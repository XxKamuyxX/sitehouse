import { Layout } from '../../components/Layout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useState, useEffect, useRef } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db, storage } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Trash2, Upload, Image as ImageIcon, Settings, Play, CheckCircle, AlertCircle } from 'lucide-react';
import { compressFile } from '../../utils/compressImage';
import { EngineId } from '../../engines/types';

interface EngineConfig {
  engine_id: EngineId;
  regras_fisicas: any;
  mapeamento_materiais: any;
}

interface Template {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  createdAt: any;
  engine_config?: EngineConfig;
}

const CATEGORIES = [
  'Janelas',
  'Portas',
  'Box',
  'Espelhos',
  'Guarda-Corpo',
  'Cobertura',
  'Outro',
];

const ENGINE_TYPES = [
  { value: '', label: 'Sem Motor de Engenharia' },
  { value: 'sacada_ks', label: 'Sacada KS (Empilhável)' },
  { value: 'janela_correr', label: 'Janela de Correr' },
  { value: 'janela_maximar', label: 'Janela Maxim-Ar' },
  { value: 'porta_pivotante', label: 'Porta Pivotante' },
  { value: 'box_frontal', label: 'Box Frontal' },
  { value: 'box_canto', label: 'Box de Canto (L)' },
  { value: 'guarda_corpo_torre', label: 'Guarda-Corpo Torre' },
  { value: 'vidro_fixo', label: 'Vidro Fixo' },
];

