/**
 * Referral Commission - Single-Tier System
 * Fixed 25% commission rate for all direct referrals
 */

// Single-tier commission rate: 25% flat
export const COMMISSION_RATE = 0.25; // 25%

/**
 * Calculate commission amount based on payment amount
 * Always returns 25% of the payment amount
 */
export function calculateCommission(paymentAmount: number): number {
  return paymentAmount * COMMISSION_RATE;
}

/**
 * Get commission percentage (always 25% in single-tier system)
 */
export function getCommissionPercent(): number {
  return 25;
}

// Legacy functions for backward compatibility (kept to avoid breaking existing code)
export type TierName = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface TierConfig {
  name: TierName;
  label: string;
  minReferrals: number;
  maxReferrals: number | null;
  commissionPercent: number;
}

/**
 * @deprecated Legacy function - always returns 25% now
 */
export function getTierName(_activeReferrals: number): TierName {
  return 'diamond'; // Return highest tier for backward compatibility
}
