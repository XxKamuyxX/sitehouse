import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { CurrencyInput } from '../components/ui/CurrencyInput';
import { Save, Trash2, Download, Plus, FileText, Search, Lock, X, MessageCircle } from 'lucide-react';
import { PDFOptionsModal } from '../components/PDFOptionsModal';
import { pdf } from '@react-pdf/renderer';
import { QuotePDF } from '../components/QuotePDF';
import { ContractModal, ContractData } from '../components/ContractModal';
import { ContractPDF } from '../components/ContractPDF';
import { InstallationItemModal } from '../components/InstallationItemModal';
import { ServiceSelectorModal } from '../components/ServiceSelectorModal';
import { ClientForm } from '../components/ClientForm';
import { LibrarySelectorModal } from '../components/LibrarySelectorModal';
import { getProfessionCatalog } from '../utils/professionCatalog';
import { getCategoriesForIndustry, getIconComponent } from '../constants/serviceCategories';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { queryWithCompanyId } from '../lib/queries';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../hooks/useCompany';
import { roundCurrency } from '../lib/utils';
// Removed useSecurityGate - phone verification is now handled globally at /activate
import { PaywallModal } from '../components/PaywallModal';

interface Service {
  id: string;
  name: string;
  description: string;
  type: 'unit' | 'meter' | 'package';
  defaultPrice?: number;
}

// Serviços padrão - serão carregados do Firestore se disponível
const DEFAULT_SERVICES: Service[] = [
  {
    id: 'troca-roldanas',
    name: 'Troca de Roldanas',
    description: 'Substituição por roldanas premium',
    type: 'unit',
    defaultPrice: 50,
  },
  {
    id: 'vedacao',
    name: 'Vedação',
    description: 'Substituição da vedação',
    type: 'unit',
    defaultPrice: 35,
  },
  {
    id: 'higienizacao',
    name: 'Higienização',
    description: 'Limpeza profunda e higienização completa',
    type: 'unit',
    defaultPrice: 200,
  },
  {
    id: 'limpeza',
    name: 'Limpeza',
    description: 'Limpeza profissional dos vidros e trilhos',
    type: 'unit',
    defaultPrice: 150,
  },
  {
    id: 'blindagem',
    name: 'Blindagem',
    description: 'Blindagem nos trilhos para proteção',
    type: 'unit',
    defaultPrice: 100,
  },
  {
    id: 'colagem-vidro',
    name: 'Colagem de Vidro',
    description: 'Colagem profissional de vidros soltos',
    type: 'unit',
    defaultPrice: 120,
  },
  {
    id: 'visita-tecnica',
    name: 'Visita Técnica/Diagnóstico',
    description: 'Diagnóstico completo do sistema',
    type: 'unit',
    defaultPrice: 150,
  },
];

interface Client {
  id: string;
  name: string;
  address: string;
  condominium: string;
  phone: string;
  email: string;
}

interface QuoteItem {
  serviceId: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  isCustom?: boolean;
  // Pricing calculator fields
  pricingMethod?: 'm2' | 'linear' | 'fixed' | 'unit';
  dimensions?: {
    width: number;
    height: number;
    area?: number;
  };
  // Installation-specific fields
  glassColor?: string;
  glassThickness?: string;
  profileColor?: string;
  isInstallation?: boolean;
  // Visual library fields
  imageUrl?: string;
  templateId?: string;
  description?: string;
}

const VIP_CONDOMINIUMS = [
  'Belvedere',
  'Vila da Serra',
  'Nova Lima',
  'Alphaville Lagoa dos Ingleses',
  'Vale dos Cristais',
  'Olympus',
  'Four Seasons',
  'Beverly Hills',
];

