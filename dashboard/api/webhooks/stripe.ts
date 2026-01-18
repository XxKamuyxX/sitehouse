/**
 * Stripe Webhook Handler
 * 
 * This endpoint processes Stripe webhook events to:
 * 1. Activate subscriptions on successful payment
 * 2. Process affiliate commissions
 * 3. Handle subscription cancellations and payment failures
 * 
 * DEPLOYMENT:
 * - Vercel: Place in `api/webhooks/stripe.ts`
 * - Firebase Functions: Use as Cloud Function
 * - Custom Backend: Adapt to your Express/Node.js server
 * 
 * SETUP:
 * 1. Get webhook signing secret from Stripe Dashboard > Webhooks
 * 2. Add to environment variables: STRIPE_WEBHOOK_SECRET
 * 3. Configure webhook URL in Stripe Dashboard to point to this endpoint
 * 4. Subscribe to events: 
 *    - customer.subscription.created (trial starts)
 *    - invoice.payment_succeeded (payment after trial and monthly)
 *    - invoice.payment_failed (payment failure)
 *    - customer.subscription.deleted (cancellation)
 */

import Stripe from 'stripe';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
// Removed getTierName import - no longer using multi-tier system

// Initialize Firebase Admin (only if not already initialized)
if (!getApps().length) {
  try {
    // For Vercel/Firebase, use service account from environment
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : null;

    if (serviceAccount) {
      initializeApp({
        credential: cert(serviceAccount),
      });
    } else {
      // Fallback: use default credentials (for Firebase Functions)
      initializeApp();
    }
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    // Continue anyway - might be using client SDK in some contexts
  }
}

const db = getFirestore();

// Initialize Stripe - secret key must be in environment variables
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover',
});

/**
 * Check if setting affiliateParentId would create a cycle
 * Returns true if newParentId is already a descendant of userId
 */
async function wouldCreateCycle(userId: string, newParentId: string): Promise<boolean> {
  let currentId = newParentId;
  const visited = new Set<string>([userId]); // Prevent self-reference
  
  // Traverse up the chain (max 10 levels to prevent infinite loops)
  for (let i = 0; i < 10; i++) {
    if (currentId === userId) {
      return true; // Cycle detected
    }
    
    const userDoc = await db.collection('users').doc(currentId).get();
    if (!userDoc.exists) {
      break; // End of chain
    }
    
    const userData = userDoc.data()!;
    const parentId = userData.affiliateParentId;
    
    if (!parentId) {
      break; // End of chain
    }
    
    if (visited.has(parentId)) {
      return true; // Cycle detected
    }
    
    visited.add(parentId);
    currentId = parentId;
  }
  
  return false;
}

/**
 * Process single-tier affiliate commission (25% flat rate)
 * Only processes commission for the direct referrer
 */
