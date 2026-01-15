import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePremiumGate } from './usePremiumGate';
import { PhoneVerificationModal } from '../components/PhoneVerificationModal';

interface SecurityGateReturn {
  verifyGate: (action: () => void, requiredFor?: string) => void;
  showPhoneModal: boolean;
  setShowPhoneModal: (show: boolean) => void;
  isLocked: boolean;
  PhoneVerificationModalComponent: (props: { requiredFor?: string }) => JSX.Element | null;
}

/**
 * Hook to enforce security gates (Phone Verification + Premium Subscription)
 * Blocks actions if phone is not verified or subscription is expired
 */
export function useSecurityGate(): SecurityGateReturn {
  const { userMetadata } = useAuth();
  const { gate: premiumGate, isLocked: premiumLocked } = usePremiumGate();
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [requiredForAction, setRequiredForAction] = useState<string>('esta ação');

  // Check if phone is verified
  const isPhoneVerified = userMetadata?.mobileVerified === true;

  const verifyGate = (action: () => void, requiredFor: string = 'esta ação') => {
    // Step 1: Check Premium Gate first (trial/subscription)
    if (premiumLocked) {
      // Premium gate will handle opening subscription modal
      premiumGate(action);
      return;
    }

    // Step 2: Check Phone Verification
    if (!isPhoneVerified) {
      setPendingAction(() => action);
      setRequiredForAction(requiredFor);
      setShowPhoneModal(true);
      return;
    }

    // All checks passed, allow action
    action();
  };

  const handlePhoneVerified = () => {
    // Execute pending action after phone verification
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  const PhoneVerificationModalComponent = ({ requiredFor }: { requiredFor?: string }) => {
    if (!showPhoneModal) return null;
    
    return (
      <PhoneVerificationModal
        isOpen={showPhoneModal}
        onClose={() => {
          setShowPhoneModal(false);
          setPendingAction(null);
        }}
        onVerified={handlePhoneVerified}
        requiredFor={requiredFor || requiredForAction}
      />
    );
  };

  return {
    verifyGate,
    showPhoneModal,
    setShowPhoneModal,
    isLocked: !isPhoneVerified || premiumLocked,
    PhoneVerificationModalComponent,
  };
}
