/**
 * Stripe Integration Service
 * 
 * NOTE: Stripe secret key operations must run on a backend (Cloud Functions or API route).
 * This file contains the client-side structure. The actual Stripe API calls should be made
 * from a secure backend endpoint.
 */

import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface StripeCustomer {
  id: string; // Stripe Customer ID (e.g., "cus_12345")
  email: string;
  name?: string;
  companyId: string;
}

export interface SubscriptionCheckoutParams {
  companyId: string;
  referralDiscountActive?: boolean;
  successUrl?: string;
  cancelUrl?: string;
}

/**
 * Create or retrieve Stripe Customer for a company
 * This should be called from a backend endpoint (Cloud Function or API route)
 * 
 * @param companyId - Firestore company document ID
 * @param email - Company owner email
 * @param companyName - Company name
 * @returns Stripe Customer ID
 */
export async function syncStripeCustomer(
  companyId: string,
  email: string,
  companyName: string
): Promise<string> {
  try {
    // Check if company already has stripeCustomerId
    const companyDoc = await getDoc(doc(db, 'companies', companyId));
    if (companyDoc.exists()) {
      const companyData = companyDoc.data();
      if (companyData.stripeCustomerId) {
        return companyData.stripeCustomerId;
      }
    }

    // Call backend API to create Stripe customer
    const apiUrl = `${window.location.origin}/api/stripe/create-customer`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        companyId,
        email,
        name: companyName,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create Stripe customer: ${response.statusText}`);
    }

    const data = await response.json();
    const stripeCustomerId = data.customerId;

    // Update company document with Stripe Customer ID
    await updateDoc(doc(db, 'companies', companyId), {
      stripeCustomerId,
      updatedAt: serverTimestamp(),
    });

    return stripeCustomerId;
  } catch (error: any) {
    console.error('Error syncing Stripe customer:', error);
    throw error;
  }
}

/**
 * Create Stripe Checkout Session for subscription
 * This should be called from a backend endpoint (Cloud Function or API route)
 * 
 * @param params - Checkout session parameters
 * @returns Checkout session URL
 */
export async function createSubscriptionCheckout(
  params: SubscriptionCheckoutParams
): Promise<string> {
  try {
    // Get company data
    const companyDoc = await getDoc(doc(db, 'companies', params.companyId));
    if (!companyDoc.exists()) {
      throw new Error('Company not found');
    }

    const companyData = companyDoc.data();
    const stripeCustomerId = companyData.stripeCustomerId;

    if (!stripeCustomerId) {
      // Create customer first if doesn't exist
      const email = companyData.email || '';
      const companyName = companyData.name || 'Company';
      await syncStripeCustomer(params.companyId, email, companyName);
      
      // Reload to get the new customer ID
      const updatedDoc = await getDoc(doc(db, 'companies', params.companyId));
      const updatedData = updatedDoc.data();
      if (!updatedData?.stripeCustomerId) {
        throw new Error('Failed to create Stripe customer');
      }
    }

    // Get base URL for redirects
    const baseUrl = window.location.origin;
    const successUrl = params.successUrl || `${baseUrl}/admin/settings?status=success`;
    const cancelUrl = params.cancelUrl || `${baseUrl}/admin/settings?status=cancel`;

    // Call backend API to create checkout session
    const apiUrl = `${window.location.origin}/api/stripe/create-checkout`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        companyId: params.companyId,
        stripeCustomerId: stripeCustomerId,
        referralDiscountActive: params.referralDiscountActive || false,
        successUrl,
        cancelUrl,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create checkout session: ${response.statusText}`);
    }

    const data = await response.json();
    return data.checkoutUrl;
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Helper function to check if referral discount is active
 */
export function isReferralDiscountActive(company: any): boolean {
  if (!company?.firstMonthDiscount || !company?.discountExpirationDate) {
    return false;
  }

  try {
    const expirationDate = company.discountExpirationDate?.toDate 
      ? company.discountExpirationDate.toDate() 
      : company.discountExpirationDate?.seconds
      ? new Date(company.discountExpirationDate.seconds * 1000)
      : new Date(company.discountExpirationDate);
    
    return expirationDate > new Date();
  } catch {
    return false;
  }
}
