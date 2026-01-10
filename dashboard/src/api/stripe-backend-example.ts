/**
 * EXAMPLE BACKEND IMPLEMENTATION
 * 
 * This file shows how to implement the Stripe backend endpoints.
 * 
 * IMPORTANT: These functions MUST run on a secure backend (Cloud Functions, API route, etc.)
 * NEVER expose your Stripe secret key in the frontend code.
 * 
 * For Vercel: Create `api/stripe/create-customer.ts` and `api/stripe/create-checkout.ts`
 * For Firebase: Create Cloud Functions
 */

import Stripe from 'stripe';

// Initialize Stripe with secret key (ONLY on backend)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

/**
 * EXAMPLE: Create Stripe Customer (Backend Endpoint)
 * 
 * Endpoint: POST /api/stripe/create-customer
 * Body: { companyId, email, name }
 * Returns: { customerId: "cus_12345" }
 */
export async function createStripeCustomerBackend(
  companyId: string,
  email: string,
  name: string
): Promise<string> {
  try {
    // Check if customer already exists by email
    const existingCustomers = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      // Customer exists, return existing ID
      return existingCustomers.data[0].id;
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        companyId,
      },
    });

    return customer.id;
  } catch (error: any) {
    console.error('Error creating Stripe customer:', error);
    throw error;
  }
}

/**
 * EXAMPLE: Create Subscription Checkout Session (Backend Endpoint)
 * 
 * Endpoint: POST /api/stripe/create-checkout
 * Body: { companyId, stripeCustomerId, referralDiscountActive, successUrl, cancelUrl }
 * Returns: { checkoutUrl: "https://checkout.stripe.com/..." }
 * 
 * REQUIRED STRIPE SETUP:
 * 1. Create Product in Stripe Dashboard: "Mensalidade Gestor" - R$ 40.00/month
 * 2. Copy the Price ID (e.g., "price_1234567890")
 * 3. Create Coupon: 15% off (ID: e.g., "FIRST_MONTH_15")
 * 4. Enable Boleto in Stripe Dashboard > Settings > Payment methods
 *    Note: PIX requires 60 days for new accounts in Brazil, so we launch with Card and Boleto only
 */
export async function createSubscriptionCheckoutBackend(
  companyId: string,
  stripeCustomerId: string,
  referralDiscountActive: boolean,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  try {
    // Get Price ID from environment variable (required)
    const PRICE_ID = process.env.STRIPE_PRICE_ID;
    if (!PRICE_ID) {
      throw new Error('STRIPE_PRICE_ID environment variable is required');
    }
    
    // Get Coupon ID from environment variable (optional - only if referral discount is active)
    const COUPON_ID = process.env.STRIPE_COUPON_ID; // Optional - can be undefined

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: stripeCustomerId,
      mode: 'subscription',
      // Payment methods: Card (recommended for trials) and Boleto
      // Note: PIX is not available for new Stripe accounts in Brazil (60-day restriction)
      // We launch with Card and Boleto only
      // Stripe will require a payment method to be saved during trial for automatic billing
      payment_method_types: ['card', 'boleto'],
      line_items: [
        {
          price: PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        companyId,
      },
      subscription_data: {
        trial_period_days: 7, // 7-day free trial before first charge
        metadata: {
          companyId,
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

    const session = await stripe.checkout.sessions.create(sessionParams);

    return session.url || '';
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * INSTRUCTIONS FOR DEPLOYMENT:
 * 
 * 1. VERCEL (Recommended):
 *    - Create `api/stripe/create-customer.ts` in your project root
 *    - Create `api/stripe/create-checkout.ts` in your project root
 *    - Add environment variables in Vercel Dashboard:
 *      - STRIPE_SECRET_KEY
 *      - STRIPE_PRICE_ID
 *      - STRIPE_COUPON_ID
 * 
 * 2. FIREBASE CLOUD FUNCTIONS:
 *    - Create functions in `functions/src/index.ts`
 *    - Deploy with `firebase deploy --only functions`
 *    - Update frontend to call Cloud Function URLs
 * 
 * 3. CUSTOM BACKEND:
 *    - Implement these functions in your Node.js/Express backend
 *    - Expose as REST API endpoints
 *    - Update frontend fetch URLs to point to your backend
 */
