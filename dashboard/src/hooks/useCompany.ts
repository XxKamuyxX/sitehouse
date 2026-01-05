import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useCompanyId } from '../lib/queries';

export interface CompanyData {
  id: string;
  name: string;
  cnpj?: string;
  address: string;
  phone: string;
  email?: string;
  logoUrl?: string;
  createdAt?: any;
  updatedAt?: any;
}

export function useCompany() {
  const companyId = useCompanyId();
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
    if (!companyId) return;

    try {
      setLoading(true);
      const companyDoc = await getDoc(doc(db, 'companies', companyId));
      
      if (companyDoc.exists()) {
        setCompany({
          id: companyDoc.id,
          ...companyDoc.data(),
        } as CompanyData);
      } else {
        // Create default company document if it doesn't exist
        const defaultCompany: Omit<CompanyData, 'id'> = {
          name: 'House Manutenção',
          address: 'Rua Rio Grande do Norte, 726, Savassi',
          phone: '(31) 98279-8513',
          email: 'contato@housemanutencao.com.br',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        await setDoc(doc(db, 'companies', companyId), defaultCompany);
        setCompany({
          id: companyId,
          ...defaultCompany,
        } as CompanyData);
      }
      setError(null);
    } catch (err: any) {
      console.error('Error loading company:', err);
      setError(err.message || 'Erro ao carregar dados da empresa');
    } finally {
      setLoading(false);
    }
  };

  const updateCompany = async (data: Partial<Omit<CompanyData, 'id'>>) => {
    if (!companyId) throw new Error('companyId não encontrado');

    try {
      const updateData = {
        ...data,
        updatedAt: new Date(),
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
