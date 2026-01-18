/**
 * Get Subscription Details API Route
 * 
 * GET /api/stripe/get-subscription?companyId=xxx
 * 
 * Returns subscription details including:
 * - Status
 * - Current period start/end
 * - Amount
 * - Payment method
 * - Cancel at period end
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
  query: {
    companyId?: string;
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
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { companyId } = req.query;

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

    // Get subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      limit: 1,
      status: 'all',
    });

    if (subscriptions.data.length === 0) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    const subscription = subscriptions.data[0];

    // Get payment method details
    let paymentMethodDetails = null;
    if (subscription.default_payment_method) {
      try {
        const paymentMethod = await stripe.paymentMethods.retrieve(
          subscription.default_payment_method as string
        );
        paymentMethodDetails = {
          type: paymentMethod.type,
          card: paymentMethod.card ? {
            brand: paymentMethod.card.brand,
            last4: paymentMethod.card.last4,
            expMonth: paymentMethod.card.exp_month,
            expYear: paymentMethod.card.exp_year,
          } : null,
        };
      } catch (error) {
        console.error('Error retrieving payment method:', error);
      }
    }

    // Get latest invoice
    let latestInvoice = null;
    if (subscription.latest_invoice) {
      try {
        const invoice = await stripe.invoices.retrieve(
          subscription.latest_invoice as string
        );
        latestInvoice = {
          amountPaid: invoice.amount_paid,
          amountDue: invoice.amount_due,
          currency: invoice.currency,
          status: invoice.status,
          hostedInvoiceUrl: invoice.hosted_invoice_url,
          invoicePdf: invoice.invoice_pdf,
          created: invoice.created,
        };
      } catch (error) {
        console.error('Error retrieving invoice:', error);
      }
    }

    // Format subscription data
    const subscriptionData = {
      id: subscription.id,
      status: subscription.status,
      currentPeriodStart: subscription.current_period_start,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at,
      trialStart: subscription.trial_start,
      trialEnd: subscription.trial_end,
      amount: subscription.items.data[0]?.price?.unit_amount || 0,
      currency: subscription.items.data[0]?.price?.currency || 'brl',
      interval: subscription.items.data[0]?.price?.recurring?.interval || 'month',
      paymentMethod: paymentMethodDetails,
      latestInvoice: latestInvoice,
      created: subscription.created,
    };

    return res.status(200).json({ subscription: subscriptionData });
  } catch (error: any) {
    console.error('Error getting subscription:', error);
    return res.status(500).json({
      error: 'Failed to get subscription',
      message: error.message || 'Unknown error occurred',
    });
  }
}
