import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Loader2, CheckCircle2, Building2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { generateAffiliateCode } from '../utils/affiliateCode';
import { syncStripeCustomer } from '../services/stripe';
import { Timestamp } from 'firebase/firestore';

export function SetupCompany() {
  const { user, userMetadata, loading: authLoading, refreshUserProfile } = useAuth();
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Redirect if already has companyId
  useEffect(() => {
    if (!authLoading && user && userMetadata?.companyId) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, userMetadata, authLoading, navigate]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Redirect if phone not verified
  useEffect(() => {
    if (!authLoading && user && userMetadata && !userMetadata.mobileVerified) {
      navigate('/activate', { replace: true });
    }
  }, [user, userMetadata, authLoading, navigate]);

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      // CPF: XXX.XXX.XXX-XX
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4').replace(/[-.]$/, '');
    } else {
      // CNPJ: XX.XXX.XXX/XXXX-XX
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5').replace(/[-./]$/, '');
    }
  };

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value);
    setCnpj(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyName || companyName.trim() === '') {
      setError('Nome da empresa é obrigatório');
      return;
    }

    if (!user) {
      setError('Usuário não autenticado');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // Generate unique companyId (slugified name + random string)
      const slug = companyName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const randomSuffix = Math.random().toString(36).substring(2, 10);
      const newCompanyId = `${slug}-${randomSuffix}`;

      // Calculate trial end date (7 days from now)
      const trialEndsAt = Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

      // Generate affiliate code for new company
      const affiliateCode = await generateAffiliateCode(companyName);

      // Create company document
      await setDoc(doc(db, 'companies', newCompanyId), {
        name: companyName.trim(),
        cnpj: cnpj.trim() || '',
        address: address.trim() || '',
        email: user.email || '',
        phone: userMetadata?.phone || '',
        ownerId: user.uid,
        affiliateCode,
        referredBy: null,
        firstMonthDiscount: false,
        discountExpirationDate: null,
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
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Update user document with companyId and role
      await updateDoc(doc(db, 'users', user.uid), {
        companyId: newCompanyId,
        role: 'owner',
        subscriptionStatus: 'trial',
        trialEndsAt,
        isActive: true,
        updatedAt: serverTimestamp(),
      });

      // Sync with Stripe (create customer) - non-blocking
      try {
        await syncStripeCustomer(newCompanyId, user.email || '', companyName.trim());
      } catch (stripeError) {
        console.error('Error syncing with Stripe (non-blocking):', stripeError);
        // Don't throw - company creation should succeed even if Stripe sync fails
      }

      setSuccess(true);

      // Refresh user profile to update local state immediately
      await refreshUserProfile();

      // Small delay to ensure state propagation, then redirect
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
    } catch (error: any) {
      console.error('Error setting up company:', error);
      
      if (error.code === 'permission-denied' || error.code === 'PERMISSION_DENIED') {
        setError('Erro de permissão: Não foi possível criar a empresa. Entre em contato com o suporte.');
        console.error('Firestore permission denied. Check firestore.rules for companies collection create permissions.');
      } else if (error.code?.startsWith('firestore/') || error.code?.startsWith('PERMISSION')) {
        setError('Erro ao criar empresa no banco de dados. Verifique suas permissões ou entre em contato com o suporte.');
        console.error('Firestore error:', error);
      } else {
        setError(error.message || 'Erro ao configurar empresa. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Don't render if user is not logged in (redirect will happen)
  if (!user) {
    return null;
  }

  // Don't render if phone not verified (redirect will happen)
  if (userMetadata && !userMetadata.mobileVerified) {
    return null;
  }

  // Don't render if already has company (redirect will happen)
  if (userMetadata?.companyId) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="max-w-md w-full">
        <div className="text-center mb-6">
          <Building2 className="w-16 h-16 text-navy mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-navy mb-2">Bem-vindo ao Gestor Vítreo!</h1>
          <p className="text-slate-600">
            Para começar, vamos configurar sua vidraçaria.
          </p>
        </div>

        <div className="space-y-4">
          {success ? (
            <div className="text-center py-4">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-green-700 font-medium mb-2">Empresa configurada com sucesso!</p>
              <p className="text-sm text-slate-600">Redirecionando para o dashboard...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nome da Empresa <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ex: Vidraçaria Silva"
                  disabled={isLoading}
                  className="w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  CNPJ (Opcional)
                </label>
                <Input
                  type="text"
                  value={cnpj}
                  onChange={handleCNPJChange}
                  placeholder="00.000.000/0000-00"
                  disabled={isLoading}
                  className="w-full"
                  maxLength={18}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Endereço (Opcional)
                </label>
                <Input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rua, número - Cidade, Estado"
                  disabled={isLoading}
                  className="w-full"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={isLoading || !companyName.trim()}
                className="w-full flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Configurando...
                  </>
                ) : (
                  <>
                    <Building2 className="w-5 h-5" />
                    Configurar Empresa
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
}
