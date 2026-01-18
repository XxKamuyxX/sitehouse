import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../hooks/useCompany';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SubscribeButton } from '../components/SubscribeButton';
import { AlertCircle, MessageCircle } from 'lucide-react';

export function Expired() {
  const { signOut } = useAuth();
  const { company } = useCompany();
  const navigate = useNavigate();
  
  // Calculate pricing with discount
  const basePrice = 40.00; // Base monthly price in BRL
  const hasDiscount = company?.firstMonthDiscount && company?.discountExpirationDate;
  
  // Check if discount is still valid (not expired)
  let discountActive = false;
  if (hasDiscount && company.discountExpirationDate) {
    try {
      const expirationDate = company.discountExpirationDate?.toDate 
        ? company.discountExpirationDate.toDate() 
        : company.discountExpirationDate?.seconds
        ? new Date(company.discountExpirationDate.seconds * 1000)
        : new Date(company.discountExpirationDate);
      discountActive = expirationDate > new Date();
    } catch (error) {
      console.error('Error parsing discount expiration date:', error);
      discountActive = false;
    }
  }
  
  const discountPercent = discountActive ? 15 : 0;
  const discountAmount = discountActive ? (basePrice * 0.15) : 0;
  const finalPrice = basePrice - discountAmount;
  
  // WhatsApp support link - replace with your actual WhatsApp number
  const whatsappNumber = '5511999999999'; // Format: country code + number without + or spaces
  const whatsappMessage = encodeURIComponent(
    `Olá! Meu período de teste expirou e gostaria de continuar usando o sistema.${
      discountActive 
        ? ` Tenho um desconto de ${discountPercent}% aplicado. Valor: R$ ${finalPrice.toFixed(2)}` 
        : ``
    }`
  );
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

          <div className="bg-slate-50 rounded-lg p-6 mb-6 space-y-4">
            <p className="text-slate-700 mb-4">
              Para continuar usando o sistema e ter acesso a todas as funcionalidades,
              entre em contato conosco para ativar sua assinatura.
            </p>
            
            {/* Pricing Section */}
            <div className="bg-white rounded-lg border-2 border-slate-200 p-4">
              <h3 className="font-semibold text-navy mb-3">Valor da Assinatura Mensal</h3>
              <div className="space-y-2">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                  <p className="text-sm font-semibold text-green-800 mb-1">
                    🎁 7 dias grátis para testar
                  </p>
                  <p className="text-xs text-green-700">
                    Após o período de teste, cobrança mensal automática
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Preço base:</span>
                  <span className="font-medium">R$ {basePrice.toFixed(2)}/mês</span>
                </div>
                {discountActive && (
                  <>
                    <div className="flex justify-between items-center text-green-700">
                      <span>Desconto de indicação (-15%):</span>
                      <span className="font-medium">- R$ {discountAmount.toFixed(2)}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                      <span className="font-bold text-navy">Valor após desconto:</span>
                      <span className="text-xl font-bold text-green-700">R$ {finalPrice.toFixed(2)}/mês</span>
                    </div>
                    {company?.discountExpirationDate && (
                      <p className="text-xs text-green-700 mt-2">
                        ✓ Desconto válido até{' '}
                        {(() => {
                          try {
                            const expirationDate = company.discountExpirationDate?.toDate 
                              ? company.discountExpirationDate.toDate() 
                              : company.discountExpirationDate?.seconds
                              ? new Date(company.discountExpirationDate.seconds * 1000)
                              : new Date(company.discountExpirationDate);
                            return expirationDate.toLocaleDateString('pt-BR');
                          } catch {
                            return 'data inválida';
                          }
                        })()}
                      </p>
                    )}
                  </>
                )}
                {!discountActive && (
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                    <span className="font-bold text-navy">Total:</span>
                    <span className="text-xl font-bold text-navy">R$ {basePrice.toFixed(2)}/mês</span>
                  </div>
                )}
              </div>
            </div>
            
            <p className="text-sm text-slate-500">
              Nossa equipe está pronta para ajudar você a continuar gerenciando seu negócio
              de forma eficiente.
            </p>
          </div>

          <div className="space-y-3">
            <SubscribeButton
              fullWidth
              size="lg"
              successUrl={`${window.location.origin}/admin/settings?status=success`}
              cancelUrl={`${window.location.origin}/subscription-expired?status=cancel`}
              onError={(error) => {
                alert(`Erro ao iniciar checkout: ${error.message || 'Erro desconhecido'}\n\nPor favor, entre em contato via WhatsApp.`);
              }}
            />

            <Button
              variant="outline"
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
