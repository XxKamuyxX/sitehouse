import { X } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { SubscribeButton } from './SubscribeButton';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PaywallModal({ isOpen, onClose }: PaywallModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-navy">Assinatura Necessária</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 font-medium mb-2">
              ⚠️ Seu período de teste acabou
            </p>
            <p className="text-sm text-yellow-700">
              Para continuar criando e gerenciando orçamentos, ordens de serviço e clientes, 
              você precisa assinar o plano premium.
            </p>
          </div>

          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-slate-700 mb-2">
              <strong>Plano:</strong> Mensal - R$ 40,00/mês
            </p>
            <p className="text-sm text-slate-500">
              Pagamento via Cartão de Crédito ou Boleto. Renovação automática mensal.
            </p>
          </div>

          <SubscribeButton
            fullWidth
            onCheckoutStart={onClose}
          />

          <Button
            variant="outline"
            onClick={onClose}
            className="w-full"
          >
            Fechar
          </Button>
        </div>
      </Card>
    </div>
  );
}
