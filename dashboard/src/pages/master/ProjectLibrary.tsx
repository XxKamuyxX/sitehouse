/**
 * Project Library - Master Dashboard
 * 
 * Manage installation and maintenance templates
 * - Add templates with images
 * - Organize by profession (vidraçaria, elétrica, etc)
 * - Organize by type (instalação, manutenção)
 * - Organize by category (box, janela, porta, etc)
 */

import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Plus, Edit2, Trash2, Upload, X, Search, Image as ImageIcon } from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';

interface ProjectTemplate {
  id: string;
  title: string;
  description: string;
  profession: string; // vidraçaria, elétrica, hidráulica, etc
  type: 'installation' | 'maintenance';
  category: string; // box, janela, porta, sacada, espelho, etc
  imageUrl?: string;
  createdAt: any;
  updatedAt: any;
}

const PROFESSIONS = [
  { id: 'vidracaria', label: 'Vidraçaria' },
  { id: 'eletrica', label: 'Elétrica' },
  { id: 'hidraulica', label: 'Hidráulica' },
  { id: 'pintura', label: 'Pintura' },
  { id: 'marcenaria', label: 'Marcenaria' },
  { id: 'alvenaria', label: 'Alvenaria' },
  { id: 'outros', label: 'Outros' },
];

const TYPES = [
  { id: 'installation', label: 'Instalação' },
  { id: 'maintenance', label: 'Manutenção' },
];

const CATEGORIES = [
  { id: 'box', label: 'Box' },
  { id: 'janela', label: 'Janela' },
  { id: 'porta', label: 'Porta' },
  { id: 'sacada', label: 'Sacada' },
  { id: 'espelho', label: 'Espelho' },
  { id: 'guarda-corpo', label: 'Guarda-Corpo' },
  { id: 'divisorio', label: 'Divisório' },
  { id: 'vidro-fixo', label: 'Vidro Fixo' },
  { id: 'outros', label: 'Outros' },
];