async function processAffiliateCommission(payingCompanyId: string, paymentAmount: number): Promise<void> {
  try {
    // Step 1: Get the user who made the payment (owner/admin of the company)
    const payingUserDoc = await db.collection('users')
      .where('companyId', '==', payingCompanyId)
      .where('role', 'in', ['owner', 'admin'])
      .limit(1)
      .get();
    
    if (payingUserDoc.empty) {
      console.log(`No owner/admin user found for company ${payingCompanyId}`);
      return;
    }
    
    const payingUserId = payingUserDoc.docs[0].id;
    const payingUserData = payingUserDoc.docs[0].data();
    
    // Step 2: Get referrerId from user document (direct referrer)
    // Fallback to affiliateParentId for backward compatibility
    const referrerId = payingUserData.referrerId || payingUserData.affiliateParentId;
    
    if (!referrerId) {
      console.log(`User ${payingUserId} has no referrer. No commission to process.`);
      return;
    }
    
    // Ensure referrer is not the payer (self-referral protection)
    if (referrerId === payingUserId) {
      console.log(`Referrer is the same as payer. Skipping commission.`);
      return;
    }
    
    // Step 3: Calculate commission (25% flat rate)
    const commissionAmount = paymentAmount * 0.25;
    const commissionPercent = 25;
    
    // Step 4: Get referrer user to find their companyId
    const referrerUserDoc = await db.collection('users').doc(referrerId).get();
    if (!referrerUserDoc.exists) {
      console.error(`Referrer user ${referrerId} not found`);
      return;
    }
    
    const referrerUserData = referrerUserDoc.data()!;
    const referrerCompanyId = referrerUserData.companyId;
    
    if (!referrerCompanyId) {
      console.error(`Referrer user ${referrerId} has no companyId`);
      return;
    }
    
    // Step 5: Get referrer company
    const referrerCompanyDoc = await db.collection('companies').doc(referrerCompanyId).get();
    if (!referrerCompanyDoc.exists) {
      console.error(`Referrer company ${referrerCompanyId} not found`);
      return;
    }
    
    const referrerCompanyData = referrerCompanyDoc.data()!;
    
    // Step 6: Create referral ledger entry
    const releaseDate = Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // 30 days from now
    
    await db.collection('referral_ledger').add({
      referrerId: referrerCompanyId, // Company ID of the referrer
      referrerUserId: referrerId, // User ID of the referrer (for tracking)
      referredCompanyId: payingCompanyId,
      amount: commissionAmount,
      paymentAmount: paymentAmount,
      commissionPercent: commissionPercent,
      tier: '1', // Single tier system (always tier 1)
      tierLabel: 'Comissão Direta - 25%',
      status: 'pending',
      releaseDate: releaseDate,
      createdAt: Timestamp.now(),
    });
    
    // Step 7: Update referrer's wallet.pending balance
    const currentPending = referrerCompanyData.wallet?.pending || 0;
    const newPending = currentPending + commissionAmount;
    
    // Step 8: Update referrer's referralStats.totalEarnings
    const currentTotalEarnings = referrerCompanyData.referralStats?.totalEarnings || 0;
    const newTotalEarnings = currentTotalEarnings + commissionAmount;
    
    // Step 9: Increment activeReferrals count
    const activeReferrals = referrerCompanyData.referralStats?.activeReferrals || 0;
    const newActiveReferrals = activeReferrals + 1;
    
    // Update referrer company
    await db.collection('companies').doc(referrerCompanyId).update({
      'wallet.pending': newPending,
      'referralStats.totalEarnings': newTotalEarnings,
      'referralStats.activeReferrals': newActiveReferrals,
      updatedAt: Timestamp.now(),
    });
    
    console.log(`Single-tier commission processed: ${commissionAmount.toFixed(2)} BRL (25%) for referrer ${referrerCompanyId} from payment: ${paymentAmount.toFixed(2)} BRL`);
  } catch (error: any) {
    console.error('Error processing affiliate commission:', error);
    throw error;
  }
}

// Removed processTierCommission function - no longer needed with single-tier system

/**
 * Find company by Stripe Customer ID
 */
async function findCompanyByStripeCustomerId(stripeCustomerId: string): Promise<string | null> {
  try {
    const companiesRef = db.collection('companies');
    const snapshot = await companiesRef.where('stripeCustomerId', '==', stripeCustomerId).limit(1).get();
    
    if (snapshot.empty) {
      console.error(`No company found for Stripe customer: ${stripeCustomerId}`);
      return null;
    }
    
    return snapshot.docs[0].id;
  } catch (error) {
    console.error('Error finding company by Stripe customer ID:', error);
    return null;
  }
}

/**
 * Find user by company ID (get the admin user)
 */
async function findUserByCompanyId(companyId: string): Promise<string | null> {
  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('companyId', '==', companyId).where('role', '==', 'admin').limit(1).get();
    
    if (snapshot.empty) {
      console.error(`No admin user found for company: ${companyId}`);
      return null;
    }
    
    return snapshot.docs[0].id;
  } catch (error) {
    console.error('Error finding user by company ID:', error);
    return null;
  }
}

/**
 * Handle successful invoice payment
 */
