import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, addDoc, collection, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { X, Plus, Copy, ExternalLink, FileText, ClipboardCheck, Trash2, Edit, Calendar, Clock, User } from 'lucide-react';
import { ImageUpload } from '../components/ImageUpload';
import { TechnicalInspection } from '../components/TechnicalInspection';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { useCompany } from '../hooks/useCompany';
import { useAuth } from '../contexts/AuthContext';
import { CurrencyInput } from '../components/ui/CurrencyInput';
import { ServiceSelectorModal } from '../components/ServiceSelectorModal';

interface ManualService {
  id: string;
  description: string;
  price?: number;
}

interface WorkOrder {
  id: string;
  quoteId: string;
  clientName: string;
  scheduledDate: string;
  scheduledTime?: string;
  technician: string;
  status: 'scheduled' | 'in-progress' | 'completed';
  checklist: { task: string; completed: boolean }[];
  notes: string;
  photos?: string[];
  feedbackLink?: string;
  technicalInspection?: {
    leaves?: any[];
    generalChecklist: { task: string; completed: boolean; value?: string }[];
    surveyFields?: Record<string, string>;
    customChecklist?: Array<{ id: string; label: string; value: string }>;
    surveyPhotos?: string[];
  };
  clientPhone?: string;
  hasRisk?: boolean;
  manualServices?: ManualService[];
  totalPrice?: number;
}

