import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { CurrencyInput } from '../components/ui/CurrencyInput';
import { Save, Trash2, Download, Plus, FileText, Square, DoorOpen as DoorIcon, Package, Shield, Home, Image, Lock, MoreHorizontal } from 'lucide-react';
import { WhatsAppButton } from '../components/WhatsAppButton';
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
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { queryWithCompanyId } from '../lib/queries';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../hooks/useCompany';

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

  useEffect(() => {
    const init = async () => {
      if (companyId) {
      await loadClients();
      await loadServices();
      if (id) {
        await loadQuote(id);
      } else {
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
          item.total = area * item.quantity * item.unitPrice;
        } else if (item.pricingMethod === 'linear' && item.dimensions) {
          item.total = item.dimensions.width * item.quantity * item.unitPrice;
        } else {
          item.total = item.quantity * item.unitPrice;
        }
      } else if (field === 'unitPrice' && item.isCustom) {
        // Only allow editing unitPrice for custom services
        item.unitPrice = value;
        if (item.pricingMethod === 'm2' && item.dimensions) {
          const area = item.dimensions.width * item.dimensions.height;
          item.total = area * item.quantity * item.unitPrice;
        } else if (item.pricingMethod === 'linear' && item.dimensions) {
          item.total = item.dimensions.width * item.quantity * item.unitPrice;
        } else {
          item.total = item.quantity * item.unitPrice;
        }
      }
    } else {
      // Standard calculation
      if (field === 'quantity') {
        item.quantity = value;
        item.total = item.quantity * item.unitPrice;
      } else if (field === 'unitPrice' && item.isCustom) {
        // Only allow editing unitPrice for custom services
        item.unitPrice = value;
        item.total = item.quantity * item.unitPrice;
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

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const total = subtotal - discount;

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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-navy">
              {id ? 'Editar Orçamento' : 'Novo Orçamento'}
            </h1>
            <p className="text-slate-600 mt-1">Crie e gerencie seus orçamentos</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/quotes')}>
              Cancelar
            </Button>
            {id && selectedClientId && (
              <WhatsAppButton
                phoneNumber={clients.find((c) => c.id === selectedClientId)?.phone || ''}
                clientName={clients.find((c) => c.id === selectedClientId)?.name || ''}
                docType="Orçamento"
                docLink={`${window.location.origin}/p/quote/${id}`}
                googleReviewUrl={(company as any)?.googleReviewUrl}
                size="md"
              />
            )}
            <Button
              variant="secondary"
              onClick={handleGeneratePDFClick}
              className="flex items-center gap-2"
              disabled={!selectedClientId || items.length === 0}
            >
              <Download className="w-5 h-5" />
              Gerar PDF
            </Button>
            {id && (
              <Button
                variant="outline"
                onClick={() => setShowContractModal(true)}
                className="flex items-center gap-2"
                disabled={!selectedClientId || items.length === 0}
              >
                <FileText className="w-5 h-5" />
                Gerar Contrato
              </Button>
            )}
            {id && status === 'approved' && (
              <>
                <Button
                  variant="primary"
                  onClick={handleCreateWorkOrder}
                  className="flex items-center gap-2"
                >
                  🛠️ Gerar Ordem de Serviço
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowContractModal(true)}
                  className="flex items-center gap-2 border-gold text-gold-700 hover:bg-gold-50"
                  disabled={!selectedClientId || items.length === 0}
                >
                  <FileText className="w-5 h-5" />
                  Gerar Contrato
                </Button>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-32">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client Selection */}
            <Card className="relative pb-32">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-navy">Cliente</h2>
              </div>
              
              {/* Search Bar */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  value={clientSearchTerm}
                  onChange={(e) => setClientSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                />
              </div>

              {/* Client List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {clients
                  .filter((client) => 
                    clientSearchTerm === '' || 
                    client.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
                    client.condominium.toLowerCase().includes(clientSearchTerm.toLowerCase())
                  )
                  .map((client) => (
                    <button
                      key={client.id}
                      onClick={() => setSelectedClientId(client.id)}
                      className={`w-full p-3 text-left border-2 rounded-lg transition-all ${
                        selectedClientId === client.id
                          ? 'border-navy bg-navy-50'
                          : 'border-slate-200 hover:border-navy hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-medium text-navy">{client.name}</div>
                      {client.condominium && (
                        <div className="text-sm text-slate-600">{client.condominium}</div>
                      )}
                    </button>
                  ))}
                {clients.filter((client) => 
                  clientSearchTerm === '' || 
                  client.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
                  client.condominium.toLowerCase().includes(clientSearchTerm.toLowerCase())
                ).length === 0 && (
                  <p className="text-center text-slate-500 py-8">Nenhum cliente encontrado</p>
                )}
              </div>

              {/* Sticky Footer */}
              <div className="fixed bottom-0 left-0 right-0 bg-white z-50 p-4 border-t border-slate-200 shadow-lg">
                <div className="max-w-7xl mx-auto flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowClientModal(true)}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Cadastrar Novo Cliente
                  </Button>
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
                    className="flex-1"
                    disabled={!selectedClientId}
                  >
                    Avançar
                  </Button>
                </div>
              </div>
            </Card>

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

              {/* Installation Category Grid */}
              {activeServiceTab === 'installation' && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-navy mb-4">Selecione o tipo de instalação:</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { icon: Square, name: 'Janela', catalogName: 'Janela de Vidro' },
                      { icon: DoorIcon, name: 'Porta', catalogName: 'Porta de Vidro' },
                      { icon: Package, name: 'Box', catalogName: 'Box Padrão' },
                      { icon: Shield, name: 'Guardacorpo', catalogName: 'Guarda-corpo' },
                      { icon: Home, name: 'Sacada', catalogName: 'Cortina de Vidro' },
                      { icon: Image, name: 'Espelho', catalogName: 'Divisória de Vidro' },
                      { icon: Lock, name: 'Fixo', catalogName: 'Divisória de Vidro' },
                      { icon: MoreHorizontal, name: 'Outro', catalogName: 'Outro' },
                    ].map((category) => (
                      <button
                        key={category.name}
                        onClick={() => {
                          if (category.catalogName === 'Outro') {
                            // Open modal with empty service name
                            setEditingItemIndex(null);
                            setShowInstallationModal(true);
                            (window as any).__selectedInstallationCategory = {
                              serviceName: '',
                              pricingMethod: 'm2',
                              defaultPrice: 0,
                            };
                          } else {
                            // Open library modal to select a model
                            setSelectedCategoryForLibrary({ catalogName: category.catalogName, categoryName: category.name });
                            setShowLibraryModal(true);
                          }
                        }}
                        className="p-4 border-2 border-slate-200 rounded-lg hover:border-navy hover:bg-navy-50 transition-all text-center group"
                      >
                        <category.icon className="w-8 h-8 mx-auto mb-2 text-slate-600 group-hover:text-navy" />
                        <div className="font-medium text-slate-700 group-hover:text-navy">{category.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
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

              {/* Items List */}
              {items.length === 0 ? (
                <p className="text-center text-slate-600 py-8">
                  Nenhum serviço adicionado. Selecione um serviço acima.
                </p>
              ) : (
                <div className="space-y-4">
                  {items.map((item, index) => {
                    const service = services.find((s) => s.id === item.serviceId);

                    return (
                      <div
                        key={index}
                        className="p-4 border border-slate-200 rounded-lg bg-slate-50"
                      >
                        <div className="flex justify-between items-start mb-3">
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
                                          newItems[index].total = area * newItems[index].quantity * newItems[index].unitPrice;
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
                                          newItems[index].total = area * newItems[index].quantity * newItems[index].unitPrice;
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
                                          newItems[index].total = area * quantity * newItems[index].unitPrice;
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
                                        newItems[index].total = newTotal;
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
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unitPrice}
                                onChange={(e) =>
                                  updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)
                                }
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
                                  newItems[index].total = newTotal;
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
                                    newItems[index].total = newTotal;
                                    // Recalculate unit price: New Unit Price = New Total / Quantity
                                    if (newItems[index].quantity > 0) {
                                      newItems[index].unitPrice = newTotal / newItems[index].quantity;
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
              )}
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
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                  />
                </div>
                <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:justify-between gap-2">
                  <span className="font-bold text-lg text-navy">Total:</span>
                  <CurrencyInput
                    value={total}
                    onChange={(newTotal) => {
                      // Recalculate discount: New Discount = Subtotal - New Total
                      const newDiscount = Math.max(0, subtotal - newTotal);
                      setDiscount(newDiscount);
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
    </Layout>
  );
}

