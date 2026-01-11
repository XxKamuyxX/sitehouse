import { useState, useRef } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { ImageUpload } from './ImageUpload';
import { CheckCircle2, AlertCircle, XCircle, X, Plus, Trash2, Camera } from 'lucide-react';
import { getSurveyFields } from '../utils/surveyFields';
import { useStorage } from '../hooks/useStorage';
import { compressFile } from '../utils/compressImage';

interface Leaf {
  id: number;
  status: 'perfect' | 'attention' | 'damaged';
  defects: string[];
  customDefect?: string; // Campo de texto livre para defeitos não listados
  photo?: string;
}

interface TechnicalInspectionProps {
  initialLeaves?: Leaf[];
  initialGeneralChecklist?: { task: string; completed: boolean; value?: string }[];
  profession?: string;
  workOrderId?: string;
  initialSurveyFields?: Record<string, string>;
  initialCustomChecklist?: Array<{ id: string; label: string; value: string }>;
  initialSurveyPhotos?: string[];
  onSave: (data: {
    leaves?: Leaf[];
    generalChecklist: { task: string; completed: boolean; value?: string }[];
    surveyFields?: Record<string, string>;
    customChecklist?: Array<{ id: string; label: string; value: string }>;
    surveyPhotos?: string[];
  }) => void;
}

const DEFECT_OPTIONS = [
  'Roldana', 
  'Vedação', 
  'Vidro Lascado', 
  'Fechadura', 
  'Trilho',
  'Vidro Solto',
  'Tombando',
  'Descolado'
];

interface GeneralChecklistItem {
  task: string;
  completed: boolean;
  value?: string; // Para campos com opções (guia, trilhos, níveis)
}

const GENERAL_CHECKLIST_ITEMS: GeneralChecklistItem[] = [
  { task: 'Proteção do piso realizada', completed: false },
  { task: 'Condição das paredes verificada', completed: false },
  { task: 'Área de trabalho limpa', completed: false },
  { task: 'Ferramentas organizadas', completed: false },
];

const LEVEL_OPTIONS = [
  { value: '', label: 'Selecione' },
  { value: 'leve', label: 'Leve' },
  { value: 'moderado', label: 'Moderado' },
  { value: 'intenso', label: 'Intenso' },
];

