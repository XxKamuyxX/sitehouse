import { MessageCircle } from 'lucide-react';
import { Button } from './ui/Button';

interface WhatsAppButtonProps {
  phoneNumber: string;
  clientName: string;
  docType: 'Orçamento' | 'OS' | 'Recibo';
  docLink: string;
  googleReviewUrl?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  'data-whatsapp-button'?: string;
}

export function WhatsAppButton({
  phoneNumber,
  clientName,
  docType,
  docLink,
  googleReviewUrl,
  variant = 'primary',
  size = 'md',
  className = '',
  'data-whatsapp-button': dataWhatsappButton,
}: WhatsAppButtonProps) {
  const sanitizePhone = (phone: string): string => {
    if (!phone) return '';
    // Remove spaces, parentheses, dashes
    let cleaned = phone.replace(/[\s\(\)\-]/g, '');
    
    // Remove leading + if exists
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    }
    
    // If doesn't start with '55', add Brazil country code
    if (!cleaned.startsWith('55')) {
      cleaned = '55' + cleaned;
    }
    
    return cleaned;
  };

  const getMessage = (): string => {
    let message = '';
    
    if (docType === 'OS') {
      // Para OS, sempre usar um único link que mostra tudo (OS + aprovação + PDF)
      message = `Olá ${clientName}, segue sua Ordem de Serviço digital:\n\n${docLink}\n\nNeste link você pode:\n✅ Ver todos os detalhes da OS\n✅ Aprovar ou rejeitar o serviço\n✅ Baixar o PDF`;
    } else {
      const templates = {
        'Orçamento': `Olá ${clientName}, segue o link do seu Orçamento: ${docLink}`,
        'Recibo': `Olá ${clientName}, confirmamos seu pagamento. Segue o Recibo: ${docLink}`,
      };
      message = templates[docType];
    }
    
    // Append review link if available
    if (googleReviewUrl && googleReviewUrl.trim()) {
      message += `\n\nAvalie nosso serviço: ${googleReviewUrl}`;
    }
    
    return message;
  };

  const handleClick = () => {
    try {
      const message = getMessage();
      const encodedMessage = encodeURIComponent(message);
      
      // If phone is empty/invalid, use api.whatsapp.com to allow manual contact selection
      if (!phoneNumber || phoneNumber.trim() === '') {
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
        return;
      }

      const phone = sanitizePhone(phoneNumber);
      const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
      
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      console.error('Error opening WhatsApp:', error);
      alert('Erro ao abrir WhatsApp');
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={`bg-green-600 hover:bg-green-700 ${className}`}
      data-whatsapp-button={dataWhatsappButton}
    >
      <MessageCircle className="w-5 h-5 mr-2" />
      Enviar no WhatsApp
    </Button>
  );
}