// Configurações padrão para cada tipo de motor
const DEFAULT_ENGINE_CONFIGS: Record<string, any> = {
  sacada_ks: {
    engine_id: 'sacada_ks',
    regras_fisicas: {
      tipo_movimento: 'empilhavel',
      tem_pivo: true,
      permite_abertura_dupla: false,
      folgas: {
        padrao: 15,
        lateral: 20,
        superior: 15,
        inferior: 15,
      },
      fator_empilhamento: 0.04,
      largura_minima_folha: 0.5,
      largura_maxima_folha: 1.0,
      area_maxima_folha: 2.5,
      peso_maximo_folha: 50,
      altura_minima: 1.2,
      altura_maxima: 3.0,
      espessuras_vidro_permitidas: [6, 8, 10],
      espessura_vidro_padrao: 8,
      tipos_vidro_permitidos: ['temperado'],
      tipo_vidro_obrigatorio: 'temperado',
      tipo_perfil: 'linha_ks_standard',
      espessura_perfil: 30,
      calcular_folhas_automatico: true,
      exigir_numero_folhas_par: true,
      permitir_folhas_asimetricas: false,
    },
    mapeamento_materiais: {
      vidro: {
        incolor: { hex: '#E6F5FA', nome: 'Incolor' },
        fume: { hex: '#3C4146', nome: 'Fumê' },
        verde: { hex: '#B4DCBE', nome: 'Verde' },
        bronze: { hex: '#B49178', nome: 'Bronze' },
      },
      perfil: {
        branco_fosco: { hex: '#F5F7FA', nome: 'Branco Fosco' },
        preto_anodizado: { hex: '#35383D', nome: 'Preto Anodizado' },
        bronze: { hex: '#8B6F47', nome: 'Bronze' },
      },
    },
  },
  janela_correr: {
    engine_id: 'janela_correr',
    regras_fisicas: {
      tipo_movimento: 'correr',
      tem_pivo: false,
      permite_abertura_dupla: false,
      folgas: {
        padrao: 12,
        lateral: 15,
        superior: 12,
        inferior: 12,
      },
      sobreposicao_folhas: 0.05,
      largura_minima_folha: 0.6,
      largura_maxima_folha: 1.2,
      area_maxima_folha: 1.8,
      peso_maximo_folha: 35,
      espessuras_vidro_permitidas: [4, 6, 8],
      espessura_vidro_padrao: 6,
      tipos_vidro_permitidos: ['temperado', 'laminado', 'comum'],
      tipo_perfil: 'linha_25_esquadria',
      espessura_perfil: 25,
      calcular_folhas_automatico: false,
      permitir_folhas_asimetricas: false,
    },
    mapeamento_materiais: {
      vidro: {
        incolor: { hex: '#E6F5FA', nome: 'Incolor' },
        fume: { hex: '#3C4146', nome: 'Fumê' },
        verde: { hex: '#B4DCBE', nome: 'Verde' },
      },
      perfil: {
        branco_fosco: { hex: '#F5F7FA', nome: 'Branco Fosco' },
        preto_fosco: { hex: '#2C2F33', nome: 'Preto Fosco' },
      },
    },
  },
  box_frontal: {
    engine_id: 'box_frontal',
    regras_fisicas: {
      tipo_movimento: 'correr',
      tem_pivo: false,
      permite_abertura_dupla: false,
      folgas: {
        padrao: 10,
        lateral: 15,
        superior: 10,
        inferior: 10,
      },
      largura_minima_folha: 0.6,
      largura_maxima_folha: 1.0,
      area_maxima_folha: 2.0,
      peso_maximo_folha: 40,
      espessuras_vidro_permitidas: [8, 10],
      espessura_vidro_padrao: 8,
      tipos_vidro_permitidos: ['temperado'],
      tipo_vidro_obrigatorio: 'temperado',
      tipo_perfil: 'trilho_box',
      calcular_folhas_automatico: false,
    },
    mapeamento_materiais: {
      vidro: {
        incolor: { hex: '#E6F5FA', nome: 'Incolor' },
        fume: { hex: '#3C4146', nome: 'Fumê' },
      },
      perfil: {
        natural_brilhante: { hex: '#D0D8E0', nome: 'Natural Brilhante' },
        preto_brilhante: { hex: '#25282C', nome: 'Preto Brilhante' },
      },
    },
  },
  guarda_corpo_torre: {
    engine_id: 'guarda_corpo_torre',
    regras_fisicas: {
      tipo_movimento: 'fixo',
      tem_pivo: false,
      permite_abertura_dupla: false,
      folgas: {
        padrao: 0,
        lateral: 50,
        superior: 0,
        inferior: 0,
      },
      altura_minima: 1.05,
      altura_maxima: 1.2,
      largura_maxima_folha: 1.5,
      area_maxima_folha: 1.8,
      espessuras_vidro_permitidas: [10, 12],
      espessura_vidro_padrao: 10,
      tipos_vidro_permitidos: ['temperado', 'laminado'],
      tipo_vidro_obrigatorio: 'temperado',
      tipo_perfil: 'torre_inox',
    },
    mapeamento_materiais: {
      vidro: {
        incolor: { hex: '#E6F5FA', nome: 'Incolor' },
        extra_clear: { hex: '#F5FAFC', nome: 'Extra Clear' },
        fume: { hex: '#3C4146', nome: 'Fumê' },
      },
      perfil: {
        inox_polido: { hex: '#C0C8D0', nome: 'Inox Polido' },
        inox_escovado: { hex: '#B0B8C0', nome: 'Inox Escovado' },
      },
    },
  },
  vidro_fixo: {
    engine_id: 'vidro_fixo',
    regras_fisicas: {
      tipo_movimento: 'fixo',
      tem_pivo: false,
      permite_abertura_dupla: false,
      folgas: {
        padrao: 10,
        lateral: 10,
        superior: 10,
        inferior: 10,
      },
      largura_minima_folha: 0.3,
      largura_maxima_folha: 3.0,
      area_maxima_folha: 4.0,
      espessuras_vidro_permitidas: [6, 8, 10, 12],
      espessura_vidro_padrao: 8,
      tipos_vidro_permitidos: ['temperado', 'laminado', 'comum'],
      tipo_perfil: 'perfil_u',
    },
    mapeamento_materiais: {
      vidro: {
        incolor: { hex: '#E6F5FA', nome: 'Incolor' },
        fume: { hex: '#3C4146', nome: 'Fumê' },
        verde: { hex: '#B4DCBE', nome: 'Verde' },
        bronze: { hex: '#B49178', nome: 'Bronze' },
      },
      perfil: {
        natural_fosco: { hex: '#C8D0D8', nome: 'Natural Fosco' },
        branco_fosco: { hex: '#F5F7FA', nome: 'Branco Fosco' },
        preto_fosco: { hex: '#2C2F33', nome: 'Preto Fosco' },
      },
    },
  },
};