export function TechnicalInspection({
  initialLeaves = [],
  initialGeneralChecklist = GENERAL_CHECKLIST_ITEMS.map(item => ({ ...item })),
  profession = 'vidracaria',
  workOrderId,
  initialSurveyFields = {},
  initialCustomChecklist = [],
  initialSurveyPhotos = [],
  onSave,
}: TechnicalInspectionProps) {
  const [numberOfLeaves, setNumberOfLeaves] = useState(initialLeaves.length || 0);
  const [leaves, setLeaves] = useState<Leaf[]>(initialLeaves);
  const [selectedLeaf, setSelectedLeaf] = useState<number | null>(null);
  const [generalChecklist, setGeneralChecklist] = useState<GeneralChecklistItem[]>(
    initialGeneralChecklist.length > 0 ? initialGeneralChecklist : GENERAL_CHECKLIST_ITEMS.map(item => ({ ...item }))
  );
  
  // Dynamic survey fields
  const surveyFields = getSurveyFields(profession);
  const [surveyFieldValues, setSurveyFieldValues] = useState<Record<string, string>>(() => {
    // Initialize quantidade_folhas from initialLeaves if not set
    const initialFields = { ...initialSurveyFields };
    if (profession === 'vidracaria' && initialLeaves.length > 0 && !initialFields.quantidade_folhas) {
      initialFields.quantidade_folhas = initialLeaves.length.toString();
    }
    return initialFields;
  });
  
  // Custom checklist items
  const [customChecklist, setCustomChecklist] = useState<Array<{ id: string; label: string; value: string }>>(initialCustomChecklist);
  const [showAddCustomItem, setShowAddCustomItem] = useState(false);
  const [newCustomLabel, setNewCustomLabel] = useState('');
  const [newCustomValue, setNewCustomValue] = useState('');
  
  // Survey photos
  const [surveyPhotos, setSurveyPhotos] = useState<string[]>(initialSurveyPhotos);
  const { uploadImage, uploading } = useStorage();

  const handleSetLeaves = () => {
    if (numberOfLeaves <= 0) {
      alert('Digite um número válido de folhas');
      return;
    }

    const newLeaves: Leaf[] = Array.from({ length: numberOfLeaves }, (_, i) => {
      const existing = leaves.find((l) => l.id === i + 1);
      return existing || {
        id: i + 1,
        status: 'perfect',
        defects: [],
      };
    });

    setLeaves(newLeaves);
    // Also update the survey field value for quantidade_folhas
    handleSurveyFieldChange('quantidade_folhas', numberOfLeaves.toString());
  };

  const updateLeafStatus = (leafId: number, status: 'perfect' | 'attention' | 'damaged') => {
    setLeaves(leaves.map((leaf) => (leaf.id === leafId ? { ...leaf, status } : leaf)));
  };

  const toggleDefect = (leafId: number, defect: string) => {
    setLeaves(
      leaves.map((leaf) => {
        if (leaf.id === leafId) {
          const defects = leaf.defects.includes(defect)
            ? leaf.defects.filter((d) => d !== defect)
            : [...leaf.defects, defect];
          return { ...leaf, defects };
        }
        return leaf;
      })
    );
  };

  const handlePhotoUpload = (leafId: number, url: string) => {
    setLeaves(leaves.map((leaf) => (leaf.id === leafId ? { ...leaf, photo: url } : leaf)));
  };

  const updateGeneralChecklistValue = (index: number, value: string) => {
    const updated = [...generalChecklist];
    updated[index].value = value;
    setGeneralChecklist(updated);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'perfect':
        return 'bg-green-100 border-green-500 text-green-700';
      case 'attention':
        return 'bg-yellow-100 border-yellow-500 text-yellow-700';
      case 'damaged':
        return 'bg-red-100 border-red-500 text-red-700';
      default:
        return 'bg-slate-100 border-slate-300 text-slate-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'perfect':
        return <CheckCircle2 className="w-5 h-5" />;
      case 'attention':
        return <AlertCircle className="w-5 h-5" />;
      case 'damaged':
        return <XCircle className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'perfect':
        return 'Perfeito';
      case 'attention':
        return 'Atenção';
      case 'damaged':
        return 'Danificado';
      default:
        return '';
    }
  };

  const getDefectCount = (defect: string) => {
    return leaves.filter((leaf) => leaf.defects.includes(defect)).length;
  };

  const handleSurveyFieldChange = (fieldId: string, value: string) => {
    setSurveyFieldValues({ ...surveyFieldValues, [fieldId]: value });
  };

  const handleAddCustomChecklistItem = () => {
    if (!newCustomLabel.trim()) {
      alert('Digite um rótulo para o item');
      return;
    }
    const newItem = {
      id: Date.now().toString(),
      label: newCustomLabel,
      value: newCustomValue,
    };
    setCustomChecklist([...customChecklist, newItem]);
    setNewCustomLabel('');
    setNewCustomValue('');
    setShowAddCustomItem(false);
  };

  const handleRemoveCustomChecklistItem = (id: string) => {
    setCustomChecklist(customChecklist.filter(item => item.id !== id));
  };

  const handleSurveyPhotoUpload = async (file: File) => {
    if (!workOrderId) {
      alert('Erro: ID da OS não encontrado');
      return;
    }

    try {
      const compressedFile = await compressFile(file);
      const timestamp = Date.now();
      const fileName = `${timestamp}_${compressedFile.name}`;
      const path = `work-orders/${workOrderId}/survey/${fileName}`;
      const url = await uploadImage(compressedFile, path);
      setSurveyPhotos([...surveyPhotos, url]);
    } catch (error) {
      console.error('Error uploading survey photo:', error);
      alert('Erro ao fazer upload da foto');
    }
  };

  const handleRemoveSurveyPhoto = (index: number) => {
    setSurveyPhotos(surveyPhotos.filter((_, i) => i !== index));
  };

  const surveyPhotoInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas imagens');
      return;
    }
    await handleSurveyPhotoUpload(file);
    if (surveyPhotoInputRef.current) {
      surveyPhotoInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    const saveData: any = {
      generalChecklist,
      surveyFields: surveyFieldValues,
      customChecklist: customChecklist.length > 0 ? customChecklist : undefined,
      surveyPhotos: surveyPhotos.length > 0 ? surveyPhotos : undefined,
    };
    
    // Only include leaves for vidracaria profession
    if (profession === 'vidracaria' && leaves.length > 0) {
      saveData.leaves = leaves;
    }
    
    onSave(saveData);
  };

  return (
    <div className="space-y-6">
      {/* Leaf Count Input (only for vidracaria) */}
      {profession === 'vidracaria' && (
        <Card>
          <h2 className="text-xl font-bold text-navy mb-4">Quantidade de Folhas (Lâminas)</h2>
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              value={numberOfLeaves}
              onChange={(e) => setNumberOfLeaves(parseInt(e.target.value) || 0)}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
              placeholder="Digite o número de folhas"
            />
            <Button variant="primary" onClick={handleSetLeaves}>
              Definir
            </Button>
          </div>
        </Card>
      )}

      {/* Leaves Visualization (only for vidracaria) */}
      {profession === 'vidracaria' && leaves.length > 0 && (
        <Card>
          <h2 className="text-xl font-bold text-navy mb-4">Vistoria Técnica - Folhas</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
            {leaves.map((leaf) => (
              <button
                key={leaf.id}
                onClick={() => setSelectedLeaf(leaf.id)}
                className={`p-4 border-2 rounded-lg transition-all hover:scale-105 ${getStatusColor(
                  leaf.status
                )}`}
              >
                <div className="flex items-center justify-center mb-2">
                  {getStatusIcon(leaf.status)}
                </div>
                <p className="font-bold text-center">Folha {leaf.id}</p>
                <p className="text-xs text-center mt-1">{getStatusLabel(leaf.status)}</p>
                {leaf.defects.length > 0 && (
                  <p className="text-xs text-center mt-1 text-red-600">
                    {leaf.defects.length} defeito(s)
                  </p>
                )}
              </button>
            ))}
          </div>

          {/* Leaf Detail Modal */}
          {selectedLeaf !== null && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-navy">Folha {selectedLeaf}</h3>
                  <button
                    onClick={() => setSelectedLeaf(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Status Selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => updateLeafStatus(selectedLeaf, 'perfect')}
                        className={`p-3 rounded-lg border-2 transition-colors ${
                          leaves.find((l) => l.id === selectedLeaf)?.status === 'perfect'
                            ? 'bg-green-100 border-green-500 text-green-700'
                            : 'bg-white border-slate-300 text-slate-700'
                        }`}
                      >
                        <CheckCircle2 className="w-6 h-6 mx-auto mb-1" />
                        <span className="text-xs">Perfeito</span>
                      </button>
                      <button
                        onClick={() => updateLeafStatus(selectedLeaf, 'attention')}
                        className={`p-3 rounded-lg border-2 transition-colors ${
                          leaves.find((l) => l.id === selectedLeaf)?.status === 'attention'
                            ? 'bg-yellow-100 border-yellow-500 text-yellow-700'
                            : 'bg-white border-slate-300 text-slate-700'
                        }`}
                      >
                        <AlertCircle className="w-6 h-6 mx-auto mb-1" />
                        <span className="text-xs">Atenção</span>
                      </button>
                      <button
                        onClick={() => updateLeafStatus(selectedLeaf, 'damaged')}
                        className={`p-3 rounded-lg border-2 transition-colors ${
                          leaves.find((l) => l.id === selectedLeaf)?.status === 'damaged'
                            ? 'bg-red-100 border-red-500 text-red-700'
                            : 'bg-white border-slate-300 text-slate-700'
                        }`}
                      >
                        <XCircle className="w-6 h-6 mx-auto mb-1" />
                        <span className="text-xs">Danificado</span>
                      </button>
                    </div>
                  </div>

                  {/* Defects Selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Defeitos (Selecione múltiplos)
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {DEFECT_OPTIONS.map((defect) => {
                        const leaf = leaves.find((l) => l.id === selectedLeaf);
                        const isSelected = leaf?.defects.includes(defect);
                        return (
                          <button
                            key={defect}
                            onClick={() => toggleDefect(selectedLeaf, defect)}
                            className={`px-3 py-1 rounded-full text-sm transition-colors ${
                              isSelected
                                ? 'bg-navy text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {defect}
                          </button>
                        );
                      })}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Outro defeito (descreva)
                      </label>
                      <input
                        type="text"
                        value={leaves.find((l) => l.id === selectedLeaf)?.customDefect || ''}
                        onChange={(e) => {
                          const updatedLeaves = leaves.map((leaf) =>
                            leaf.id === selectedLeaf
                              ? { ...leaf, customDefect: e.target.value }
                              : leaf
                          );
                          setLeaves(updatedLeaves);
                        }}
                        placeholder="Descreva outro defeito não listado..."
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                      />
                    </div>
                  </div>

                  {/* Photo Upload */}
                  <div>
                    <ImageUpload
                      onUploadComplete={(url) => handlePhotoUpload(selectedLeaf, url)}
                      path={`work-orders/leaves/${selectedLeaf}`}
                      label="Foto da Folha"
                    />
                    {leaves.find((l) => l.id === selectedLeaf)?.photo && (
                      <img
                        src={leaves.find((l) => l.id === selectedLeaf)?.photo}
                        alt={`Folha ${selectedLeaf}`}
                        className="mt-2 w-full h-48 object-cover rounded-lg"
                      />
                    )}
                  </div>
                </div>
              </Card>
            </div>
          )}
        </Card>
      )}

      {/* Dynamic Survey Fields (for non-vidracaria professions or in addition to leaves) */}
      {profession !== 'vidracaria' && surveyFields.length > 0 && (
        <Card>
          <h2 className="text-xl font-bold text-navy mb-4">Vistoria Técnica</h2>
          <div className="space-y-4">
            {surveyFields.map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    value={surveyFieldValues[field.id] || ''}
                    onChange={(e) => handleSurveyFieldChange(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                    rows={4}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                  />
                ) : field.type === 'select' ? (
                  <select
                    value={surveyFieldValues[field.id] || ''}
                    onChange={(e) => handleSurveyFieldChange(field.id, e.target.value)}
                    required={field.required}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                  >
                    <option value="">Selecione...</option>
                    {field.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    value={surveyFieldValues[field.id] || ''}
                    onChange={(e) => handleSurveyFieldChange(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                  />
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Survey Fields for Vidracaria (in addition to leaves) */}
      {profession === 'vidracaria' && surveyFields.length > 0 && (
        <Card>
          <h2 className="text-xl font-bold text-navy mb-4">Informações Adicionais</h2>
          <div className="space-y-4">
            {surveyFields.filter(f => f.id !== 'quantidade_folhas').map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                {field.type === 'select' ? (
                  <select
                    value={surveyFieldValues[field.id] || ''}
                    onChange={(e) => handleSurveyFieldChange(field.id, e.target.value)}
                    required={field.required}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                  >
                    <option value="">Selecione...</option>
                    {field.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    value={surveyFieldValues[field.id] || ''}
                    onChange={(e) => handleSurveyFieldChange(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                  />
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* General Checklist - Apenas Guia e Trilhos (for vidracaria) */}
      {profession === 'vidracaria' && (
        <Card>
          <h2 className="text-xl font-bold text-navy mb-4">Checklist Geral</h2>
        <div className="space-y-4">
          {/* Guia - Quantidade */}
          <div className="p-4 border-2 border-navy rounded-lg bg-navy-50">
            <label className="block text-sm font-medium text-navy mb-2">Quantidade de Guias</label>
            <input
              type="number"
              min="0"
              value={generalChecklist.find(item => item.task === 'Guia')?.value || '0'}
              onChange={(e) => {
                const guiaIndex = generalChecklist.findIndex(item => item.task === 'Guia');
                const value = e.target.value;
                if (guiaIndex === -1) {
                  setGeneralChecklist([...generalChecklist, { task: 'Guia', completed: true, value }]);
                } else {
                  updateGeneralChecklistValue(guiaIndex, value);
                  const updated = [...generalChecklist];
                  updated[guiaIndex].completed = true;
                  setGeneralChecklist(updated);
                }
              }}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy bg-white"
              placeholder="0"
            />
            <p className="text-xs text-slate-600 mt-1">Digite 0 se não houver guias</p>
          </div>

          {/* Trilhos */}
          <div className="p-4 border-2 border-navy rounded-lg bg-navy-50 space-y-3">
            <label className="block text-sm font-medium text-navy mb-2">Trilhos</label>
            
            {/* Amassado */}
            <div>
              <label className="block text-xs text-slate-600 mb-1">Amassado</label>
              <select
                value={generalChecklist.find(item => item.task === 'Trilhos - Amassado')?.value || ''}
                onChange={(e) => {
                  const index = generalChecklist.findIndex(item => item.task === 'Trilhos - Amassado');
                  if (index === -1) {
                    setGeneralChecklist([...generalChecklist, { task: 'Trilhos - Amassado', completed: !!e.target.value, value: e.target.value }]);
                  } else {
                    updateGeneralChecklistValue(index, e.target.value);
                    const updated = [...generalChecklist];
                    updated[index].completed = !!e.target.value;
                    setGeneralChecklist(updated);
                  }
                }}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy bg-white"
              >
                {LEVEL_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Ressecado */}
            <div>
              <label className="block text-xs text-slate-600 mb-1">Ressecado</label>
              <select
                value={generalChecklist.find(item => item.task === 'Trilhos - Ressecado')?.value || ''}
                onChange={(e) => {
                  const index = generalChecklist.findIndex(item => item.task === 'Trilhos - Ressecado');
                  if (index === -1) {
                    setGeneralChecklist([...generalChecklist, { task: 'Trilhos - Ressecado', completed: !!e.target.value, value: e.target.value }]);
                  } else {
                    updateGeneralChecklistValue(index, e.target.value);
                    const updated = [...generalChecklist];
                    updated[index].completed = !!e.target.value;
                    setGeneralChecklist(updated);
                  }
                }}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy bg-white"
              >
                {LEVEL_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Sujo */}
            <div>
              <label className="block text-xs text-slate-600 mb-1">Sujo</label>
              <select
                value={generalChecklist.find(item => item.task === 'Trilhos - Sujo')?.value || ''}
                onChange={(e) => {
                  const index = generalChecklist.findIndex(item => item.task === 'Trilhos - Sujo');
                  if (index === -1) {
                    setGeneralChecklist([...generalChecklist, { task: 'Trilhos - Sujo', completed: !!e.target.value, value: e.target.value }]);
                  } else {
                    updateGeneralChecklistValue(index, e.target.value);
                    const updated = [...generalChecklist];
                    updated[index].completed = !!e.target.value;
                    setGeneralChecklist(updated);
                  }
                }}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy bg-white"
              >
                {LEVEL_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>
      )}

      {/* General Checklist (for non-vidracaria professions) */}
      {profession !== 'vidracaria' && (
        <Card>
          <h2 className="text-xl font-bold text-navy mb-4">Checklist Geral</h2>
          <div className="space-y-3">
            {generalChecklist.map((item, index) => (
              <label key={index} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={(e) => {
                    const updated = [...generalChecklist];
                    updated[index].completed = e.target.checked;
                    setGeneralChecklist(updated);
                  }}
                  className="w-5 h-5 text-navy rounded focus:ring-navy"
                />
                <span className={item.completed ? 'line-through text-slate-500' : 'text-slate-700'}>
                  {item.task}
                </span>
              </label>
            ))}
          </div>
        </Card>
      )}

      {/* Custom Checklist Items */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-navy">Itens Personalizados do Checklist</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddCustomItem(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar Item
          </Button>
        </div>

        {showAddCustomItem && (
          <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="space-y-3">
              <input
                type="text"
                value={newCustomLabel}
                onChange={(e) => setNewCustomLabel(e.target.value)}
                placeholder="Rótulo do item (ex: Estado da Pintura)"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
              />
              <input
                type="text"
                value={newCustomValue}
                onChange={(e) => setNewCustomValue(e.target.value)}
                placeholder="Valor (ex: Bom, Regular, Ruim)"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
              />
              <div className="flex gap-2">
                <Button variant="primary" size="sm" onClick={handleAddCustomChecklistItem}>
                  Adicionar
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                  setShowAddCustomItem(false);
                  setNewCustomLabel('');
                  setNewCustomValue('');
                }}>
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}

        {customChecklist.length > 0 ? (
          <div className="space-y-2">
            {customChecklist.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex-1">
                  <p className="font-medium text-slate-700">{item.label}</p>
                  {item.value && <p className="text-sm text-slate-600">{item.value}</p>}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveCustomChecklistItem(item.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-slate-500 py-4">Nenhum item personalizado adicionado</p>
        )}
      </Card>

      {/* Survey Photos */}
      <Card>
        <h2 className="text-xl font-bold text-navy mb-4">Fotos da Vistoria</h2>
        <div className="space-y-4">
          <div>
            <input
              ref={surveyPhotoInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="survey-photo-upload"
            />
            <label
              htmlFor="survey-photo-upload"
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <Camera className="w-5 h-5" />
              {uploading ? 'Enviando...' : 'Adicionar Foto'}
            </label>
            <p className="text-xs text-slate-500 mt-2">
              Adicione fotos como evidência da vistoria técnica
            </p>
          </div>

          {surveyPhotos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {surveyPhotos.map((photoUrl, index) => (
                <div key={index} className="relative group">
                  <img
                    src={photoUrl}
                    alt={`Foto vistoria ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-slate-200"
                  />
                  <button
                    onClick={() => handleRemoveSurveyPhoto(index)}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Defect Summary (only for vidracaria) */}
      {profession === 'vidracaria' && leaves.length > 0 && (
        <Card>
          <h2 className="text-xl font-bold text-navy mb-4">Resumo de Defeitos</h2>
          <div className="space-y-2">
            {DEFECT_OPTIONS.map((defect) => {
              const count = getDefectCount(defect);
              if (count === 0) return null;
              return (
                <div key={defect} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <span className="font-medium text-red-700">{defect}</span>
                  <span className="text-red-600 font-bold">{count} folha(s)</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button variant="primary" size="lg" onClick={handleSave}>
          Salvar Vistoria
        </Button>
      </div>
    </div>
  );
}

