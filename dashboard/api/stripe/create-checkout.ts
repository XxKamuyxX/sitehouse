/**
 * Stripe Checkout Session Creation API Route
 * 
 * POST /api/stripe/create-checkout
 * Body: {
 *   companyId: string,
 *   stripeCustomerId: string,
 *   referralDiscountActive: boolean,
 *   successUrl?: string,
 *   cancelUrl?: string
 * }
 * 
 * Returns: { checkoutUrl: string }
 */

import Stripe from 'stripe';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin (only if not already initialized)
if (!getApps().length) {
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : null;

    if (serviceAccount) {
      initializeApp({
        credential: cert(serviceAccount),
      });
    } else {
      initializeApp();
    }
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
  }
}

const db = getFirestore();

// Type definitions for Vercel serverless function
type VercelRequest = {
  method: string;
  body: any;
  headers: {
    origin?: string;
    [key: string]: string | undefined;
  };
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (data: any) => void;
};

// Initialize Stripe with secret key from environment
// IMPORTANT: Never hardcode secret keys. Use environment variables.
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover',
});

// Price ID from Stripe Dashboard (configure via environment variable)
const PRICE_ID = process.env.STRIPE_PRICE_ID || process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;
if (!PRICE_ID) {
  throw new Error('STRIPE_PRICE_ID environment variable is required');
}

