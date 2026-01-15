/**
 * Referral Commission Processing
 * Handles commission calculation and ledger management
 */

import { collection, addDoc, query, where, getDocs, updateDoc, doc, getDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { calculateCommission, getTierName } from './referralTiers';

export interface ReferralLedgerEntry {
  id?: string;
  referrerId: string; // Company ID of the referrer
  referrerUserId?: string; // User ID of the referrer (for MLM tracking)
  referredCompanyId: string; // Company ID of the company that made payment
  amount: number; // Commission amount in BRL
  paymentAmount: number; // Original payment amount
  commissionPercent: number; // Commission percentage applied
  tier: string; // Tier level: "1", "2", "3" (MLM) or legacy tier name (bronze, silver, gold, diamond)
  tierLabel?: string; // Human-readable tier label (e.g., "Nível 1 - Venda Direta")
  status: 'pending' | 'released' | 'paid';
  releaseDate: any; // Timestamp when funds become available (now + 30 days)
  createdAt: any; // Timestamp when commission was created
  releasedAt?: any; // Timestamp when funds were moved to available
  paidAt?: any; // Timestamp when funds were withdrawn
}

/**
 * Process a payment and create commission for referrer
 * This should be called when a subscription payment is received
 * 
 * @param payingCompanyId - ID of the company making the payment
 * @param paymentAmount - Amount paid (in BRL, e.g., 40.00)
 */
export async function processPaymentCommission(payingCompanyId: string, paymentAmount: number): Promise<void> {
  try {
    // 1. Get the company that made the payment
    const payingCompanyDoc = await getDoc(doc(db, 'companies', payingCompanyId));
    if (!payingCompanyDoc.exists()) {
      console.error(`Company ${payingCompanyId} not found`);
      return;
    }

    const payingCompanyData = payingCompanyDoc.data();
    const referredBy = payingCompanyData.referredBy;

    // 2. If no referrer, no commission to process
    if (!referredBy) {
      console.log(`Company ${payingCompanyId} has no referrer. No commission to process.`);
      return;
    }

    // 3. Get the referrer company
    const referrerDoc = await getDoc(doc(db, 'companies', referredBy));
    if (!referrerDoc.exists()) {
      console.error(`Referrer company ${referredBy} not found`);
      return;
    }

    const referrerData = referrerDoc.data();
    const activeReferrals = referrerData.referralStats?.activeReferrals || 0;

    // 4. Calculate commission based on tier
    const tier = getTierName(activeReferrals);
    const commissionAmount = calculateCommission(paymentAmount, activeReferrals);
    const commissionPercent = (commissionAmount / paymentAmount) * 100;

    // 5. Create referral ledger entry
    const releaseDate = Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // 30 days from now

    const ledgerEntry: Omit<ReferralLedgerEntry, 'id'> = {
      referrerId: referredBy,
      referredCompanyId: payingCompanyId,
      amount: commissionAmount,
      paymentAmount: paymentAmount,
      commissionPercent: commissionPercent,
      tier: tier,
      status: 'pending',
      releaseDate: releaseDate,
      createdAt: serverTimestamp(),
    };

    await addDoc(collection(db, 'referral_ledger'), ledgerEntry);

    // 6. Update referrer's wallet.pending balance
    const currentPending = referrerData.wallet?.pending || 0;
    const newPending = currentPending + commissionAmount;

    // 7. Update referrer's referralStats.totalEarnings
    const currentTotalEarnings = referrerData.referralStats?.totalEarnings || 0;
    const newTotalEarnings = currentTotalEarnings + commissionAmount;

    // 8. Check if tier needs to be updated
    const newActiveReferrals = activeReferrals + 1;
    const newTier = getTierName(newActiveReferrals);

    await updateDoc(doc(db, 'companies', referredBy), {
      'wallet.pending': newPending,
      'referralStats.totalEarnings': newTotalEarnings,
      'referralStats.activeReferrals': newActiveReferrals,
      'referralStats.currentTier': newTier,
      updatedAt: serverTimestamp(),
    });

    console.log(`Commission processed: ${commissionAmount.toFixed(2)} BRL for referrer ${referredBy} (Tier: ${tier})`);
  } catch (error: any) {
    console.error('Error processing payment commission:', error);
    throw error;
  }
}

/**
 * Mature pending commissions (move from pending to available after 30 days)
 * Should be called periodically (on dashboard load or via cron)
 */
export async function maturePendingCommissions(): Promise<{
  matured: number;
  errors: number;
  totalAmountMatured: number;
}> {
  try {
    const now = new Date();
    
    // 1. Find all pending ledger entries where releaseDate has passed
    const pendingQuery = query(
      collection(db, 'referral_ledger'),
      where('status', '==', 'pending')
    );
    
    const pendingSnapshot = await getDocs(pendingQuery);
    const pendingEntries = pendingSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as ReferralLedgerEntry))
      .filter((entry) => {
        if (!entry.releaseDate) return false;
        
        const releaseDate = entry.releaseDate?.toDate 
          ? entry.releaseDate.toDate() 
          : entry.releaseDate?.seconds
          ? new Date(entry.releaseDate.seconds * 1000)
          : new Date(entry.releaseDate);
        
        return releaseDate <= now;
      });

    let matured = 0;
    let errors = 0;
    let totalAmountMatured = 0;

    // 2. For each matured entry, move funds from pending to available
    for (const entry of pendingEntries) {
      try {
        // Get referrer company
        const referrerDoc = await getDoc(doc(db, 'companies', entry.referrerId));
        if (!referrerDoc.exists()) {
          console.error(`Referrer company ${entry.referrerId} not found for ledger entry ${entry.id}`);
          errors++;
          continue;
        }

        const referrerData = referrerDoc.data();
        const currentPending = referrerData.wallet?.pending || 0;
        const currentAvailable = referrerData.wallet?.available || 0;

        // Ensure we don't subtract more than what's in pending
        const amountToMove = Math.min(entry.amount, currentPending);
        const newPending = currentPending - amountToMove;
        const newAvailable = currentAvailable + amountToMove;

        // Update company wallet
        await updateDoc(doc(db, 'companies', entry.referrerId), {
          'wallet.pending': newPending,
          'wallet.available': newAvailable,
          updatedAt: serverTimestamp(),
        });

        // Update ledger entry status
        await updateDoc(doc(db, 'referral_ledger', entry.id!), {
          status: 'released',
          releasedAt: serverTimestamp(),
        });

        matured++;
        totalAmountMatured += amountToMove;
      } catch (error: any) {
        console.error(`Error maturing commission ${entry.id}:`, error);
        errors++;
      }
    }

    console.log(`Commission maturation complete: ${matured} matured, ${errors} errors, ${totalAmountMatured.toFixed(2)} BRL moved to available`);
    
    return {
      matured,
      errors,
      totalAmountMatured,
    };
  } catch (error: any) {
    console.error('Error in maturePendingCommissions:', error);
    throw error;
  }
}
