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
      successUrl,
      cancelUrl,
    } = req.body;

    // Validate required fields
    if (!companyId || !stripeCustomerId) {
      return res.status(400).json({
        error: 'Missing required fields: companyId and stripeCustomerId are required',
      });
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
      // For trials, prefer card to ensure seamless billing after trial ends
      // Boleto is also available; PIX is handled automatically by Stripe in subscription invoices
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
      },
      subscription_data: {
        trial_period_days: 7, // 7-day free trial - user pays nothing today
        metadata: {
          companyId: companyId,
        },
      },
    };

    // Apply discount coupon if referral discount is active
    // Stripe applies the coupon to the first invoice generated AFTER the trial ends
    // So if trial is 7 days, coupon applies to invoice on day 8
    if (referralDiscountActive) {
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
