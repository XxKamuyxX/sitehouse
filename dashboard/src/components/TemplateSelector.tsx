import { useState } from 'react';
import { X, Square, DoorOpen, Box, Image, Shield, Sun } from 'lucide-react';
import { Card } from './ui/Card';

interface Template {
  id: string;
  name: string;
  category: string;
  icon: React.ReactNode;
  defaultName: string;
  description: string;
}

interface TemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: Template) => void;
}

const CATEGORIES = [
  {
    id: 'janelas',
    name: 'Janelas',
    icon: <Square className="w-12 h-12" />,
    templates: [
      { id: 'janela-2-folhas', name: '2 Folhas', defaultName: 'Janela 2 Folhas', description: 'Janela de duas folhas deslizantes' },
      { id: 'janela-4-folhas', name: '4 Folhas', defaultName: 'Janela 4 Folhas', description: 'Janela de quatro folhas deslizantes' },
      { id: 'janela-basculante', name: 'Basculante', defaultName: 'Janela Basculante', description: 'Janela basculante de vidro' },
      { id: 'janela-maximo-ar', name: 'Máximo Ar', defaultName: 'Janela Máximo Ar', description: 'Janela de máximo aproveitamento' },
    ],
  },
  {
    id: 'portas',
    name: 'Portas',
    icon: <DoorOpen className="w-12 h-12" />,
    templates: [
      { id: 'porta-deslizante', name: 'Deslizante', defaultName: 'Porta de Vidro Deslizante', description: 'Porta deslizante de vidro' },
      { id: 'porta-pivotante', name: 'Pivotante', defaultName: 'Porta Pivotante', description: 'Porta pivotante de vidro' },
      { id: 'porta-batente', name: 'Batente', defaultName: 'Porta de Vidro Batente', description: 'Porta de batente com vidro' },
    ],
  },
  {
    id: 'box',
    name: 'Box',
    icon: <Box className="w-12 h-12" />,
    templates: [
      { id: 'box-padrao', name: 'Box Padrão', defaultName: 'Box de Vidro Padrão', description: 'Box de vidro para banheiro' },
      { id: 'box-curvilineo', name: 'Curvilíneo', defaultName: 'Box Curvilíneo', description: 'Box de vidro curvilíneo' },
      { id: 'box-neo-angle', name: 'Neo Angle', defaultName: 'Box Neo Angle', description: 'Box de vidro neo angle' },
    ],
  },
  {
    id: 'espelhos',
    name: 'Espelhos',
    icon: <Image className="w-12 h-12" />,
    templates: [
      { id: 'espelho-simples', name: 'Simples', defaultName: 'Espelho Simples', description: 'Espelho plano simples' },
      { id: 'espelho-com-borda', name: 'Com Borda', defaultName: 'Espelho com Borda', description: 'Espelho com borda decorativa' },
      { id: 'espelho-com-iluminacao', name: 'Com Iluminação', defaultName: 'Espelho com Iluminação', description: 'Espelho com iluminação LED' },
    ],
  },
  {
    id: 'guarda-corpo',
    name: 'Guarda-Corpo',
    icon: <Shield className="w-12 h-12" />,
    templates: [
      { id: 'guarda-corpo-vidro', name: 'Vidro', defaultName: 'Guarda-Corpo de Vidro', description: 'Guarda-corpo de vidro temperado' },
      { id: 'guarda-corpo-inox', name: 'Inox + Vidro', defaultName: 'Guarda-Corpo Inox + Vidro', description: 'Guarda-corpo com estrutura inox' },
      { id: 'guarda-corpo-madeira', name: 'Madeira + Vidro', defaultName: 'Guarda-Corpo Madeira + Vidro', description: 'Guarda-corpo com estrutura de madeira' },
    ],
  },
  {
    id: 'cobertura',
    name: 'Cobertura',
    icon: <Sun className="w-12 h-12" />,
    templates: [
      { id: 'cobertura-vidro', name: 'Cobertura de Vidro', defaultName: 'Cobertura de Vidro', description: 'Cobertura translúcida de vidro' },
      { id: 'cobertura-policarbonato', name: 'Policarbonato', defaultName: 'Cobertura de Policarbonato', description: 'Cobertura de policarbonato' },
    ],
  },
];

export function TemplateSelector({ isOpen, onClose, onSelectTemplate }: TemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedCategoryData = CATEGORIES.find((cat) => cat.id === selectedCategory);

  const handleTemplateSelect = (template: any) => {
    const fullTemplate: Template = {
      id: template.id,
      name: template.name,
      category: selectedCategory || '',
      icon: selectedCategoryData?.icon || <Square className="w-12 h-12" />,
      defaultName: template.defaultName,
      description: template.description,
    };
    onSelectTemplate(fullTemplate);
    setSelectedCategory(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-secondary">
            {selectedCategory ? `Selecione o Tipo de ${selectedCategoryData?.name}` : 'Selecione a Categoria'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {!selectedCategory ? (
          // Category Grid
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className="group relative p-6 rounded-lg border-2 border-gray-200 hover:border-primary transition-all bg-white hover:bg-glass-blue"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="text-primary group-hover:scale-110 transition-transform">
                    {category.icon}
                  </div>
                  <h3 className="font-bold text-secondary text-lg">{category.name}</h3>
                  <p className="text-xs text-slate-500">{category.templates.length} opções</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          // Template Grid
          <div>
            <button
              onClick={() => setSelectedCategory(null)}
              className="mb-4 flex items-center gap-2 text-primary hover:text-primary-dark"
            >
              <X className="w-4 h-4" />
              Voltar
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedCategoryData?.templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className="group p-6 rounded-lg border-2 border-gray-200 hover:border-primary transition-all bg-white hover:bg-glass-blue text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-primary group-hover:scale-110 transition-transform">
                      {selectedCategoryData.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-secondary text-lg mb-1">{template.name}</h3>
                      <p className="text-sm text-slate-600">{template.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
