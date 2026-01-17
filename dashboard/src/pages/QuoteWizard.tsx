import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { InstallationItemModal } from '../components/InstallationItemModal';
import { TemplateSelectorModal } from '../components/TemplateSelectorModal';
import { VisualQuoteBuilder } from '../components/VisualQuoteBuilder';
import { PDFOptionsModal } from '../components/PDFOptionsModal';
import { ClientForm } from '../components/ClientForm';
import { MaintenanceCategorySelector } from '../components/MaintenanceCategorySelector';
import { MaintenanceServiceSelector } from '../components/MaintenanceServiceSelector';
import { InstallationCategorySelector } from '../components/InstallationCategorySelector';
import { InstallationServiceSelector } from '../components/InstallationServiceSelector';
import { Search, Plus, Wrench, ArrowLeft, ArrowRight, Save, Download, X, Trash2, Hammer } from 'lucide-react';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { queryWithCompanyId } from '../lib/queries';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../hooks/useCompany';
import { pdf } from '@react-pdf/renderer';
import { QuotePDF } from '../components/QuotePDF';

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
  pricingMethod?: 'm2' | 'linear' | 'fixed' | 'unit';
  dimensions?: {
    width: number;
    height: number;
    area?: number;
  };
  glassColor?: string;
  glassThickness?: string;
  profileColor?: string;
  isInstallation?: boolean;
  imageUrl?: string;
  templateId?: string;
}

type ServiceType = 'installation' | 'maintenance' | null;

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

