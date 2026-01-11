import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { generateAffiliateCode } from '../utils/affiliateCode';

export interface CompanyData {
  id: string;
  name: string;
  cnpj?: string;
  address: string;
  phone: string;
  email?: string;
  logoUrl?: string;
  signatureUrl?: string;
  primaryColor?: string;
  contractTemplate?: string;
  segment?: string; // 'glazier' | 'locksmith' | 'plumber' | 'handyman'
  profession?: 'vidracaria' | 'serralheria' | 'chaveiro' | 'marido-de-aluguel' | 'eletrica-hidraulica'; // Primary profession for onboarding
  createdAt?: any;
  updatedAt?: any;
  // Affiliate System Fields
  affiliateCode?: string; // Unique code (e.g., "VID4829")
  referredBy?: string | null; // ID of the company who referred this user
  referralStats?: {
    activeReferrals: number; // Count of paying users referred
    totalEarnings: number; // Lifetime value
    currentTier: 'bronze' | 'silver' | 'gold' | 'diamond';
  };
  wallet?: {
    pending: number; // Funds < 30 days old
    available: number; // Funds ready for withdrawal
    totalPaid: number; // Total paid out
  };
  // Discount fields
  firstMonthDiscount?: boolean; // 15% discount on first month
  discountExpirationDate?: any; // Timestamp when discount expires (created_at + 30 days)
  // Stripe Integration
  stripeCustomerId?: string; // Stripe Customer ID (e.g., "cus_12345")
  // Tutorial Progress Tracking
  tutorialProgress?: {
    dashboardSeen: boolean;
    quotesSeen: boolean;
    workOrdersSeen: boolean;
    financeSeen: boolean;
  };
  // Payment Settings
  paymentSettings?: {
    pixDiscount: number; // e.g., 5
    maxInstallments: number; // e.g., 3
    paymentNotes: string; // Custom text, e.g., "Entrada de 50% + restante na entrega."
  };
  // PDF Customization Settings
  pdfSettings?: {
    primaryColor: string; // Hex code (e.g., #2563EB) for borders/headers
    secondaryColor: string; // Accent color
    documentTitle: string; // Custom title (e.g., "Proposta Comercial" vs "Orçamento")
    quoteValidityDays: number; // Default: 15
    customFooterText: string; // e.g., "Obrigado pela preferência! Visite nosso site."
    showCnpj: boolean; // Toggle to show/hide document ID
    legalTerms: string; // Default warranty/service terms text
  };
}

export function useCompany() {
  const { userMetadata } = useAuth();
  const companyId = userMetadata?.companyId;
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (companyId) {
      loadCompany();
    } else {
      setLoading(false);
    }
  }, [companyId]);

  const loadCompany = async () => {
    if (!companyId) {
      setError('Empresa não identificada. Por favor, verifique se você está autenticado corretamente.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const companyDoc = await getDoc(doc(db, 'companies', companyId));
      
      if (companyDoc.exists()) {
        setCompany({
          id: companyDoc.id,
          ...companyDoc.data(),
        } as CompanyData);
        setError(null);
      } else {
        // Create default company document if it doesn't exist
        try {
          // Generate affiliate code for default company
          const affiliateCode = await generateAffiliateCode('Gestor Vitreo');
          
          const defaultCompany: Omit<CompanyData, 'id'> = {
            name: 'Gestor Vitreo',
            address: '',
            phone: '',
            email: '',
            affiliateCode,
            referredBy: null,
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
            segment: 'glazier',
            tutorialProgress: {
              dashboardSeen: false,
              quotesSeen: false,
              workOrdersSeen: false,
              financeSeen: false,
            },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          
          await setDoc(doc(db, 'companies', companyId), defaultCompany);
          setCompany({
            id: companyId,
            ...defaultCompany,
          } as CompanyData);
          setError(null);
        } catch (createErr: any) {
          console.error('Error creating default company:', createErr);
          setError(`Erro ao criar empresa padrão: ${createErr.message}`);
        }
      }
    } catch (err: any) {
      console.error('Error loading company:', err);
      if (err.code === 'permission-denied') {
        setError('Permissão negada. Verifique se você tem acesso a esta empresa. Se o problema persistir, entre em contato com o administrador.');
      } else {
        setError(err.message || 'Erro ao carregar dados da empresa');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateCompany = async (data: Partial<Omit<CompanyData, 'id'>>) => {
    if (!companyId) throw new Error('companyId não encontrado');

    try {
      const updateData = {
        ...data,
        updatedAt: serverTimestamp(),
      };
      
      await setDoc(
        doc(db, 'companies', companyId),
        updateData,
        { merge: true }
      );
      
      // Reload company data
      await loadCompany();
    } catch (err: any) {
      console.error('Error updating company:', err);
      throw err;
    }
  };

  return {
    company,
    loading,
    error,
    updateCompany,
    reload: loadCompany,
  };
}