export function QuoteNew() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userMetadata } = useAuth();
  const companyId = userMetadata?.companyId;
  const { company } = useCompany();
  // Removed verifyGate - phone verification is now handled globally
  const [showPaywall, setShowPaywall] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [status, setStatus] = useState<'draft' | 'sent' | 'approved' | 'cancelled'>('draft');
  const [warranty, setWarranty] = useState('');
  const [observations, setObservations] = useState('');
  const [showInstallationModal, setShowInstallationModal] = useState(false);
  const [showServiceSelectorModal, setShowServiceSelectorModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showPDFOptionsModal, setShowPDFOptionsModal] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [selectedCategoryForLibrary, setSelectedCategoryForLibrary] = useState<{ catalogName: string; categoryName: string } | null>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [services, setServices] = useState<Service[]>(DEFAULT_SERVICES);
  const [diagnosis, setDiagnosis] = useState({
    beforePhotos: [] as string[],
    afterPhotos: [] as string[],
    notes: '',
  });
  const [loading, setLoading] = useState(true);
  const [activeServiceTab, setActiveServiceTab] = useState<'installation' | 'maintenance' | 'custom'>('installation');
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  
  const isEditMode = !!id;

  // Reset form state when switching between new and edit mode
  const resetFormState = () => {
    setSelectedClientId('');
    setItems([]);
    setDiscount(0);
    setStatus('draft');
    setWarranty('');
    setObservations('');
    setDiagnosis({
      beforePhotos: [],
      afterPhotos: [],
      notes: '',
    });
    setSelectedCategoryId(null);
    setCategorySearchTerm('');
    setClientSearchTerm('');
  };

  useEffect(() => {
    const init = async () => {
      if (companyId) {
        await loadClients();
        await loadServices();
        if (id) {
          // Edit mode: load quote data
          await loadQuote(id);
        } else {
          // New mode: reset all form state to ensure clean slate
          resetFormState();
          setLoading(false);
        }
      }
    };
    init();
  }, [id, companyId]);

  const loadClients = async () => {
    if (!companyId) return;
    
    try {
      const q = queryWithCompanyId('clients', companyId);
      const snapshot = await getDocs(q);
      const clientsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Client[];
      // Sort clients alphabetically by name (A-Z)
      clientsData.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const loadServices = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'config'));
      if (settingsDoc.exists() && settingsDoc.data().services) {
        setServices(settingsDoc.data().services as Service[]);
      }
    } catch (error) {
      console.error('Error loading services:', error);
      // Usa serviços padrão se não conseguir carregar
    }
  };

  const loadQuote = async (quoteId: string) => {
    try {
      const docRef = doc(db, 'quotes', quoteId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSelectedClientId(data.clientId);
        setItems(data.items || []);
        setDiscount(data.discount || 0);
        setStatus(data.status || 'draft');
        setWarranty(data.warranty || '');
        setObservations(data.observations || '');
        setDiagnosis(data.diagnosis || { beforePhotos: [], afterPhotos: [], notes: '' });
      }
    } catch (error) {
      console.error('Error loading quote:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectServiceFromModal = (itemData: {
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
    const newItem: QuoteItem = {
      serviceId: itemData.serviceId,
      serviceName: itemData.serviceName,
      quantity: itemData.quantity,
      unitPrice: itemData.unitPrice,
      total: itemData.total,
      isCustom: itemData.isCustom || false,
      pricingMethod: itemData.pricingMethod,
      dimensions: itemData.dimensions,
      glassThickness: itemData.glassThickness,
      profileColor: itemData.profileColor,
      isInstallation: itemData.isInstallation || false,
      imageUrl: itemData.imageUrl,
      templateId: itemData.templateId,
    };
    setItems([...items, newItem]);
  };

  const updateItem = (index: number, field: 'quantity' | 'unitPrice', value: number) => {
    const newItems = [...items];
    const item = newItems[index];
    
    // Don't allow editing unitPrice for catalog services (not custom)
    if (field === 'unitPrice' && !item.isCustom) {
      return; // Catalog service price is read-only
    }
    
    // If item has pricing method, recalculate based on method
    if (item.pricingMethod && item.pricingMethod !== 'fixed' && !item.isInstallation) {
      if (field === 'quantity') {
        item.quantity = value;
        if (item.pricingMethod === 'm2' && item.dimensions) {
          const area = item.dimensions.width * item.dimensions.height;
          const rawTotal = area * item.quantity * item.unitPrice;
          item.total = roundCurrency(rawTotal);
        } else if (item.pricingMethod === 'linear' && item.dimensions) {
          const rawTotal = item.dimensions.width * item.quantity * item.unitPrice;
          item.total = roundCurrency(rawTotal);
        } else {
          const rawTotal = item.quantity * item.unitPrice;
          item.total = roundCurrency(rawTotal);
        }
      } else if (field === 'unitPrice' && item.isCustom) {
        // Only allow editing unitPrice for custom services
        item.unitPrice = value;
        if (item.pricingMethod === 'm2' && item.dimensions) {
          const area = item.dimensions.width * item.dimensions.height;
          const rawTotal = area * item.quantity * item.unitPrice;
          item.total = roundCurrency(rawTotal);
        } else if (item.pricingMethod === 'linear' && item.dimensions) {
          const rawTotal = item.dimensions.width * item.quantity * item.unitPrice;
          item.total = roundCurrency(rawTotal);
        } else {
          const rawTotal = item.quantity * item.unitPrice;
          item.total = roundCurrency(rawTotal);
        }
      }
    } else {
      // Standard calculation
      if (field === 'quantity') {
        item.quantity = value;
        const rawTotal = item.quantity * item.unitPrice;
        item.total = roundCurrency(rawTotal);
      } else if (field === 'unitPrice' && item.isCustom) {
        // Only allow editing unitPrice for custom services
        item.unitPrice = value;
        const rawTotal = item.quantity * item.unitPrice;
        item.total = roundCurrency(rawTotal);
      }
    }
    
    setItems(newItems);
  };

  const handleSaveInstallationItem = (itemData: any) => {
    if (editingItemIndex !== null) {
      // Update existing item
      const newItems = [...items];
      newItems[editingItemIndex] = {
        ...newItems[editingItemIndex],
        ...itemData,
        serviceId: newItems[editingItemIndex].serviceId || `installation-${Date.now()}`,
      };
      setItems(newItems);
      setEditingItemIndex(null);
    } else {
      // Add new item
      const newItem: QuoteItem = {
        serviceId: `installation-${Date.now()}`,
        ...itemData,
      };
      setItems([...items, newItem]);
    }
    setShowInstallationModal(false);
  };

  const handleEditInstallationItem = (index: number) => {
    setEditingItemIndex(index);
    setShowInstallationModal(true);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleCreateClient = async (clientData: Omit<Client, 'id'>) => {
    // CRITICAL: Validate companyId before attempting any operation
    if (!companyId) {
      alert('Erro: Empresa não identificada. Por favor, recarregue a página.');
      return;
    }
    
    try {
      // CRITICAL: companyId MUST be explicitly included in the payload
      const newClientData = {
        ...clientData,
        companyId: companyId, // MANDATORY: Explicitly include companyId
        createdAt: new Date(),
      };
      const docRef = await addDoc(collection(db, 'clients'), newClientData);
      
      // Reload clients list
      await loadClients();
      
      // Auto-select the new client
      setSelectedClientId(docRef.id);
      
      // Close modal
      setShowClientModal(false);
    } catch (error: any) {
      console.error('Error creating client:', error);
      const errorMessage = error?.message || 'Erro desconhecido';
      alert(`Erro ao criar cliente: ${errorMessage}\n\nVerifique o console para mais detalhes.`);
    }
  };

  const subtotal = roundCurrency(items.reduce((sum, item) => sum + item.total, 0));
  const total = roundCurrency(subtotal - discount);

  const handleSave = async () => {
      if (!selectedClientId) {
        alert('Selecione um cliente');
        return;
      }

      const selectedClient = clients.find((c) => c.id === selectedClientId);
      if (!selectedClient) return;

      try {
      // Sanitize items - include all fields including installation data
      const sanitizedItems = items.map((item) => {
        // Validate required fields
        if (!item.serviceId || !item.serviceName) {
          throw new Error(`Item inválido: falta serviceId ou serviceName`);
        }

        const sanitized: any = {
          serviceId: String(item.serviceId),
          serviceName: String(item.serviceName),
          quantity: Number(item.quantity) || 0,
          unitPrice: Number(item.unitPrice) || 0,
          total: Number(item.total) || 0,
        };

        // Only add optional fields if they have values
        if (item.isCustom !== undefined) sanitized.isCustom = Boolean(item.isCustom);
        if (item.isInstallation !== undefined) sanitized.isInstallation = Boolean(item.isInstallation);
        
        // Add installation-specific fields if present
        if (item.isInstallation) {
          if (item.pricingMethod) sanitized.pricingMethod = String(item.pricingMethod);
          if (item.dimensions) {
            sanitized.dimensions = {
              width: Number(item.dimensions.width) || 0,
              height: Number(item.dimensions.height) || 0,
            };
            if (item.dimensions.area !== undefined) {
              sanitized.dimensions.area = Number(item.dimensions.area) || 0;
            }
          }
          if (item.glassColor) sanitized.glassColor = String(item.glassColor);
          if (item.glassThickness) sanitized.glassThickness = String(item.glassThickness);
          if (item.profileColor) sanitized.profileColor = String(item.profileColor);
        }
        
        // Include imageUrl and templateId if available (from project library)
        if (item.imageUrl) sanitized.imageUrl = String(item.imageUrl);
        if (item.templateId) sanitized.templateId = String(item.templateId);
        
        return sanitized;
      });

      // Sanitize diagnosis - only include if has content
      const sanitizedDiagnosis = 
        diagnosis.beforePhotos.length > 0 || 
        diagnosis.afterPhotos.length > 0 || 
        diagnosis.notes
          ? {
              beforePhotos: diagnosis.beforePhotos || [],
              afterPhotos: diagnosis.afterPhotos || [],
              notes: diagnosis.notes || '',
            }
          : null;

      // Build quoteData - ensure all values are valid
      const quoteData: any = {
        clientId: String(selectedClientId),
        clientName: String(selectedClient.name),
        items: sanitizedItems,
        subtotal: Number(subtotal) || 0,
        discount: Number(discount) || 0,
        total: Number(total) || 0,
        status: String(status) || 'draft',
        warranty: String(warranty || ''),
        observations: String(observations || ''),
        updatedAt: new Date(),
      };

      // Only add diagnosis if it exists
      if (sanitizedDiagnosis) {
        quoteData.diagnosis = sanitizedDiagnosis;
      }

      // Only add createdAt and companyId for new quotes
      if (!id) {
        if (!companyId) {
          alert('Erro: companyId não encontrado. Por favor, recarregue a página.');
          return;
        }
        quoteData.createdAt = serverTimestamp(); // Use serverTimestamp for consistency
        quoteData.companyId = companyId; // MANDATORY: Required by security rules
      }

      // Validate data before saving
      if (!quoteData.clientId || !quoteData.clientName) {
        alert('Erro: Dados do cliente inválidos');
        return;
      }

      if (!Array.isArray(quoteData.items) || quoteData.items.length === 0) {
        alert('Adicione pelo menos um item ao orçamento');
        return;
      }

      // Remove any undefined or null values from items
      quoteData.items = quoteData.items.map((item: any) => {
        const cleanItem: any = {};
        Object.keys(item).forEach(key => {
          if (item[key] !== undefined && item[key] !== null) {
            cleanItem[key] = item[key];
          }
        });
        return cleanItem;
      });

      if (id) {
        // For updates, ensure companyId is preserved if not in quoteData
        // Get existing quote to preserve companyId if not already set
        const existingQuote = await getDoc(doc(db, 'quotes', id));
        if (existingQuote.exists()) {
          const existingData = existingQuote.data();
          // Preserve companyId if it exists in the document
          if (existingData.companyId && !quoteData.companyId) {
            quoteData.companyId = existingData.companyId;
          }
        }
        // CRITICAL: Ensure companyId is preserved on update
        if (!quoteData.companyId && existingQuote.exists()) {
          const existingData = existingQuote.data();
          quoteData.companyId = existingData.companyId || companyId;
        }
        if (!quoteData.companyId) {
          quoteData.companyId = companyId;
        }
        await updateDoc(doc(db, 'quotes', id), quoteData);
        alert('Orçamento atualizado com sucesso!');
      } else {
        // CRITICAL: Validate companyId before creating
        if (!quoteData.companyId) {
          alert('Erro: Empresa não identificada. Por favor, recarregue a página.');
          return;
        }
        console.log('Creating quote with data:', { ...quoteData, createdAt: '[serverTimestamp]' });
        await addDoc(collection(db, 'quotes'), quoteData);
        alert('Orçamento salvo com sucesso!');
      }

      navigate('/quotes');
    } catch (error: any) {
      console.error('Error saving quote:', error);
      const errorMessage = error?.message || 'Erro desconhecido';
      alert(`Erro ao salvar orçamento: ${errorMessage}\n\nVerifique o console para mais detalhes.`);
    }
  };



  const handleCreateWorkOrder = async () => {
    if (!selectedClientId || items.length === 0 || !id) {
      alert('Complete o orçamento e salve antes de gerar a OS');
      return;
    }

    if (!companyId) {
      alert('Erro: Empresa não identificada');
      return;
    }

    const selectedClient = clients.find((c) => c.id === selectedClientId);
    if (!selectedClient) return;

    try {
      const workOrderData = {
        quoteId: id,
        clientId: selectedClientId,
        clientName: selectedClient.name,
        clientPhone: selectedClient.phone,
        clientAddress: selectedClient.address,
        scheduledDate: new Date().toISOString().split('T')[0],
        technician: '',
        status: 'scheduled' as const,
        checklist: items.map((item) => ({
          task: `${item.serviceName} - Qtd: ${item.quantity}`,
          completed: false,
        })),
        notes: observations || '',
        companyId: companyId, // MANDATORY: Required by security rules
        createdAt: serverTimestamp(), // Use serverTimestamp for consistency
      };

      console.log('Creating work order with data:', { ...workOrderData, createdAt: '[serverTimestamp]' });
      const docRef = await addDoc(collection(db, 'workOrders'), workOrderData);
      alert('Ordem de Serviço criada com sucesso!');
      navigate(`/work-orders/${docRef.id}`);
    } catch (error: any) {
      console.error('Error creating work order:', error);
      alert(`Erro ao criar ordem de serviço: ${error.message}`);
    }
  };

  const handleGeneratePDFClick = () => {
    if (!selectedClientId || items.length === 0) {
      alert('Complete o orçamento antes de gerar o PDF');
      return;
    }
    setShowPDFOptionsModal(true);
  };

  const handleGeneratePDF = async (options: { hideDimensions: boolean; hideUnitPrice: boolean }) => {
    const selectedClient = clients.find((c) => c.id === selectedClientId);
    if (!selectedClient) return;

    try {
      // Convert logo to base64 to avoid CORS issues
      let logoBase64: string | null = null;
      if (company?.logoUrl) {
        const { getBase64ImageFromUrl } = await import('../utils/imageToBase64');
        logoBase64 = await getBase64ImageFromUrl(company.logoUrl);
      }

      const doc = (
        <QuotePDF
          clientName={selectedClient.name}
          clientAddress={selectedClient.address}
          clientCondominium={selectedClient.condominium}
          clientPhone={selectedClient.phone}
          clientEmail={selectedClient.email}
          items={items}
          subtotal={subtotal}
          discount={discount}
          total={total}
          quoteNumber={id || undefined}
          createdAt={new Date()}
          warranty={warranty || undefined}
          observations={observations || undefined}
          photos={diagnosis?.beforePhotos || diagnosis?.afterPhotos || []}
          hasRisk={false}
          hideDimensions={options.hideDimensions}
          hideUnitPrice={options.hideUnitPrice}
          companyData={company ? {
            name: company.name,
            address: company.address,
            phone: company.phone,
            email: company.email || '',
            logoUrl: logoBase64 || company.logoUrl || undefined,
            cnpj: company.cnpj || '',
            pdfSettings: company.pdfSettings,
            paymentSettings: company.paymentSettings,
          } : undefined}
        />
      );

      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Orcamento_${selectedClient.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erro ao gerar PDF');
    }
  };

  const handleGenerateContract = async (contractData: ContractData) => {
    if (!selectedClientId || items.length === 0) {
      alert('Complete o orçamento antes de gerar o contrato');
      return;
    }

    const selectedClient = clients.find((c) => c.id === selectedClientId);
    if (!selectedClient) return;

    try {
      // Convert logo to base64 to avoid CORS issues
      let logoBase64: string | null = null;
      if (company?.logoUrl) {
        const { getBase64ImageFromUrl } = await import('../utils/imageToBase64');
        logoBase64 = await getBase64ImageFromUrl(company.logoUrl);
      }

      // Prepare quote items for contract
      const contractItems = items.map(item => ({
        serviceName: item.serviceName,
        quantity: item.quantity,
        total: item.total,
        dimensions: item.dimensions,
      }));

      // Convert signature to base64 if available
      let signatureBase64: string | null = null;
      if ((company as any)?.signatureUrl) {
        try {
          const { getBase64ImageFromUrl } = await import('../utils/imageToBase64');
          signatureBase64 = await getBase64ImageFromUrl((company as any).signatureUrl);
        } catch (err) {
          console.warn('Could not convert signature to base64:', err);
        }
      }

      const contractDoc = (
        <ContractPDF
          quoteItems={contractItems}
          total={total}
          contractData={contractData}
          companyData={company ? {
            name: company.name,
            address: company.address,
            phone: company.phone,
            email: company.email || '',
            logoUrl: logoBase64 || company.logoUrl || undefined,
            cnpj: company.cnpj || '',
            pdfSettings: company.pdfSettings,
            paymentSettings: company.paymentSettings,
          } : undefined}
          companySignatureUrl={signatureBase64 || (company as any)?.signatureUrl || undefined}
        />
      );

      const blob = await pdf(contractDoc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Contrato_${selectedClient.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setShowContractModal(false);
      alert('Contrato gerado com sucesso!');
    } catch (error) {
      console.error('Error generating contract:', error);
      alert('Erro ao gerar contrato');
    }
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

  return (
      <Layout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 py-3">
            <div>
              <h1 className="text-lg font-semibold text-navy">
                {id ? 'Editar Orçamento' : 'Novo Orçamento'}
              </h1>
            </div>
          <div className="flex gap-2 items-center flex-wrap">
            <Button variant="outline" onClick={() => navigate('/quotes')}>
              Cancelar
            </Button>
            
            {/* Action Buttons (no longer in dropdown) */}
            {id && selectedClientId && (() => {
              const selectedClient = clients.find((c) => c.id === selectedClientId);
              const sanitizePhone = (phone: string): string => {
                if (!phone) return '';
                let cleaned = phone.replace(/[\s\(\)\-]/g, '');
                if (cleaned.startsWith('+')) cleaned = cleaned.substring(1);
                if (!cleaned.startsWith('55')) cleaned = '55' + cleaned;
                return cleaned;
              };
              const handleWhatsApp = () => {
                const message = `Olá ${selectedClient?.name}, segue o link do seu Orçamento: ${window.location.origin}/p/quote/${id}${(company as any)?.googleReviewUrl ? `\n\nAvalie nosso serviço: ${(company as any).googleReviewUrl}` : ''}`;
                const encodedMessage = encodeURIComponent(message);
                const phone = sanitizePhone(selectedClient?.phone || '');
                const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
                window.open(whatsappUrl, '_blank');
              };
              return (
                <Button
                  variant="outline"
                  onClick={handleWhatsApp}
                  className="flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </Button>
              );
            })()}
            
            {id && (
              <>
                <Button
                  variant="outline"
                  onClick={handleGeneratePDFClick}
                  className="flex items-center gap-2"
                  disabled={!selectedClientId || items.length === 0}
                >
                  <Download className="w-4 h-4" />
                  Gerar PDF
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setShowContractModal(true)}
                  className="flex items-center gap-2"
                  disabled={!selectedClientId || items.length === 0}
                >
                  <FileText className="w-4 h-4" />
                  Contrato
                </Button>
                
                {status === 'approved' && (
                  <Button
                    variant="outline"
                    onClick={handleCreateWorkOrder}
                    className="flex items-center gap-2"
                  >
                    🛠️ Ordem de Serviço
                  </Button>
                )}
              </>
            )}
            
            <Button 
              variant="primary" 
              onClick={handleSave} 
              className="flex items-center gap-2"
              disabled={!companyId}
            >
              <Save className="w-5 h-5" />
              Salvar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-48">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client Selection / Read-Only Client Card */}
            {isEditMode && selectedClientId ? (
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-navy">Cliente</h2>
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                {(() => {
                  const selectedClient = clients.find((c) => c.id === selectedClientId);
                  if (!selectedClient) return null;
                  return (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="font-semibold text-gray-900 mb-1">{selectedClient.name}</p>
                      <p className="text-sm text-gray-600 mb-1">{selectedClient.phone || 'Sem telefone'}</p>
                      <p className="text-sm text-gray-600">{selectedClient.address || 'Sem endereço'}</p>
                    </div>
                  );
                })()}
              </Card>
            ) : (
              <Card className="relative flex flex-col h-[calc(100vh-200px)] min-h-[500px]">
                {/* Search Bar with New Client Button */}
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="Buscar cliente..."
                    value={clientSearchTerm}
                    onChange={(e) => setClientSearchTerm(e.target.value)}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                    autoFocus={false}
                  />
                  <Button
                    variant="primary"
                    onClick={() => setShowClientModal(true)}
                    className="h-10 w-10 p-0 flex items-center justify-center"
                    title="Novo Cliente"
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>

                {/* Client List - Compact Dense List */}
                <div className="flex-1 overflow-y-auto pb-24">
                  <ul className="divide-y divide-gray-100">
                    {clients
                      .filter((client) => 
                        clientSearchTerm === '' || 
                        client.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
                        client.condominium.toLowerCase().includes(clientSearchTerm.toLowerCase())
                      )
                      .map((client) => (
                        <li key={client.id}>
                          <button
                            onClick={() => setSelectedClientId(client.id)}
                            className={`w-full flex flex-row items-center justify-between p-3 transition-colors ${
                              selectedClientId === client.id
                                ? 'bg-navy-50 border-l-4 border-l-navy'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <span className="text-sm font-semibold text-gray-900">{client.name}</span>
                            <span className="text-xs text-gray-500">{client.phone || ''}</span>
                          </button>
                        </li>
                      ))}
                  </ul>
                  {clients.filter((client) => 
                    clientSearchTerm === '' || 
                    client.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
                    client.condominium.toLowerCase().includes(clientSearchTerm.toLowerCase())
                  ).length === 0 && (
                    <p className="text-center text-slate-500 py-8">Nenhum cliente encontrado</p>
                  )}
                </div>

                {/* Sticky Footer - Only Avançar button */}
                <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-3 z-50">
                  <div className="max-w-7xl mx-auto">
                    <Button
                      variant="primary"
                      onClick={() => {
                        if (!selectedClientId) {
                          alert('Por favor, selecione um cliente');
                          return;
                        }
                        // Scroll to services section
                        document.querySelector('[data-section="services"]')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="w-full"
                      disabled={!selectedClientId}
                    >
                      Avançar
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Services */}
            <Card data-section="services">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-navy">Serviços</h2>
              </div>

              {/* Service Type Tabs */}
              <div className="flex gap-2 mb-6 border-b border-slate-200">
                <button
                  onClick={() => setActiveServiceTab('installation')}
                  className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                    activeServiceTab === 'installation'
                      ? 'border-navy text-navy'
                      : 'border-transparent text-slate-600 hover:text-navy'
                  }`}
                >
                  Instalação
                </button>
                <button
                  onClick={() => setActiveServiceTab('maintenance')}
                  className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                    activeServiceTab === 'maintenance'
                      ? 'border-navy text-navy'
                      : 'border-transparent text-slate-600 hover:text-navy'
                  }`}
                >
                  Manutenção
                </button>
                <button
                  onClick={() => setActiveServiceTab('custom')}
                  className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                    activeServiceTab === 'custom'
                      ? 'border-navy text-navy'
                      : 'border-transparent text-slate-600 hover:text-navy'
                  }`}
                >
                  Meus Serviços
                </button>
              </div>

              {/* Installation Category Grid - Show immediately in new mode, button in edit mode */}
              {activeServiceTab === 'installation' && (
                isEditMode ? (
                  <div className="mb-6">
                    <Button
                      variant="outline"
                      onClick={() => setShowCategoryModal(true)}
                      className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed"
                    >
                      <Plus className="w-5 h-5" />
                      Adicionar Novo Item
                    </Button>
                  </div>
                ) : (() => {
                    // Get categories based on company industry/segment/profession
                    const industry = company?.segment || company?.profession || 'glazier';
                    const allCategories = getCategoriesForIndustry(industry);
                    
                    // Filter categories based on search
                    const filteredCategories = allCategories.filter(category =>
                      category.label.toLowerCase().includes(categorySearchTerm.toLowerCase())
                    );
                    
                    return (
                      <div className="mb-6">
                      <h3 className="text-lg font-semibold text-navy mb-4">Selecione a Categoria</h3>
                      
                      {/* Search Bar */}
                      <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Buscar categoria (ex: Janela, Fiação...)"
                          value={categorySearchTerm}
                          onChange={(e) => setCategorySearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                        />
                      </div>
                      
                      {/* Category Grid */}
                      {filteredCategories.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-slate-600 mb-4">Nenhum serviço encontrado</p>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setEditingItemIndex(null);
                              setShowInstallationModal(true);
                              (window as any).__selectedInstallationCategory = {
                                serviceName: '',
                                pricingMethod: 'm2',
                                defaultPrice: 0,
                              };
                            }}
                            className="flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Cadastrar Outro
                          </Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {filteredCategories.map((category) => {
                            const IconComponent = getIconComponent(category.icon);
                            return (
                              <button
                                key={category.id}
                                onClick={() => {
                                  setSelectedCategoryId(category.id);
                                  // Auto-open modal immediately
                                  if (category.id === 'outros' || category.id === 'outro') {
                                    // Open modal with empty service name
                                    setEditingItemIndex(null);
                                    setShowInstallationModal(true);
                                    (window as any).__selectedInstallationCategory = {
                                      serviceName: '',
                                      pricingMethod: 'm2',
                                      defaultPrice: 0,
                                    };
                                  } else if (category.catalogName) {
                                    // Open library modal to select a model
                                    setSelectedCategoryForLibrary({ 
                                      catalogName: category.catalogName, 
                                      categoryName: category.label 
                                    });
                                    setShowLibraryModal(true);
                                  } else {
                                    // Fallback: open installation modal
                                    setEditingItemIndex(null);
                                    setShowInstallationModal(true);
                                    (window as any).__selectedInstallationCategory = {
                                      serviceName: category.label,
                                      pricingMethod: 'm2',
                                      defaultPrice: 0,
                                    };
                                  }
                                }}
                                className={`p-4 border-2 rounded-lg transition-all duration-200 text-center group ${
                                  selectedCategoryId === category.id
                                    ? 'border-blue-600 bg-blue-50 shadow-md ring-1 ring-blue-600'
                                    : 'border-slate-200 bg-white hover:border-blue-300'
                                }`}
                              >
                                <IconComponent className={`w-8 h-8 mx-auto mb-2 ${
                                  selectedCategoryId === category.id
                                    ? 'text-blue-600'
                                    : 'text-slate-600 group-hover:text-blue-600'
                                }`} />
                                <div className={`font-medium ${
                                  selectedCategoryId === category.id
                                    ? 'text-blue-600'
                                    : 'text-slate-700 group-hover:text-blue-600'
                                }`}>{category.label}</div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    );
                  })()
                )}

              {/* Maintenance & Custom Services - Show Add Button */}
              {(activeServiceTab === 'maintenance' || activeServiceTab === 'custom') && (
                <div className="mb-6">
                        <Button 
                          variant="primary" 
                    size="lg"
                    onClick={() => {
                      setEditingItemIndex(null);
                      setShowServiceSelectorModal(true);
                    }}
                    className="w-full sm:w-auto flex items-center gap-2"
                        >
                    <Plus className="w-5 h-5" />
                    Adicionar Item
                        </Button>
                  </div>
                )}

              {/* Items List - Only show empty state if not in installation tab (where grid is shown) */}
              {items.length === 0 && !(activeServiceTab === 'installation' && !isEditMode) ? (
                <p className="text-center text-slate-600 py-8">
                  Nenhum serviço adicionado. Selecione um serviço acima.
                </p>
              ) : items.length > 0 ? (
                <div className="space-y-4">
                  {items.map((item, index) => {
                    const service = services.find((s) => s.id === item.serviceId);

                    return (
                      <div
                        key={index}
                        className="p-4 border border-slate-200 rounded-lg bg-slate-50"
                      >
                        <div className="flex justify-between items-start mb-3 gap-3">
                          {/* Imagem do Template */}
                          {item.imageUrl && (
                            <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100">
                              <img
                                src={item.imageUrl}
                                alt={item.serviceName}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-navy">{item.serviceName}</h3>
                              {item.isCustom && (
                                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                  Manual
                                </span>
                              )}
                              {item.isInstallation && (
                                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                                  Instalação
                                </span>
                              )}
                            </div>
                            {service?.description && !item.isCustom && !item.isInstallation && (
                              <p className="text-sm text-slate-600">{service.description}</p>
                            )}
                            {item.isInstallation && (
                              <div className="mt-2 space-y-1">
                                {item.pricingMethod === 'm2' && item.dimensions && (
                                  <p className="text-xs text-slate-600">
                                    {item.dimensions.width}m × {item.dimensions.height}m = {item.dimensions.area?.toFixed(2)}m²
                                    {item.quantity > 1 && ` (${item.quantity}x = ${((item.dimensions.area || 0) * item.quantity).toFixed(2)}m² total)`}
                                  </p>
                                )}
                                {item.pricingMethod === 'linear' && item.dimensions && (
                                  <p className="text-xs text-slate-600">
                                    {item.dimensions.width}m × {item.quantity} = {(item.dimensions.width * item.quantity).toFixed(2)}m linear
                                  </p>
                                )}
                                {item.glassColor && (
                                  <p className="text-xs text-slate-600">
                                    <span className="font-medium">Vidro:</span> {item.glassColor}
                                  </p>
                                )}
                                {item.profileColor && (
                                  <p className="text-xs text-slate-600">
                                    <span className="font-medium">Perfil:</span> {item.profileColor}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {item.isInstallation && (
                              <button
                                onClick={() => handleEditInstallationItem(index)}
                                className="text-blue-600 hover:text-blue-700"
                                title="Editar item de instalação"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => removeItem(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        {!item.isInstallation ? (
                          <div>
                            {/* For m2 services (from catalog with type='meter'), show dimensions */}
                            {item.pricingMethod === 'm2' ? (
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-xs text-slate-600 mb-1">
                                      Largura (m) *
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={item.dimensions?.width || 0}
                                      onChange={(e) => {
                                        const width = parseFloat(e.target.value) || 0;
                                        const newItems = [...items];
                                        newItems[index].dimensions = {
                                          ...newItems[index].dimensions,
                                          width,
                                          height: newItems[index].dimensions?.height || 0,
                                          area: width * (newItems[index].dimensions?.height || 0),
                                        };
                                        // Recalculate total
                                        if (width > 0 && (newItems[index].dimensions?.height || 0) > 0) {
                                          const area = width * (newItems[index].dimensions?.height || 0);
                                          const rawTotal = area * newItems[index].quantity * newItems[index].unitPrice;
                                          newItems[index].total = roundCurrency(rawTotal);
                                        }
                                        setItems(newItems);
                                      }}
                                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-slate-600 mb-1">
                                      Altura (m) *
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={item.dimensions?.height || 0}
                                      onChange={(e) => {
                                        const height = parseFloat(e.target.value) || 0;
                                        const newItems = [...items];
                                        newItems[index].dimensions = {
                                          ...newItems[index].dimensions,
                                          width: newItems[index].dimensions?.width || 0,
                                          height,
                                          area: (newItems[index].dimensions?.width || 0) * height,
                                        };
                                        // Recalculate total
                                        if ((newItems[index].dimensions?.width || 0) > 0 && height > 0) {
                                          const area = (newItems[index].dimensions?.width || 0) * height;
                                          const rawTotal = area * newItems[index].quantity * newItems[index].unitPrice;
                                          newItems[index].total = roundCurrency(rawTotal);
                                        }
                                        setItems(newItems);
                                      }}
                                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                                      required
                                    />
                                  </div>
                                </div>
                                {item.dimensions?.width && item.dimensions?.height && item.dimensions.width > 0 && item.dimensions.height > 0 && (
                                  <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
                                    <p className="text-xs text-blue-700">
                                      <span className="font-medium">Área:</span> {(item.dimensions.width * item.dimensions.height).toFixed(2)} m²
                                      {item.quantity > 1 && (
                                        <span className="ml-2">
                                          ({item.quantity}x = {((item.dimensions.width * item.dimensions.height) * item.quantity).toFixed(2)} m² total)
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-xs text-slate-600 mb-1">
                                      Quantidade
                                    </label>
                                    <input
                                      type="number"
                                      min="1"
                                      step="1"
                                      value={item.quantity}
                                      onChange={(e) => {
                                        const quantity = parseFloat(e.target.value) || 1;
                                        const newItems = [...items];
                                        newItems[index].quantity = quantity;
                                        // Recalculate total
                                        if (newItems[index].dimensions?.width && newItems[index].dimensions?.height) {
                                          const area = newItems[index].dimensions.width * newItems[index].dimensions.height;
                                          const rawTotal = area * quantity * newItems[index].unitPrice;
                                          newItems[index].total = roundCurrency(rawTotal);
                                        }
                                        setItems(newItems);
                                      }}
                                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-slate-600 mb-1">Total</label>
                                    <CurrencyInput
                                      value={item.total}
                                      onChange={(newTotal: number) => {
                                        const newItems = [...items];
                                        newItems[index].total = roundCurrency(newTotal);
                                        // Recalculate unit price: New Unit Price = New Total / Quantity
                                        if (newItems[index].quantity > 0) {
                                          newItems[index].unitPrice = newTotal / newItems[index].quantity;
                                        } else {
                                          newItems[index].unitPrice = newTotal;
                                        }
                                        setItems(newItems);
                                      }}
                                      placeholder="0,00"
                                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy font-medium text-navy"
                                    />
                                  </div>
                                </div>
                                <div className="text-xs text-slate-500">
                                  Preço: R$ {item.unitPrice.toFixed(2)}/m² (do catálogo)
                                </div>
                              </div>
                            ) : (
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs text-slate-600 mb-1">
                                Quantidade
                              </label>
                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={item.quantity}
                                onChange={(e) =>
                                  updateItem(index, 'quantity', parseFloat(e.target.value) || 1)
                                }
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                              />
                            </div>
                                {/* Hide unit price if service is from catalog (not custom) */}
                                {item.isCustom ? (
                            <div>
                              <label className="block text-xs text-slate-600 mb-1">
                                Preço / Unidade
                              </label>
                              <CurrencyInput
                                value={item.unitPrice}
                                onChange={(newPrice) =>
                                  updateItem(index, 'unitPrice', roundCurrency(newPrice))
                                }
                                placeholder="0,00"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                              />
                            </div>
                                ) : (
                                  <div>
                                    <label className="block text-xs text-slate-600 mb-1">
                                      Preço / Unidade
                                    </label>
                                    <div className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-600 text-sm">
                                      R$ {item.unitPrice.toFixed(2)}
                                      <span className="text-xs text-slate-500 block">(do catálogo)</span>
                                    </div>
                                  </div>
                                )}
                            <div>
                              <label className="block text-xs text-slate-600 mb-1">Total</label>
                              <CurrencyInput
                                value={item.total}
                                onChange={(newTotal: number) => {
                                  const newItems = [...items];
                                  const roundedTotal = roundCurrency(newTotal);
                                  newItems[index].total = roundedTotal;
                                  // Recalculate unit price: New Unit Price = New Total / Quantity
                                  if (newItems[index].quantity > 0) {
                                    newItems[index].unitPrice = roundCurrency(roundedTotal / newItems[index].quantity);
                                  } else {
                                    newItems[index].unitPrice = newTotal;
                                  }
                                  setItems(newItems);
                                }}
                                placeholder="0,00"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy font-medium text-navy"
                              />
                              </div>
                            </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-3 bg-white rounded-lg border border-slate-200">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-xs text-slate-600 mb-1">Método de Precificação</p>
                                <p className="text-sm font-medium text-navy">
                                  {item.pricingMethod === 'm2' && 'Por m²'}
                                  {item.pricingMethod === 'linear' && 'Por Metro Linear'}
                                  {item.pricingMethod === 'fixed' && 'Preço Fixo'}
                                  {item.pricingMethod === 'unit' && 'Por Unidade'}
                                </p>
                              </div>
                              <div className="text-right">
                                <label className="block text-xs text-slate-600 mb-1">Total</label>
                                <CurrencyInput
                                  value={item.total}
                                  onChange={(newTotal: number) => {
                                    const newItems = [...items];
                                    const roundedTotal = roundCurrency(newTotal);
                                    newItems[index].total = roundedTotal;
                                    // Recalculate unit price: New Unit Price = New Total / Quantity
                                    if (newItems[index].quantity > 0) {
                                      newItems[index].unitPrice = roundCurrency(roundedTotal / newItems[index].quantity);
                                    } else {
                                      newItems[index].unitPrice = newTotal;
                                    }
                                    setItems(newItems);
                                  }}
                                  placeholder="0,00"
                                  className="text-lg font-bold text-navy px-2 py-1 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy w-full sm:w-auto text-right"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Summary */}
            <Card>
              <h2 className="text-xl font-bold text-navy mb-4">Resumo</h2>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-medium">R$ {subtotal.toFixed(2)}</span>
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Desconto (R$)</label>
                  <CurrencyInput
                    value={discount}
                    onChange={(newDiscount) => setDiscount(roundCurrency(newDiscount))}
                    placeholder="0,00"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                  />
                </div>
                <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:justify-between gap-2">
                  <span className="font-bold text-lg text-navy">Total:</span>
                  <CurrencyInput
                    value={total}
                    onChange={(newTotal: number) => {
                      // Proportional price adjustment: adjust unit prices instead of discount
                      if (subtotal > 0 && newTotal > 0) {
                        const ratio = roundCurrency(newTotal / subtotal);
                        const newItems = items.map(item => {
                          const updatedItem = { ...item };
                          // Update unit price proportionally
                          updatedItem.unitPrice = roundCurrency(item.unitPrice * ratio);
                          // Recalculate total based on pricing method
                          if (updatedItem.pricingMethod === 'm2' && updatedItem.dimensions) {
                            const area = (updatedItem.dimensions.width * updatedItem.dimensions.height) || 0;
                            const rawTotal = area * updatedItem.quantity * updatedItem.unitPrice;
                            updatedItem.total = roundCurrency(rawTotal);
                          } else if (updatedItem.pricingMethod === 'linear' && updatedItem.dimensions) {
                            const rawTotal = updatedItem.dimensions.width * updatedItem.quantity * updatedItem.unitPrice;
                            updatedItem.total = roundCurrency(rawTotal);
                          } else {
                            const rawTotal = updatedItem.quantity * updatedItem.unitPrice;
                            updatedItem.total = roundCurrency(rawTotal);
                          }
                          return updatedItem;
                        });
                        setItems(newItems);
                        // Set discount to 0 (no discount, just adjusted prices)
                        setDiscount(0);
                      }
                    }}
                    placeholder="0,00"
                    className="w-full sm:w-auto text-right font-bold text-lg text-navy px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                  />
                </div>
              </div>
            </Card>

            {/* Status */}
            <Card>
              <h2 className="text-xl font-bold text-navy mb-4">Status</h2>
              <Select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as 'draft' | 'sent' | 'approved' | 'cancelled')
                }
                options={[
                  { value: 'draft', label: 'Rascunho' },
                  { value: 'sent', label: 'Enviado' },
                  { value: 'approved', label: 'Aprovado' },
                  { value: 'cancelled', label: 'Cancelado' },
                ]}
              />
            </Card>

            {/* Garantia */}
            <Card>
              <h2 className="text-xl font-bold text-navy mb-4">Garantia</h2>
              <input
                type="text"
                placeholder="Ex: 90 dias, 6 meses, etc."
                value={warranty}
                onChange={(e) => setWarranty(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
              />
            </Card>

            {/* Observações */}
            <Card>
              <h2 className="text-xl font-bold text-navy mb-4">Observações</h2>
              <textarea
                placeholder="Descreva o produto ou serviço (ex: medidas, cor, material...)"
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy resize-none"
              />
              <p className="text-xs text-slate-500 mt-2">
                Use este campo para documentar itens que precisavam ser trocados mas o cliente optou por não fazer.
              </p>
            </Card>
          </div>
        </div>

        {/* Service Selector Modal */}
        <ServiceSelectorModal
          isOpen={showServiceSelectorModal}
          onClose={() => setShowServiceSelectorModal(false)}
          onSelectService={handleSelectServiceFromModal}
          companyId={companyId}
        />

        {/* Library Selector Modal */}
        <LibrarySelectorModal
          isOpen={showLibraryModal}
          onClose={() => {
            setShowLibraryModal(false);
            setSelectedCategoryForLibrary(null);
          }}
          onSelect={(libraryItem) => {
            // Find catalog item and open installation modal with library data
            const profession = (company as any)?.profession || (company as any)?.segment || 'vidracaria';
            const catalog = getProfessionCatalog(profession);
            const catalogItem = selectedCategoryForLibrary 
              ? catalog.installation.find((item) => item.name === selectedCategoryForLibrary.catalogName)
              : null;
            
            setEditingItemIndex(null);
            setShowInstallationModal(true);
            (window as any).__selectedInstallationCategory = {
              serviceName: catalogItem?.name || selectedCategoryForLibrary?.catalogName || libraryItem.name,
              pricingMethod: catalogItem?.pricingMethod || 'm2',
              defaultPrice: catalogItem?.defaultPrice || 0,
              glassThickness: catalogItem?.metadata?.glassThickness?.[0],
              profileColor: catalogItem?.metadata?.profileColor?.[0],
              imageUrl: libraryItem.imageUrl,
              description: libraryItem.description,
            };
            setShowLibraryModal(false);
            setSelectedCategoryForLibrary(null);
          }}
          filterCategory={selectedCategoryForLibrary?.categoryName}
        />

        {/* Category Selection Modal (for Edit Mode) */}
        {showCategoryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
                <h3 className="text-xl font-bold text-navy">Selecione a Categoria</h3>
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6">
                {/* Search Bar */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar categoria (ex: Janela, Fiação...)"
                    value={categorySearchTerm}
                    onChange={(e) => setCategorySearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                  />
                </div>
                
                {/* Category Grid */}
                {(() => {
                  const industry = company?.segment || company?.profession || 'glazier';
                  const allCategories = getCategoriesForIndustry(industry);
                  const filteredCategories = allCategories.filter(category =>
                    category.label.toLowerCase().includes(categorySearchTerm.toLowerCase())
                  );
                  
                  if (filteredCategories.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <p className="text-slate-600 mb-4">Nenhum serviço encontrado</p>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowCategoryModal(false);
                            setEditingItemIndex(null);
                            setShowInstallationModal(true);
                            (window as any).__selectedInstallationCategory = {
                              serviceName: '',
                              pricingMethod: 'm2',
                              defaultPrice: 0,
                            };
                          }}
                          className="flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Cadastrar Outro
                        </Button>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {filteredCategories.map((category) => {
                        const IconComponent = getIconComponent(category.icon);
                        return (
                          <button
                            key={category.id}
                            onClick={() => {
                              setShowCategoryModal(false);
                              setSelectedCategoryId(category.id);
                              if (category.id === 'outros' || category.id === 'outro') {
                                setEditingItemIndex(null);
                                setShowInstallationModal(true);
                                (window as any).__selectedInstallationCategory = {
                                  serviceName: '',
                                  pricingMethod: 'm2',
                                  defaultPrice: 0,
                                };
                              } else if (category.catalogName) {
                                setSelectedCategoryForLibrary({ 
                                  catalogName: category.catalogName, 
                                  categoryName: category.label 
                                });
                                setShowLibraryModal(true);
                              } else {
                                setEditingItemIndex(null);
                                setShowInstallationModal(true);
                                (window as any).__selectedInstallationCategory = {
                                  serviceName: category.label,
                                  pricingMethod: 'm2',
                                  defaultPrice: 0,
                                };
                              }
                            }}
                            className="p-4 border-2 rounded-lg transition-all duration-200 text-center group border-slate-200 bg-white hover:border-blue-300"
                          >
                            <IconComponent className="w-8 h-8 mx-auto mb-2 text-slate-600 group-hover:text-blue-600" />
                            <div className="font-medium text-slate-700 group-hover:text-blue-600">{category.label}</div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Installation Item Modal (kept for editing existing items) */}
        <InstallationItemModal
          isOpen={showInstallationModal}
          onClose={() => {
            setShowInstallationModal(false);
            setEditingItemIndex(null);
            (window as any).__selectedInstallationCategory = null;
          }}
          onSave={handleSaveInstallationItem}
          initialItem={
            editingItemIndex !== null 
              ? items[editingItemIndex] 
              : (window as any).__selectedInstallationCategory || undefined
          }
        />

        {/* Client Form Modal */}
        {showClientModal && (
          <ClientForm
            onSave={handleCreateClient}
            onCancel={() => setShowClientModal(false)}
            vipCondominiums={VIP_CONDOMINIUMS}
          />
        )}

        {showContractModal && selectedClientId && (
          <ContractModal
            quote={{
              id: id || '',
              clientName: clients.find((c) => c.id === selectedClientId)?.name || '',
              clientAddress: clients.find((c) => c.id === selectedClientId)?.address || '',
              items: items.map(item => ({
                serviceName: item.serviceName,
                quantity: item.quantity,
                total: item.total,
                dimensions: item.dimensions,
              })),
              total,
            }}
            onClose={() => setShowContractModal(false)}
            onGenerate={handleGenerateContract}
          />
        )}

        {showPDFOptionsModal && (
          <PDFOptionsModal
            isOpen={showPDFOptionsModal}
            onClose={() => setShowPDFOptionsModal(false)}
            onConfirm={handleGeneratePDF}
          />
        )}
      </div>

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
      />
    </Layout>
  );
}

