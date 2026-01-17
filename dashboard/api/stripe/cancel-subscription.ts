/**
 * Cancel Subscription API Route
 * 
 * POST /api/stripe/cancel-subscription
 * Body: {
 *   companyId: string,
 *   cancelImmediately?: boolean (default: false)
 * }
 * 
 * If cancelImmediately is false, subscription will remain active
 * until the end of the current billing period (cancel_at_period_end)
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
  body: {
    companyId?: string;
    cancelImmediately?: boolean;
  };
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (data: any) => void;
};

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { companyId, cancelImmediately = false } = req.body;

    if (!companyId) {
      return res.status(400).json({ error: 'companyId is required' });
    }

    // Get company from Firestore
    const companyDoc = await db.collection('companies').doc(companyId).get();

    if (!companyDoc.exists) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const companyData = companyDoc.data();
    const stripeCustomerId = companyData?.stripeCustomerId;

    if (!stripeCustomerId) {
      return res.status(400).json({ error: 'No Stripe customer ID found' });
    }

    // Get active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    const subscription = subscriptions.data[0];

    // Cancel subscription
    let canceledSubscription;
    if (cancelImmediately) {
      // Cancel immediately
      canceledSubscription = await stripe.subscriptions.cancel(subscription.id);
    } else {
      // Cancel at period end (default behavior)
      canceledSubscription = await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: true,
      });
    }

    // Update company in Firestore
    await db.collection('companies').doc(companyId).update({
      subscriptionCanceledAt: new Date(),
      subscriptionCancelAtPeriodEnd: !cancelImmediately,
      updatedAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      subscription: {
        id: canceledSubscription.id,
        status: canceledSubscription.status,
        cancelAtPeriodEnd: canceledSubscription.cancel_at_period_end,
        currentPeriodEnd: canceledSubscription.current_period_end,
      },
      message: cancelImmediately
        ? 'Assinatura cancelada imediatamente'
        : 'Assinatura será cancelada no final do período atual',
    });
  } catch (error: any) {
    console.error('Error canceling subscription:', error);
    return res.status(500).json({
      error: 'Failed to cancel subscription',
      message: error.message || 'Unknown error occurred',
    });
  }
}
