import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { AlertCircle, MessageCircle } from 'lucide-react';

export function Expired() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  // WhatsApp support link - replace with your actual WhatsApp number
  const whatsappNumber = '5511999999999'; // Format: country code + number without + or spaces
  const whatsappMessage = encodeURIComponent('Olá! Meu período de teste expirou e gostaria de continuar usando o sistema.');
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="text-center">
          <div className="mb-6">
            <div className="inline-block bg-red-100 rounded-full p-4 mb-4">
              <AlertCircle className="w-12 h-12 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-navy mb-2">Período de Teste Expirado</h1>
            <p className="text-slate-600">
              Seu período de teste gratuito de 14 dias acabou.
            </p>
          </div>

          <div className="bg-slate-50 rounded-lg p-6 mb-6">
            <p className="text-slate-700 mb-4">
              Para continuar usando o sistema e ter acesso a todas as funcionalidades,
              entre em contato conosco para ativar sua assinatura.
            </p>
            <p className="text-sm text-slate-500">
              Nossa equipe está pronta para ajudar você a continuar gerenciando seu negócio
              de forma eficiente.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              variant="primary"
              size="lg"
              className="w-full flex items-center justify-center gap-2"
              onClick={() => window.open(whatsappLink, '_blank')}
            >
              <MessageCircle className="w-5 h-5" />
              Falar com Suporte
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={async () => {
                await signOut();
                navigate('/login');
              }}
            >
              Sair
            </Button>
          </div>

          <p className="text-xs text-slate-500 mt-6">
            Precisa de ajuda? Entre em contato através do WhatsApp acima.
          </p>
        </Card>
      </div>
    </div>
  );
}
