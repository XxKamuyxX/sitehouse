import { useState, useEffect } from 'react';
import { X, Wrench, Settings, Package } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { useCompany } from '../hooks/useCompany';
import { getProfessionCatalog, CatalogItem } from '../utils/professionCatalog';
import { getDocs } from 'firebase/firestore';
import { queryWithCompanyId } from '../lib/queries';
import { InstallationItemModal } from './InstallationItemModal';

interface ServiceSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectService: (item: {
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
  }) => void;
  companyId?: string;
}

type TabType = 'installation' | 'maintenance' | 'custom';

export function ServiceSelectorModal({
  isOpen,
  onClose,
  onSelectService,
  companyId,
}: ServiceSelectorModalProps) {
  const { company, loading: companyLoading } = useCompany();
  const [activeTab, setActiveTab] = useState<TabType>('installation');
  const [customServices, setCustomServices] = useState<Array<{
    id: string;
    name: string;
    description: string;
    defaultPrice: number;
    type: 'unit' | 'meter' | 'package';
  }>>([]);
  const [loadingCustom, setLoadingCustom] = useState(false);
  const [showInstallationModal, setShowInstallationModal] = useState(false);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<CatalogItem | null>(null);

  useEffect(() => {
    if (isOpen && activeTab === 'custom' && companyId) {
      loadCustomServices();
    }
  }, [isOpen, activeTab, companyId]);

  const loadCustomServices = async () => {
    if (!companyId) return;
    
    setLoadingCustom(true);
    try {
      const q = queryWithCompanyId('services', companyId);
      const snapshot = await getDocs(q);
      const servicesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Array<{
        id: string;
        name: string;
        description: string;
        defaultPrice: number;
        type: 'unit' | 'meter' | 'package';
      }>;
      setCustomServices(servicesData);
    } catch (error) {
      console.error('Error loading custom services:', error);
    } finally {
      setLoadingCustom(false);
    }
  };

  // Get profession with fallback - wait for company to load
  const profession = companyLoading 
    ? 'vidracaria' // Default while loading
    : (company as any)?.profession || (company as any)?.segment || 'vidracaria';
  
  // Get catalog - if profession is invalid, use generic/default catalog
  const catalog = getProfessionCatalog(profession) || getProfessionCatalog('vidracaria');
  
  // Check if profession is missing
  const hasProfession = !companyLoading && (company as any)?.profession || (company as any)?.segment;

  const handleSelectCatalogItem = (item: CatalogItem) => {
    if (item.category === 'installation' && item.requiresDimensions) {
      // For installation items with dimensions, open the installation modal
      setSelectedCatalogItem(item);
      setShowInstallationModal(true);
    } else {
      // For simple items, add directly
      const pricingMethod = item.pricingMethod || 'unit';
      const unitPrice = item.defaultPrice || 0;
      
      onSelectService({
        serviceId: item.id,
        serviceName: item.name,
        quantity: 1,
        unitPrice,
        total: unitPrice,
        isCustom: false,
        pricingMethod,
        isInstallation: item.category === 'installation',
        ...(item.requiresDimensions && {
          dimensions: {
            width: 0,
            height: 0,
            area: 0,
          },
        }),
      });
      onClose();
    }
  };

  const handleSelectCustomService = (service: typeof customServices[0]) => {
    const pricingMethod = service.type === 'meter' ? 'm2' : 'unit';
    const unitPrice = service.defaultPrice || 0;
    
    onSelectService({
      serviceId: service.id,
      serviceName: service.name,
      quantity: 1,
      unitPrice,
      total: unitPrice,
      isCustom: true,
      pricingMethod,
      ...(service.type === 'meter' && {
        dimensions: {
          width: 0,
          height: 0,
          area: 0,
        },
      }),
    });
    onClose();
  };

  const handleSaveInstallationItem = (itemData: any) => {
    if (!selectedCatalogItem) return;
    
    onSelectService({
      serviceId: selectedCatalogItem.id,
      serviceName: selectedCatalogItem.name,
      quantity: itemData.quantity || 1,
      unitPrice: itemData.unitPrice || selectedCatalogItem.defaultPrice || 0,
      total: itemData.total || itemData.unitPrice || selectedCatalogItem.defaultPrice || 0,
      isCustom: false,
      pricingMethod: selectedCatalogItem.pricingMethod,
      dimensions: itemData.dimensions,
      glassThickness: itemData.glassThickness,
      profileColor: itemData.profileColor,
      isInstallation: true,
    });
    setShowInstallationModal(false);
    setSelectedCatalogItem(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
            <h2 className="text-2xl font-bold text-navy">Adicionar Serviço</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('installation')}
              className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'installation'
                  ? 'border-navy text-navy'
                  : 'border-transparent text-slate-600 hover:text-navy'
              }`}
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Instalação
              </div>
            </button>
            <button
              onClick={() => setActiveTab('maintenance')}
              className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'maintenance'
                  ? 'border-navy text-navy'
                  : 'border-transparent text-slate-600 hover:text-navy'
              }`}
            >
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                Manutenção
              </div>
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'custom'
                  ? 'border-navy text-navy'
                  : 'border-transparent text-slate-600 hover:text-navy'
              }`}
            >
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Meus Serviços
              </div>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {!hasProfession && !companyLoading && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Atenção:</strong> Por favor, selecione sua profissão em{' '}
                  <strong>Configurações &gt; Dados da Empresa</strong> para ver os serviços disponíveis.
                </p>
              </div>
            )}
            
            {activeTab === 'installation' && (
              <div className="space-y-3">
                {companyLoading ? (
                  <p className="text-center text-slate-500 py-8">Carregando serviços...</p>
                ) : catalog.installation.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">
                    Nenhum serviço de instalação disponível para esta profissão.
                  </p>
                ) : (
                  catalog.installation.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelectCatalogItem(item)}
                      className="w-full p-4 text-left border border-slate-200 rounded-lg hover:border-navy hover:bg-navy-50 transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-bold text-navy mb-1">{item.name}</h3>
                          <p className="text-sm text-slate-600 mb-2">{item.description}</p>
                          <div className="flex gap-2 flex-wrap">
                            <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                              {item.pricingMethod === 'm2' ? 'Por m²' : 
                               item.pricingMethod === 'linear' ? 'Por metro' :
                               item.pricingMethod === 'fixed' ? 'Preço fixo' : 'Por unidade'}
                            </span>
                            {item.defaultPrice && (
                              <span className="px-2 py-1 bg-navy-100 text-navy-700 rounded text-xs font-medium">
                                R$ {item.defaultPrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="ml-4 text-navy">
                          <Settings className="w-5 h-5" />
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {activeTab === 'maintenance' && (
              <div className="space-y-3">
                {companyLoading ? (
                  <p className="text-center text-slate-500 py-8">Carregando serviços...</p>
                ) : catalog.maintenance.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">
                    Nenhum serviço de manutenção disponível para esta profissão.
                  </p>
                ) : (
                  catalog.maintenance.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelectCatalogItem(item)}
                      className="w-full p-4 text-left border border-slate-200 rounded-lg hover:border-navy hover:bg-navy-50 transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-bold text-navy mb-1">{item.name}</h3>
                          <p className="text-sm text-slate-600 mb-2">{item.description}</p>
                          <div className="flex gap-2 flex-wrap">
                            <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                              {item.pricingMethod === 'm2' ? 'Por m²' : 
                               item.pricingMethod === 'linear' ? 'Por metro' :
                               item.pricingMethod === 'fixed' ? 'Preço fixo' : 'Por unidade'}
                            </span>
                            {item.defaultPrice && (
                              <span className="px-2 py-1 bg-navy-100 text-navy-700 rounded text-xs font-medium">
                                R$ {item.defaultPrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="ml-4 text-navy">
                          <Wrench className="w-5 h-5" />
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {activeTab === 'custom' && (
              <div className="space-y-3">
                {loadingCustom ? (
                  <p className="text-center text-slate-500 py-8">Carregando serviços...</p>
                ) : customServices.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 mb-2">Nenhum serviço personalizado cadastrado</p>
                    <p className="text-sm text-slate-400">
                      Adicione serviços personalizados em Configurações &gt; Dados da Empresa &gt; Meus Serviços
                    </p>
                  </div>
                ) : (
                  customServices.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => handleSelectCustomService(service)}
                      className="w-full p-4 text-left border border-slate-200 rounded-lg hover:border-navy hover:bg-navy-50 transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-bold text-navy mb-1">{service.name}</h3>
                          <p className="text-sm text-slate-600 mb-2">{service.description}</p>
                          <div className="flex gap-2 flex-wrap">
                            <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                              {service.type === 'meter' ? 'Por metro' : 
                               service.type === 'package' ? 'Pacote' : 'Por unidade'}
                            </span>
                            {service.defaultPrice > 0 && (
                              <span className="px-2 py-1 bg-navy-100 text-navy-700 rounded text-xs font-medium">
                                R$ {service.defaultPrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="ml-4 text-navy">
                          <Package className="w-5 h-5" />
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </Card>
      </div>

      {/* Installation Modal for complex items */}
      {showInstallationModal && selectedCatalogItem && (
        <InstallationItemModal
          isOpen={showInstallationModal}
          onClose={() => {
            setShowInstallationModal(false);
            setSelectedCatalogItem(null);
          }}
          onSave={handleSaveInstallationItem}
          isInstallation={selectedCatalogItem.category === 'installation'}
          initialItem={{
            serviceName: selectedCatalogItem.name,
            pricingMethod: selectedCatalogItem.pricingMethod,
            unitPrice: selectedCatalogItem.defaultPrice || 0,
            glassThickness: selectedCatalogItem.metadata?.glassThickness?.[0],
            profileColor: selectedCatalogItem.metadata?.profileColor?.[0],
          }}
        />
      )}
    </>
  );
}