export function ProjectLibrary() {
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ProjectTemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProfession, setFilterProfession] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    profession: '',
    type: 'installation' as 'installation' | 'maintenance',
    category: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'projectTemplates'));
      const templatesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ProjectTemplate[];
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error loading templates:', error);
      alert('Erro ao carregar templates');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (template?: ProjectTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        title: template.title,
        description: template.description,
        profession: template.profession,
        type: template.type,
        category: template.category,
      });
      setImagePreview(template.imageUrl || null);
    } else {
      setEditingTemplate(null);
      setFormData({
        title: '',
        description: '',
        profession: '',
        type: 'installation',
        category: '',
      });
      setImagePreview(null);
    }
    setImageFile(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTemplate(null);
    setFormData({
      title: '',
      description: '',
      profession: '',
      type: 'installation',
      category: '',
    });
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const timestamp = Date.now();
    const filename = `project-templates/${timestamp}_${file.name}`;
    const storageRef = ref(storage, filename);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.profession || !formData.category) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setUploading(true);

    try {
      let imageUrl = editingTemplate?.imageUrl || '';

      // Upload new image if selected
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const templateData = {
        title: formData.title,
        description: formData.description,
        profession: formData.profession,
        type: formData.type,
        category: formData.category,
        imageUrl: imageUrl || null,
        updatedAt: serverTimestamp(),
      };

      if (editingTemplate) {
        // Update existing template
        await updateDoc(doc(db, 'projectTemplates', editingTemplate.id), templateData);
      } else {
        // Create new template
        await addDoc(collection(db, 'projectTemplates'), {
          ...templateData,
          createdAt: serverTimestamp(),
        });
      }

      await loadTemplates();
      handleCloseModal();
      alert('Template salvo com sucesso!');
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Erro ao salvar template');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (template: ProjectTemplate) => {
    if (!confirm(`Tem certeza que deseja excluir "${template.title}"?`)) {
      return;
    }

    try {
      // Delete image from storage if exists
      if (template.imageUrl) {
        try {
          const imageRef = ref(storage, template.imageUrl);
          await deleteObject(imageRef);
        } catch (error) {
          console.error('Error deleting image:', error);
        }
      }

      await deleteDoc(doc(db, 'projectTemplates', template.id));
      await loadTemplates();
      alert('Template excluído com sucesso!');
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Erro ao excluir template');
    }
  };

  // Filter templates
  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProfession = !filterProfession || template.profession === filterProfession;
    const matchesType = !filterType || template.type === filterType;
    const matchesCategory = !filterCategory || template.category === filterCategory;
    
    return matchesSearch && matchesProfession && matchesType && matchesCategory;
  });

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-600">Carregando biblioteca...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-navy">Biblioteca de Projetos</h1>
            <p className="text-slate-600 mt-1">Gerencie templates de instalação e manutenção</p>
          </div>
          <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Novo Template
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Buscar templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterProfession}
              onChange={(e) => setFilterProfession(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
            >
              <option value="">Todas as Profissões</option>
              {PROFESSIONS.map((prof) => (
                <option key={prof.id} value={prof.id}>{prof.label}</option>
              ))}
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
            >
              <option value="">Todos os Tipos</option>
              {TYPES.map((type) => (
                <option key={type.id} value={type.id}>{type.label}</option>
              ))}
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
            >
              <option value="">Todas as Categorias</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>
        </Card>

        {/* Templates Grid */}
        {filteredTemplates.length === 0 ? (
          <Card className="p-12 text-center">
            <ImageIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 mb-2">Nenhum template encontrado</p>
            <p className="text-sm text-slate-500">
              {searchTerm || filterProfession || filterType || filterCategory
                ? 'Tente ajustar os filtros'
                : 'Clique em "Novo Template" para começar'}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="overflow-hidden">
                {/* Image */}
                <div className="relative h-48 bg-slate-100">
                  {template.imageUrl ? (
                    <img
                      src={template.imageUrl}
                      alt={template.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-slate-300" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-bold text-navy text-lg mb-2">{template.title}</h3>
                  <p className="text-sm text-slate-600 mb-3 line-clamp-2">{template.description}</p>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                      {PROFESSIONS.find((p) => p.id === template.profession)?.label}
                    </span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                      {TYPES.find((t) => t.id === template.type)?.label}
                    </span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                      {CATEGORIES.find((c) => c.id === template.category)?.label}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenModal(template)}
                      className="flex-1 flex items-center justify-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(template)}
                      className="flex items-center justify-center text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
                <h2 className="text-2xl font-bold text-navy">
                  {editingTemplate ? 'Editar Template' : 'Novo Template'}
                </h2>
                <Button variant="ghost" size="sm" onClick={handleCloseModal}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Título *
                  </label>
                  <Input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Janela 4 Folhas"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ex: Janela 4 folhas - 2 fixas e 2 móveis"
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Profissão *
                    </label>
                    <select
                      value={formData.profession}
                      onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                    >
                      <option value="">Selecione...</option>
                      {PROFESSIONS.map((prof) => (
                        <option key={prof.id} value={prof.id}>{prof.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Tipo *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as 'installation' | 'maintenance' })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                    >
                      {TYPES.map((type) => (
                        <option key={type.id} value={type.id}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Categoria *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                    >
                      <option value="">Selecione...</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Imagem do Projeto
                  </label>
                  <div className="mt-2">
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview(null);
                          }}
                          className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-navy">
                        <Upload className="w-8 h-8 text-slate-400 mb-2" />
                        <span className="text-sm text-slate-600">Clique para fazer upload</span>
                        <span className="text-xs text-slate-500 mt-1">PNG, JPG até 5MB</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-slate-200 flex gap-3 justify-end">
                <Button variant="outline" onClick={handleCloseModal} disabled={uploading}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={uploading}>
                  {uploading ? 'Salvando...' : editingTemplate ? 'Salvar Alterações' : 'Criar Template'}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
