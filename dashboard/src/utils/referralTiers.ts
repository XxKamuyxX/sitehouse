/**
 * Referral Commission Tiers
 * Based on number of active referrals (paying customers)
 */

export type TierName = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface TierConfig {
  name: TierName;
  label: string;
  minReferrals: number;
  maxReferrals: number | null; // null means no upper limit
  commissionPercent: number;
}

export const REFERRAL_TIERS: TierConfig[] = [
  {
    name: 'bronze',
    label: 'Bronze',
    minReferrals: 0,
    maxReferrals: 5,
    commissionPercent: 10,
  },
  {
    name: 'silver',
    label: 'Silver',
    minReferrals: 6,
    maxReferrals: 15,
    commissionPercent: 15,
  },
  {
    name: 'gold',
    label: 'Gold',
    minReferrals: 16,
    maxReferrals: 30,
    commissionPercent: 20,
  },
  {
    name: 'diamond',
    label: 'Diamond',
    minReferrals: 31,
    maxReferrals: null, // No upper limit
    commissionPercent: 25,
  },
];

/**
 * Get tier based on number of active referrals
 */
export function getTierForReferrals(activeReferrals: number): TierConfig {
  for (const tier of REFERRAL_TIERS) {
    if (
      activeReferrals >= tier.minReferrals &&
      (tier.maxReferrals === null || activeReferrals <= tier.maxReferrals)
    ) {
      return tier;
    }
  }
  
  // Fallback to bronze if no tier matches (shouldn't happen)
  return REFERRAL_TIERS[0];
}

/**
 * Get commission percentage for a given number of active referrals
 */
export function getCommissionPercent(activeReferrals: number): number {
  const tier = getTierForReferrals(activeReferrals);
  return tier.commissionPercent;
}

/**
 * Calculate commission amount based on payment amount and active referrals
 */
export function calculateCommission(paymentAmount: number, activeReferrals: number): number {
  const commissionPercent = getCommissionPercent(activeReferrals);
  return (paymentAmount * commissionPercent) / 100;
}

/**
 * Get tier name for a given number of active referrals
 */
export function getTierName(activeReferrals: number): TierName {
  const tier = getTierForReferrals(activeReferrals);
  return tier.name;
}
