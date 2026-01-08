import { useState, useEffect, useRef } from 'react';
import { X, Lock, Unlock } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Select } from './ui/Select';
import { ChipSelector } from './ui/ChipSelector';

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
  isInstallation?: boolean;
}

export function InstallationItemModal({
  isOpen,
  onClose,
  onSave,
  initialItem,
  isInstallation = true,
}: InstallationItemModalProps) {
  const [serviceName, setServiceName] = useState('');
  const [pricingMethod, setPricingMethod] = useState<'m2' | 'linear' | 'fixed' | 'unit'>('unit');
  // UI values as strings (empty by default)
  const [widthDisplay, setWidthDisplay] = useState('');
  const [heightDisplay, setHeightDisplay] = useState('');
  const [unitPriceDisplay, setUnitPriceDisplay] = useState('');
  const [totalPriceDisplay, setTotalPriceDisplay] = useState('');
  const [quantityDisplay, setQuantityDisplay] = useState('');
  const [isManualOverride, setIsManualOverride] = useState(false);
  const [glassColor, setGlassColor] = useState('');
  const [glassThickness, setGlassThickness] = useState('');
  const [profileColor, setProfileColor] = useState('');
  const [customServiceName, setCustomServiceName] = useState('');
  const serviceNameInputRef = useRef<HTMLSelectElement>(null);

  // Helper: Convert display value to number (treat empty as 0)
  const toNumber = (val: string): number => {
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  };

  // Helper: Convert number to display value (0 becomes empty string)
  const toDisplay = (val: number): string => {
    return val === 0 ? '' : val.toString();
  };

  // Computed numeric values for calculations
  const width = toNumber(widthDisplay);
  const height = toNumber(heightDisplay);
  const unitPrice = toNumber(unitPriceDisplay);
  const quantity = Math.max(1, toNumber(quantityDisplay) || 1); // Default to 1 for quantity
  const totalPrice = toNumber(totalPriceDisplay);

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
      setPricingMethod(initialItem.pricingMethod || (initialItem.isInstallation ? 'm2' : 'unit'));
      setWidthDisplay(toDisplay(initialItem.dimensions?.width || 0));
      setHeightDisplay(toDisplay(initialItem.dimensions?.height || 0));
      setUnitPriceDisplay(toDisplay(initialItem.unitPrice || 0));
      setTotalPriceDisplay(toDisplay(initialItem.total || 0));
      setQuantityDisplay(toDisplay(initialItem.quantity || 1));
      setGlassColor(initialItem.glassColor || '');
      setGlassThickness(initialItem.glassThickness || '');
      setProfileColor(initialItem.profileColor || '');
      setCustomServiceName(initialItem.serviceName && !installationServices.find(s => s.value === initialItem.serviceName) ? initialItem.serviceName : '');
      setIsManualOverride(initialItem.pricingMethod === 'fixed' || false);
    } else {
      // Reset form - empty strings for clean inputs
      setServiceName('');
      setPricingMethod(isInstallation ? 'm2' : 'unit');
      setWidthDisplay('');
      setHeightDisplay('');
      setUnitPriceDisplay('');
      setTotalPriceDisplay('');
      setQuantityDisplay('');
      setGlassColor('');
      setGlassThickness('');
      setProfileColor('');
      setCustomServiceName('');
      setIsManualOverride(false);
    }
  }, [initialItem, isOpen, isInstallation]);

  // Auto-focus on service name input when modal opens with empty fields (manual mode)
  useEffect(() => {
    if (isOpen && !initialItem && serviceNameInputRef.current) {
      // Small delay to ensure modal is fully rendered
      setTimeout(() => {
        serviceNameInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, initialItem]);

  // Calculate total based on pricing method
  useEffect(() => {
    if (isManualOverride && pricingMethod !== 'fixed') {
      return; // Don't auto-calculate if manually overridden
    }

    let calculatedTotal = 0;

    switch (pricingMethod) {
      case 'm2':
        if (width > 0 && height > 0 && unitPrice > 0) {
          // Convert mm² to m²: (width_mm * height_mm) / 1000000
          const areaM2 = (width * height) / 1000000;
          calculatedTotal = areaM2 * quantity * unitPrice;
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
      setTotalPriceDisplay(toDisplay(calculatedTotal));
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

    if (pricingMethod === 'm2' && (!widthDisplay || !heightDisplay || !unitPriceDisplay || width <= 0 || height <= 0 || unitPrice <= 0)) {
      alert('Preencha largura, altura e preço por m²');
      return;
    }

    if (pricingMethod === 'linear' && (!widthDisplay || !unitPriceDisplay || width <= 0 || unitPrice <= 0)) {
      alert('Preencha largura e preço por metro linear');
      return;
    }

    if (pricingMethod === 'unit' && (!unitPriceDisplay || !quantityDisplay || unitPrice <= 0 || quantity <= 0)) {
      alert('Preencha quantidade e preço unitário');
      return;
    }

    onSave({
      serviceName: finalServiceName,
      quantity,
      unitPrice: pricingMethod === 'fixed' ? totalPrice : unitPrice,
      total: totalPrice,
      pricingMethod,
      // Only include dimensions for installation
      dimensions: isInstallation ? {
        width: width || 0,
        height: pricingMethod === 'linear' ? 0 : (height || 0),
        area: pricingMethod === 'm2' && width > 0 && height > 0 ? (width * height) / 1000000 : undefined,
      } : undefined,
      // Only include glass specs for installation, use empty strings instead of undefined
      glassColor: isInstallation ? (glassColor || '') : '',
      glassThickness: isInstallation ? (glassThickness || '') : '',
      profileColor: isInstallation ? (profileColor || '') : '',
      isInstallation,
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-secondary">
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
                // Add template name if it's not in the list
                ...(initialItem?.serviceName && !installationServices.find(s => s.value === initialItem.serviceName) 
                  ? [{ value: initialItem.serviceName, label: initialItem.serviceName }]
                  : []),
              ]}
              required
            />
            {serviceName === 'Outro' && (
              <input
                type="text"
                placeholder="Especifique o tipo de serviço"
                value={customServiceName}
                onChange={(e) => setCustomServiceName(e.target.value)}
                className="w-full mt-2 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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

          {/* Dimensions and Pricing Fields - Only show for installation */}
          {isInstallation && (
            <div className="grid grid-cols-2 gap-4">
              {/* Width - Always shown for m2, linear, and fixed */}
              {(pricingMethod === 'm2' || pricingMethod === 'linear' || pricingMethod === 'fixed') && (
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Largura (mm)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={widthDisplay}
                    onChange={(e) => setWidthDisplay(e.target.value)}
                    placeholder="Largura (mm)"
                    className="w-full px-4 py-3 text-lg border border-slate-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              )}

              {/* Height - Only for m2 and fixed */}
              {(pricingMethod === 'm2' || pricingMethod === 'fixed') && (
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Altura (mm)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={heightDisplay}
                    onChange={(e) => setHeightDisplay(e.target.value)}
                    placeholder="Altura (mm)"
                    className="w-full px-4 py-3 text-lg border border-slate-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
                    required={pricingMethod === 'm2'}
                  />
                </div>
              )}
            </div>
          )}

          {/* For maintenance, show simplified fields */}
          {!isInstallation && (
            <div className="grid grid-cols-2 gap-4">
              {/* Quantity - For all methods */}
              <div>
                <label className="block text-xs text-slate-600 mb-1">Qtd</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quantityDisplay}
                  onChange={(e) => setQuantityDisplay(e.target.value)}
                  placeholder="Qtd"
                  className="w-full px-4 py-3 text-lg border border-slate-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              {/* Unit Price - Always show for maintenance */}
              <div>
                <label className="block text-xs text-slate-600 mb-1">Valor (R$)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={unitPriceDisplay}
                  onChange={(e) => setUnitPriceDisplay(e.target.value)}
                  placeholder="Valor (R$)"
                  className="w-full px-4 py-3 text-lg border border-slate-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            </div>
          )}

          {/* Calculated Area (for m2) - Only show for installation */}
          {isInstallation && pricingMethod === 'm2' && width > 0 && height > 0 && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700">
                <span className="font-medium">Área Calculada:</span> {((width * height) / 1000000).toFixed(2)} m²
                {quantity > 1 && (
                  <span className="ml-2">
                    ({quantityDisplay || '1'}x = {(((width * height) / 1000000) * quantity).toFixed(2)} m² total)
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
                  className="flex items-center gap-1 text-xs text-slate-600 hover:text-secondary"
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
              value={totalPriceDisplay}
              onChange={(e) => {
                setTotalPriceDisplay(e.target.value);
                if (pricingMethod !== 'fixed') {
                  setIsManualOverride(true);
                }
              }}
              placeholder="0,00"
              className="w-full px-4 py-3 text-lg border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-medium text-navy"
              required
              readOnly={!isManualOverride && pricingMethod !== 'fixed'}
            />
            {pricingMethod === 'm2' && !isManualOverride && width > 0 && height > 0 && unitPrice > 0 && quantity > 0 && (
              <p className="text-xs text-slate-500 mt-1">
                Cálculo: {widthDisplay || '0'}m × {heightDisplay || '0'}m × {quantityDisplay || '1'} × R$ {unitPriceDisplay || '0'}/m² = R$ {totalPrice.toFixed(2)}
              </p>
            )}
            {pricingMethod === 'linear' && !isManualOverride && width > 0 && unitPrice > 0 && quantity > 0 && (
              <p className="text-xs text-slate-500 mt-1">
                Cálculo: {widthDisplay || '0'}m × {quantityDisplay || '1'} × R$ {unitPriceDisplay || '0'}/m = R$ {totalPrice.toFixed(2)}
              </p>
            )}
            {pricingMethod === 'unit' && !isManualOverride && unitPrice > 0 && quantity > 0 && (
              <p className="text-xs text-slate-500 mt-1">
                Cálculo: {quantityDisplay || '1'} × R$ {unitPriceDisplay || '0'} = R$ {totalPrice.toFixed(2)}
              </p>
            )}
          </div>

          {/* Installation-specific fields */}
          <div className="pt-4 border-t border-slate-200 space-y-4">
            <h3 className="text-sm font-medium text-navy mb-3">Especificações do Vidro</h3>
            
            {isInstallation && (
              <>
                <ChipSelector
                  label="Cor do Vidro"
                  options={['Incolor', 'Verde', 'Fumê', 'Bronze']}
                  selected={glassColor}
                  onChange={(value) => setGlassColor(typeof value === 'string' ? value : value[0] || '')}
                />

                <ChipSelector
                  label="Espessura do Vidro"
                  options={['4mm', '6mm', '8mm', '10mm', '12mm']}
                  selected={glassThickness}
                  onChange={(value) => setGlassThickness(typeof value === 'string' ? value : value[0] || '')}
                />
              </>
            )}

            {isInstallation && (
              <ChipSelector
                label="Cor do Perfil"
                options={['Branco', 'Preto', 'Fosco', 'Bronze', 'Cromado']}
                selected={profileColor}
                onChange={(value) => setProfileColor(typeof value === 'string' ? value : value[0] || '')}
              />
            )}
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
