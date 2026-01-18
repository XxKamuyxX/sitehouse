/**
 * Affiliate Network Stats API Route (Vercel Serverless Function)
 * 
 * GET /api/affiliate/network
 * Headers: { Authorization: "Bearer <firebase-id-token>" }
 * 
 * Returns: {
 *   stats: {
 *     tier1Count: number,
 *     tier2Count: number,
 *     tier3Count: number,
 *     totalNetwork: number
 *   },
 *   directReferrals: Array<{
 *     uid: string,
 *     name: string,
 *     email: string,
 *     joinDate: Timestamp,
 *     companyId: string
 *   }>
 * }
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
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

const auth = getAuth();
const db = getFirestore();

// Type definitions for Vercel serverless function
type VercelRequest = {
  method: string;
  headers: {
    authorization?: string;
    [key: string]: string | undefined;
  };
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (data: any) => void;
  send: (data: any) => void;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate the user
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized. Missing or invalid authorization token.' });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (tokenError) {
      return res.status(401).json({ error: 'Unauthorized. Invalid token.' });
    }

    const currentUserId = decodedToken.uid;

    // Get current user document to verify it exists
    const currentUserDoc = await db.collection('users').doc(currentUserId).get();
    if (!currentUserDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Step 1: Get Tier 1 (Direct Referrals)
    const tier1Snapshot = await db.collection('users')
      .where('affiliateParentId', '==', currentUserId)
      .get();

    const tier1Users = tier1Snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data(),
    }));

    const tier1Count = tier1Users.length;
    const tier1Uids = tier1Users.map(u => u.uid);

    // Step 2: Get Tier 2 (Indirect Referrals) - Only if Tier 1 exists
    let tier2Count = 0;
    let tier2Uids: string[] = [];

    if (tier1Uids.length > 0) {
      // Firestore 'in' query limit is 10, so we need to chunk if needed
      const chunkSize = 10;
      const tier2Promises: Promise<any>[] = [];

      for (let i = 0; i < tier1Uids.length; i += chunkSize) {
        const chunk = tier1Uids.slice(i, i + chunkSize);
        tier2Promises.push(
          db.collection('users')
            .where('affiliateParentId', 'in', chunk)
            .get()
        );
      }

      const tier2Snapshots = await Promise.all(tier2Promises);
      const tier2Users: any[] = [];
      
      tier2Snapshots.forEach(snapshot => {
        snapshot.docs.forEach(doc => {
          tier2Users.push({
            uid: doc.id,
            ...doc.data(),
          });
        });
      });

      tier2Count = tier2Users.length;
      tier2Uids = tier2Users.map(u => u.uid);
    }

    // Step 3: Get Tier 3 (Deep Network) - Only if Tier 2 exists
    let tier3Count = 0;

    if (tier2Uids.length > 0) {
      const chunkSize = 10;
      const tier3Promises: Promise<any>[] = [];

      for (let i = 0; i < tier2Uids.length; i += chunkSize) {
        const chunk = tier2Uids.slice(i, i + chunkSize);
        tier3Promises.push(
          db.collection('users')
            .where('affiliateParentId', 'in', chunk)
            .get()
        );
      }

      const tier3Snapshots = await Promise.all(tier3Promises);
      
      tier3Snapshots.forEach(snapshot => {
        tier3Count += snapshot.size;
      });
    }

    // Prepare direct referrals list (Tier 1 only) with user details
    const directReferrals = tier1Users.map(user => ({
      uid: user.uid,
      name: user.name || user.displayName || 'Sem nome',
      email: user.email || 'Sem email',
      joinDate: user.createdAt || user.joinedAt || null,
      companyId: user.companyId || null,
    }));

    // Calculate total network size
    const totalNetwork = tier1Count + tier2Count + tier3Count;

    return res.status(200).json({
      stats: {
        tier1Count,
        tier2Count,
        tier3Count,
        totalNetwork,
      },
      directReferrals,
    });
  } catch (error: any) {
    console.error('Error fetching affiliate network:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Unknown error occurred',
    });
  }
}
