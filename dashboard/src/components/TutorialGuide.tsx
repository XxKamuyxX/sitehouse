import { useState, useEffect } from 'react';
import Joyride, { STATUS, Step, CallBackProps } from 'react-joyride';
import { useCompany } from '../hooks/useCompany';

interface TutorialGuideProps {
  steps: Step[];
  tutorialKey: 'dashboardSeen' | 'quotesSeen' | 'workOrdersSeen' | 'financeSeen';
  run?: boolean; // Optional override to force run
}

export function TutorialGuide({ steps, tutorialKey, run }: TutorialGuideProps) {
  const { company, updateCompany } = useCompany();
  const [shouldRun, setShouldRun] = useState(false);

  useEffect(() => {
    // If run prop is explicitly provided, use it
    if (run !== undefined) {
      setShouldRun(run);
      return;
    }

    // Otherwise, check tutorial progress
    if (!company) {
      setShouldRun(false);
      return;
    }

    const tutorialProgress = company.tutorialProgress || {
      dashboardSeen: false,
      quotesSeen: false,
      workOrdersSeen: false,
      financeSeen: false,
    };
    const hasSeenTutorial = tutorialProgress[tutorialKey] === true;
    
    // Only run if user hasn't seen this tutorial yet
    setShouldRun(!hasSeenTutorial);
  }, [company, tutorialKey, run]);

  const markTutorialAsSeen = async () => {
    if (!company?.id) return;

    try {
      await updateCompany({
        tutorialProgress: {
          ...(company.tutorialProgress || {
            dashboardSeen: false,
            quotesSeen: false,
            workOrdersSeen: false,
            financeSeen: false,
          }),
          [tutorialKey]: true,
        },
      });
    } catch (error) {
      console.error('Error marking tutorial as seen:', error);
    }
  };

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      markTutorialAsSeen();
      setShouldRun(false);
    }
  };

  // Don't render if tutorial should not run
  if (!shouldRun || steps.length === 0) {
    return null;
  }

  return (
    <Joyride
      steps={steps}
      continuous={true}
      showSkipButton={true}
      showProgress={true}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#0F172A', // Navy color matching brand
          textColor: '#1E293B',
          backgroundColor: '#FFFFFF',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          arrowColor: '#FFFFFF',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 8,
          padding: 20,
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        buttonNext: {
          backgroundColor: '#0F172A',
          borderRadius: 6,
          padding: '10px 20px',
          fontSize: '14px',
          fontWeight: '600',
        },
        buttonBack: {
          color: '#64748B',
          marginRight: 10,
        },
        buttonSkip: {
          color: '#64748B',
          fontSize: '14px',
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
      }}
      locale={{
        back: 'Voltar',
        close: 'Fechar',
        last: 'Finalizar',
        next: 'Próximo',
        skip: 'Pular tour',
      }}
    />
  );
}
