'use client';

import MagneticButton from './ui/MagneticButton';

export default function HeaderCTA() {
  const openModal = () => {
    window.dispatchEvent(new CustomEvent('openWhatsAppModal'));
  };

  return (
    <MagneticButton onClick={openModal} variant="primary" class="!bg-green-600 hover:!bg-green-700 !text-white !shadow-lg hover:!shadow-xl">
      Agendar
    </MagneticButton>
  );
}
