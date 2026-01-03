import { useState, useEffect } from 'react';
import { X, Lock, Unlock } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Select } from './ui/Select';

interface InstallationItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: {
    serviceName: string;
    quantity: number;
    unitPrice: number;
    total: number;
    pricingMethod: 'm2' | 'linear' | 'fixed' | 'unit';
    dimensions?: {
      width: number;
      height: number;
      area?: number;
    };
    glassColor?: string;
    glassThickness?: string;
    profileColor?: string;
    isInstallation: boolean;
  }) => void;
  initialItem?: any;
}

export function InstallationItemModal({
  isOpen,
  onClose,
  onSave,
  initialItem,
}: InstallationItemModalProps) {
  const [serviceName, setServiceName] = useState('');
  const [pricingMethod, setPricingMethod] = useState<'m2' | 'linear' | 'fixed' | 'unit'>('unit');
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [unitPrice, setUnitPrice] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isManualOverride, setIsManualOverride] = useState(false);
  const [glassColor, setGlassColor] = useState('');
  const [glassThickness, setGlassThickness] = useState('');
  const [profileColor, setProfileColor] = useState('');
  const [customServiceName, setCustomServiceName] = useState('');

  // Installation service options
  const installationServices = [
    { value: 'Cortina de Vidro', label: 'Cortina de Vidro' },
    { value: 'Box Padrão', label: 'Box Padrão' },
    { value: 'Guarda-corpo', label: 'Guarda-corpo' },
    { value: 'Porta de Vidro', label: 'Porta de Vidro' },
    { value: 'Janela de Vidro', label: 'Janela de Vidro' },
    { value: 'Divisória de Vidro', label: 'Divisória de Vidro' },
    { value: 'Outro', label: 'Outro (especificar)' },
  ];

  useEffect(() => {
    if (initialItem) {
      setServiceName(initialItem.serviceName || '');
      setPricingMethod(initialItem.pricingMethod || 'unit');
      setWidth(initialItem.dimensions?.width || 0);
      setHeight(initialItem.dimensions?.height || 0);
      setUnitPrice(initialItem.unitPrice || 0);
      setTotalPrice(initialItem.total || 0);
      setQuantity(initialItem.quantity || 1);
      setGlassColor(initialItem.glassColor || '');
      setGlassThickness(initialItem.glassThickness || '');
      setProfileColor(initialItem.profileColor || '');
      setCustomServiceName(initialItem.serviceName && !installationServices.find(s => s.value === initialItem.serviceName) ? initialItem.serviceName : '');
      setIsManualOverride(initialItem.pricingMethod === 'fixed' || false);
    } else {
      // Reset form
      setServiceName('');
      setPricingMethod('unit');
      setWidth(0);
      setHeight(0);
      setUnitPrice(0);
      setTotalPrice(0);
      setQuantity(1);
      setGlassColor('');
      setGlassThickness('');
      setProfileColor('');
      setCustomServiceName('');
      setIsManualOverride(false);
    }
  }, [initialItem, isOpen]);

  // Calculate total based on pricing method
  useEffect(() => {
    if (isManualOverride && pricingMethod !== 'fixed') {
      return; // Don't auto-calculate if manually overridden
    }

    let calculatedTotal = 0;

    switch (pricingMethod) {
      case 'm2':
        if (width > 0 && height > 0 && unitPrice > 0) {
          const area = width * height;
          calculatedTotal = area * quantity * unitPrice;
        }
        break;
      case 'linear':
        if (width > 0 && unitPrice > 0) {
          calculatedTotal = width * quantity * unitPrice;
        }
        break;
      case 'fixed':
        // Total is manually set
        calculatedTotal = totalPrice;
        break;
      case 'unit':
      default:
        calculatedTotal = quantity * unitPrice;
        break;
    }

    if (!isManualOverride || pricingMethod === 'fixed') {
      setTotalPrice(calculatedTotal);
    }
  }, [pricingMethod, width, height, unitPrice, quantity, isManualOverride]);

  const handleSave = () => {
    const finalServiceName = serviceName === 'Outro' ? customServiceName : serviceName;
    
    if (!finalServiceName.trim()) {
      alert('Selecione ou digite o nome do serviço');
      return;
    }

    if (pricingMethod === 'fixed' && totalPrice <= 0) {
      alert('Digite um valor total válido');
      return;
    }

    if (pricingMethod === 'm2' && (width <= 0 || height <= 0 || unitPrice <= 0)) {
      alert('Preencha largura, altura e preço por m²');
      return;
    }

    if (pricingMethod === 'linear' && (width <= 0 || unitPrice <= 0)) {
      alert('Preencha largura e preço por metro linear');
      return;
    }

    if (pricingMethod === 'unit' && (unitPrice <= 0 || quantity <= 0)) {
      alert('Preencha quantidade e preço unitário');
      return;
    }

    const area = pricingMethod === 'm2' ? width * height : undefined;

    onSave({
      serviceName: finalServiceName,
      quantity,
      unitPrice: pricingMethod === 'fixed' ? totalPrice : unitPrice,
      total: totalPrice,
      pricingMethod,
      dimensions: {
        width,
        height: pricingMethod === 'linear' ? 0 : height,
        area,
      },
      glassColor,
      glassThickness,
      profileColor,
      isInstallation: true,
    });

    onClose();
  };

  if (!isOpen) return null;

  const area = width * height;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-navy">
            {initialItem ? 'Editar Item de Instalação' : 'Adicionar Item de Instalação'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Service Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tipo de Serviço *
            </label>
            <Select
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              options={[
                { value: '', label: 'Selecione o tipo de serviço...' },
                ...installationServices,
              ]}
              required
            />
            {serviceName === 'Outro' && (
              <input
                type="text"
                placeholder="Especifique o tipo de serviço"
                value={customServiceName}
                onChange={(e) => setCustomServiceName(e.target.value)}
                className="w-full mt-2 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                required
              />
            )}
          </div>

          {/* Pricing Method */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Método de Precificação *
            </label>
            <Select
              value={pricingMethod}
              onChange={(e) => {
                setPricingMethod(e.target.value as 'm2' | 'linear' | 'fixed' | 'unit');
                setIsManualOverride(false);
              }}
              options={[
                { value: 'm2', label: 'Por m² (Metro Quadrado)' },
                { value: 'linear', label: 'Por Metro Linear' },
                { value: 'fixed', label: 'Preço Fixo (Manual)' },
                { value: 'unit', label: 'Por Unidade' },
              ]}
            />
          </div>

          {/* Dimensions and Pricing Fields */}
          <div className="grid grid-cols-2 gap-4">
            {/* Width - Always shown for m2, linear, and fixed */}
            {(pricingMethod === 'm2' || pricingMethod === 'linear' || pricingMethod === 'fixed') && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Largura (m) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={width}
                  onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                  required
                />
              </div>
            )}

            {/* Height - Only for m2 and fixed */}
            {(pricingMethod === 'm2' || pricingMethod === 'fixed') && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Altura (m) {pricingMethod === 'm2' ? '*' : ''}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={height}
                  onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                  required={pricingMethod === 'm2'}
                />
              </div>
            )}

            {/* Quantity - For all methods */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Quantidade *
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                required
              />
            </div>

            {/* Unit Price - For m2, linear, and unit */}
            {pricingMethod !== 'fixed' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Preço Unitário (R$/{pricingMethod === 'm2' ? 'm²' : pricingMethod === 'linear' ? 'm' : 'un'}) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                  required
                />
              </div>
            )}
          </div>

          {/* Calculated Area (for m2) */}
          {pricingMethod === 'm2' && width > 0 && height > 0 && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700">
                <span className="font-medium">Área Calculada:</span> {area.toFixed(2)} m²
                {quantity > 1 && (
                  <span className="ml-2">
                    ({quantity}x = {(area * quantity).toFixed(2)} m² total)
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Total Price */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-slate-700">
                Preço Total (R$) *
              </label>
              {pricingMethod !== 'fixed' && (
                <button
                  type="button"
                  onClick={() => setIsManualOverride(!isManualOverride)}
                  className="flex items-center gap-1 text-xs text-slate-600 hover:text-navy"
                  title={isManualOverride ? 'Desbloquear edição automática' : 'Editar manualmente'}
                >
                  {isManualOverride ? (
                    <>
                      <Unlock className="w-3 h-3" />
                      Manual
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3" />
                      Automático
                    </>
                  )}
                </button>
              )}
            </div>
            <input
              type="number"
              min="0"
              step="0.01"
              value={totalPrice}
              onChange={(e) => {
                setTotalPrice(parseFloat(e.target.value) || 0);
                if (pricingMethod !== 'fixed') {
                  setIsManualOverride(true);
                }
              }}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy font-medium text-navy"
              required
              readOnly={!isManualOverride && pricingMethod !== 'fixed'}
            />
            {pricingMethod === 'm2' && !isManualOverride && (
              <p className="text-xs text-slate-500 mt-1">
                Cálculo: {width}m × {height}m × {quantity} × R$ {unitPrice.toFixed(2)}/m² = R$ {totalPrice.toFixed(2)}
              </p>
            )}
            {pricingMethod === 'linear' && !isManualOverride && (
              <p className="text-xs text-slate-500 mt-1">
                Cálculo: {width}m × {quantity} × R$ {unitPrice.toFixed(2)}/m = R$ {totalPrice.toFixed(2)}
              </p>
            )}
            {pricingMethod === 'unit' && !isManualOverride && (
              <p className="text-xs text-slate-500 mt-1">
                Cálculo: {quantity} × R$ {unitPrice.toFixed(2)} = R$ {totalPrice.toFixed(2)}
              </p>
            )}
          </div>

          {/* Installation-specific fields */}
          <div className="pt-4 border-t border-slate-200">
            <h3 className="text-sm font-medium text-navy mb-3">Especificações do Vidro</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Cor do Vidro
                </label>
                <input
                  type="text"
                  value={glassColor}
                  onChange={(e) => setGlassColor(e.target.value)}
                  placeholder="Ex: Incolor, Fumé, Verde..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Espessura do Vidro
                </label>
                <Select
                  value={glassThickness}
                  onChange={(e) => setGlassThickness(e.target.value)}
                  options={[
                    { value: '', label: 'Selecione...' },
                    { value: '4mm', label: '4mm' },
                    { value: '5mm', label: '5mm' },
                    { value: '6mm', label: '6mm' },
                    { value: '8mm', label: '8mm' },
                    { value: '10mm', label: '10mm' },
                    { value: '12mm', label: '12mm' },
                    { value: '15mm', label: '15mm' },
                    { value: 'Outro', label: 'Outro' },
                  ]}
                />
                {glassThickness === 'Outro' && (
                  <input
                    type="text"
                    placeholder="Especifique a espessura (ex: 6.5mm)"
                    value={glassThickness}
                    onChange={(e) => setGlassThickness(e.target.value)}
                    className="w-full mt-2 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Cor do Perfil
                </label>
                <input
                  type="text"
                  value={profileColor}
                  onChange={(e) => setProfileColor(e.target.value)}
                  placeholder="Ex: Branco, Preto, Prata..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button variant="primary" onClick={handleSave} className="flex-1">
              {initialItem ? 'Salvar Alterações' : 'Adicionar Item'}
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
