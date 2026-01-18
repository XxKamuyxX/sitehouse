import { useAuth } from '../contexts/AuthContext';

interface PremiumGateReturn {
  isLocked: boolean;
  isTrialExpired: boolean;
  isActive: boolean;
  gate: (action: () => void) => void;
  openSubscriptionModal: () => void;
}

/**
 * Hook to enforce premium subscription gate
 * Blocks Create/Edit/Delete actions if trial expired and subscription is not active
 */
export function usePremiumGate(): PremiumGateReturn {
  const { user, userMetadata } = useAuth();

  // Calculate if trial is expired
  const calculateTrialStatus = () => {
    if (!userMetadata?.trialEndsAt) {
      // If no trialEndsAt, check createdAt (fallback for legacy users)
      if (!user?.metadata?.creationTime) {
        return { isTrialExpired: false, isActive: false };
      }
      
      // Calculate trial end from creation date (7 days)
      const createdAt = new Date(user.metadata.creationTime);
      const trialEndsAt = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
      const isTrialExpired = new Date() > trialEndsAt;
      const isActive = userMetadata?.subscriptionStatus === 'active' || 
                      userMetadata?.subscriptionStatus === 'trialing';
      
      return { isTrialExpired, isActive };
    }

    // Use trialEndsAt from userMetadata
    const trialEndDate = userMetadata.trialEndsAt?.toDate 
      ? userMetadata.trialEndsAt.toDate() 
      : new Date(userMetadata.trialEndsAt);
    
    const isTrialExpired = new Date() > trialEndDate;
    const isActive = userMetadata?.subscriptionStatus === 'active' || 
                    userMetadata?.subscriptionStatus === 'trialing';

    return { isTrialExpired, isActive };
  };

  const { isTrialExpired, isActive } = calculateTrialStatus();
  
  // The Lock Condition: Trial expired AND subscription not active
  const isLocked = isTrialExpired && !isActive;

  const openSubscriptionModal = () => {
    // Trigger subscription modal - this will be handled by the component
    // For now, we'll use a custom event that components can listen to
    window.dispatchEvent(new CustomEvent('openSubscriptionModal'));
  };

  const gate = (action: () => void) => {
    if (isLocked) {
      openSubscriptionModal();
      return;
    }
    action(); // Allow action
  };

  return {
    isLocked,
    isTrialExpired,
    isActive,
    gate,
    openSubscriptionModal,
  };
}
