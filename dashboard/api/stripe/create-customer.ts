/**
 * Stripe Customer Creation API Route
 * 
 * POST /api/stripe/create-customer
 * Body: {
 *   companyId: string,
 *   email: string,
 *   name: string
 * }
 * 
 * Returns: { customerId: string }
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { companyId, email, name } = req.body;

    // Validate required fields
    if (!companyId || !email || !name) {
      return res.status(400).json({
        error: 'Missing required fields: companyId, email, and name are required',
      });
    }

    // Check if customer already exists by email
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      // Customer exists, return existing ID
      const existingCustomer = existingCustomers.data[0];
      
      // Update metadata if needed
      if (existingCustomer.metadata.companyId !== companyId) {
        await stripe.customers.update(existingCustomer.id, {
          metadata: {
            companyId: companyId,
          },
        });
      }

      return res.status(200).json({
        customerId: existingCustomer.id,
        isNew: false,
      });
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email: email,
      name: name,
      metadata: {
        companyId: companyId,
      },
    });

    return res.status(200).json({
      customerId: customer.id,
      isNew: true,
    });
  } catch (error: any) {
    console.error('Error creating Stripe customer:', error);
    
    return res.status(500).json({
      error: 'Failed to create Stripe customer',
      message: error.message || 'Unknown error occurred',
    });
  }
}