// Coupon ID for referral discount (15% off) - optional
const COUPON_ID = process.env.STRIPE_COUPON_ID || process.env.NEXT_PUBLIC_STRIPE_COUPON_ID;
// Referral Coupon ID specifically for referral system (15% off via INDICACAO15)
const REFERRAL_COUPON_ID = process.env.STRIPE_REFERRAL_COUPON_ID || 'INDICACAO15';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      companyId,
      stripeCustomerId,
      referralDiscountActive = false,
      referralCode,
      successUrl,
      cancelUrl,
    } = req.body;

    // Validate required fields
    if (!companyId || !stripeCustomerId) {
      return res.status(400).json({
        error: 'Missing required fields: companyId and stripeCustomerId are required',
      });
    }

    // Validate referral code if provided
    let referrerId: string | null = null;
    let shouldApplyDiscount = referralDiscountActive;

    if (referralCode) {
      try {
        // Normalize code: uppercase and remove spaces
        const normalizedCode = referralCode.toUpperCase().trim().replace(/\s/g, '');

        // Search for user with this myReferralCode in users collection
        const usersSnapshot = await db
          .collection('users')
          .where('myReferralCode', '==', normalizedCode)
          .limit(1)
          .get();

        if (!usersSnapshot.empty) {
          const userDoc = usersSnapshot.docs[0];
          referrerId = userDoc.id; // This is the uid (referrerId)
          shouldApplyDiscount = true; // Apply discount if valid code found
          console.log(`Valid referral code found: ${normalizedCode} for user ${referrerId}`);
        } else {
          console.log(`Referral code not found: ${normalizedCode}, proceeding without discount`);
          // Continue without discount if code is invalid
        }
      } catch (error: any) {
        console.error('Error validating referral code:', error);
        // Continue without discount if validation fails
      }
    }

    // Get base URL from environment or request
    // Use provided URLs if available, otherwise construct from environment
    const baseUrl = process.env.NEXT_PUBLIC_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      req.headers.origin || 
      'http://localhost:3000';

    // Use provided URLs or construct default ones
    const finalSuccessUrl = successUrl || `${baseUrl}/admin/settings?status=success`;
    const finalCancelUrl = cancelUrl || `${baseUrl}/admin/settings?status=cancel`;

    // Check if user's trial has expired (only offer trial on first subscription)
    let shouldOfferTrial = false;
    try {
      // Get company data to check creation date
      const companyDoc = await db.collection('companies').doc(companyId).get();
      if (companyDoc.exists) {
        const companyData = companyDoc.data();
        const createdAt = companyData?.createdAt;
        
        if (createdAt) {
          // Convert Firestore timestamp to Date
          const createdDate = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
          const now = new Date();
          const daysSinceCreation = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
          
          // Only offer trial if account was created less than 7 days ago
          shouldOfferTrial = daysSinceCreation < 7;
          
          console.log(`Account created ${daysSinceCreation} days ago. Trial offer: ${shouldOfferTrial}`);
        }
      }
    } catch (error) {
      console.error('Error checking trial eligibility:', error);
      // If we can't check, don't offer trial (safer)
      shouldOfferTrial = false;
    }

    // Create checkout session parameters
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: stripeCustomerId,
      mode: 'subscription',
      // Payment methods: Card (recommended for trials) and Boleto
      // Note: PIX is not available for new Stripe accounts in Brazil (60-day restriction)
      // We launch with Card and Boleto only
      payment_method_types: ['card', 'boleto'],
      line_items: [
        {
          price: PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      metadata: {
        companyId: companyId,
        ...(referrerId && { referrerId: referrerId }),
      },
      subscription_data: {
        // Only add trial_period_days if account was created recently (< 7 days)
        ...(shouldOfferTrial && { trial_period_days: 7 }),
        metadata: {
          companyId: companyId,
          ...(referrerId && { referrerId: referrerId }),
        },
      },
      // If no trial, require immediate payment
      payment_behavior: shouldOfferTrial ? undefined : 'default_incomplete',
    };

    // Apply discount coupon if referral discount is active or valid code found
    // Use STRIPE_REFERRAL_COUPON_ID (INDICACAO15) for referral system
    // Stripe applies the coupon to the first invoice generated AFTER the trial ends
    // So if trial is 7 days, coupon applies to invoice on day 8
    if (shouldApplyDiscount && referrerId && REFERRAL_COUPON_ID) {
      sessionParams.discounts = [
        {
          coupon: REFERRAL_COUPON_ID,
        },
      ];
      console.log(`Applying referral coupon ${REFERRAL_COUPON_ID} for referrer ${referrerId}`);
    }

    // Create the checkout session with error handling for invalid customer IDs
    let session;
    try {
      session = await stripe.checkout.sessions.create(sessionParams);
    } catch (checkoutError: any) {
      // Check if the error is "customer not found" (resource_missing)
      if (checkoutError.code === 'resource_missing' && checkoutError.type === 'StripeInvalidRequestError') {
        console.log(`Customer ${stripeCustomerId} not found in Stripe. Creating new customer and retrying...`);
        
        try {
          // Get company data from Firestore to create new customer
          const companyDoc = await db.collection('companies').doc(companyId).get();
          
          if (!companyDoc.exists) {
            return res.status(404).json({
              error: 'Company not found',
            });
          }

          const companyData = companyDoc.data();
          const companyEmail = companyData?.email || '';
          const companyName = companyData?.name || 'Company';

          if (!companyEmail) {
            return res.status(400).json({
              error: 'Company email is required to create Stripe customer',
            });
          }

          // Check if customer already exists by email (might exist in Live mode)
          const existingCustomers = await stripe.customers.list({
            email: companyEmail,
            limit: 1,
          });

          let newCustomerId: string;

          if (existingCustomers.data.length > 0) {
            // Customer exists with this email, use existing ID
            newCustomerId = existingCustomers.data[0].id;
            console.log(`Found existing customer by email: ${newCustomerId}`);
          } else {
            // Create new customer in Stripe
            const newCustomer = await stripe.customers.create({
              email: companyEmail,
              name: companyName,
              metadata: {
                companyId: companyId,
              },
            });
            newCustomerId = newCustomer.id;
            console.log(`Created new Stripe customer: ${newCustomerId}`);
          }

          // Update Firestore with the new customer ID
          await db.collection('companies').doc(companyId).update({
            stripeCustomerId: newCustomerId,
            updatedAt: new Date(),
          });
          console.log(`Updated company ${companyId} with new stripeCustomerId: ${newCustomerId}`);

          // Retry creating checkout session with the new customer ID
          sessionParams.customer = newCustomerId;
          session = await stripe.checkout.sessions.create(sessionParams);
          console.log(`Successfully created checkout session with new customer ID`);
        } catch (recoveryError: any) {
          console.error('Error recovering from invalid customer ID:', recoveryError);
          return res.status(500).json({
            error: 'Failed to create checkout session',
            message: 'Customer migration failed. Please contact support.',
            details: recoveryError.message || 'Unknown error occurred',
          });
        }
      } else {
        // Re-throw if it's a different error
        throw checkoutError;
      }
    }

    if (!session || !session.url) {
      return res.status(500).json({
        error: 'Failed to create checkout session URL',
      });
    }

    // Return the checkout URL
    return res.status(200).json({
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error('Error creating Stripe checkout session:', error);
    
    // Return user-friendly error message
    return res.status(500).json({
      error: 'Failed to create checkout session',
      message: error.message || 'Unknown error occurred',
    });
  }
}