export function QuoteWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userMetadata } = useAuth();
  const companyId = userMetadata?.companyId;
  const { company } = useCompany();
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [clientSearch, setClientSearch] = useState('');
  
  // Data state
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>(null);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [discount, setDiscount] = useState('');
  const [warranty, setWarranty] = useState('');
  const [observations, setObservations] = useState('');
  
  // UI state
  const [showClientModal, setShowClientModal] = useState(false);
  const [showTemplateSelectorModal, setShowTemplateSelectorModal] = useState(false);
  const [showVisualBuilder, setShowVisualBuilder] = useState(false);
  const [showInstallationModal, setShowInstallationModal] = useState(false);
  const [showPDFOptionsModal, setShowPDFOptionsModal] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [maintenanceCategory, setMaintenanceCategory] = useState<string | null>(null);
  const [maintenanceService, setMaintenanceService] = useState<{ name: string; description: string } | null>(null);
  const [installationCategory, setInstallationCategory] = useState<string | null>(null);
  const [installationService, setInstallationService] = useState<{ name: string; description: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (companyId) {
      loadClients();
      setLoading(false);
    }
  }, [companyId]);

  // Pre-select client from URL parameter
  useEffect(() => {
    const clientIdFromUrl = searchParams.get('clientId');
    if (clientIdFromUrl && clients.length > 0) {
      setSelectedClientId(clientIdFromUrl);
    }
  }, [searchParams, clients]);

  const loadClients = async () => {
    if (!companyId) return;
    try {
      const q = queryWithCompanyId('clients', companyId);
      const snapshot = await getDocs(q);
      const clientsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Client[];
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const handleCreateClient = async (clientData: Omit<Client, 'id'>) => {
    if (!companyId) {
      alert('Erro: Empresa não identificada.');
      return;
    }
    try {
      const newClientData = {
        ...clientData,
        companyId: companyId, // MANDATORY: Required by security rules
        createdAt: serverTimestamp(), // Use serverTimestamp for consistency
      };
      console.log('Creating client with data:', { ...newClientData, createdAt: '[serverTimestamp]' });
      const docRef = await addDoc(collection(db, 'clients'), newClientData);
      await loadClients();
      setSelectedClientId(docRef.id);
      setShowClientModal(false);
    } catch (error: any) {
      console.error('Error creating client:', error);
      console.error('Client data attempted:', { ...clientData, companyId, createdAt: '[serverTimestamp]' });
      alert(`Erro ao criar cliente: ${error.message}\n\nVerifique o console para mais detalhes.`);
    }
  };

  const handleSaveVisualItem = (itemData: any) => {
    const newItem: QuoteItem = {
      ...itemData,
      serviceId: `installation-${Date.now()}`,
      isInstallation: true,
      pricingMethod: itemData.dimensions?.width && itemData.dimensions?.height ? 'm2' : 'unit',
    };
    setItems([...items, newItem]);
    setShowVisualBuilder(false);
  };

  const handleSaveInstallationItem = (itemData: any) => {
    if (editingItemIndex !== null) {
      const newItems = [...items];
      newItems[editingItemIndex] = {
        ...newItems[editingItemIndex],
        ...itemData,
        serviceId: newItems[editingItemIndex].serviceId || `${itemData.isInstallation ? 'installation' : 'maintenance'}-${Date.now()}`,
        isInstallation: serviceType === 'installation', // Ensure isInstallation is set correctly
      };
      setItems(newItems);
      setEditingItemIndex(null);
    } else {
      const newItem: QuoteItem = {
        ...itemData,
        serviceId: `${itemData.isInstallation ? 'installation' : 'maintenance'}-${Date.now()}`,
        isInstallation: serviceType === 'installation', // Ensure isInstallation is set correctly
      };
      setItems([...items, newItem]);
    }
    setShowInstallationModal(false);
    // Reset maintenance flow after adding item
    if (serviceType === 'maintenance') {
      setMaintenanceCategory(null);
      setMaintenanceService(null);
    }
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  // Sanitize item data to remove undefined values
  const sanitizeItem = (item: QuoteItem): any => {
    const cleanItem: any = {
      serviceId: item.serviceId || '',
      serviceName: item.serviceName || '',
      quantity: item.quantity || 1,
      unitPrice: item.unitPrice || 0,
      total: item.total || 0,
      pricingMethod: item.pricingMethod || 'unit',
      isInstallation: item.isInstallation || false,
    };

    // Only include dimensions if they exist and are valid
    if (item.dimensions && (item.dimensions.width > 0 || item.dimensions.height > 0)) {
      cleanItem.dimensions = {
        width: item.dimensions.width || 0,
        height: item.dimensions.height || 0,
      };
      if (item.dimensions.area) {
        cleanItem.dimensions.area = item.dimensions.area;
      }
    }

    // Only include glass specs if they exist (for installation items)
    if (item.isInstallation) {
      cleanItem.glassColor = item.glassColor || '';
      cleanItem.glassThickness = item.glassThickness || '';
      cleanItem.profileColor = item.profileColor || '';
    } else {
      // For maintenance, ensure these fields are empty strings, not undefined
      cleanItem.glassColor = '';
      cleanItem.glassThickness = '';
      cleanItem.profileColor = '';
    }

    // Remove any undefined values
    Object.keys(cleanItem).forEach(key => {
      if (cleanItem[key] === undefined) {
        delete cleanItem[key];
      }
    });

    return cleanItem;
  };

  const handleSave = async () => {
    if (!companyId || !selectedClientId || items.length === 0) {
      alert('Complete todos os campos obrigatórios');
      return;
    }

    try {
      // Sanitize all items before saving
      const sanitizedItems = items.map(item => sanitizeItem(item));

      const quoteData = {
        clientId: selectedClientId,
        items: sanitizedItems,
        subtotal: sanitizedItems.reduce((sum, item) => sum + (item.total || 0), 0),
        discount: parseFloat(discount) || 0,
        total: sanitizedItems.reduce((sum, item) => sum + (item.total || 0), 0) - (parseFloat(discount) || 0),
        status: 'draft',
        warranty: warranty || '',
        observations: observations || '',
        companyId: companyId, // MANDATORY: Required by security rules
        createdAt: serverTimestamp(), // Use serverTimestamp for consistency
      };

      // Remove any undefined values from quoteData (except companyId which must exist)
      Object.keys(quoteData).forEach(key => {
        if ((quoteData as any)[key] === undefined && key !== 'companyId') {
          delete (quoteData as any)[key];
        }
      });

      // CRITICAL: Validate companyId before saving
      if (!quoteData.companyId) {
        alert('Erro: Empresa não identificada. Por favor, recarregue a página.');
        return;
      }

      console.log('Creating quote with data:', { ...quoteData, createdAt: '[serverTimestamp]' });
      await addDoc(collection(db, 'quotes'), quoteData);
      alert('Orçamento salvo com sucesso!');
      navigate('/quotes');
    } catch (error: any) {
      console.error('Error saving quote:', error);
      alert(`Erro ao salvar orçamento: ${error.message}`);
    }
  };

  const handleGeneratePDFClick = () => {
    if (!selectedClientId || items.length === 0) return;
    setShowPDFOptionsModal(true);
  };

  const handleGeneratePDF = async (options: { hideDimensions: boolean; hideUnitPrice: boolean }) => {
    const selectedClient = clients.find((c) => c.id === selectedClientId);
    if (!selectedClient || !company) return;

    try {
      let logoBase64: string | null = null;
      if (company.logoUrl) {
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
          subtotal={items.reduce((sum, item) => sum + item.total, 0)}
          discount={parseFloat(discount) || 0}
          total={items.reduce((sum, item) => sum + item.total, 0) - (parseFloat(discount) || 0)}
          createdAt={new Date()}
          warranty={warranty || undefined}
          observations={observations || undefined}
          hideDimensions={options.hideDimensions}
          hideUnitPrice={options.hideUnitPrice}
          companyData={{
            name: company.name,
            address: company.address,
            phone: company.phone,
            email: company.email || '',
            logoUrl: logoBase64 || company.logoUrl || undefined,
            cnpj: company.cnpj || '',
            pdfSettings: company.pdfSettings,
            paymentSettings: company.paymentSettings,
          }}
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

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.phone.includes(clientSearch) ||
    client.email.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const discountValue = parseFloat(discount) || 0;
  const total = subtotal - discountValue;

  // Step validation
  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return !!selectedClientId;
      case 2:
        return serviceType !== null;
      case 3:
        return items.length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <p className="text-slate-600">Carregando...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h-screen flex flex-col">
        {/* Progress Indicator */}
        <div className="px-4 pt-4 pb-2 border-b border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => navigate('/quotes')}
              className="text-slate-600 hover:text-secondary"
            >
              <X className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-secondary">Novo Orçamento</h1>
            <div className="w-5" />
          </div>
          <div className="flex gap-2 mt-3">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`flex-1 h-1 rounded-full ${
                  step <= currentStep ? 'bg-gradient-to-r from-primary to-primary-dark' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-slate-600 mt-2 text-center">
            {currentStep === 1 && 'Cliente'}
            {currentStep === 2 && 'Tipo de Serviço'}
            {currentStep === 3 && 'Itens'}
            {currentStep === 4 && 'Resumo'}
          </p>
        </div>

        {/* Step Content - Takes remaining space with padding for fixed footer */}
        <div className="flex-1 overflow-y-auto pb-20">
          {/* STEP 1: CLIENT SELECTION */}
          {currentStep === 1 && (
            <div className="p-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  placeholder="Buscar cliente por nome, telefone ou email..."
                  className="w-full pl-10 pr-4 py-3 text-lg border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                  autoFocus
                />
              </div>

              {filteredClients.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-600">
                    {clientSearch ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {filteredClients.map((client) => (
                    <li key={client.id}>
                      <button
                        onClick={() => {
                          setSelectedClientId(client.id);
                          // Auto-advance to next step after a short delay for visual feedback
                          setTimeout(() => {
                            if (canGoNext()) {
                              setCurrentStep(2);
                            }
                          }, 300);
                        }}
                        className={`w-full flex flex-row items-center justify-between p-3 transition-colors ${
                          selectedClientId === client.id
                            ? 'bg-primary/10 border-l-4 border-l-primary'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-sm font-semibold text-gray-900">{client.name}</span>
                        <span className="text-xs text-gray-500">{client.phone || ''}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* STEP 2: SERVICE TYPE */}
          {currentStep === 2 && (
            <div className="p-4 space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-secondary mb-2">Tipo de Serviço</h2>
                <p className="text-slate-600">Selecione o tipo de serviço que será prestado</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Installation Card */}
                <div
                  className={`p-6 cursor-pointer transition-all duration-200 rounded-lg h-full ${
                    serviceType === 'installation'
                      ? 'border-2 border-blue-600 bg-blue-50 shadow-md ring-1 ring-blue-600'
                      : 'border border-gray-200 bg-white hover:border-blue-300'
                  }`}
                  onClick={() => setServiceType('installation')}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg flex-shrink-0">
                      <Hammer className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        Instalação
                      </h3>
                      <p className="text-sm text-gray-700 mb-2">
                        Instalação de novos produtos ou execução de projetos.
                      </p>
                      <p className="text-xs text-gray-500">
                        Orçamento para itens novos e mão de obra.
                      </p>
                    </div>
                    {serviceType === 'installation' && (
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                        ✓
                      </div>
                    )}
                  </div>
                </div>

                {/* Maintenance Card */}
                <div
                  className={`p-6 cursor-pointer transition-all duration-200 rounded-lg h-full ${
                    serviceType === 'maintenance'
                      ? 'border-2 border-orange-600 bg-orange-50 shadow-md ring-1 ring-orange-600'
                      : 'border border-gray-200 bg-white hover:border-orange-300'
                  }`}
                  onClick={() => setServiceType('maintenance')}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-orange-100 rounded-lg flex-shrink-0">
                      <Wrench className="w-8 h-8 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        Manutenção / Reparo
                      </h3>
                      <p className="text-sm text-gray-700 mb-2">
                        Consertos, trocas de peças e ajustes técnicos.
                      </p>
                      <p className="text-xs text-gray-500">
                        Orçamento focado em serviço e peças de reposição.
                      </p>
                    </div>
                    {serviceType === 'maintenance' && (
                      <div className="w-6 h-6 rounded-full bg-orange-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                        ✓
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: ITEMS */}
          {currentStep === 3 && (
            <div className="p-4 space-y-4 pb-40">
              {/* Installation Flow: Category Selection */}
              {serviceType === 'installation' && !installationCategory && (
                <div>
                  <InstallationCategorySelector
                    onSelectCategory={(category) => {
                      setInstallationCategory(category);
                    }}
                  />
                </div>
              )}

              {/* Installation Flow: Service Selection */}
              {serviceType === 'installation' && installationCategory && !installationService && (
                <div>
                  <InstallationServiceSelector
                    category={installationCategory}
                    onSelectService={(service) => {
                      setInstallationService(service);
                      // Auto-open modal with pre-filled service
                      setEditingItemIndex(null);
                      setShowInstallationModal(true);
                    }}
                    onBack={() => setInstallationCategory(null)}
                  />
                </div>
              )}

              {/* Maintenance Flow: Category Selection */}
              {serviceType === 'maintenance' && !maintenanceCategory && (
                <div>
                  <MaintenanceCategorySelector
                    onSelectCategory={(category) => {
                      setMaintenanceCategory(category);
                    }}
                  />
                </div>
              )}

              {/* Maintenance Flow: Service Selection */}
              {serviceType === 'maintenance' && maintenanceCategory && !maintenanceService && (
                <div>
                  <MaintenanceServiceSelector
                    category={maintenanceCategory}
                    onSelectService={(service) => {
                      setMaintenanceService(service);
                      // Auto-open modal with pre-filled service
                      setEditingItemIndex(null);
                      setShowInstallationModal(true);
                    }}
                    onBack={() => setMaintenanceCategory(null)}
                  />
                </div>
              )}

              {/* Items List (shown when not in category/service selection) */}
              {!(
                (serviceType === 'maintenance' && (!maintenanceCategory || !maintenanceService)) ||
                (serviceType === 'installation' && (!installationCategory || !installationService))
              ) && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-secondary">Itens do Orçamento</h2>
                    {items.length > 0 && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          if (serviceType === 'installation') {
                            // Reset installation flow
                            setInstallationCategory(null);
                            setInstallationService(null);
                          } else {
                            // Reset maintenance flow
                            setMaintenanceCategory(null);
                            setMaintenanceService(null);
                          }
                        }}
                        className="flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Adicionar Item
                      </Button>
                    )}
                  </div>

                  {items.length === 0 ? (
                    <Card className="p-8 text-center">
                      <p className="text-slate-600 mb-4">Nenhum item adicionado ainda</p>
                      <p className="text-sm text-slate-500">
                        {serviceType === 'installation'
                          ? 'Selecione uma categoria acima para começar'
                          : 'Selecione uma categoria acima para começar'}
                      </p>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {items.map((item, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-bold text-secondary mb-1">{item.serviceName}</h3>
                              {item.isInstallation && item.glassColor && (
                                <p className="text-sm text-slate-600">Vidro: {item.glassColor}</p>
                              )}
                              {item.isInstallation && item.profileColor && (
                                <p className="text-sm text-slate-600">Perfil: {item.profileColor}</p>
                              )}
                              {item.isInstallation && item.dimensions && (
                                <p className="text-sm text-slate-600">
                                  {item.dimensions.width}mm × {item.dimensions.height}mm
                                </p>
                              )}
                              <p className="text-sm font-medium text-secondary mt-2">
                                Qtd: {item.quantity} × R$ {item.unitPrice.toFixed(2)} = R$ {item.total.toFixed(2)}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingItemIndex(index);
                                  if (item.isInstallation) {
                                    setSelectedTemplate(null);
                                  } else {
                                    setMaintenanceCategory(null);
                                    setMaintenanceService(null);
                                  }
                                  setShowInstallationModal(true);
                                }}
                                className="text-slate-600 hover:text-secondary"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleRemoveItem(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* STEP 4: SUMMARY */}
          {currentStep === 4 && (
            <div className="p-4 space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-secondary mb-2">Resumo do Orçamento</h2>
                {selectedClient && (
                  <p className="text-slate-600">Cliente: {selectedClient.name}</p>
                )}
              </div>

              {/* Items Summary */}
              <Card className="p-4">
                <h3 className="font-bold text-secondary mb-3">Itens</h3>
                <div className="space-y-2 mb-4">
                  {items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.serviceName}</span>
                      <span className="font-medium">R$ {item.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-200 pt-3 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-medium">R$ {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2 w-full">
                    <label className="text-sm text-slate-600 whitespace-normal flex-shrink-0">Desconto (R$)</label>
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      placeholder="Valor (R$)"
                      className="flex-1 px-3 py-2 text-lg border border-slate-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-navy"
                    />
                  </div>
                  <div className="flex justify-between text-lg font-bold text-secondary pt-2 border-t border-slate-200">
                    <span>Total:</span>
                    <span>R$ {total.toFixed(2)}</span>
                  </div>
                </div>
              </Card>

              {/* Optional Fields */}
              <Card className="p-4 space-y-4">
                <Input
                  label="Garantia"
                  value={warranty}
                  onChange={(e) => setWarranty(e.target.value)}
                  placeholder="Ex: 90 dias"
                />
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Observações
                  </label>
                  <textarea
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    placeholder="Observações adicionais..."
                    rows={3}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy resize-none"
                  />
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Fixed Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white p-3 flex gap-3 shadow-lg z-50">
          {currentStep === 1 ? (
            <>
              <Button
                variant="outline"
                onClick={() => setShowClientModal(true)}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Novo Cliente
              </Button>
              <Button
                variant="primary"
                onClick={() => setCurrentStep(2)}
                disabled={!canGoNext()}
                className="flex-1 flex items-center justify-center gap-2"
              >
                Próximo
                <ArrowRight className="w-5 h-5" />
              </Button>
            </>
          ) : currentStep > 1 && currentStep < 4 ? (
            <>
              <Button
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Voltar
              </Button>
              <Button
                variant="primary"
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canGoNext()}
                className="flex-1 flex items-center justify-center gap-2"
              >
                Próximo
                <ArrowRight className="w-5 h-5" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleGeneratePDFClick}
                disabled={!selectedClientId || items.length === 0}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                PDF
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={!selectedClientId || items.length === 0}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                Salvar
              </Button>
            </>
          )}
        </div>

        {/* Modals */}
        {showClientModal && (
          <ClientForm
            onSave={handleCreateClient}
            onCancel={() => setShowClientModal(false)}
            vipCondominiums={VIP_CONDOMINIUMS}
          />
        )}

        {showVisualBuilder && (
          <VisualQuoteBuilder
            isOpen={showVisualBuilder}
            onClose={() => {
              setShowVisualBuilder(false);
            }}
            onSave={handleSaveVisualItem}
          />
        )}

        {showTemplateSelectorModal && (
          <TemplateSelectorModal
            isOpen={showTemplateSelectorModal}
            onClose={() => {
              setShowTemplateSelectorModal(false);
            }}
            onSelectTemplate={(template: any) => {
              // If manual option selected, open modal with empty fields
              if (template.id === 'manual') {
                setSelectedTemplate({
                  serviceName: '',
                  isInstallation: true,
                  pricingMethod: 'm2',
                });
              } else {
                // If template selected, pre-fill with template data
                setSelectedTemplate({
                  serviceName: template.name,
                  isInstallation: true,
                  pricingMethod: 'm2',
                });
              }
              setShowTemplateSelectorModal(false);
              setShowInstallationModal(true);
            }}
          />
        )}

        {showInstallationModal && (
          <InstallationItemModal
            isOpen={showInstallationModal}
            onClose={() => {
              setShowInstallationModal(false);
              setEditingItemIndex(null);
              setSelectedTemplate(null);
              if (serviceType === 'maintenance') {
                setMaintenanceCategory(null);
                setMaintenanceService(null);
              }
              if (serviceType === 'installation') {
                setInstallationCategory(null);
                setInstallationService(null);
              }
            }}
            onSave={handleSaveInstallationItem}
            initialItem={
              editingItemIndex !== null
                ? items[editingItemIndex]
                : serviceType === 'installation' && installationService
                  ? {
                      serviceName: installationService.name,
                      isInstallation: true,
                      pricingMethod: 'm2',
                      quantity: 1,
                      unitPrice: 0,
                      total: 0,
                      imageUrl: installationService.imageUrl,
                      templateId: installationService.templateId,
                    }
                  : serviceType === 'maintenance' && maintenanceService
                    ? {
                        serviceName: `Manutenção de ${maintenanceCategory ? maintenanceCategory.charAt(0).toUpperCase() + maintenanceCategory.slice(1) : ''} - ${maintenanceService.name}`,
                        isInstallation: false,
                        pricingMethod: 'unit',
                        quantity: 1,
                        unitPrice: 0,
                        total: 0,
                        imageUrl: maintenanceService.imageUrl,
                        templateId: maintenanceService.templateId,
                      }
                    : selectedTemplate
                      ? {
                          serviceName: selectedTemplate.serviceName || selectedTemplate.name || '',
                          isInstallation: true,
                          pricingMethod: 'm2',
                        }
                      : undefined
            }
            isInstallation={serviceType === 'installation'}
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
