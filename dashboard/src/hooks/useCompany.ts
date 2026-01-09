import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

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
  createdAt?: any;
  updatedAt?: any;
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
          const defaultCompany: Omit<CompanyData, 'id'> = {
            name: 'Gestor Vitreo',
            address: '',
            phone: '',
            email: '',
            createdAt: new Date(),
            updatedAt: new Date(),
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
