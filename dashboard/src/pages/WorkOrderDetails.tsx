import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { doc, getDoc, updateDoc, addDoc, collection, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { X, Plus, Copy, ExternalLink, FileText, ClipboardCheck, Trash2, Edit, Calendar, Clock, User, Eye, Camera, Image as ImageIcon, MoreVertical } from 'lucide-react';
import { TechnicalInspection } from '../components/TechnicalInspection';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { useCompany } from '../hooks/useCompany';
import { useAuth } from '../contexts/AuthContext';
import { useStorage } from '../hooks/useStorage';
import { compressFile } from '../utils/compressImage';
import { CurrencyInput } from '../components/ui/CurrencyInput';
import { ServiceSelectorModal } from '../components/ServiceSelectorModal';
import { LibrarySelectorModal } from '../components/LibrarySelectorModal';
import { pdf } from '@react-pdf/renderer';
import { ReceiptPDF } from '../components/ReceiptPDF';
import { roundCurrency } from '../lib/utils';

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
    customChecklist?: Array<{ id: string; label: string; value: string; imageUrl?: string }>;
    surveyPhotos?: string[];
  };
  clientPhone?: string;
  hasRisk?: boolean;
  manualServices?: ManualService[];
  totalPrice?: number;
  clientAccepted?: boolean;
  acceptedAt?: any;
  clientIp?: string;
  deviceInfo?: string;
  signatureImage?: string;
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
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const { uploadImage, uploading: uploadingPhoto } = useStorage();

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
      // Recalculate total
      const newTotal = updated.reduce((sum, s) => {
        const price = typeof s.price === 'number' ? s.price : parseFloat(String(s.price || 0).replace(',', '.'));
        return sum + (isNaN(price) ? 0 : price);
      }, 0);
      setTotalPrice(roundCurrency(newTotal));

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

  // Load technicians when modal opens
  useEffect(() => {
    if (showScheduleModal && companyId) {
      loadTechnicians();
    }
  }, [showScheduleModal, companyId]);

  const loadTechnicians = async () => {
    if (!companyId) return;
    setLoadingTechnicians(true);
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('companyId', '==', companyId)
      );
      const snapshot = await getDocs(usersQuery);
      const techs = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || '',
        email: doc.data().email || ''
      }));
      setTechnicians(techs);
    } catch (error) {
      console.error('Error loading technicians:', error);
    } finally {
      setLoadingTechnicians(false);
    }
  };

  const handleScheduleSubmit = async () => {
    if (!id || !scheduleDate) return;
    setSaving(true);
    try {
      const updateData: any = {
        scheduledDate: scheduleDate,
      };
      if (scheduleTime) {
        updateData.scheduledTime = scheduleTime;
      }
      if (selectedTechnicianId) {
        updateData.technicianId = selectedTechnicianId;
      }
      await updateDoc(doc(db, 'workOrders', id), updateData);
      setShowScheduleModal(false);
      await loadWorkOrder();
      alert('Agendamento salvo com sucesso!');
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Erro ao salvar agendamento');
    } finally {
      setSaving(false);
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

  const handlePhotoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas imagens');
      return;
    }

    if (!id) return;

    try {
      const compressedFile = await compressFile(file);
      const timestamp = Date.now();
      const fileName = `${timestamp}_${compressedFile.name}`;
      const path = `work-orders/${id}/photos/${fileName}`;
      
      const url = await uploadImage(compressedFile, path);
      await handlePhotoUpload(url);
      
      // Reset inputs
      if (cameraInputRef.current) {
        cameraInputRef.current.value = '';
      }
      if (galleryInputRef.current) {
        galleryInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Erro ao fazer upload da foto');
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

  const handleGeneratePdfPreview = async () => {
    if (!id || !workOrder || !company) return;

    try {
      // Get quote data for items
      let quoteData: any = null;
      if (workOrder.quoteId) {
        const quoteDoc = await getDoc(doc(db, 'quotes', workOrder.quoteId));
        if (quoteDoc.exists()) {
          quoteData = quoteDoc.data();
        }
      }

      // Prepare receipt data for PDF
      const receiptItems = (quoteData?.items || []).map((item: any) => ({
        serviceName: item.name || item.title || 'Serviço',
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || item.price || 0,
        total: item.total || 0,
      }));

      // Add manual services
      const manualServicesItems = (manualServices || []).map((service) => ({
        serviceName: service.description,
        quantity: 1,
        unitPrice: service.price || 0,
        total: service.price || 0,
      }));

      const allItems = [...receiptItems, ...manualServicesItems];
      const totalAmount = allItems.reduce((sum, item) => sum + item.total, 0) || totalPrice || 0;

      // Generate PDF
      const pdfDoc = (
        <ReceiptPDF
          clientName={workOrder.clientName}
          workOrderId={id || ''}
          scheduledDate={workOrder.scheduledDate || ''}
          scheduledTime={workOrder.scheduledTime}
          completedDate={new Date().toISOString().split('T')[0]}
          technician={workOrder.technician || 'Não atribuído'}
          checklist={workOrder.technicalInspection?.customChecklist?.map((item: any) => ({
            task: item.label,
            completed: item.value === 'ok' || item.value === 'sim',
          })) || []}
          notes={notes || workOrder.notes || ''}
          items={allItems}
          total={totalAmount}
          warranty={quoteData?.warranty || ''}
          photos={workOrder.photos || []}
          hasRisk={workOrder.hasRisk || false}
          companyData={{
            name: company.name || '',
            address: company.address || '',
            phone: company.phone || '',
            email: company.email,
            logoUrl: company.logoUrl,
            cnpj: company.cnpj,
          }}
          manualServices={manualServices}
          manualServicesTotal={totalPrice}
          clientAccepted={workOrder.clientAccepted}
          acceptedAt={workOrder.acceptedAt}
          signatureImage={workOrder.signatureImage}
          deviceInfo={workOrder.deviceInfo}
          clientIp={workOrder.clientIp}
        />
      );

      const blob = await pdf(pdfDoc).toBlob();
      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);
      setShowPdfPreview(true);
      // Open PDF in new tab
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error generating PDF preview:', error);
      alert('Erro ao gerar preview do PDF');
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
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[workOrder.status]}`}>
              {statusLabels[workOrder.status]}
            </span>
            {/* Dropdown Menu */}
            <div className="relative">
              <button
                className="p-2 text-slate-600 hover:text-navy hover:bg-slate-100 rounded-lg transition-colors"
                onClick={(e) => {
                  const menu = e.currentTarget.nextElementSibling as HTMLElement;
                  if (menu) {
                    menu.classList.toggle('hidden');
                  }
                }}
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              <div className="hidden absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-10">
                <button
                  onClick={async () => {
                    const menu = document.querySelector('.relative button + div');
                    if (menu) menu.classList.add('hidden');
                    await handleDeleteWorkOrder();
                  }}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir OS
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Status Actions - Segmented Control */}
        <Card>
          <h2 className="text-xl font-bold text-navy mb-4">Alterar Status</h2>
          <div className="inline-flex rounded-lg border border-slate-300 bg-slate-50 p-1">
            <button
              onClick={() => handleStatusChange('scheduled')}
              disabled={saving}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                workOrder.status === 'scheduled'
                  ? 'bg-white text-navy shadow-sm'
                  : 'text-slate-600 hover:text-navy'
              }`}
            >
              Agendado
            </button>
            <button
              onClick={() => handleStatusChange('in-progress')}
              disabled={saving}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                workOrder.status === 'in-progress'
                  ? 'bg-white text-navy shadow-sm'
                  : 'text-slate-600 hover:text-navy'
              }`}
            >
              Em Andamento
            </button>
            <button
              onClick={() => handleStatusChange('completed')}
              disabled={saving}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                workOrder.status === 'completed'
                  ? 'bg-white text-navy shadow-sm'
                  : 'text-slate-600 hover:text-navy'
              }`}
            >
              Concluído
            </button>
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
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Data Agendada
                </label>
                <input
                  type="date"
                  value={workOrder.scheduledDate ? new Date(workOrder.scheduledDate).toISOString().split('T')[0] : ''}
                  onChange={async (e) => {
                    if (id && workOrder) {
                      const newDate = e.target.value;
                      await updateDoc(doc(db, 'workOrders', id), {
                        scheduledDate: newDate,
                      });
                      setWorkOrder({ ...workOrder, scheduledDate: newDate });
                    }
                  }}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                />
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
                          className="text-slate-500 hover:text-slate-700 p-1.5 transition-colors"
                          title="Editar serviço"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async () => {
                            const updated = manualServices.filter(s => s.id !== service.id);
                            setManualServices(updated);
                            // Recalculate total
                            const newTotal = updated.reduce((sum, s) => {
                              const price = typeof s.price === 'number' ? s.price : parseFloat(String(s.price || 0).replace(',', '.'));
                              return sum + (isNaN(price) ? 0 : price);
                            }, 0);
                            setTotalPrice(roundCurrency(newTotal));
                            if (id) {
                              await updateDoc(doc(db, 'workOrders', id), {
                                manualServices: updated,
                                totalPrice: roundCurrency(newTotal),
                              });
                            }
                          }}
                          className="text-slate-500 hover:text-slate-700 p-1.5 transition-colors"
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
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Total (R$)
                  </label>
                  {manualServices.length > 0 && (
                    <span className="text-sm text-slate-600">
                      Calculado: {manualServices.reduce((sum, s) => {
                        const price = typeof s.price === 'number' ? s.price : parseFloat(String(s.price || 0).replace(',', '.'));
                        return sum + (isNaN(price) ? 0 : price);
                      }, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  )}
                </div>
                <CurrencyInput
                  value={totalPrice}
                  onChange={(value) => {
                    setTotalPrice(roundCurrency(value));
                  }}
                  onBlur={async () => {
                    if (id) {
                      await updateDoc(doc(db, 'workOrders', id), {
                        totalPrice: totalPrice,
                      });
                    }
                  }}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                  placeholder="0,00"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Digite o valor total ou deixe em branco para calcular automaticamente
                </p>
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
                  ? 'border-b-2 border-blue-600 text-blue-600 font-bold'
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
                  ? 'border-b-2 border-blue-600 text-blue-600 font-bold'
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
                  ? 'border-b-2 border-blue-600 text-blue-600 font-bold'
                  : 'text-slate-600 hover:text-navy'
              }`}
            >
              <Plus className="w-5 h-5 inline mr-2" />
              Fotos
            </button>
          </div>
        </div>

        {/* Tab Content - Using CSS visibility to preserve state */}
        <div className={activeTab === 'info' ? 'block' : 'hidden'}>
          <>
            {/* WhatsApp Button - Share OS with approval link */}
              <Card>
                <div>
                  <h2 className="text-xl font-bold text-navy mb-2">Compartilhar OS</h2>
                  <p className="text-sm text-slate-600 mb-4">
                    Envie o link da ordem de serviço e aprovação para o cliente via WhatsApp
                  </p>
                  <div className="flex flex-col gap-3">
                    <Button
                      variant="outline"
                      onClick={handleGeneratePdfPreview}
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <Eye className="w-5 h-5" />
                      Pré-visualizar
                    </Button>
                    <WhatsAppButton
                      phoneNumber={clientPhone}
                      clientName={workOrder.clientName}
                      docType="OS"
                      docLink={`${window.location.origin}/p/os/${id}`}
                      googleReviewUrl={(company as any)?.googleReviewUrl}
                      data-whatsapp-button="true"
                      className="w-full"
                    />
                  </div>
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

            {/* Client Digital Acceptance */}
            {workOrder.status === 'completed' && (
              <Card>
                <h2 className="text-xl font-bold text-navy mb-4">Aceite Digital do Cliente</h2>
                {workOrder.clientAccepted ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-700 font-medium mb-2">✓ Aceite confirmado</p>
                      <p className="text-sm text-green-600">
                        Aceito em {workOrder.acceptedAt?.toDate ? 
                          new Date(workOrder.acceptedAt.toDate()).toLocaleString('pt-BR') :
                          workOrder.acceptedAt ? new Date(workOrder.acceptedAt).toLocaleString('pt-BR') : 'N/A'
                        }
                      </p>
                    </div>

                    {/* Audit Card */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                      <h3 className="text-sm font-semibold text-navy mb-3 flex items-center gap-2">
                        🛡️ Auditoria do Aceite Digital
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            Assinado Digitalmente
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-600">Assinado por:</span>{' '}
                          <span className="font-medium text-navy">{workOrder.clientName}</span>
                        </div>
                        <div>
                          <span className="text-slate-600">Data/Hora:</span>{' '}
                          <span className="font-mono text-xs">
                            {workOrder.acceptedAt?.toDate ? 
                              new Date(workOrder.acceptedAt.toDate()).toLocaleString('pt-BR', { 
                                day: '2-digit', 
                                month: '2-digit', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                              }) :
                              workOrder.acceptedAt ? new Date(workOrder.acceptedAt).toLocaleString('pt-BR', {
                                day: '2-digit', 
                                month: '2-digit', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                              }) : 'N/A'
                            }
                          </span>
                        </div>
                        {workOrder.deviceInfo && (
                          <div>
                            <span className="text-slate-600">Dispositivo:</span>{' '}
                            <span className="font-mono text-xs text-slate-700">{workOrder.deviceInfo}</span>
                          </div>
                        )}
                        {workOrder.clientIp && (
                          <div>
                            <span className="text-slate-600">IP de Origem:</span>{' '}
                            <span className="font-mono text-xs text-slate-700">{workOrder.clientIp}</span>
                          </div>
                        )}
                        {workOrder.signatureImage && (
                          <div className="mt-3 pt-3 border-t border-slate-200">
                            <span className="text-slate-600 text-xs block mb-2">Assinatura:</span>
                            <img 
                              src={workOrder.signatureImage} 
                              alt="Assinatura do cliente"
                              className="max-w-xs border border-slate-300 rounded bg-white p-2"
                              style={{ maxHeight: '80px' }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-slate-600 mb-4">
                      Gere um link para o cliente confirmar o recebimento do serviço.
                    </p>
                    <Button
                      variant="primary"
                      onClick={() => {
                        const acceptanceLink = `${window.location.origin}/p/os/accept/${id}`;
                        navigator.clipboard.writeText(acceptanceLink);
                        alert('Link copiado! Compartilhe com o cliente.');
                      }}
                      className="flex items-center gap-2"
                    >
                      <Copy className="w-5 h-5" />
                      Copiar Link de Aceite
                    </Button>
                  </div>
                )}
              </Card>
            )}

          </>
        </div>

        <div className={activeTab === 'inspection' ? 'block' : 'hidden'}>
          <TechnicalInspection
            initialLeaves={workOrder.technicalInspection?.leaves || []}
            profession={(company as any)?.profession || (company as any)?.segment || 'vidracaria'}
            workOrderId={id}
            initialSurveyFields={workOrder.technicalInspection?.surveyFields || {}}
            initialCustomChecklist={workOrder.technicalInspection?.customChecklist || []}
            initialSurveyPhotos={workOrder.technicalInspection?.surveyPhotos || []}
            onSave={handleSaveInspection}
          />
        </div>

        <div className={activeTab === 'photos' ? 'block' : 'hidden'}>
          <Card>
            <h2 className="text-xl font-bold text-navy mb-4">Relatório Fotográfico</h2>
            
            {/* Photo Upload Options - Camera vs Gallery */}
            <div className="mb-6">
              <div className="grid grid-cols-2 gap-3 mb-3">
                {/* Camera Button */}
                <Button
                  variant="outline"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="w-full flex items-center justify-center gap-2 border-2"
                >
                  <Camera className="w-5 h-5" />
                  📷 Tirar Foto
                </Button>
                
                {/* Gallery Button */}
                <Button
                  variant="outline"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="w-full flex items-center justify-center gap-2 border-2"
                >
                  <ImageIcon className="w-5 h-5" />
                  🖼️ Galeria
                </Button>
              </div>
              
              {/* Hidden File Inputs */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoFileSelect}
                className="hidden"
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoFileSelect}
                className="hidden"
              />
              
              {/* Library Button */}
              <Button
                variant="outline"
                onClick={() => setShowLibraryModal(true)}
                className="w-full flex items-center justify-center gap-2"
              >
                📂 Escolher da Biblioteca
              </Button>
              
              {uploadingPhoto && (
                <p className="text-sm text-slate-600 mt-2 text-center">Enviando foto...</p>
              )}
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
        </div>

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
                          // Recalculate total
                          const newTotal = updated.reduce((sum, s) => {
                            const price = typeof s.price === 'number' ? s.price : parseFloat(String(s.price || 0).replace(',', '.'));
                            return sum + (isNaN(price) ? 0 : price);
                          }, 0);
                          setTotalPrice(roundCurrency(newTotal));
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
                            totalPrice: roundCurrency(newTotal),
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
                          // Recalculate total
                          const newTotal = updated.reduce((sum, s) => {
                            const price = typeof s.price === 'number' ? s.price : parseFloat(String(s.price || 0).replace(',', '.'));
                            return sum + (isNaN(price) ? 0 : price);
                          }, 0);
                          setTotalPrice(roundCurrency(newTotal));
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
                            totalPrice: roundCurrency(newTotal),
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

      {/* Library Selector Modal */}
      <LibrarySelectorModal
        isOpen={showLibraryModal}
        onClose={() => setShowLibraryModal(false)}
        onSelect={(item) => {
          handlePhotoUpload(item.imageUrl);
        }}
      />

      {/* PDF Preview Modal */}
      {showPdfPreview && pdfBlobUrl && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-5xl h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200">
              <h2 className="text-xl font-bold text-navy">Pré-visualização do PDF</h2>
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  onClick={() => {
                    // Close preview and proceed with WhatsApp
                    setShowPdfPreview(false);
                    // Trigger WhatsApp button click
                    const whatsappButton = document.querySelector('[data-whatsapp-button]') as HTMLElement;
                    if (whatsappButton) {
                      whatsappButton.click();
                    }
                    // Clean up blob URL
                    if (pdfBlobUrl) {
                      URL.revokeObjectURL(pdfBlobUrl);
                      setPdfBlobUrl(null);
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  Confirmar e Enviar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPdfPreview(false);
                    if (pdfBlobUrl) {
                      URL.revokeObjectURL(pdfBlobUrl);
                      setPdfBlobUrl(null);
                    }
                  }}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                src={pdfBlobUrl}
                className="w-full h-full border-0"
                title="PDF Preview"
              />
            </div>
          </Card>
        </div>
      )}
    </Layout>
  );
}

