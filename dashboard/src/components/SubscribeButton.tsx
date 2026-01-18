/**
 * Subscribe Button Component
 * 
 * A reusable button component that triggers the Stripe Checkout flow
 * for premium subscription with 7-day free trial.
 */

import { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useCompany } from '../hooks/useCompany';
import { useAuth } from '../contexts/AuthContext';
import { createSubscriptionCheckout, isReferralDiscountActive } from '../services/stripe';
import { CreditCard, Loader2, CheckCircle2, XCircle, Gift } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface SubscribeButtonProps {
  /**
   * Custom label for the button
   * @default "Assinar Premium (7 Dias Grátis)"
   */
  label?: string;
  
  /**
   * Custom variant for the button
   * @default "primary"
   */
  variant?: 'primary' | 'secondary' | 'outline';
  
  /**
   * Custom size for the button
   * @default "lg"
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Custom CSS classes
   */
  className?: string;
  
  /**
   * Custom success redirect URL
   * @default "/admin/settings?status=success"
   */
  successUrl?: string;
  
  /**
   * Custom cancel redirect URL
   * @default "/admin/settings?status=cancel"
   */
  cancelUrl?: string;
  
  /**
   * Show full width button
   * @default false
   */
  fullWidth?: boolean;
  
  /**
   * Callback fired when checkout is initiated (before redirect)
   */
  onCheckoutStart?: () => void;
  
  /**
   * Callback fired if checkout fails
   */
  onError?: (error: Error) => void;
}

