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
    let affiliateId: string | null = null;
    let shouldApplyDiscount = referralDiscountActive;

    if (referralCode) {
      try {
        // Normalize code: uppercase and remove spaces
        const normalizedCode = referralCode.toUpperCase().trim().replace(/\s/g, '');

        // Search for company with this affiliate code
        const companiesSnapshot = await db
          .collection('companies')
          .where('affiliateCode', '==', normalizedCode)
          .limit(1)
          .get();

        if (!companiesSnapshot.empty) {
          const companyDoc = companiesSnapshot.docs[0];
          affiliateId = companyDoc.id;
          shouldApplyDiscount = true; // Apply discount if valid code found
          console.log(`Valid referral code found: ${normalizedCode} for company ${affiliateId}`);
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
        ...(affiliateId && { affiliateId: affiliateId }),
      },
      subscription_data: {
        trial_period_days: 7, // 7-day free trial - user pays nothing today
        metadata: {
          companyId: companyId,
          ...(affiliateId && { affiliateId: affiliateId }),
        },
      },
    };

    // Apply discount coupon if referral discount is active or valid code found
    // Stripe applies the coupon to the first invoice generated AFTER the trial ends
    // So if trial is 7 days, coupon applies to invoice on day 8
    if (shouldApplyDiscount && COUPON_ID) {
      sessionParams.discounts = [
        {
          coupon: COUPON_ID,
        },
      ];
    }

    // Create the checkout session
    const session = await stripe.checkout.sessions.create(sessionParams);

    if (!session.url) {
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
