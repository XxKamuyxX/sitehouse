import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Save, Trash2, Download, Plus } from 'lucide-react';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { pdf } from '@react-pdf/renderer';
import { QuotePDF } from '../components/QuotePDF';
import { InstallationItemModal } from '../components/InstallationItemModal';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

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
}

export function QuoteNew() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [status, setStatus] = useState<'draft' | 'sent' | 'approved' | 'cancelled'>('draft');
  const [warranty, setWarranty] = useState('');
  const [observations, setObservations] = useState('');
  const [customServiceName, setCustomServiceName] = useState('');
  const [customServicePrice, setCustomServicePrice] = useState(0);
  const [showCustomService, setShowCustomService] = useState(false);
  const [showInstallationModal, setShowInstallationModal] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [services, setServices] = useState<Service[]>(DEFAULT_SERVICES);
  const [diagnosis, setDiagnosis] = useState({
    beforePhotos: [] as string[],
    afterPhotos: [] as string[],
    notes: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await loadClients();
      await loadServices();
      if (id) {
        await loadQuote(id);
      } else {
        setLoading(false);
      }
    };
    init();
  }, [id]);

  const loadClients = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'clients'));
      const clientsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Client[];
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

  const addService = (service: Service) => {
    const newItem: QuoteItem = {
      serviceId: service.id,
      serviceName: service.name,
      quantity: 1,
      unitPrice: service.defaultPrice || 0,
      total: service.defaultPrice || 0,
      isCustom: false,
    };
    setItems([...items, newItem]);
  };

  const addCustomService = () => {
    if (!customServiceName || customServicePrice <= 0) {
      alert('Preencha o nome e o preço do serviço');
      return;
    }
    const newItem: QuoteItem = {
      serviceId: `custom-${Date.now()}`,
      serviceName: customServiceName,
      quantity: 1,
      unitPrice: customServicePrice,
      total: customServicePrice,
      isCustom: true,
    };
    setItems([...items, newItem]);
    setCustomServiceName('');
    setCustomServicePrice(0);
    setShowCustomService(false);
  };

  const updateItem = (index: number, field: 'quantity' | 'unitPrice', value: number) => {
    const newItems = [...items];
    const item = newItems[index];
    
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
      } else if (field === 'unitPrice') {
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
      } else if (field === 'unitPrice') {
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
        const sanitized: any = {
          serviceId: item.serviceId,
          serviceName: item.serviceName,
          quantity: item.quantity || 0,
          unitPrice: item.unitPrice || 0,
          total: item.total || 0,
          isCustom: item.isCustom || false,
        };
        
        // Add installation-specific fields if present
        if (item.isInstallation) {
          sanitized.isInstallation = true;
          if (item.pricingMethod) sanitized.pricingMethod = item.pricingMethod;
          if (item.dimensions) sanitized.dimensions = item.dimensions;
          if (item.glassColor) sanitized.glassColor = item.glassColor;
          if (item.glassThickness) sanitized.glassThickness = item.glassThickness;
          if (item.profileColor) sanitized.profileColor = item.profileColor;
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

      // Build quoteData - never use undefined
      const quoteData: any = {
        clientId: selectedClientId,
        clientName: selectedClient.name,
        items: sanitizedItems,
        subtotal: subtotal || 0,
        discount: discount || 0,
        total: total || 0,
        status: status || 'draft',
        warranty: warranty || '',
        observations: observations || '',
        updatedAt: new Date(),
      };

      // Only add diagnosis if it exists
      if (sanitizedDiagnosis) {
        quoteData.diagnosis = sanitizedDiagnosis;
      }

      // Only add createdAt for new quotes
      if (!id) {
        quoteData.createdAt = new Date();
      }

      if (id) {
        await updateDoc(doc(db, 'quotes', id), quoteData);
      } else {
        await addDoc(collection(db, 'quotes'), quoteData);
      }

      navigate('/quotes');
    } catch (error) {
      console.error('Error saving quote:', error);
      alert('Erro ao salvar orçamento');
    }
  };



  const handleGeneratePDF = async () => {
    if (!selectedClientId || items.length === 0) {
      alert('Complete o orçamento antes de gerar o PDF');
      return;
    }

    const selectedClient = clients.find((c) => c.id === selectedClientId);
    if (!selectedClient) return;

    try {
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
          cnpj="42.721.809/0001-52"
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
                size="md"
              />
            )}
            <Button
              variant="secondary"
              onClick={handleGeneratePDF}
              className="flex items-center gap-2"
              disabled={!selectedClientId || items.length === 0}
            >
              <Download className="w-5 h-5" />
              Gerar PDF
            </Button>
            <Button variant="primary" onClick={handleSave} className="flex items-center gap-2">
              <Save className="w-5 h-5" />
              Salvar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client Selection */}
            <Card>
              <h2 className="text-xl font-bold text-navy mb-4">Cliente</h2>
              <Select
                label="Selecione o Cliente"
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                options={[
                  { value: '', label: 'Selecione um cliente...' },
                  ...clients.map((client) => ({
                    value: client.id,
                    label: `${client.name} - ${client.condominium}`,
                  })),
                ]}
                required
              />
            </Card>

            {/* Services */}
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-navy">Serviços</h2>
              </div>

              {/* Add Service */}
              <div className="mb-4 p-4 border-2 border-dashed border-slate-300 rounded-lg">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
                  <p className="text-sm font-medium text-slate-700">Adicionar Serviço:</p>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setEditingItemIndex(null);
                        setShowInstallationModal(true);
                      }}
                      className="flex items-center gap-1 whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4" />
                      Instalação/Vidro
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCustomService(!showCustomService)}
                      className="whitespace-nowrap"
                    >
                      {showCustomService ? 'Cancelar' : '+ Serviço Manual'}
                    </Button>
                  </div>
                </div>

                {showCustomService && (
                  <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <h3 className="text-sm font-medium text-navy mb-3">Adicionar Serviço Manual</h3>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Nome do serviço"
                        value={customServiceName}
                        onChange={(e) => setCustomServiceName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                      />
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="number"
                          placeholder="Preço unitário (R$)"
                          min="0"
                          step="0.01"
                          value={customServicePrice}
                          onChange={(e) => setCustomServicePrice(parseFloat(e.target.value) || 0)}
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                        />
                        <Button 
                          variant="primary" 
                          size="sm" 
                          onClick={addCustomService}
                          className="w-full sm:w-auto whitespace-nowrap"
                        >
                          Adicionar
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {services.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => addService(service)}
                      className="text-left p-3 border border-slate-200 rounded-lg hover:border-navy hover:bg-navy-50 transition-colors"
                    >
                      <div className="font-medium text-navy">{service.name}</div>
                      <div className="text-xs text-slate-600">{service.description}</div>
                      <div className="text-xs text-gold font-medium mt-1">
                        R$ {service.defaultPrice?.toFixed(2)}
                        {service.type === 'meter' ? '/m' : service.type === 'package' ? '/pacote' : '/un'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

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
                            <div>
                              <label className="block text-xs text-slate-600 mb-1">Total</label>
                              <div className="px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium text-navy">
                                R$ {item.total.toFixed(2)}
                              </div>
                            </div>
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
                                <p className="text-xs text-slate-600 mb-1">Total</p>
                                <p className="text-lg font-bold text-navy">R$ {item.total.toFixed(2)}</p>
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
              <div className="space-y-3">
                <div className="flex justify-between text-slate-600">
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
                <div className="pt-3 border-t border-slate-200 flex justify-between">
                  <span className="font-bold text-lg text-navy">Total:</span>
                  <span className="font-bold text-lg text-navy">R$ {total.toFixed(2)}</span>
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
                placeholder="Itens que o cliente optou por não trocar, observações técnicas, etc."
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

        {/* Installation Item Modal */}
        <InstallationItemModal
          isOpen={showInstallationModal}
          onClose={() => {
            setShowInstallationModal(false);
            setEditingItemIndex(null);
          }}
          onSave={handleSaveInstallationItem}
          initialItem={editingItemIndex !== null ? items[editingItemIndex] : undefined}
        />
      </div>
    </Layout>
  );
}

