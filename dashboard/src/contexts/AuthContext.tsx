import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { generateAffiliateCode } from '../utils/affiliateCode';
import { syncStripeCustomer } from '../services/stripe';

export type UserRole = 'admin' | 'tech' | 'master';

export interface UserMetadata {
  companyId: string;
  role: UserRole;
  name?: string;
  email: string;
  subscriptionStatus?: 'trial' | 'trialing' | 'active' | 'expired' | 'canceled' | 'past_due';
  trialEndsAt?: any;
  isActive?: boolean;
  // Payout Information (for affiliates/users who receive commissions)
  payoutInfo?: {
    pixKey: string;
    pixKeyType: string; // 'CPF', 'EMAIL', 'PHONE', 'RANDOM'
    bankName: string;
    agency: string;
    accountNumber: string;
    accountType: string; // 'Corrente' or 'Poupança'
    holderName: string;
    holderCpf: string;
  };
}

interface AuthContextType {
  user: User | null;
  userMetadata: UserMetadata | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  createUser: (email: string, password: string, companyId: string, role: UserRole, name?: string) => Promise<void>;
  signUp: (email: string, password: string, companyName: string, ownerName: string, phone: string, referredBy?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userMetadata, setUserMetadata] = useState<UserMetadata | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserMetadata = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        console.log('User metadata loaded:', { userId, companyId: data.companyId, role: data.role });
        if (!data.companyId) {
          console.error('User document exists but companyId is missing!', data);
          setUserMetadata(null);
          return;
        }
        setUserMetadata({
          companyId: data.companyId,
          role: data.role,
          name: data.name,
          email: data.email,
          subscriptionStatus: data.subscriptionStatus,
          trialEndsAt: data.trialEndsAt,
          isActive: data.isActive !== false, // Default to true if not set
          payoutInfo: data.payoutInfo,
        });
      } else {
        console.error('User document does not exist for userId:', userId);
        // If user document doesn't exist, create it with default values
        // This handles legacy users - they'll need to be migrated
        setUserMetadata(null);
      }
    } catch (error: any) {
      console.error('Error loading user metadata:', error);
      if (error.code === 'permission-denied') {
        console.error('Permission denied when loading user metadata. Check Firestore rules for users collection.');
      }
      setUserMetadata(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await loadUserMetadata(firebaseUser.uid);
      } else {
        setUserMetadata(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUserMetadata(null);
  };

  const createUser = async (email: string, password: string, companyId: string, role: UserRole, name?: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = userCredential.user;
    
    // Create user document in Firestore
    await setDoc(doc(db, 'users', newUser.uid), {
      email,
      companyId,
      role,
      name: name || '',
      createdAt: new Date(),
    });
  };

  const signUp = async (email: string, password: string, companyName: string, ownerName: string, phone: string, referredBy?: string) => {
    // Generate unique companyId (slugified name + random string)
    const slug = companyName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 10);
    const companyId = `${slug}-${randomSuffix}`;

    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = userCredential.user;

    // Calculate trial end date (14 days from now)
    const trialEndsAt = Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000));

    // Create user document
    await setDoc(doc(db, 'users', newUser.uid), {
      email,
      companyId,
      role: 'admin' as UserRole,
      name: ownerName,
      subscriptionStatus: 'trial',
      trialEndsAt,
      isActive: true,
      createdAt: Timestamp.now(),
    });

    // Generate affiliate code for new company
    const affiliateCode = await generateAffiliateCode(companyName);
    
    // Calculate discount expiration date (30 days from now if referred)
    const discountExpirationDate = referredBy
      ? Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
      : null;
    
    // Create company document with affiliate system fields
    await setDoc(doc(db, 'companies', companyId), {
      name: companyName,
      phone,
      email,
      address: '',
      affiliateCode,
      referredBy: referredBy || null,
      firstMonthDiscount: referredBy ? true : false,
      discountExpirationDate: discountExpirationDate || null,
      referralStats: {
        activeReferrals: 0,
        totalEarnings: 0,
        currentTier: 'bronze',
      },
      wallet: {
        pending: 0,
        available: 0,
        totalPaid: 0,
      },
      tutorialProgress: {
        dashboardSeen: false,
        quotesSeen: false,
        workOrdersSeen: false,
        financeSeen: false,
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // Sync with Stripe (create customer)
    // This is non-blocking - if it fails, company is still created
    try {
      await syncStripeCustomer(companyId, email, companyName);
    } catch (stripeError) {
      console.error('Error syncing with Stripe (non-blocking):', stripeError);
      // Don't throw - company creation should succeed even if Stripe sync fails
    }
  };

  return (
    <AuthContext.Provider value={{ user, userMetadata, loading, signIn, signOut, createUser, signUp }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}




