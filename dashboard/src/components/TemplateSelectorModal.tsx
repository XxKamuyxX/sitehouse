import { useState, useEffect } from 'react';
import { X, Pencil } from 'lucide-react';
import { Card } from './ui/Card';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Template {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  createdAt: any;
}

interface TemplateSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: Template | { id: 'manual'; name: 'Personalizado / Manual'; category: 'manual'; imageUrl: '' }) => void;
}

export function TemplateSelectorModal({ isOpen, onClose, onSelectTemplate }: TemplateSelectorModalProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'templates'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const templatesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Template[];
      setTemplates(templatesData);
      
      // Auto-select first category if available
      if (templatesData.length > 0 && !selectedCategory) {
        const firstCategory = templatesData[0].category;
        setSelectedCategory(firstCategory);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      alert('Erro ao carregar templates');
    } finally {
      setLoading(false);
    }
  };

  // Group templates by category
  const templatesByCategory = templates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, Template[]>);

  const categories = Object.keys(templatesByCategory).sort();

  // If a category is selected, show only that category. Otherwise, show all.
  const displayTemplates = selectedCategory 
    ? templatesByCategory[selectedCategory] || []
    : templates;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-6 px-6 pt-6">
          <h2 className="text-2xl font-bold text-secondary">
            Selecione um Projeto
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-slate-600 mt-4">Carregando templates...</p>
            </div>
          </div>
        ) : templates.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-slate-600 mb-2">Nenhum template disponível</p>
              <p className="text-sm text-slate-500">Os templates serão adicionados pelo administrador</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col px-6 pb-6">
            {/* Category Tabs */}
            {categories.length > 1 && (
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === null
                      ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-md shadow-primary/20'
                      : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-primary/30'
                  }`}
                >
                  Todos
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === category
                        ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-md shadow-primary/20'
                        : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-primary/30'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}

            {/* Templates Grid */}
            <div className="flex-1 overflow-y-auto">
              {selectedCategory && templatesByCategory[selectedCategory]?.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-600">Nenhum template nesta categoria</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {/* Manual / Custom Option - Always first */}
                  <button
                    onClick={() => {
                      onSelectTemplate({
                        id: 'manual',
                        name: 'Personalizado / Manual',
                        category: 'manual',
                        imageUrl: '',
                      });
                      onClose();
                    }}
                    className="group relative p-4 rounded-lg border-2 border-dashed border-primary hover:border-primary-dark transition-all bg-gradient-to-br from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/20 text-left"
                  >
                    <div className="aspect-video bg-white/50 rounded-lg mb-3 overflow-hidden flex items-center justify-center">
                      <Pencil className="w-12 h-12 text-primary group-hover:scale-110 transition-transform" />
                    </div>
                    <h3 className="font-bold text-secondary text-sm line-clamp-2">
                      Personalizado / Manual
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Criar item personalizado</p>
                  </button>

                  {/* Template Cards */}
                  {displayTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => {
                        onSelectTemplate(template);
                        onClose();
                      }}
                      className="group relative p-4 rounded-lg border-2 border-slate-200 hover:border-primary transition-all bg-white hover:bg-glass-blue text-left"
                    >
                      <div className="aspect-video bg-gray-50 rounded-lg mb-3 overflow-hidden">
                        <img
                          src={template.imageUrl}
                          alt={template.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <h3 className="font-bold text-secondary text-sm line-clamp-2">
                        {template.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">{template.category}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
