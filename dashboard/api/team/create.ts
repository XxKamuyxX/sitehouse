/**
 * Team Member Creation API Route (Vercel Serverless Function)
 * 
 * POST /api/team/create
 * Body: {
 *   email: string,
 *   password: string,
 *   displayName: string,
 *   role: 'owner' | 'admin' | 'technician' | 'sales',
 *   companyId: string (from authenticated user)
 * }
 * 
 * Returns: { success: boolean, userId?: string, error?: string }
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
  body: any;
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
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, displayName, role } = req.body;

    // Validate input
    if (!email || !password || !displayName || !role) {
      return res.status(400).json({ error: 'Missing required fields: email, password, displayName, role' });
    }

    // Validate role
    const validRoles = ['owner', 'admin', 'technician', 'sales'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    // Get the requester's authentication token (from Authorization header)
    // Note: In production, you should verify this token properly
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized. Missing or invalid authorization token.' });
    }

    const token = authHeader.split('Bearer ')[1];
    let requesterUser;
    try {
      const decodedToken = await auth.verifyIdToken(token);
      requesterUser = await auth.getUser(decodedToken.uid);
    } catch (tokenError) {
      return res.status(401).json({ error: 'Unauthorized. Invalid token.' });
    }

    // Get requester's user document to check role and companyId
    const requesterDoc = await db.collection('users').doc(requesterUser.uid).get();
    if (!requesterDoc.exists) {
      return res.status(403).json({ error: 'Forbidden. Requester user document not found.' });
    }

    const requesterData = requesterDoc.data();
    const requesterRole = requesterData?.role;
    const requesterCompanyId = requesterData?.companyId;

    // Check permissions: Only 'owner' or 'admin' can create users
    if (requesterRole !== 'owner' && requesterRole !== 'admin') {
      return res.status(403).json({ error: 'Forbidden. Only owners and admins can create team members.' });
    }

    if (!requesterCompanyId) {
      return res.status(403).json({ error: 'Forbidden. Requester companyId not found.' });
    }

    // Check if email already exists
    try {
      await auth.getUserByEmail(email);
      return res.status(400).json({ error: 'Email already in use' });
    } catch (error: any) {
      // If user doesn't exist, error.code will be 'auth/user-not-found', which is expected
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    // Create the user in Firebase Auth
    const newUser = await auth.createUser({
      email,
      password,
      displayName,
      emailVerified: false,
    });

    // Create the user document in Firestore
    await db.collection('users').doc(newUser.uid).set({
      email,
      name: displayName,
      role,
      companyId: requesterCompanyId, // Use requester's companyId
      active: true, // Default to active
      createdAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      userId: newUser.uid,
      message: 'Team member created successfully',
    });
  } catch (error: any) {
    console.error('Error creating team member:', error);
    
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ error: 'Email already in use' });
    }
    
    if (error.code === 'auth/invalid-email') {
      return res.status(400).json({ error: 'Invalid email address' });
    }
    
    if (error.code === 'auth/weak-password') {
      return res.status(400).json({ error: 'Password is too weak. Use at least 6 characters.' });
    }

    return res.status(500).json({ 
      error: error.message || 'Internal server error',
      code: error.code,
    });
  }
}
