/**
 * Subscribe Button Component
 * 
 * A reusable button component that triggers the Stripe Checkout flow
 * for premium subscription with 7-day free trial.
 */

import { useState } from 'react';
import { Button } from './ui/Button';
import { useCompany } from '../hooks/useCompany';
import { useAuth } from '../contexts/AuthContext';
import { createSubscriptionCheckout, isReferralDiscountActive } from '../services/stripe';
import { CreditCard, Loader2 } from 'lucide-react';

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
  label = 'Assinar Premium (7 Dias Grátis)',
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
  const { company, loading: companyLoading } = useCompany();
  const [loading, setLoading] = useState(false);

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

    setLoading(true);
    onCheckoutStart?.();

    try {
      // Check if referral discount is active
      const referralDiscount = isReferralDiscountActive(company);

      // Get base URL for redirects
      const baseUrl = window.location.origin;
      const finalSuccessUrl = successUrl || `${baseUrl}/admin/settings?status=success`;
      const finalCancelUrl = cancelUrl || `${baseUrl}/admin/settings?status=cancel`;

      // Call the checkout API
      const checkoutUrl = await createSubscriptionCheckout({
        companyId: company.id,
        referralDiscountActive: referralDiscount,
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

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {showDiscount && (
        <div className="mb-2 text-center">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            🎁 Você tem 15% de desconto na primeira mensalidade!
          </span>
        </div>
      )}
      
      <Button
        variant={variant}
        size={size}
        onClick={handleSubscribe}
        disabled={loading || companyLoading}
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
            {label}
          </>
        )}
      </Button>
    </div>
  );
}
