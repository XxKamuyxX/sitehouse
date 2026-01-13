import { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { X, Search } from 'lucide-react';

interface LibraryItem {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  sector: string;
  category: string;
}

interface LibrarySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string) => void;
}

export function LibrarySelectorModal({ isOpen, onClose, onSelect }: LibrarySelectorModalProps) {
  const { userMetadata } = useAuth();
  const companyId = userMetadata?.companyId;
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen && companyId) {
      loadItems();
    }
  }, [isOpen, companyId]);

  const loadItems = async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      const q = query(
        collection(db, 'library_items'),
        where('companyId', '==', companyId)
      );
      const snapshot = await getDocs(q);
      const loadedItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as LibraryItem[];
      setItems(loadedItems);
    } catch (error) {
      console.error('Error loading library items:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-navy">📂 Escolher da Biblioteca</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Buscar por nome ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Items Grid */}
        {loading ? (
          <div className="text-center py-8 text-slate-600">Carregando...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-8 text-slate-600">
            {searchTerm ? 'Nenhum item encontrado' : 'Nenhum item na biblioteca'}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onSelect(item.imageUrl);
                  onClose();
                }}
                className="group relative p-3 rounded-lg border-2 border-slate-200 hover:border-navy transition-all bg-white hover:bg-slate-50 text-left"
              >
                <div className="aspect-video bg-slate-100 rounded-lg mb-2 overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Imagem+Inválida';
                    }}
                  />
                </div>
                <h3 className="font-medium text-sm text-slate-700 line-clamp-2">{item.name}</h3>
                {item.description && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                )}
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
