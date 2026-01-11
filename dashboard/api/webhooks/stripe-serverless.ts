/**
 * Stripe Webhook Handler - Serverless Function Version
 * 
 * This is an alternative implementation for serverless environments
 * that don't support Firebase Admin SDK directly.
 * 
 * Instead, it uses the Firestore REST API or client SDK.
 * 
 * USAGE:
 * - For Vercel: Use `stripe.ts` instead (recommended)
 * - For other serverless: Adapt this version
 */

import Stripe from 'stripe';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../src/lib/firebase';
import { processPaymentCommission } from '../../src/utils/referralCommission';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

/**
 * Find company by Stripe Customer ID (using client SDK)
 */
async function findCompanyByStripeCustomerId(stripeCustomerId: string): Promise<string | null> {
  try {
    const companiesRef = collection(db, 'companies');
    const q = query(companiesRef, where('stripeCustomerId', '==', stripeCustomerId));
    const snapshot = await getDocs(q);
    
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
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('companyId', '==', companyId), where('role', '==', 'admin'));
    const snapshot = await getDocs(q);
    
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

    const companyId = await findCompanyByStripeCustomerId(customerId);
    if (!companyId) {
      console.error(`Company not found for customer: ${customerId}`);
      return;
    }

    const amountPaid = event.amount_paid / 100;
    const currency = event.currency.toUpperCase();

    if (currency !== 'BRL') {
      console.log(`Skipping payment in ${currency} (expected BRL)`);
      return;
    }

    console.log(`Processing payment for company ${companyId}: ${amountPaid} BRL`);

    // Update user subscription status
    const userId = await findUserByCompanyId(companyId);
    if (userId) {
      await updateDoc(doc(db, 'users', userId), {
        subscriptionStatus: 'active',
        lastPaymentDate: serverTimestamp(),
        isActive: true,
        updatedAt: serverTimestamp(),
      });
      console.log(`Updated user ${userId} subscription status to active`);
    }

    // Process affiliate commission
    try {
      await processPaymentCommission(companyId, amountPaid);
      console.log(`Commission processed for company ${companyId}`);
    } catch (commissionError: any) {
      console.error(`Error processing commission for company ${companyId}:`, commissionError);
    }

    // Update company lastPaymentDate
    await updateDoc(doc(db, 'companies', companyId), {
      lastPaymentDate: serverTimestamp(),
      updatedAt: serverTimestamp(),
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
      await updateDoc(doc(db, 'users', userId), {
        subscriptionStatus: 'past_due',
        updatedAt: serverTimestamp(),
      });
      console.log(`Updated user ${userId} subscription status to past_due`);
    }

    await updateDoc(doc(db, 'companies', companyId), {
      updatedAt: serverTimestamp(),
    });

    console.log(`Marked subscription as past_due for company ${companyId}`);
  } catch (error: any) {
    console.error('Error handling invoice.payment_failed:', error);
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
      await updateDoc(doc(db, 'users', userId), {
        subscriptionStatus: 'canceled',
        updatedAt: serverTimestamp(),
      });
      console.log(`Updated user ${userId} subscription status to canceled`);
    }

    await updateDoc(doc(db, 'companies', companyId), {
      updatedAt: serverTimestamp(),
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