export function TemplateManager() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    customCategory: '',
    engineType: '',
    engineConfigJson: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  const [jsonValid, setJsonValid] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  // Carregar configuração padrão quando selecionar tipo de motor
  const handleEngineTypeChange = (engineType: string) => {
    setFormData({ ...formData, engineType, engineConfigJson: '' });
    
    if (engineType && DEFAULT_ENGINE_CONFIGS[engineType]) {
      const config = DEFAULT_ENGINE_CONFIGS[engineType];
      setFormData({
        ...formData,
        engineType,
        engineConfigJson: JSON.stringify(config, null, 2),
      });
      setJsonValid(true);
    }
  };

  // Carregar configuração padrão manualmente
  const handleLoadDefault = () => {
    if (!formData.engineType) {
      alert('Selecione um tipo de motor primeiro');
      return;
    }

    const config = DEFAULT_ENGINE_CONFIGS[formData.engineType];
    if (config) {
      setFormData({
        ...formData,
        engineConfigJson: JSON.stringify(config, null, 2),
      });
      setJsonValid(true);
    }
  };

  // Validar JSON
  const handleJsonChange = (value: string) => {
    setFormData({ ...formData, engineConfigJson: value });
    
    try {
      if (value.trim()) {
        JSON.parse(value);
        setJsonValid(true);
      } else {
        setJsonValid(true); // Vazio é válido
      }
    } catch (error) {
      setJsonValid(false);
    }
  };

  // Testar renderização
  const handleTestRendering = () => {
    if (!formData.engineConfigJson.trim()) {
      alert('Configure o motor de engenharia primeiro');
      return;
    }

    try {
      const config = JSON.parse(formData.engineConfigJson);
      setTestError(null);
      setShowTestModal(true);
    } catch (error: any) {
      setTestError(`JSON inválido: ${error.message}`);
      alert(`Erro no JSON: ${error.message}`);
    }
  };

  const loadTemplates = async () => {
    try {
      const q = query(collection(db, 'templates'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const templatesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Template[];
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error loading templates:', error);
      alert('Erro ao carregar templates');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas imagens (JPG, PNG, SVG)');
      return;
    }

    setSelectedFile(file);

    // Show preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Digite o nome do projeto');
      return;
    }

    const category = formData.category === 'Outro' ? formData.customCategory : formData.category;
    if (!category.trim()) {
      alert('Selecione ou digite a categoria');
      return;
    }

    if (!selectedFile) {
      alert('Selecione uma imagem do projeto');
      return;
    }

    // Validar engine_config se fornecido
    let engineConfig: EngineConfig | undefined;
    if (formData.engineType && formData.engineConfigJson.trim()) {
      try {
        engineConfig = JSON.parse(formData.engineConfigJson);
        
        // Validar estrutura básica
        if (!engineConfig.engine_id || !engineConfig.regras_fisicas) {
          alert('Configuração do motor inválida. Faltam campos obrigatórios (engine_id, regras_fisicas)');
          return;
        }
      } catch (error: any) {
        alert(`Erro no JSON da configuração: ${error.message}`);
        return;
      }
    }

    try {
      setUploading(true);

      // Compress image before upload
      const compressedFile = await compressFile(selectedFile);
      console.log(`Compressed size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);

      // Upload to Firebase Storage
      const timestamp = Date.now();
      const fileName = `${timestamp}_${compressedFile.name}`;
      const storageRef = ref(storage, `templates/${fileName}`);
      
      await uploadBytes(storageRef, compressedFile);
      const imageUrl = await getDownloadURL(storageRef);

      // Prepare template data
      const templateData: any = {
        name: formData.name.trim(),
        category: category.trim(),
        imageUrl,
        createdAt: new Date(),
      };

      // Add engine_config if provided
      if (engineConfig) {
        templateData.engine_config = engineConfig;
      }

      // Save to Firestore
      await addDoc(collection(db, 'templates'), templateData);

      // Reset form
      setFormData({
        name: '',
        category: '',
        customCategory: '',
        engineType: '',
        engineConfigJson: '',
      });
      setSelectedFile(null);
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      alert('Template salvo com sucesso!');
      await loadTemplates();
    } catch (error: any) {
      console.error('Error saving template:', error);
      alert(`Erro ao salvar template: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (template: Template) => {
    if (!confirm(`Tem certeza que deseja excluir o template "${template.name}"?`)) {
      return;
    }

    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'templates', template.id));

      // Delete from Storage
      try {
        const imageRef = ref(storage, template.imageUrl);
        await deleteObject(imageRef);
      } catch (storageError) {
        console.warn('Error deleting image from storage:', storageError);
        // Continue even if storage deletion fails
      }

      alert('Template excluído com sucesso!');
      await loadTemplates();
    } catch (error: any) {
      console.error('Error deleting template:', error);
      alert(`Erro ao excluir template: ${error.message}`);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-secondary">Biblioteca de Projetos</h1>
          <p className="text-slate-600 mt-1">Gerencie os templates visuais para orçamentos</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side - Form */}
          <Card>
            <h2 className="text-xl font-bold text-secondary mb-4">Adicionar Novo Projeto</h2>
            
            <div className="space-y-4">
              <Input
                label="Nome do Projeto *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Janela 4 Folhas Correr"
                required
              />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Categoria *
                </label>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value, customCategory: '' })}
                  options={[
                    { value: '', label: 'Selecione a categoria...' },
                    ...CATEGORIES.map((cat) => ({ value: cat, label: cat })),
                  ]}
                  required
                />
              </div>

              {formData.category === 'Outro' && (
                <Input
                  label="Nome da Categoria Personalizada *"
                  value={formData.customCategory}
                  onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                  placeholder="Digite o nome da categoria"
                  required
                />
              )}

              {/* SEÇÃO: MOTOR DE ENGENHARIA */}
              <div className="border-t border-slate-200 pt-4 mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Settings className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-bold text-secondary">Motor de Engenharia (Opcional)</h3>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                  Configure o motor de cálculo automático para este template. Deixe em branco para templates estáticos.
                </p>

                <div className="space-y-4">
                  {/* Tipo de Motor */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Tipo de Motor
                    </label>
                    <Select
                      value={formData.engineType}
                      onChange={(e) => handleEngineTypeChange(e.target.value)}
                      options={ENGINE_TYPES}
                    />
                  </div>

                  {/* JSON Editor */}
                  {formData.engineType && (
                    <>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-sm font-medium text-slate-700">
                            Configuração Avançada (JSON)
                          </label>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleLoadDefault}
                              className="text-xs"
                            >
                              Carregar Padrão
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleTestRendering}
                              disabled={!jsonValid || !formData.engineConfigJson.trim()}
                              className="text-xs flex items-center gap-1"
                            >
                              <Play className="w-3 h-3" />
                              Testar
                            </Button>
                          </div>
                        </div>
                        <div className="relative">
                          <textarea
                            value={formData.engineConfigJson}
                            onChange={(e) => handleJsonChange(e.target.value)}
                            className={`w-full h-64 p-3 border rounded-lg font-mono text-xs ${
                              jsonValid
                                ? 'border-slate-300 focus:border-primary focus:ring-1 focus:ring-primary'
                                : 'border-red-300 bg-red-50'
                            }`}
                            placeholder="Cole ou edite o JSON da configuração aqui..."
                            spellCheck={false}
                          />
                          <div className="absolute top-2 right-2">
                            {jsonValid ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                        </div>
                        {!jsonValid && (
                          <p className="text-xs text-red-600 mt-1">
                            JSON inválido. Verifique a sintaxe.
                          </p>
                        )}
                        <p className="text-xs text-slate-500 mt-1">
                          Edite as regras físicas e mapeamento de materiais. Use "Testar" para visualizar.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Imagem do Projeto * (JPG, PNG, SVG)
                </label>
                <div className="space-y-2">
                  {preview ? (
                    <div className="relative">
                      <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-48 object-contain border border-slate-200 rounded-lg bg-gray-50"
                      />
                      <button
                        onClick={() => {
                          setSelectedFile(null);
                          setPreview(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                    >
                      <ImageIcon className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                      <p className="text-slate-600">Clique para selecionar ou arraste uma imagem</p>
                      <p className="text-xs text-slate-500 mt-1">JPG, PNG ou SVG</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </div>

              <Button
                variant="primary"
                onClick={handleSave}
                disabled={uploading || !formData.name || !formData.category || !selectedFile}
                className="w-full flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Salvar Projeto
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Right Side - List */}
          <Card>
            <h2 className="text-xl font-bold text-secondary mb-4">Templates Existentes</h2>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-slate-600 mt-2">Carregando...</p>
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-600">Nenhum template cadastrado ainda</p>
                <p className="text-sm text-slate-500 mt-1">Adicione seu primeiro projeto ao lado</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="border border-slate-200 rounded-lg p-3 hover:border-primary transition-colors"
                  >
                    <div className="aspect-video bg-gray-50 rounded-lg mb-2 overflow-hidden">
                      <img
                        src={template.imageUrl}
                        alt={template.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-secondary text-sm">{template.name}</h3>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-slate-500">{template.category}</p>
                        {template.engine_config && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                            <Settings className="w-3 h-3" />
                            Motor
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(template)}
                      className="w-full mt-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Excluir
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* MODAL: Teste de Renderização */}
        {showTestModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-secondary">Teste de Renderização</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Visualize como o motor renderizará este template
                  </p>
                </div>
                <button
                  onClick={() => setShowTestModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-900">Preview Simplificado</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        Este é um preview da configuração. O motor completo de renderização será implementado na próxima fase.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Exibir configuração */}
                {formData.engineConfigJson && (() => {
                  try {
                    const config = JSON.parse(formData.engineConfigJson);
                    return (
                      <div className="space-y-4">
                        {/* Informações Básicas */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-50 rounded-lg p-4">
                            <p className="text-xs text-slate-600 mb-1">Tipo de Motor</p>
                            <p className="font-bold text-secondary">{config.engine_id}</p>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-4">
                            <p className="text-xs text-slate-600 mb-1">Tipo de Movimento</p>
                            <p className="font-bold text-secondary capitalize">
                              {config.regras_fisicas?.tipo_movimento || 'N/A'}
                            </p>
                          </div>
                        </div>

                        {/* Regras Físicas */}
                        <div>
                          <h4 className="font-bold text-secondary mb-2 flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            Regras Físicas
                          </h4>
                          <div className="bg-slate-50 rounded-lg p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                            {config.regras_fisicas?.folgas && (
                              <>
                                <div>
                                  <p className="text-xs text-slate-600">Folga Padrão</p>
                                  <p className="font-mono text-sm">{config.regras_fisicas.folgas.padrao}mm</p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-600">Folga Lateral</p>
                                  <p className="font-mono text-sm">{config.regras_fisicas.folgas.lateral}mm</p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-600">Folga Superior</p>
                                  <p className="font-mono text-sm">{config.regras_fisicas.folgas.superior}mm</p>
                                </div>
                              </>
                            )}
                            {config.regras_fisicas?.largura_minima_folha && (
                              <div>
                                <p className="text-xs text-slate-600">Largura Mín. Folha</p>
                                <p className="font-mono text-sm">{config.regras_fisicas.largura_minima_folha}m</p>
                              </div>
                            )}
                            {config.regras_fisicas?.largura_maxima_folha && (
                              <div>
                                <p className="text-xs text-slate-600">Largura Máx. Folha</p>
                                <p className="font-mono text-sm">{config.regras_fisicas.largura_maxima_folha}m</p>
                              </div>
                            )}
                            {config.regras_fisicas?.espessura_vidro_padrao && (
                              <div>
                                <p className="text-xs text-slate-600">Espessura Padrão</p>
                                <p className="font-mono text-sm">{config.regras_fisicas.espessura_vidro_padrao}mm</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Mapeamento de Materiais */}
                        {config.mapeamento_materiais && (
                          <div>
                            <h4 className="font-bold text-secondary mb-2">Materiais Disponíveis</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Vidros */}
                              {config.mapeamento_materiais.vidro && (
                                <div className="bg-slate-50 rounded-lg p-4">
                                  <p className="text-sm font-medium text-slate-700 mb-2">Vidros</p>
                                  <div className="space-y-2">
                                    {Object.entries(config.mapeamento_materiais.vidro).map(([key, value]: [string, any]) => (
                                      <div key={key} className="flex items-center gap-2">
                                        <div
                                          className="w-8 h-8 rounded border border-slate-300"
                                          style={{ backgroundColor: value.hex }}
                                        ></div>
                                        <div>
                                          <p className="text-xs font-medium">{value.nome}</p>
                                          <p className="text-xs text-slate-500 font-mono">{value.hex}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Perfis */}
                              {config.mapeamento_materiais.perfil && (
                                <div className="bg-slate-50 rounded-lg p-4">
                                  <p className="text-sm font-medium text-slate-700 mb-2">Perfis</p>
                                  <div className="space-y-2">
                                    {Object.entries(config.mapeamento_materiais.perfil).map(([key, value]: [string, any]) => (
                                      <div key={key} className="flex items-center gap-2">
                                        <div
                                          className="w-8 h-8 rounded border border-slate-300"
                                          style={{ backgroundColor: value.hex }}
                                        ></div>
                                        <div>
                                          <p className="text-xs font-medium">{value.nome}</p>
                                          <p className="text-xs text-slate-500 font-mono">{value.hex}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Validações */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-green-900">Configuração Válida</p>
                              <p className="text-xs text-green-700 mt-1">
                                A estrutura JSON está correta e pode ser salva.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  } catch (error: any) {
                    return (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex gap-2">
                          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-red-900">Erro no JSON</p>
                            <p className="text-xs text-red-700 mt-1">{error.message}</p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                })()}
              </div>

              <div className="p-6 border-t border-slate-200 flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setShowTestModal(false)}
                >
                  Fechar
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setShowTestModal(false)}
                >
                  OK, Configuração Válida
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
