import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { ImageUpload } from '../components/ImageUpload';
import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Trash2, Edit, Plus, Search } from 'lucide-react';

interface LibraryItem {
  id: string;
  companyId: string;
  sector: string;
  category: string;
  name: string;
  description: string;
  imageUrl: string;
  createdAt: any;
}

const SECTORS = ['Vidraçaria', 'Serralheria', 'Marcenaria', 'Outros'];
const CATEGORIES: Record<string, string[]> = {
  'Vidraçaria': ['Janelas', 'Portas', 'Box', 'Esquadrias', 'Vidros Temperados'],
  'Serralheria': ['Portões', 'Grades', 'Corrimãos', 'Estruturas Metálicas'],
  'Marcenaria': ['Móveis', 'Portas', 'Painéis', 'Estruturas'],
  'Outros': ['Diversos'],
};

export function Library() {
  const { userMetadata } = useAuth();
  const companyId = userMetadata?.companyId;
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<LibraryItem | null>(null);
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    sector: 'Vidraçaria',
    category: 'Janelas',
    name: '',
    description: '',
    imageUrl: '',
  });

  useEffect(() => {
    if (companyId) {
      loadItems();
    }
  }, [companyId]);

  const loadItems = async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      const q = query(
        collection(db, 'library_items'),
        where('companyId', '==', companyId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const loadedItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as LibraryItem[];
      setItems(loadedItems);
    } catch (error) {
      console.error('Error loading library items:', error);
      // If orderBy fails, try without it
      try {
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
      } catch (err) {
        console.error('Error loading library items (fallback):', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageUploadComplete = (url: string) => {
    setFormData({ ...formData, imageUrl: url });
  };

  const handleSave = async () => {
    if (!companyId || !formData.name || !formData.imageUrl) {
      alert('Preencha todos os campos obrigatórios (Nome e Imagem)');
      return;
    }

    try {
      if (editingItem) {
        await updateDoc(doc(db, 'library_items', editingItem.id), {
          ...formData,
          updatedAt: new Date(),
        });
      } else {
        await addDoc(collection(db, 'library_items'), {
          ...formData,
          companyId,
          createdAt: new Date(),
        });
      }
      
      setShowModal(false);
      setEditingItem(null);
      setFormData({
        sector: 'Vidraçaria',
        category: 'Janelas',
        name: '',
        description: '',
        imageUrl: '',
      });
      await loadItems();
    } catch (error: any) {
      console.error('Error saving library item:', error);
      alert(`Erro ao salvar: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const handleEdit = (item: LibraryItem) => {
    setEditingItem(item);
    setFormData({
      sector: item.sector,
      category: item.category,
      name: item.name,
      description: item.description,
      imageUrl: item.imageUrl,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;
    try {
      await deleteDoc(doc(db, 'library_items', id));
      await loadItems();
    } catch (error: any) {
      console.error('Error deleting library item:', error);
      alert(`Erro ao excluir: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const handleNew = () => {
    setEditingItem(null);
    setFormData({
      sector: 'Vidraçaria',
      category: 'Janelas',
      name: '',
      description: '',
      imageUrl: '',
    });
    setShowModal(true);
  };

  const filteredItems = items.filter(item => {
    const matchesSector = selectedSector === 'all' || item.sector === selectedSector;
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSector && matchesCategory && matchesSearch;
  });

  const availableCategories = CATEGORIES[formData.sector] || [];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-navy">Biblioteca de Projetos</h1>
            <p className="text-slate-600 mt-1">Gerencie seus projetos e modelos visuais</p>
          </div>
          <Button onClick={handleNew} className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Novo Item
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Setor</label>
              <Select
                value={selectedSector}
                onChange={(e) => {
                  setSelectedSector(e.target.value);
                  setSelectedCategory('all');
                }}
                options={[
                  { value: 'all', label: 'Todos' },
                  ...SECTORS.map(s => ({ value: s, label: s }))
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Categoria</label>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                options={[
                  { value: 'all', label: 'Todas' },
                  ...(selectedSector !== 'all' && CATEGORIES[selectedSector] 
                    ? CATEGORIES[selectedSector].map(c => ({ value: c, label: c }))
                    : [])
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Buscar por nome ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Items Grid */}
        {loading ? (
          <Card>
            <p className="text-center text-slate-600 py-8">Carregando...</p>
          </Card>
        ) : filteredItems.length === 0 ? (
          <Card>
            <p className="text-center text-slate-600 py-8">
              {items.length === 0 
                ? 'Nenhum item na biblioteca. Clique em "Novo Item" para adicionar.'
                : 'Nenhum item encontrado com os filtros selecionados.'}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-slate-100 relative">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      Sem imagem
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-navy truncate">{item.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {item.sector} • {item.category}
                      </p>
                    </div>
                  </div>
                  {item.description && (
                    <p className="text-sm text-slate-600 line-clamp-2 mb-3">{item.description}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(item)}
                      className="flex-1 flex items-center justify-center gap-1"
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
                <h2 className="text-2xl font-bold text-navy">
                  {editingItem ? 'Editar Item' : 'Novo Item'}
                </h2>
                <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                  ✕
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Setor *
                    </label>
                    <Select
                      value={formData.sector}
                      onChange={(e) => {
                        setFormData({ ...formData, sector: e.target.value, category: CATEGORIES[e.target.value]?.[0] || '' });
                      }}
                      options={SECTORS.map(s => ({ value: s, label: s }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Categoria *
                    </label>
                    <Select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      options={availableCategories.map(c => ({ value: c, label: c }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nome *
                  </label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Janela 4 Folhas"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ex: Vidro 8mm, 2 fixos e 2 móveis"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy resize-none"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Imagem *
                  </label>
                  {formData.imageUrl && (
                    <div className="mb-4">
                      <img src={formData.imageUrl} alt="Preview" className="max-w-xs rounded-lg border border-slate-300" />
                    </div>
                  )}
                  <ImageUpload
                    onUploadComplete={handleImageUploadComplete}
                    path={`companies/${companyId}/library`}
                    label={formData.imageUrl ? "Trocar Imagem" : "Enviar Imagem"}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowModal(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleSave}
                    disabled={!formData.name || !formData.imageUrl}
                  >
                    {editingItem ? 'Salvar Alterações' : 'Criar Item'}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