async function handleInvoicePaymentSucceeded(event: Stripe.Invoice): Promise<void> {
  try {
    const customerId = typeof event.customer === 'string' ? event.customer : event.customer?.id;
    if (!customerId) {
      console.error('No customer ID in invoice event');
      return;
    }

    // Find company by Stripe customer ID
    const companyId = await findCompanyByStripeCustomerId(customerId);
    if (!companyId) {
      console.error(`Company not found for customer: ${customerId}`);
      return;
    }

    // Get payment amount (convert from cents to BRL)
    const amountPaid = event.amount_paid / 100; // Stripe amounts are in cents
    const currency = event.currency.toUpperCase();

    // Only process BRL payments
    if (currency !== 'BRL') {
      console.log(`Skipping payment in ${currency} (expected BRL)`);
      return;
    }

    // Note: For subscriptions with trial_period_days, Stripe creates the subscription immediately as 'active'
    // but the first invoice is generated and paid after the trial period ends (day 8).
    // This webhook event (invoice.payment_succeeded) will fire when the first payment after trial is processed.
    console.log(`Processing payment for company ${companyId}: ${amountPaid} BRL`);

    // 1. Update user subscription status
    // If trial was active, this is the first payment after the 7-day trial period
    const userId = await findUserByCompanyId(companyId);
    if (userId) {
      await db.collection('users').doc(userId).update({
        subscriptionStatus: 'active',
        lastPaymentDate: Timestamp.now(),
        isActive: true,
        updatedAt: Timestamp.now(),
      });
      console.log(`Updated user ${userId} subscription status to active`);
    }

    // 2. Process affiliate commission
    try {
      await processAffiliateCommission(companyId, amountPaid);
      console.log(`Commission processed for company ${companyId}`);
    } catch (commissionError: any) {
      // Log but don't fail the webhook if commission processing fails
      console.error(`Error processing commission for company ${companyId}:`, commissionError);
    }

    // 3. Update company lastPaymentDate
    await db.collection('companies').doc(companyId).update({
      lastPaymentDate: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    console.log(`Successfully processed payment for company ${companyId}`);
  } catch (error: any) {
    console.error('Error handling invoice.payment_succeeded:', error);
    throw error;
  }
}

/**
 * Handle failed invoice payment
 */

/**
 * Handle checkout session completed
 * This fires when checkout is completed (before trial starts)
 * We use this to set affiliateParentId on the user when referral code is used
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
  try {
    const companyId = session.metadata?.companyId;
    const affiliateId = session.metadata?.affiliateId; // This is the company ID of the affiliate

    if (!companyId) {
      console.log('No companyId in checkout session metadata');
      return;
    }

    // If affiliateId is present in metadata, set affiliateParentId on the user
    if (affiliateId) {
      try {
        // Get the owner/admin user of the paying company
        const payingUsersSnapshot = await db.collection('users')
          .where('companyId', '==', companyId)
          .where('role', 'in', ['owner', 'admin'])
          .limit(1)
          .get();
        
        if (payingUsersSnapshot.empty) {
          console.log(`No owner/admin user found for company ${companyId}`);
          return;
        }
        
        const payingUserId = payingUsersSnapshot.docs[0].id;
        const payingUserData = payingUsersSnapshot.docs[0].data();
        
        // Only set affiliateParentId if not already set (first subscription)
        if (!payingUserData.affiliateParentId) {
          // Get the owner/admin user of the affiliate company
          const affiliateUsersSnapshot = await db.collection('users')
            .where('companyId', '==', affiliateId)
            .where('role', 'in', ['owner', 'admin'])
            .limit(1)
            .get();
          
          if (affiliateUsersSnapshot.empty) {
            console.log(`No owner/admin user found for affiliate company ${affiliateId}`);
            return;
          }
          
          const affiliateUserId = affiliateUsersSnapshot.docs[0].id;
          
          // Check for cycles before setting
          const wouldCycle = await wouldCreateCycle(payingUserId, affiliateUserId);
          if (wouldCycle) {
            console.error(`Setting affiliateParentId would create a cycle. Skipping.`);
            return;
          }
          
          await db.collection('users').doc(payingUserId).update({
            affiliateParentId: affiliateUserId,
            updatedAt: Timestamp.now(),
          });
          
          console.log(`Set affiliateParentId: ${affiliateUserId} for user ${payingUserId} (company ${companyId})`);
          
          // Also update company.referredBy for backward compatibility
          const companyDoc = await db.collection('companies').doc(companyId).get();
          if (companyDoc.exists) {
            const companyData = companyDoc.data()!;
            if (!companyData.referredBy) {
              await db.collection('companies').doc(companyId).update({
                referredBy: affiliateId,
                updatedAt: Timestamp.now(),
              });
            }
          }
        } else {
          console.log(`User ${payingUserId} already has affiliateParentId set, skipping update`);
        }
      } catch (error: any) {
        console.error('Error updating user with affiliateParentId:', error);
        // Don't throw - this is non-critical
      }
    }
  } catch (error: any) {
    console.error('Error handling checkout.session.completed:', error);
    // Don't throw - this is non-critical for checkout flow
  }
}

async function handleInvoicePaymentFailed(event: Stripe.Invoice): Promise<void> {
  try {
    const customerId = typeof event.customer === 'string' ? event.customer : event.customer?.id;
    if (!customerId) {
      console.error('No customer ID in invoice event');
      return;
    }

    const companyId = await findCompanyByStripeCustomerId(customerId);
    if (!companyId) {
      console.error(`Company not found for customer: ${customerId}`);
      return;
    }

    const userId = await findUserByCompanyId(companyId);
    if (userId) {
      await db.collection('users').doc(userId).update({
        subscriptionStatus: 'past_due',
        updatedAt: Timestamp.now(),
      });
      console.log(`Updated user ${userId} subscription status to past_due`);
    }

    await db.collection('companies').doc(companyId).update({
      updatedAt: Timestamp.now(),
    });

    console.log(`Marked subscription as past_due for company ${companyId}`);
  } catch (error: any) {
    console.error('Error handling invoice.payment_failed:', error);
    throw error;
  }
}

/**
 * Handle subscription creation (trial starts)
 * This fires immediately when they start the 7-day trial
 */
async function handleSubscriptionCreated(event: Stripe.Subscription): Promise<void> {
  try {
    const customerId = typeof event.customer === 'string' ? event.customer : event.customer?.id;
    if (!customerId) {
      console.error('No customer ID in subscription event');
      return;
    }

    // Get companyId from subscription metadata
    const companyId = event.metadata?.companyId;
    
    let finalCompanyId: string | null = null;

    if (companyId) {
      // Use metadata if available
      finalCompanyId = companyId;
    } else {
      // Fallback: find by customer ID
      finalCompanyId = await findCompanyByStripeCustomerId(customerId);
      
      // If still not found, try finding by customer email
      if (!finalCompanyId) {
        try {
          const customer = await stripe.customers.retrieve(customerId);
          if (!customer.deleted && customer.email) {
            // Search companies by email
            const companiesRef = db.collection('companies');
            const snapshot = await companiesRef.where('email', '==', customer.email).limit(1).get();
            
            if (!snapshot.empty) {
              finalCompanyId = snapshot.docs[0].id;
              // Update company with stripeCustomerId if missing
              await db.collection('companies').doc(finalCompanyId).update({
                stripeCustomerId: customerId,
                updatedAt: Timestamp.now(),
              });
              console.log(`Updated company ${finalCompanyId} with stripeCustomerId: ${customerId}`);
            }
          }
        } catch (customerError: any) {
          console.error('Error retrieving customer from Stripe:', customerError);
        }
      }
    }

    if (!finalCompanyId) {
      console.error(`Company not found for customer: ${customerId}`);
      return;
    }

    console.log(`Processing subscription created for company ${finalCompanyId} (trial starts)`);

    // Find user by company ID
    const userId = await findUserByCompanyId(finalCompanyId);
    if (userId) {
      await db.collection('users').doc(userId).update({
        subscriptionStatus: 'trialing', // Grant access during trial
        isActive: true, // Grant access immediately
        updatedAt: Timestamp.now(),
      });
      console.log(`Updated user ${userId} subscription status to trialing (access granted)`);
    }

    // Update company subscription info
    await db.collection('companies').doc(finalCompanyId).update({
      stripeCustomerId: customerId, // Ensure it's saved
      updatedAt: Timestamp.now(),
    });

    console.log(`Successfully activated trial for company ${finalCompanyId}`);
  } catch (error: any) {
    console.error('Error handling customer.subscription.created:', error);
    throw error;
  }
}

/**
 * Handle subscription deletion/cancellation
 */
async function handleSubscriptionDeleted(event: Stripe.Subscription): Promise<void> {
  try {
    const customerId = typeof event.customer === 'string' ? event.customer : event.customer?.id;
    if (!customerId) {
      console.error('No customer ID in subscription event');
      return;
    }

    const companyId = await findCompanyByStripeCustomerId(customerId);
    if (!companyId) {
      console.error(`Company not found for customer: ${customerId}`);
      return;
    }

    const userId = await findUserByCompanyId(companyId);
    if (userId) {
      await db.collection('users').doc(userId).update({
        subscriptionStatus: 'canceled',
        isActive: false, // Revoke access
        updatedAt: Timestamp.now(),
      });
      console.log(`Updated user ${userId} subscription status to canceled (access revoked)`);
    }

    await db.collection('companies').doc(companyId).update({
      updatedAt: Timestamp.now(),
    });

    console.log(`Marked subscription as canceled for company ${companyId}`);
  } catch (error: any) {
    console.error('Error handling customer.subscription.deleted:', error);
    throw error;
  }
}

/**
 * Main webhook handler
 */
export default async function handler(req: any, res: any) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get raw body - CRITICAL: Must use raw body (not parsed JSON) for signature verification
  // Vercel provides req.body as Buffer when bodyParser is disabled via config
  const rawBody = req.body;
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  if (!rawBody) {
    console.error('Raw body is required for signature verification');
    return res.status(400).json({ error: 'Raw body required for webhook verification' });
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature using raw body
    // Stripe requires the raw body (Buffer or string) to verify the signature
    // Vercel provides req.body as Buffer when bodyParser is disabled
    const bodyBuffer = rawBody instanceof Buffer 
      ? rawBody 
      : typeof rawBody === 'string' 
      ? Buffer.from(rawBody, 'utf8')
      : Buffer.from(JSON.stringify(rawBody), 'utf8');
    
    event = stripe.webhooks.constructEvent(bodyBuffer, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  try {
    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        // This fires when checkout is completed (before trial starts)
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
        // This fires immediately when they start the 7-day trial
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        // This fires on Day 8 (first payment) and every subsequent month
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.deleted':
        // Subscription canceled - revoke access
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return success response
    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}

// For Vercel Serverless Functions
export const config = {
  api: {
    bodyParser: false, // Stripe needs raw body for signature verification
  },
};