export function SubscribeButton({
  label,
  variant = 'primary',
  size = 'lg',
  className = '',
  successUrl,
  cancelUrl,
  fullWidth = false,
  onCheckoutStart,
  onError,
}: SubscribeButtonProps) {
  const { userMetadata } = useAuth();
  
  // Determine label based on trial status
  const getLabel = () => {
    if (label) return label; // Use custom label if provided
    
    // Check if trial has expired
    const trialEndDate = userMetadata?.trialEndsAt 
      ? (userMetadata.trialEndsAt?.toDate ? userMetadata.trialEndsAt.toDate() : new Date(userMetadata.trialEndsAt))
      : null;
    const isTrialExpired = trialEndDate ? new Date() > trialEndDate : false;
    const isActive = userMetadata?.subscriptionStatus === 'active' || userMetadata?.subscriptionStatus === 'trialing';
    
    if (isTrialExpired && !isActive) {
      return 'Assinar Agora (Liberar Acesso)';
    }
    
    return 'Assinar Premium (7 Dias Grátis)';
  };
  
  const buttonLabel = getLabel();
  const { company, loading: companyLoading } = useCompany();
  const [loading, setLoading] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [validatingCode, setValidatingCode] = useState(false);
  const [codeValidation, setCodeValidation] = useState<{
    status: 'idle' | 'valid' | 'invalid';
    message: string;
  }>({ status: 'idle', message: '' });

  const handleValidateReferralCode = async (code: string) => {
    if (!code || code.trim() === '') {
      setCodeValidation({ status: 'idle', message: '' });
      return;
    }

    // Normalize code: uppercase and remove spaces
    const normalizedCode = code.toUpperCase().trim().replace(/\s/g, '');

    // Validate format: 3 letters + 4 digits
    if (!/^[A-Z]{3}\d{4}$/.test(normalizedCode)) {
      setCodeValidation({
        status: 'invalid',
        message: 'Código inválido. Formato: 3 letras + 4 dígitos (ex: VID4829)',
      });
      return;
    }

    try {
      setValidatingCode(true);
      
      // Search for user with this myReferralCode in users collection
      const usersQuery = query(
        collection(db, 'users'),
        where('myReferralCode', '==', normalizedCode)
      );
      const snapshot = await getDocs(usersQuery);

      if (snapshot.empty) {
        setCodeValidation({
          status: 'invalid',
          message: 'Código não encontrado.',
        });
      } else {
        setCodeValidation({
          status: 'valid',
          message: 'Desconto de 15% aplicado!',
        });
      }
    } catch (error: any) {
      console.error('Error validating referral code:', error);
      setCodeValidation({
        status: 'invalid',
        message: 'Erro ao validar código. Tente novamente.',
      });
    } finally {
      setValidatingCode(false);
    }
  };

  const handleReferralCodeChange = (value: string) => {
    setReferralCode(value);
    // Validate on blur or after typing stops
    if (value.trim() === '') {
      setCodeValidation({ status: 'idle', message: '' });
    }
  };

  const handleReferralCodeBlur = () => {
    if (referralCode.trim()) {
      handleValidateReferralCode(referralCode);
    }
  };

  const handleSubscribe = async () => {
    // Check if company is loaded
    if (companyLoading) {
      alert('Aguarde enquanto carregamos seus dados...');
      return;
    }

    // Validate company exists
    if (!company?.id) {
      alert('Erro: Empresa não encontrada. Por favor, recarregue a página.');
      return;
    }

    // Validate user is authenticated
    if (!userMetadata?.companyId) {
      alert('Erro: Você precisa estar autenticado para assinar.');
      return;
    }

    // If referral code is entered but not validated, validate it first
    if (referralCode.trim()) {
      await handleValidateReferralCode(referralCode);
      // Re-check validation status after async validation
      const normalizedCode = referralCode.toUpperCase().trim().replace(/\s/g, '');
      if (/^[A-Z]{3}\d{4}$/.test(normalizedCode)) {
        // Code format is valid, check if it exists in database
        const usersQuery = query(
          collection(db, 'users'),
          where('myReferralCode', '==', normalizedCode)
        );
        const snapshot = await getDocs(usersQuery);
        if (snapshot.empty) {
          alert('Código de indicação não encontrado. Por favor, verifique o código ou deixe em branco.');
          setLoading(false);
          return;
        }
      } else {
        alert('Código de indicação inválido. Formato: 3 letras + 4 dígitos (ex: VID4829). Deixe em branco se não tiver código.');
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    onCheckoutStart?.();

    try {
      // Check if referral discount is active (from company) OR if valid code was entered
      const referralDiscount = isReferralDiscountActive(company) || codeValidation.status === 'valid';

      // Get base URL for redirects
      const baseUrl = window.location.origin;
      const finalSuccessUrl = successUrl || `${baseUrl}/admin/settings?status=success`;
      const finalCancelUrl = cancelUrl || `${baseUrl}/admin/settings?status=cancel`;

      // Normalize referral code if provided
      const normalizedReferralCode = referralCode.trim()
        ? referralCode.toUpperCase().trim().replace(/\s/g, '')
        : undefined;

      // Call the checkout API
      const checkoutUrl = await createSubscriptionCheckout({
        companyId: company.id,
        referralDiscountActive: referralDiscount,
        referralCode: normalizedReferralCode,
        successUrl: finalSuccessUrl,
        cancelUrl: finalCancelUrl,
      });

      // Redirect to Stripe Checkout
      window.location.href = checkoutUrl;
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      setLoading(false);
      
      const errorMessage = error.message || 'Erro desconhecido ao iniciar checkout';
      
      if (onError) {
        onError(error);
      } else {
        alert(`Erro ao iniciar checkout: ${errorMessage}\n\nPor favor, tente novamente ou entre em contato com o suporte.`);
      }
    }
  };

  // Show discount badge if referral discount is active
  const showDiscount = company && isReferralDiscountActive(company);
  const showCodeDiscount = codeValidation.status === 'valid';

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {(showDiscount || showCodeDiscount) && (
        <div className="mb-3 text-center">
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <Gift className="w-4 h-4 mr-1.5" />
            Você tem 15% de desconto na primeira mensalidade!
          </span>
        </div>
      )}

      {/* Referral Code Input */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Possui código de indicação?
        </label>
        <div className="relative">
          <Input
            type="text"
            placeholder="Ex: VID4829"
            value={referralCode}
            onChange={(e) => handleReferralCodeChange(e.target.value)}
            onBlur={handleReferralCodeBlur}
            disabled={loading || companyLoading || validatingCode}
            className={`pr-10 ${
              codeValidation.status === 'valid'
                ? 'border-green-500 focus:ring-green-500'
                : codeValidation.status === 'invalid'
                ? 'border-red-500 focus:ring-red-500'
                : ''
            }`}
            maxLength={7}
            style={{
              textTransform: 'uppercase',
            }}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {validatingCode ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            ) : codeValidation.status === 'valid' ? (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            ) : codeValidation.status === 'invalid' ? (
              <XCircle className="w-4 h-4 text-red-500" />
            ) : null}
          </div>
        </div>
        {codeValidation.message && (
          <p
            className={`mt-1.5 text-xs ${
              codeValidation.status === 'valid'
                ? 'text-green-600'
                : codeValidation.status === 'invalid'
                ? 'text-red-600'
                : 'text-slate-500'
            }`}
          >
            {codeValidation.message}
          </p>
        )}
      </div>
      
      <Button
        variant={variant}
        size={size}
        onClick={handleSubscribe}
        disabled={loading || companyLoading || validatingCode}
        className={`flex items-center justify-center gap-2 ${fullWidth ? 'w-full' : ''} ${className}`}
      >
        {loading || companyLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Carregando...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            {buttonLabel}
          </>
        )}
      </Button>
    </div>
  );
}
