import { createContext, useContext, ReactNode } from 'react';
import { useCompany } from '../hooks/useCompany';
import { useAuth } from './AuthContext';

export interface BrandingData {
  name: string;
  logoUrl: string | null;
  primaryColor: string;
  loading: boolean;
}

const defaultBranding: BrandingData = {
  name: 'Gestor Vitreo',
  logoUrl: '/logo.png',
  primaryColor: '#0F172A', // navy color
  loading: false,
};

interface BrandingContextType {
  branding: BrandingData;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export function BrandingProvider({ children }: { children: ReactNode }) {
  const { loading: authLoading } = useAuth();
  
  // Only fetch company if we have a companyId
  const { company, loading: companyLoading } = useCompany();
  
  const loading = authLoading || companyLoading;
  
  const branding: BrandingData = {
    name: company?.name || defaultBranding.name,
    logoUrl: company?.logoUrl || defaultBranding.logoUrl,
    primaryColor: (company as any)?.primaryColor || defaultBranding.primaryColor,
    loading: loading,
  };

  return (
    <BrandingContext.Provider value={{ branding }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    // If not within provider, return defaults
    return { branding: defaultBranding };
  }
  return context;
}
