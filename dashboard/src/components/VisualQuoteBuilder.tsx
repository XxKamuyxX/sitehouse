import { useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { 
  AppWindow, 
  DoorOpen, 
  Bath, 
  Shield, 
  Blinds, 
  Frame, 
  Square, 
  Plus, 
  ArrowLeft,
  X,
  Check
} from 'lucide-react';

interface VisualQuoteBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: QuoteItem) => void;
}

export interface QuoteItem {
  serviceName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  category?: string;
  model?: string;
  dimensions?: {
    width?: number;
    height?: number;
  };
  glassColor?: string;
  glassThickness?: string;
  profileColor?: string;
}

type Category = 'janelas' | 'portas' | 'box' | 'guarda-corpo' | 'envidracamento' | 'espelhos' | 'fixos' | 'outros';

interface CategoryConfig {
  id: Category;
  name: string;
  icon: React.ReactNode;
  models: { id: string; name: string }[];
}

const CATEGORIES: CategoryConfig[] = [
  {
    id: 'janelas',
    name: 'Janelas',
    icon: <AppWindow className="w-8 h-8" />,
    models: [
      { id: '2-folhas-correr', name: '2 Folhas Correr' },
      { id: '4-folhas-correr', name: '4 Folhas Correr' },
      { id: 'basculante', name: 'Basculante' },
      { id: 'maxim-ar', name: 'Maxim-ar' },
    ],
  },
  {
    id: 'portas',
    name: 'Portas',
    icon: <DoorOpen className="w-8 h-8" />,
    models: [
      { id: 'abrir-pivotante', name: 'Abrir (Pivotante)' },
      { id: 'correr-2-folhas', name: 'Correr 2 Folhas' },
      { id: 'correr-4-folhas', name: 'Correr 4 Folhas' },
      { id: 'mao-de-amigo', name: 'Mão de Amigo' },
    ],
  },
  {
    id: 'box',
    name: 'Box (Banheiro)',
    icon: <Bath className="w-8 h-8" />,
    models: [
      { id: 'frontal-1-fixo-1-movel', name: 'Frontal (1 Fixo 1 Móvel)' },
      { id: 'canto-l', name: 'Canto (L)' },
      { id: 'abrir-pivotante', name: 'Abrir (Pivotante)' },
      { id: 'box-ate-teto', name: 'Box até o Teto' },
    ],
  },
  {
    id: 'guarda-corpo',
    name: 'Guarda-Corpo',
    icon: <Shield className="w-8 h-8" />,
    models: [
      { id: 'torre', name: 'Torre' },
      { id: 'botao', name: 'Botão' },
      { id: 'perfil-u', name: 'Perfil U' },
    ],
  },
  {
    id: 'envidracamento',
    name: 'Envidraçamento/Sacada',
    icon: <Blinds className="w-8 h-8" />,
    models: [
      { id: 'fixo', name: 'Fixo' },
      { id: 'correr', name: 'Correr' },
      { id: 'basculante', name: 'Basculante' },
    ],
  },
  {
    id: 'espelhos',
    name: 'Espelhos',
    icon: <Frame className="w-8 h-8" />,
    models: [
      { id: 'espelho-simples', name: 'Espelho Simples' },
      { id: 'espelho-com-moldura', name: 'Espelho com Moldura' },
    ],
  },
  {
    id: 'fixos',
    name: 'Fixos/Vitrines',
    icon: <Square className="w-8 h-8" />,
    models: [
      { id: 'vitrine-simples', name: 'Vitrine Simples' },
      { id: 'vitrine-com-porta', name: 'Vitrine com Porta' },
    ],
  },
  {
    id: 'outros',
    name: 'Outros/Manual',
    icon: <Plus className="w-8 h-8" />,
    models: [],
  },
];

const GLASS_COLORS = ['Incolor', 'Verde', 'Fumê', 'Bronze'];
const GLASS_THICKNESS = ['6mm', '8mm', '10mm'];
const PROFILE_COLORS = ['Branco', 'Preto', 'Fosco', 'Bronze', 'Cromado'];