export function WorkOrderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { company } = useCompany();
  const { userMetadata } = useAuth();
  const companyId = userMetadata?.companyId;
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'inspection' | 'photos'>('info');
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptAmount, setReceiptAmount] = useState(0);
  const [clientPhone, setClientPhone] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [hasRisk, setHasRisk] = useState(false);
  const [manualServices, setManualServices] = useState<ManualService[]>([]);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [showServiceSelectorModal, setShowServiceSelectorModal] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [newService, setNewService] = useState({ description: '', price: 0 });
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [selectedTechnicianId, setSelectedTechnicianId] = useState('');
  const [technicians, setTechnicians] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [loadingTechnicians, setLoadingTechnicians] = useState(false);

  useEffect(() => {
    if (id) {
      loadWorkOrder();
    }
  }, [id]);

  const handleSelectServiceFromModal = async (itemData: {
    serviceId: string;
    serviceName: string;
    quantity: number;
    unitPrice: number;
    total: number;
    isCustom?: boolean;
    pricingMethod?: 'm2' | 'linear' | 'fixed' | 'unit';
    dimensions?: {
      width: number;
      height: number;
      area?: number;
    };
    glassThickness?: string;
    profileColor?: string;
    isInstallation?: boolean;
  }) => {
    if (!id) {
      alert('Erro: ID da OS não encontrado');
      return;
    }

    try {
      // Convert ServiceSelectorModal output to ManualService format
      const serviceDescription = itemData.dimensions 
        ? `${itemData.serviceName} - ${itemData.dimensions.width}m x ${itemData.dimensions.height}m${itemData.glassThickness ? ` - Vidro ${itemData.glassThickness}` : ''}${itemData.profileColor ? ` - Perfil ${itemData.profileColor}` : ''} (Qtd: ${itemData.quantity})`
        : itemData.quantity > 1
        ? `${itemData.serviceName} (Qtd: ${itemData.quantity})`
        : itemData.serviceName;

      const service: ManualService = {
        id: Date.now().toString(),
        description: serviceDescription,
      };
      
      // Only include price if it's greater than 0
      if (itemData.total > 0) {
        service.price = itemData.total;
      }

      const updated = [...manualServices, service];
      setManualServices(updated);

      // Remove undefined values before saving
      const cleanedServices = updated.map(s => {
        const cleaned: any = {
          id: s.id,
          description: s.description,
        };
        if (s.price !== undefined && s.price > 0) {
          cleaned.price = s.price;
        }
        return cleaned;
      });

      await updateDoc(doc(db, 'workOrders', id), {
        manualServices: cleanedServices,
      });

      setShowServiceSelectorModal(false);
    } catch (error: any) {
      console.error('Error adding service:', error);
      alert(`Erro ao adicionar serviço: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const loadWorkOrder = async () => {
    try {
      if (!id) {
        setLoading(false);
        return;
      }

      const docRef = doc(db, 'workOrders', id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setLoading(false);
        return;
      }

      const data = docSnap.data();
      const workOrderData = {
        id: docSnap.id,
        ...data,
        technicalInspection: data.technicalInspection ? {
          ...data.technicalInspection,
          surveyFields: data.technicalInspection.surveyFields || {},
          customChecklist: data.technicalInspection.customChecklist || [],
          surveyPhotos: data.technicalInspection.surveyPhotos || [],
        } : undefined,
      } as WorkOrder;
      
      setWorkOrder(workOrderData);
      setNotes(data.notes || '');
      setClientPhone(data.clientPhone || '');
      setManualServices(data.manualServices || []);
      setTotalPrice(data.totalPrice || 0);
      setScheduledTime(data.scheduledTime || '');
      setHasRisk(data.hasRisk || false);

      // Load client phone from quote if not in workOrder
      if (!data.clientPhone && data.quoteId) {
        const quoteDoc = await getDoc(doc(db, 'quotes', data.quoteId));
        if (quoteDoc.exists()) {
          const quoteData = quoteDoc.data();
          if (quoteData.clientId) {
            const clientDoc = await getDoc(doc(db, 'clients', quoteData.clientId));
            if (clientDoc.exists()) {
              setClientPhone(clientDoc.data().phone || '');
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading work order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (url: string) => {
    if (!id || !workOrder) return;

    const updatedPhotos = [...(workOrder.photos || []), url];
    
    setSaving(true);
    try {
      await updateDoc(doc(db, 'workOrders', id), {
        photos: updatedPhotos,
      });
      setWorkOrder({ ...workOrder, photos: updatedPhotos });
    } catch (error) {
      console.error('Error adding photo:', error);
      alert('Erro ao adicionar foto');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveInspection = async (data: {
    leaves?: any[];
    generalChecklist: { task: string; completed: boolean; value?: string }[];
    surveyFields?: Record<string, string>;
    customChecklist?: Array<{ id: string; label: string; value: string }>;
    surveyPhotos?: string[];
  }) => {
    if (!id || !workOrder) return;

    setSaving(true);
    try {
      const updateData: any = {
        technicalInspection: {
          ...(workOrder.technicalInspection || {}),
          generalChecklist: data.generalChecklist,
          ...(data.leaves && { leaves: data.leaves }),
          ...(data.surveyFields && { surveyFields: data.surveyFields }),
          ...(data.customChecklist && { customChecklist: data.customChecklist }),
          ...(data.surveyPhotos && { surveyPhotos: data.surveyPhotos }),
        },
      };

      await updateDoc(doc(db, 'workOrders', id), updateData);
      setWorkOrder({ 
        ...workOrder, 
        technicalInspection: {
          ...(workOrder.technicalInspection || {}),
          ...updateData.technicalInspection,
        },
      });
      alert('Vistoria salva com sucesso!');
    } catch (error) {
      console.error('Error saving inspection:', error);
      alert('Erro ao salvar vistoria');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateReceipt = async () => {
    if (!id || !workOrder || receiptAmount <= 0) {
      alert('Digite um valor válido');
      return;
    }

    try {
      // Get quote data
      let quoteData: any = null;
      if (workOrder.quoteId) {
        const quoteDoc = await getDoc(doc(db, 'quotes', workOrder.quoteId));
        if (quoteDoc.exists()) {
          quoteData = quoteDoc.data();
        }
      }

      // Get companyId from workOrder or quote
      const receiptCompanyId = (workOrder as any).companyId || quoteData?.companyId;
      if (!receiptCompanyId) {
        alert('Erro: companyId não encontrado. Não é possível criar o recibo.');
        return;
      }

      const receiptData = {
        workOrderId: id,
        clientName: workOrder.clientName,
        amount: receiptAmount,
        paymentDate: new Date(),
        items: quoteData?.items || [],
        manualServices: manualServices,
        manualServicesTotal: totalPrice,
        notes: workOrder.notes || '',
        photos: workOrder.photos || [],
        hasRisk: workOrder.hasRisk || false,
        scheduledTime: workOrder.scheduledTime || '',
        companyId: receiptCompanyId,
        createdAt: new Date(),
      };

      const receiptRef = await addDoc(collection(db, 'receipts'), receiptData);
      const receiptLink = `${window.location.origin}/p/receipt/${receiptRef.id}`;

      // Update workOrder with receipt link
      await updateDoc(doc(db, 'workOrders', id), {
        receiptLink,
      });

      setShowReceiptModal(false);
      alert('Recibo gerado com sucesso!');
      window.open(receiptLink, '_blank');
    } catch (error) {
      console.error('Error generating receipt:', error);
      alert('Erro ao gerar recibo');
    }
  };


  const handleDeleteWorkOrder = async () => {
    if (!id || !workOrder) return;

    if (!confirm(`Tem certeza que deseja excluir a ordem de serviço de ${workOrder.clientName}? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'workOrders', id));
      alert('Ordem de serviço excluída com sucesso!');
      navigate('/work-orders');
    } catch (error) {
      console.error('Error deleting work order:', error);
      alert('Erro ao excluir ordem de serviço');
    }
  };

  const handleRemovePhoto = async (index: number) => {
    if (!id || !workOrder || !workOrder.photos) return;

    const updatedPhotos = workOrder.photos.filter((_, i) => i !== index);
    
    setSaving(true);
    try {
      await updateDoc(doc(db, 'workOrders', id), {
        photos: updatedPhotos,
      });
      setWorkOrder({ ...workOrder, photos: updatedPhotos });
    } catch (error) {
      console.error('Error removing photo:', error);
      alert('Erro ao remover foto');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!id) return;

    setSaving(true);
    try {
      await updateDoc(doc(db, 'workOrders', id), {
        notes,
      });
      if (workOrder) {
        setWorkOrder({ ...workOrder, notes });
      }
      alert('Observações salvas com sucesso!');
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Erro ao salvar observações');
    } finally {
      setSaving(false);
    }
  };

  // Removido handleToggleChecklist - checklist removido da parte de informações

  const handleStatusChange = async (newStatus: 'scheduled' | 'in-progress' | 'completed') => {
    if (!id || !workOrder) return;

    if (newStatus === 'completed' && !workOrder.feedbackLink) {
      // Generate feedback link when completing
      const baseUrl = window.location.origin;
      const feedbackLink = `${baseUrl}/feedback/${id}`;
      
      setSaving(true);
      try {
        await updateDoc(doc(db, 'workOrders', id), {
          status: newStatus,
          feedbackLink,
          completedDate: new Date(),
        });
        setWorkOrder({ ...workOrder, status: newStatus, feedbackLink });
        alert('Ordem de serviço concluída! Link de feedback gerado.');
      } catch (error) {
        console.error('Error updating status:', error);
        alert('Erro ao atualizar status');
      } finally {
        setSaving(false);
      }
    } else {
      setSaving(true);
      try {
        await updateDoc(doc(db, 'workOrders', id), {
          status: newStatus,
        });
        setWorkOrder({ ...workOrder, status: newStatus });
      } catch (error) {
        console.error('Error updating status:', error);
        alert('Erro ao atualizar status');
      } finally {
        setSaving(false);
      }
    }
  };

  const copyFeedbackLink = () => {
    if (!workOrder?.feedbackLink) return;
    navigator.clipboard.writeText(workOrder.feedbackLink);
    alert('Link copiado para a área de transferência!');
  };

  const statusLabels = {
    scheduled: 'Agendado',
    'in-progress': 'Em Andamento',
    completed: 'Concluído',
  };

  const statusColors = {
    scheduled: 'bg-blue-100 text-blue-700',
    'in-progress': 'bg-yellow-100 text-yellow-700',
    completed: 'bg-green-100 text-green-700',
  };

  if (loading) {
    return (
      <Layout>
        <Card>
          <p className="text-center text-slate-600 py-8">Carregando...</p>
        </Card>
      </Layout>
    );
  }

  if (!workOrder) {
    return (
      <Layout>
        <Card>
          <p className="text-center text-slate-600 py-8">Ordem de serviço não encontrada</p>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <button
              onClick={() => navigate('/work-orders')}
              className="text-slate-600 hover:text-navy mb-2"
            >
              ← Voltar
            </button>
            <h1 className="text-3xl font-bold text-navy">Ordem de Serviço</h1>
            <p className="text-slate-600 mt-1">{workOrder.clientName}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${statusColors[workOrder.status]}`}>
              {statusLabels[workOrder.status]}
            </span>
          </div>
        </div>

        {/* Status Actions */}
        <Card>
          <h2 className="text-xl font-bold text-navy mb-4">Alterar Status</h2>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={workOrder.status === 'scheduled' ? 'primary' : 'outline'}
              onClick={() => handleStatusChange('scheduled')}
              disabled={saving}
            >
              Agendado
            </Button>
            <Button
              variant={workOrder.status === 'in-progress' ? 'primary' : 'outline'}
              onClick={() => handleStatusChange('in-progress')}
              disabled={saving}
            >
              Em Andamento
            </Button>
            <Button
              variant={workOrder.status === 'completed' ? 'primary' : 'outline'}
              onClick={() => handleStatusChange('completed')}
              disabled={saving}
            >
              Concluído
            </Button>
          </div>
        </Card>

        {/* Feedback Link */}
        {workOrder.status === 'completed' && workOrder.feedbackLink && (
          <Card>
            <h2 className="text-xl font-bold text-navy mb-4">Link de Feedback</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={workOrder.feedbackLink}
                readOnly
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg bg-slate-50"
              />
              <Button variant="outline" onClick={copyFeedbackLink}>
                <Copy className="w-4 h-4 mr-2" />
                Copiar
              </Button>
              <Button
                variant="secondary"
                onClick={() => window.open(workOrder.feedbackLink, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir
              </Button>
            </div>
            <p className="text-sm text-slate-600 mt-2">
              Compartilhe este link com o cliente para coletar feedback sobre o serviço.
            </p>
          </Card>
        )}

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <h2 className="text-xl font-bold text-navy mb-4">Informações</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-600">Cliente</p>
                <p className="font-medium text-navy">{workOrder.clientName}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Data e Hora Agendada</p>
                <p className="font-medium text-navy">
                  {new Date(workOrder.scheduledDate).toLocaleDateString('pt-BR')}
                  {scheduledTime && ` às ${scheduledTime}`}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Horário
                </label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => {
                    setScheduledTime(e.target.value);
                    if (id && workOrder) {
                      updateDoc(doc(db, 'workOrders', id), {
                        scheduledTime: e.target.value,
                      });
                    }
                  }}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                  required={workOrder.status === 'scheduled'}
                />
              </div>
              <div>
                <p className="text-sm text-slate-600">Técnico</p>
                <p className="font-medium text-navy">{workOrder.technician || 'Não atribuído'}</p>
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasRisk}
                    onChange={(e) => {
                      setHasRisk(e.target.checked);
                      if (id && workOrder) {
                        updateDoc(doc(db, 'workOrders', id), {
                          hasRisk: e.target.checked,
                        });
                      }
                    }}
                    className="w-5 h-5 text-red-600 focus:ring-red-500 border-slate-300 rounded"
                  />
                  <span className="text-sm font-medium text-red-600">
                    ⚠️ Sistema com Risco / Vidro Descolado
                  </span>
                </label>
                {hasRisk && (
                  <p className="text-xs text-red-600 mt-1">
                    Aviso de risco será incluído no PDF e na aprovação do cliente.
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Manual Services */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-navy">Serviços</h2>
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowServiceSelectorModal(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar do Catálogo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddServiceModal(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Serviço Manual
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              {manualServices.length > 0 ? (
                <>
                  {manualServices.map((service) => (
                    <div key={service.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-navy">{service.description}</p>
                        {service.price !== undefined && service.price > 0 && (
                          <p className="text-sm text-slate-600">
                            R$ {service.price.toFixed(2).replace('.', ',')}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingServiceId(service.id);
                            setNewService({
                              description: service.description,
                              price: service.price || 0,
                            });
                            setShowAddServiceModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-700 p-1"
                          title="Editar serviço"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async () => {
                            const updated = manualServices.filter(s => s.id !== service.id);
                            setManualServices(updated);
                            if (id) {
                              await updateDoc(doc(db, 'workOrders', id), {
                                manualServices: updated,
                              });
                            }
                          }}
                          className="text-red-600 hover:text-red-700 p-1"
                          title="Excluir serviço"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">
                  Nenhum serviço adicionado
                </p>
              )}
              
              <div className="pt-3 border-t border-slate-200">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Total (R$)
                </label>
                <CurrencyInput
                  value={totalPrice}
                  onChange={async (value) => {
                    setTotalPrice(value);
                    if (id) {
                      await updateDoc(doc(db, 'workOrders', id), {
                        totalPrice: value,
                      });
                    }
                  }}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                  placeholder="0,00"
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'info'
                  ? 'border-b-2 border-navy text-navy'
                  : 'text-slate-600 hover:text-navy'
              }`}
            >
              <FileText className="w-5 h-5 inline mr-2" />
              Informações
            </button>
            <button
              onClick={() => setActiveTab('inspection')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'inspection'
                  ? 'border-b-2 border-navy text-navy'
                  : 'text-slate-600 hover:text-navy'
              }`}
            >
              <ClipboardCheck className="w-5 h-5 inline mr-2" />
              Vistoria Técnica
            </button>
            <button
              onClick={() => setActiveTab('photos')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'photos'
                  ? 'border-b-2 border-navy text-navy'
                  : 'text-slate-600 hover:text-navy'
              }`}
            >
              <Plus className="w-5 h-5 inline mr-2" />
              Fotos
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'info' && (
          <>
            {/* WhatsApp Button - Share OS with approval link */}
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-navy mb-2">Compartilhar OS</h2>
                  <p className="text-sm text-slate-600">
                    Envie o link da ordem de serviço e aprovação para o cliente via WhatsApp
                  </p>
                </div>
                <WhatsAppButton
                  phoneNumber={clientPhone}
                  clientName={workOrder.clientName}
                  docType="OS"
                  docLink={`${window.location.origin}/p/os/${id}`}
                  googleReviewUrl={(company as any)?.googleReviewUrl}
                />
              </div>
            </Card>

            {/* Generate Receipt */}
            {workOrder.status === 'completed' && (
              <Card>
                <h2 className="text-xl font-bold text-navy mb-4">Gerar Recibo</h2>
                <Button
                  variant="secondary"
                  onClick={() => setShowReceiptModal(true)}
                  className="flex items-center gap-2"
                >
                  <FileText className="w-5 h-5" />
                  Gerar Recibo
                </Button>
              </Card>
            )}

            {/* Delete Work Order */}
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-red-600 mb-2">Zona de Perigo</h2>
                  <p className="text-sm text-slate-600">
                    Excluir permanentemente esta ordem de serviço
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleDeleteWorkOrder}
                  className="flex items-center gap-2 border-red-600 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-5 h-5" />
                  Excluir OS
                </Button>
              </div>
            </Card>
          </>
        )}

        {activeTab === 'inspection' && (
          <TechnicalInspection
            initialLeaves={workOrder.technicalInspection?.leaves || []}
            initialGeneralChecklist={workOrder.technicalInspection?.generalChecklist || []}
            profession={(company as any)?.profession || (company as any)?.segment || 'vidracaria'}
            workOrderId={id}
            initialSurveyFields={workOrder.technicalInspection?.surveyFields || {}}
            initialCustomChecklist={workOrder.technicalInspection?.customChecklist || []}
            initialSurveyPhotos={workOrder.technicalInspection?.surveyPhotos || []}
            onSave={handleSaveInspection}
          />
        )}

        {activeTab === 'photos' && (
          <Card>
            <h2 className="text-xl font-bold text-navy mb-4">Relatório Fotográfico</h2>
            
            {/* Image Upload */}
            <div className="mb-6">
              <ImageUpload
                onUploadComplete={handlePhotoUpload}
                path={`work-orders/${id}/photos`}
                label="Adicionar Foto"
              />
            </div>

            {/* Photos Grid */}
            {workOrder.photos && workOrder.photos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {workOrder.photos.map((photoUrl, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photoUrl}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg border border-slate-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Imagem+Inválida';
                      }}
                    />
                    <button
                      onClick={() => handleRemovePhoto(index)}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-600">
                <p>Nenhuma foto adicionada ainda.</p>
                <p className="text-sm mt-2">Adicione fotos do serviço realizado acima.</p>
              </div>
            )}
          </Card>
        )}

        {/* Notes */}
        <Card>
          <h2 className="text-xl font-bold text-navy mb-4">Observações Técnicas</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={6}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy resize-none"
            placeholder="Adicione observações sobre o serviço realizado..."
          />
          <div className="mt-4 flex justify-end">
            <Button variant="primary" onClick={handleSaveNotes} disabled={saving}>
              Salvar Observações
            </Button>
          </div>
        </Card>

        {/* Service Selector Modal */}
        <ServiceSelectorModal
          isOpen={showServiceSelectorModal}
          onClose={() => setShowServiceSelectorModal(false)}
          onSelectService={handleSelectServiceFromModal}
          companyId={companyId}
        />

        {/* Add/Edit Service Modal (for manual entry) */}
        {showAddServiceModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-navy">
                  {editingServiceId ? 'Editar Serviço' : 'Adicionar Serviço'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddServiceModal(false);
                    setEditingServiceId(null);
                    setNewService({ description: '', price: 0 });
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Descrição do Serviço *
                  </label>
                  <input
                    type="text"
                    value={newService.description}
                    onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                    placeholder="Ex: Troca de roldanas, Limpeza, etc."
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Preço (R$) - Opcional
                  </label>
                  <CurrencyInput
                    value={newService.price}
                    onChange={(value) => setNewService({ ...newService, price: value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                    placeholder="0,00"
                  />
                </div>
                <div className="flex gap-4">
                  <Button
                    variant="primary"
                    onClick={async () => {
                      if (!newService.description.trim()) {
                        alert('Digite a descrição do serviço');
                        return;
                      }

                      if (!id) {
                        alert('Erro: ID da OS não encontrado');
                        return;
                      }
                      
                      try {
                        if (editingServiceId) {
                          // Edit existing service
                          const updated = manualServices.map(s => {
                            if (s.id === editingServiceId) {
                              const updatedService: ManualService = {
                                id: s.id,
                                description: newService.description,
                              };
                              // Only include price if it's greater than 0
                              if (newService.price > 0) {
                                updatedService.price = newService.price;
                              }
                              return updatedService;
                            }
                            return s;
                          });
                          setManualServices(updated);
                          // Remove undefined values before saving
                          const cleanedServices = updated.map(s => {
                            const cleaned: any = {
                              id: s.id,
                              description: s.description,
                            };
                            if (s.price !== undefined && s.price > 0) {
                              cleaned.price = s.price;
                            }
                            return cleaned;
                          });
                          await updateDoc(doc(db, 'workOrders', id), {
                            manualServices: cleanedServices,
                          });
                        } else {
                          // Add new service
                          const service: ManualService = {
                            id: Date.now().toString(),
                            description: newService.description,
                          };
                          // Only include price if it's greater than 0
                          if (newService.price > 0) {
                            service.price = newService.price;
                          }
                          const updated = [...manualServices, service];
                          setManualServices(updated);
                          // Remove undefined values before saving
                          const cleanedServices = updated.map(s => {
                            const cleaned: any = {
                              id: s.id,
                              description: s.description,
                            };
                            if (s.price !== undefined && s.price > 0) {
                              cleaned.price = s.price;
                            }
                            return cleaned;
                          });
                          await updateDoc(doc(db, 'workOrders', id), {
                            manualServices: cleanedServices,
                          });
                        }
                        
                        // Close modal automatically on success
                        setShowAddServiceModal(false);
                        setEditingServiceId(null);
                        setNewService({ description: '', price: 0 });
                      } catch (error: any) {
                        console.error('Error saving service:', error);
                        alert(`Erro ao salvar serviço: ${error.message || 'Erro desconhecido'}\n\nVerifique o console para mais detalhes.`);
                        // Don't close modal on error so user can retry
                      }
                    }}
                    className="flex-1"
                  >
                    {editingServiceId ? 'Salvar' : 'Adicionar'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddServiceModal(false);
                      setEditingServiceId(null);
                      setNewService({ description: '', price: 0 });
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Receipt Modal */}
        {showReceiptModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-navy">Gerar Recibo</h2>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Valor do Recibo (R$)
                  </label>
                  <CurrencyInput
                    value={receiptAmount}
                    onChange={(value) => setReceiptAmount(value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                    placeholder="0,00"
                  />
                </div>
                <div className="flex gap-4">
                  <Button variant="primary" onClick={handleGenerateReceipt} className="flex-1">
                    Gerar Recibo
                  </Button>
                  <Button variant="outline" onClick={() => setShowReceiptModal(false)} className="flex-1">
                    Cancelar
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-navy flex items-center gap-2">
                <Calendar className="w-6 h-6" />
                Agendar Execução
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setShowScheduleModal(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Data
                </label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Horário
                </label>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Técnico
                </label>
                {loadingTechnicians ? (
                  <p className="text-sm text-slate-500 py-2">Carregando técnicos...</p>
                ) : (
                  <select
                    value={selectedTechnicianId}
                    onChange={(e) => setSelectedTechnicianId(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                  >
                    <option value="">Selecione um técnico (opcional)</option>
                    {technicians.map((tech) => (
                      <option key={tech.id} value={tech.id}>
                        {tech.name} ({tech.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowScheduleModal(false)}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleScheduleSubmit}
                  disabled={saving || !scheduleDate}
                >
                  {saving ? 'Salvando...' : 'Salvar Agendamento'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </Layout>
  );
}

