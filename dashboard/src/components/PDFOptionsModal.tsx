import { useState } from 'react';
import { X } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface PDFOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: { hideDimensions: boolean; hideUnitPrice: boolean }) => void;
}

export function PDFOptionsModal({ isOpen, onClose, onConfirm }: PDFOptionsModalProps) {
  const [hideDimensions, setHideDimensions] = useState(false);
  const [hideUnitPrice, setHideUnitPrice] = useState(true); // Default: true as per user request

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm({ hideDimensions, hideUnitPrice });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-secondary">Opções do PDF</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={hideDimensions}
                onChange={(e) => setHideDimensions(e.target.checked)}
                className="mt-1 w-5 h-5 text-primary border-slate-300 rounded focus:ring-primary focus:ring-2"
              />
              <div className="flex-1">
                <span className="font-medium text-secondary block">Ocultar Medidas (Altura x Largura)</span>
                <span className="text-sm text-slate-600">
                  Remove a coluna de dimensões da tabela do PDF
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={hideUnitPrice}
                onChange={(e) => setHideUnitPrice(e.target.checked)}
                className="mt-1 w-5 h-5 text-primary border-slate-300 rounded focus:ring-primary focus:ring-2"
              />
              <div className="flex-1">
                <span className="font-medium text-secondary block">Ocultar Valor Unitário</span>
                <span className="text-sm text-slate-600">
                  Remove o preço por m², mostrando apenas o valor total do item
                </span>
              </div>
            </label>
          </div>

          <div className="flex gap-2 pt-4 border-t border-slate-200">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirm}
              className="flex-1"
            >
              Gerar PDF
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
