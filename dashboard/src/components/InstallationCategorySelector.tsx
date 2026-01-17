import { Box, Square, DoorOpen, Building2, Mirror, Shield, Grid3x3, RectangleHorizontal, MoreHorizontal } from 'lucide-react';

interface InstallationCategorySelectorProps {
  onSelectCategory: (category: string) => void;
}

const CATEGORIES = [
  { id: 'box', label: 'Box', icon: Box, color: 'bg-blue-100 text-blue-600' },
  { id: 'janela', label: 'Janela', icon: Square, color: 'bg-green-100 text-green-600' },
  { id: 'porta', label: 'Porta', icon: DoorOpen, color: 'bg-purple-100 text-purple-600' },
  { id: 'sacada', label: 'Sacada', icon: Building2, color: 'bg-orange-100 text-orange-600' },
  { id: 'espelho', label: 'Espelho', icon: Mirror, color: 'bg-cyan-100 text-cyan-600' },
  { id: 'guarda-corpo', label: 'Guarda-Corpo', icon: Shield, color: 'bg-indigo-100 text-indigo-600' },
  { id: 'divisorio', label: 'Divisório', icon: Grid3x3, color: 'bg-pink-100 text-pink-600' },
  { id: 'vidro-fixo', label: 'Vidro Fixo', icon: RectangleHorizontal, color: 'bg-teal-100 text-teal-600' },
  { id: 'outros', label: 'Outros', icon: MoreHorizontal, color: 'bg-gray-100 text-gray-600' },
];

export function InstallationCategorySelector({ onSelectCategory }: InstallationCategorySelectorProps) {
  return (
    <div>
      <h2 className="text-xl font-bold text-secondary mb-4">Selecione a Categoria</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {CATEGORIES.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className="p-6 border-2 border-slate-200 rounded-lg hover:border-primary transition-all bg-white hover:bg-glass-blue text-left"
            >
              <div className={`w-16 h-16 ${category.color} rounded-lg flex items-center justify-center mb-4 mx-auto`}>
                <Icon className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-secondary text-center">{category.label}</h3>
            </button>
          );
        })}
      </div>
    </div>
  );
}