export function VisualQuoteBuilder({ isOpen, onClose, onSave }: VisualQuoteBuilderProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCategory, setSelectedCategory] = useState<CategoryConfig | null>(null);
  const [selectedModel, setSelectedModel] = useState<{ id: string; name: string } | null>(null);
  
  // Step 3 - Configuration
  const [height, setHeight] = useState('');
  const [width, setWidth] = useState('');
  const [glassColor, setGlassColor] = useState('');
  const [glassThickness, setGlassThickness] = useState('');
  const [profileColor, setProfileColor] = useState('');
  const [pricePerM2, setPricePerM2] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [quantity, setQuantity] = useState('1');

  // Calculate m²
  const calculateM2 = () => {
    const h = parseFloat(height) || 0;
    const w = parseFloat(width) || 0;
    if (h > 0 && w > 0) {
      return ((h * w) / 1000000).toFixed(2);
    }
    return '0.00';
  };

  // Calculate total price
  const calculateTotal = () => {
    const m2 = parseFloat(calculateM2());
    const price = parseFloat(pricePerM2) || 0;
    const qty = parseFloat(quantity) || 1;
    if (m2 > 0 && price > 0) {
      return (m2 * price * qty).toFixed(2);
    }
    return totalPrice || '0.00';
  };

  const handleSave = () => {
    if (!selectedCategory || !selectedModel) {
      alert('Selecione uma categoria e modelo');
      return;
    }

    const m2 = parseFloat(calculateM2());
    const price = parseFloat(pricePerM2) || 0;
    const qty = parseFloat(quantity) || 1;
    const finalTotal = parseFloat(calculateTotal()) || parseFloat(totalPrice) || 0;

    const item: QuoteItem = {
      serviceName: `${selectedCategory.name} - ${selectedModel.name}`,
      quantity: qty,
      unitPrice: price > 0 ? price : finalTotal / (m2 * qty || 1),
      total: finalTotal,
      category: selectedCategory.id,
      model: selectedModel.id,
      dimensions: {
        width: parseFloat(width) || undefined,
        height: parseFloat(height) || undefined,
      },
      glassColor: glassColor || undefined,
      glassThickness: glassThickness || undefined,
      profileColor: profileColor || undefined,
    };

    onSave(item);
    handleReset();
  };

  const handleReset = () => {
    setStep(1);
    setSelectedCategory(null);
    setSelectedModel(null);
    setHeight('');
    setWidth('');
    setGlassColor('');
    setGlassThickness('');
    setProfileColor('');
    setPricePerM2('');
    setTotalPrice('');
    setQuantity('1');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {step > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (step === 3) {
                    setStep(2);
                  } else if (step === 2) {
                    setStep(1);
                    setSelectedCategory(null);
                    setSelectedModel(null);
                  }
                }}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
            )}
            <h2 className="text-2xl font-bold text-navy">
              {step === 1 && 'Selecione a Categoria'}
              {step === 2 && 'Selecione o Modelo'}
              {step === 3 && 'Configure o Item'}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-slate-500 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Step 1: Category Selection */}
        {step === 1 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategory(category);
                  if (category.id === 'outros' || category.models.length === 0) {
                    // Skip to step 3 for manual/others
                    setSelectedModel({ id: 'manual', name: 'Manual' });
                    setStep(3);
                  } else {
                    setStep(2);
                  }
                }}
                className="h-32 flex flex-col items-center justify-center bg-white border-2 border-slate-200 rounded-xl hover:border-navy hover:bg-navy-50 transition-all shadow-md"
              >
                <div className="text-navy mb-2">{category.icon}</div>
                <span className="text-sm font-medium text-navy">{category.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Model Selection */}
        {step === 2 && selectedCategory && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {selectedCategory.models.map((model) => (
              <button
                key={model.id}
                onClick={() => {
                  setSelectedModel(model);
                  setStep(3);
                }}
                className="h-24 flex items-center justify-center bg-white border-2 border-slate-200 rounded-xl hover:border-navy hover:bg-navy-50 transition-all shadow-md px-4"
              >
                <span className="text-sm font-medium text-navy text-center">{model.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Step 3: Configuration */}
        {step === 3 && selectedCategory && selectedModel && (
          <div className="space-y-6">
            {/* Selected Model Header */}
            <div className="bg-navy-50 p-4 rounded-lg flex items-center gap-3">
              <div className="text-navy">{selectedCategory.icon}</div>
              <div>
                <h3 className="font-bold text-navy">{selectedCategory.name}</h3>
                <p className="text-sm text-slate-600">{selectedModel.name}</p>
              </div>
            </div>

            {/* Dimensions */}
            <div>
              <h3 className="text-lg font-bold text-navy mb-4">Dimensões</h3>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Altura (mm)"
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="Ex: 2000"
                />
                <Input
                  label="Largura (mm)"
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  placeholder="Ex: 1500"
                />
              </div>
              {height && width && (
                <p className="mt-2 text-sm text-slate-600">
                  Área calculada: <span className="font-bold text-navy">{calculateM2()} m²</span>
                </p>
              )}
            </div>

            {/* Glass Selection */}
            <div>
              <h3 className="text-lg font-bold text-navy mb-4">Vidro</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Cor</label>
                  <div className="flex flex-wrap gap-2">
                    {GLASS_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setGlassColor(glassColor === color ? '' : color)}
                        className={`px-4 py-2 rounded-lg border-2 transition-all ${
                          glassColor === color
                            ? 'border-navy bg-navy text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-navy'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Espessura</label>
                  <div className="flex flex-wrap gap-2">
                    {GLASS_THICKNESS.map((thickness) => (
                      <button
                        key={thickness}
                        onClick={() => setGlassThickness(glassThickness === thickness ? '' : thickness)}
                        className={`px-4 py-2 rounded-lg border-2 transition-all ${
                          glassThickness === thickness
                            ? 'border-navy bg-navy text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-navy'
                        }`}
                      >
                        {thickness}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Profile/Kit Selection */}
            <div>
              <h3 className="text-lg font-bold text-navy mb-4">Acabamento/Kit</h3>
              <div className="flex flex-wrap gap-2">
                {PROFILE_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setProfileColor(profileColor === color ? '' : color)}
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      profileColor === color
                        ? 'border-navy bg-navy text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-navy'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div>
              <h3 className="text-lg font-bold text-navy mb-4">Precificação</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Quantidade"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="1"
                />
                <Input
                  label="Preço por m² (R$)"
                  type="number"
                  value={pricePerM2}
                  onChange={(e) => {
                    setPricePerM2(e.target.value);
                    setTotalPrice('');
                  }}
                  placeholder="Ex: 150.00"
                />
                <Input
                  label="Preço Total (R$)"
                  type="number"
                  value={totalPrice || calculateTotal()}
                  onChange={(e) => {
                    setTotalPrice(e.target.value);
                    setPricePerM2('');
                  }}
                  placeholder="Ex: 450.00"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4 border-t border-slate-200">
              <Button
                variant="primary"
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                Adicionar ao Orçamento
              </Button>
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
