import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Save, Upload, X, Plus, Edit2, Trash2, Package, AppWindow, Wrench, Key, Building2, Palette, FileText, Settings } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useCompany } from '../hooks/useCompany';
import { useStorage } from '../hooks/useStorage';
import { useAuth } from '../contexts/AuthContext';
import { compressFile } from '../utils/compressImage';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { queryWithCompanyId } from '../lib/queries';
import { getDefaultContractTemplate } from '../utils/contractTemplates';

// Contract Variables Toolbar Component
function ContractVariablesToolbar({ onInsert }: { onInsert: (variable: string) => void }) {
  const variables = [
    { label: 'Nome Cliente', value: '{CLIENT_NAME}' },
    { label: 'CPF/CNPJ Cliente', value: '{CLIENT_CPF_CNPJ}' },
    { label: 'Endereço Cliente', value: '{CLIENT_ADDRESS}' },
    { label: 'Total', value: '{TOTAL}' },
    { label: 'Data', value: '{DATE}' },
    { label: 'Cidade', value: '{CITY}' },
    { label: 'Nome Empresa', value: '{COMPANY_NAME}' },
    { label: 'CNPJ Empresa', value: '{COMPANY_CNPJ}' },
    { label: 'Endereço Empresa', value: '{COMPANY_ADDRESS}' },
    { label: 'Data Início', value: '{START_DATE}' },
    { label: 'Data Entrega', value: '{DELIVERY_DATE}' },
    { label: 'Método Pagamento', value: '{PAYMENT_METHOD}' },
    { label: 'Detalhes Pagamento', value: '{PAYMENT_DETAILS}' },
    { label: 'Testemunha 1 Nome', value: '{WITNESS1_NAME}' },
    { label: 'Testemunha 1 CPF', value: '{WITNESS1_CPF}' },
    { label: 'Testemunha 2 Nome', value: '{WITNESS2_NAME}' },
    { label: 'Testemunha 2 CPF', value: '{WITNESS2_CPF}' },
  ];

  return (
    <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
      <p className="text-xs font-medium text-slate-700 mb-2">Variáveis Disponíveis (clique para inserir):</p>
      <div className="flex flex-wrap gap-2">
        {variables.map((variable) => (
          <button
            key={variable.value}
            type="button"
            onClick={() => onInsert(variable.value)}
            className="px-2 py-1 text-xs bg-white border border-slate-300 rounded-md hover:bg-slate-100 hover:border-navy transition-colors"
          >
            {variable.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// PDF Preview Component
function PDFPreview({ 
  companyName, 
  logoUrl, 
  primaryColor, 
  documentTitle 
}: { 
  companyName: string; 
  logoUrl: string | null; 
  primaryColor: string; 
  documentTitle: string;
}) {
  return (
    <div className="bg-white border-2 border-slate-300 rounded-lg shadow-lg p-4">
      <p className="text-xs font-medium text-slate-600 mb-3">Preview do Cabeçalho do PDF:</p>
      <div className="border border-slate-200 rounded">
        {/* PDF Header Preview */}
        <div 
          className="p-4 rounded-t"
          style={{ backgroundColor: primaryColor + '15', borderBottom: `2px solid ${primaryColor}` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {logoUrl && (
                <img 
                  src={logoUrl} 
                  alt="Logo" 
                  className="h-12 w-12 object-contain"
                />
              )}
              <div>
                <h3 className="font-bold text-sm" style={{ color: primaryColor }}>
                  {companyName || 'Nome da Empresa'}
                </h3>
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 bg-white rounded-b">
          <h2 className="text-lg font-bold text-center" style={{ color: primaryColor }}>
            {documentTitle || 'ORÇAMENTO DE SERVIÇOS'}
          </h2>
        </div>
      </div>
    </div>
  );
}

export function CompanySettings() {
  const { company, loading, updateCompany } = useCompany();
  const { userMetadata } = useAuth();
  const companyId = userMetadata?.companyId;
  const { uploadImage, uploading } = useStorage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contractTextareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'perfil' | 'marca' | 'contrato' | 'ajustes'>('perfil');
  
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    address: '',
    phone: '',
    email: '',
    primaryColor: '#0F172A',
    googleReviewUrl: '',
    contractTemplate: '',
    segment: 'glazier' as string,
    profession: '' as '' | 'vidracaria' | 'serralheria' | 'chaveiro' | 'marido-de-aluguel' | 'eletrica-hidraulica',
  });
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [compressingSignature, setCompressingSignature] = useState(false);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  
  // Services management
  const [services, setServices] = useState<Array<{
    id: string;
    name: string;
    description: string;
    defaultPrice: number;
    type: 'unit' | 'meter' | 'package';
    category?: 'instalacao' | 'manutencao';
  }>>([]);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<{ id: string; name: string; description: string; defaultPrice: number; type: 'unit' | 'meter' | 'package'; category?: 'instalacao' | 'manutencao' } | null>(null);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    defaultPrice: 0,
    type: 'unit' as 'unit' | 'meter' | 'package',
    category: 'manutencao' as 'instalacao' | 'manutencao',
  });
  const [serviceFilter, setServiceFilter] = useState<'all' | 'instalacao' | 'manutencao'>('all');
  
  // Payment Settings
  const [paymentSettings, setPaymentSettings] = useState({
    pixDiscount: 5,
    maxInstallments: 3,
    paymentNotes: 'Entrada de 50% + restante na entrega.',
  });
  
  // PDF Settings
  const [pdfSettings, setPdfSettings] = useState({
    primaryColor: '#0F172A',
    secondaryColor: '#2563EB',
    documentTitle: 'ORÇAMENTO DE SERVIÇOS',
    quoteValidityDays: 15,
    customFooterText: '',
    showCnpj: true,
    legalTerms: '',
  });

  useEffect(() => {
    if (company) {
      const profession = (company as any).profession || 
                        ((company as any).segment === 'metalwork' ? 'serralheria' : 
                         (company as any).segment === 'locksmith' ? 'chaveiro' :
                         (company as any).segment === 'handyman' ? 'marido-de-aluguel' :
                         (company as any).segment === 'electrician' || (company as any).segment === 'plumber' ? 'eletrica-hidraulica' :
                         (company as any).segment === 'glazier' ? 'vidracaria' : 'vidracaria');
      
      // If contractTemplate is empty, use default template based on profession
      const contractTemplate = (company as any).contractTemplate || getDefaultContractTemplate(profession);
      
      setFormData({
        name: company.name || '',
        cnpj: company.cnpj || '',
        address: company.address || '',
        phone: company.phone || '',
        email: company.email || '',
        primaryColor: (company as any).primaryColor || '#0F172A',
        googleReviewUrl: (company as any).googleReviewUrl || '',
        contractTemplate,
        segment: (company as any).segment || 'glazier', // Legacy field
        profession: profession as any,
      });
      setLogoUrl(company.logoUrl || null);
      setLogoPreview(company.logoUrl || null);
      setSignatureUrl((company as any).signatureUrl || null);
      setSignaturePreview((company as any).signatureUrl || null);
      
      // Load payment settings
      const paymentSettings = (company as any).paymentSettings || {
        pixDiscount: 5,
        maxInstallments: 3,
        paymentNotes: 'Entrada de 50% + restante na entrega.',
      };
      setPaymentSettings(paymentSettings);
      
      // Load PDF settings
      const pdfSettings = (company as any).pdfSettings || {
        primaryColor: (company as any).primaryColor || '#0F172A',
        secondaryColor: '#2563EB',
        documentTitle: 'ORÇAMENTO DE SERVIÇOS',
        quoteValidityDays: 15,
        customFooterText: '',
        showCnpj: true,
        legalTerms: '',
      };
      setPdfSettings(pdfSettings);
    }
  }, [company]);

  useEffect(() => {
    if (companyId) {
      loadServices();
    }
  }, [companyId]);

  const loadServices = async () => {
    if (!companyId) return;
    
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
      setServices(servicesData);
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  const handleSaveService = async () => {
    if (!companyId) {
      alert('Erro: Empresa não identificada');
      return;
    }

    if (!serviceForm.name || !serviceForm.description || serviceForm.defaultPrice <= 0) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      if (editingService) {
        // Update existing service
        await updateDoc(doc(db, 'services', editingService.id), {
          name: serviceForm.name,
          description: serviceForm.description,
          defaultPrice: serviceForm.defaultPrice,
          type: serviceForm.type,
          updatedAt: new Date(),
        });
        alert('Serviço atualizado com sucesso!');
      } else {
        // Create new service - CRITICAL: companyId MUST be in the payload
        const newServiceData = {
          name: serviceForm.name,
          description: serviceForm.description,
          defaultPrice: serviceForm.defaultPrice,
          type: serviceForm.type,
          category: serviceForm.category,
          companyId: companyId, // MANDATORY: Required by security rules
          createdAt: serverTimestamp(), // Use serverTimestamp for consistency
          updatedAt: serverTimestamp(),
        };
        console.log('Creating service with data:', { ...newServiceData, createdAt: '[serverTimestamp]', updatedAt: '[serverTimestamp]' });
        await addDoc(collection(db, 'services'), newServiceData);
        alert('Serviço criado com sucesso!');
      }
      
      setShowServiceModal(false);
      setEditingService(null);
      setServiceForm({ name: '', description: '', defaultPrice: 0, type: 'unit', category: 'manutencao' });
      loadServices();
    } catch (error) {
      console.error('Error saving service:', error);
      alert('Erro ao salvar serviço');
    }
  };

  const handleEditService = (service: typeof services[0]) => {
    setEditingService(service);
    setServiceForm({
      name: service.name,
      description: service.description,
      defaultPrice: service.defaultPrice,
      type: service.type,
      category: service.category || 'manutencao',
    });
    setShowServiceModal(true);
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'services', serviceId));
      alert('Serviço excluído com sucesso!');
      loadServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Erro ao excluir serviço');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas imagens');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setLogoPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      // Compress image before upload
      setCompressing(true);
      console.log(`Original logo size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
      const compressedFile = await compressFile(file);
      console.log(`Compressed logo size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
      setCompressing(false);

      // Upload to Firebase Storage
      const storagePath = `logos/${companyId}/logo.png`;
      const url = await uploadImage(compressedFile, storagePath);
      setLogoUrl(url);
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Erro ao fazer upload do logo');
      setLogoPreview(null);
      setCompressing(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl(null);
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSignatureSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas imagens');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setSignaturePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      // Compress image before upload
      setCompressingSignature(true);
      console.log(`Original signature size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
      const compressedFile = await compressFile(file);
      console.log(`Compressed signature size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
      setCompressingSignature(false);

      // Upload to Firebase Storage
      const storagePath = `signatures/${companyId}/signature.png`;
      const url = await uploadImage(compressedFile, storagePath);
      setSignatureUrl(url);
    } catch (error) {
      console.error('Error uploading signature:', error);
      alert('Erro ao fazer upload da assinatura');
      setSignaturePreview(null);
      setCompressingSignature(false);
    }
  };

  const handleRemoveSignature = () => {
    setSignatureUrl(null);
    setSignaturePreview(null);
    if (signatureInputRef.current) {
      signatureInputRef.current.value = '';
    }
  };

  const handleInsertVariable = (variable: string) => {
    const textarea = contractTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.contractTemplate;
    const newText = text.substring(0, start) + variable + text.substring(end);
    
    setFormData({ ...formData, contractTemplate: newText });
    
    // Set cursor position after inserted variable
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.address || !formData.phone) {
      alert('Preencha pelo menos Nome, Endereço e Telefone');
      return;
    }

    // Mandatory onboarding check: profession must be selected
    if (!formData.profession) {
      alert('Por favor, selecione o Tipo de Serviço/Ramo de Atividade antes de continuar. Esta informação é obrigatória.');
      return;
    }

    // Ensure companyId is available
    if (!companyId) {
      alert('Erro: ID da empresa não encontrado. Por favor, recarregue a página.');
      return;
    }

    setSaving(true);
    try {
      // Sanitize payload: ensure all fields have values (never undefined)
      // Use JSON.parse(JSON.stringify()) to strip undefined values, then set defaults
      const rawData: any = {
        name: formData.name.trim() || '',
        address: formData.address.trim() || '',
        phone: formData.phone.trim() || '',
        primaryColor: formData.primaryColor || '#0F172A',
        cnpj: formData.cnpj?.trim() || '',
        email: formData.email?.trim() || '',
        googleReviewUrl: formData.googleReviewUrl?.trim() || '',
        segment: formData.segment || 'glazier', // Legacy field for backward compatibility
        profession: formData.profession, // New mandatory field for onboarding
      };

      // Only include logoUrl and signatureUrl if they exist
      if (logoUrl) {
        rawData.logoUrl = logoUrl;
      }
      if (signatureUrl) {
        rawData.signatureUrl = signatureUrl;
      }
      
      // Include contractTemplate if exists
      if (formData.contractTemplate) {
        rawData.contractTemplate = formData.contractTemplate;
      }
      
      // Include payment settings
      rawData.paymentSettings = paymentSettings;
      
      // Include PDF settings
      rawData.pdfSettings = pdfSettings;

      // Strip undefined values using JSON serialization
      const cleanData = JSON.parse(JSON.stringify(rawData));

      await updateCompany(cleanData);
      alert('Dados da empresa salvos com sucesso!');
    } catch (error: any) {
      console.error('Error saving company data:', error);
      alert(error.message || 'Erro ao salvar dados da empresa');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !companyId) {
    return (
      <Layout>
        <Card>
          <p className="text-center text-slate-600 py-8">Carregando dados da empresa...</p>
        </Card>
      </Layout>
    );
  }

  // Check if onboarding is incomplete
  const isOnboardingIncomplete = !formData.profession || !formData.name || formData.name.trim() === '';

  const tabs = [
    { id: 'perfil' as const, label: '🏢 Perfil & Contato', icon: Building2 },
    { id: 'marca' as const, label: '🎨 Marca & PDF', icon: Palette },
    { id: 'contrato' as const, label: '📄 Contrato & Termos', icon: FileText },
    { id: 'ajustes' as const, label: '⚙️ Ajustes & Financeiro', icon: Settings },
  ];

  return (
    <Layout>
      <div className="space-y-6 pb-24">
        <div>
          <h1 className="text-3xl font-bold text-navy">Dados da Empresa</h1>
          <p className="text-slate-600 mt-1">Configure as informações da sua empresa para aparecer nos PDFs</p>
          
          {/* Onboarding Alert */}
          {isOnboardingIncomplete && (
            <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Configuração Inicial Necessária
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Para acessar todas as funcionalidades do sistema, você precisa completar seu perfil:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      {(!formData.name || formData.name.trim() === '') && (
                        <li>Preencha o <strong>Nome da Empresa</strong></li>
                      )}
                      {!formData.profession && (
                        <li>Selecione o <strong>Tipo de Serviço/Ramo de Atividade</strong></li>
                      )}
                    </ul>
                    <p className="mt-2 font-medium">
                      Após preencher e salvar, você terá acesso completo ao sistema.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs Navigation */}
        <Card className="p-0">
          <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-navy text-navy bg-navy-50'
                      : 'border-transparent text-slate-600 hover:text-navy hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Tab 1: Perfil & Contato */}
            {activeTab === 'perfil' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-navy mb-4">Informações Básicas *</h2>
                  <div className="space-y-4">
                    <Input
                      label="Nome da Empresa *"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nome da sua empresa"
                      required
                    />

                    <Input
                      label="Endereço Completo *"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Rua, número, bairro, cidade - UF"
                      required
                    />

                    <Input
                      label="Telefone/WhatsApp *"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(31) 99999-9999"
                      required
                    />

                    <Input
                      label="CNPJ"
                      value={formData.cnpj}
                      onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                      placeholder="00.000.000/0000-00"
                    />

                    <Input
                      label="Email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="contato@empresa.com.br"
                    />

                    <div>
                      <Input
                        label="Link de Avaliação Google"
                        type="url"
                        value={formData.googleReviewUrl}
                        onChange={(e) => setFormData({ ...formData, googleReviewUrl: e.target.value })}
                        placeholder="https://g.page/r/..."
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Cole aqui o link que você manda para o cliente te avaliar. Este link será incluído automaticamente nas mensagens do WhatsApp quando você enviar orçamentos e recibos.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Profession Selection - 2x2 Grid */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Tipo de Serviço/Ramo de Atividade *
                  </label>
                  <p className="text-xs text-slate-500 mb-4">
                    Selecione o tipo principal de serviço que sua empresa oferece. Esta informação é obrigatória.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Vidraçaria */}
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, profession: 'vidracaria', segment: 'glazier' })}
                      className={`p-4 rounded-xl border-2 transition-all text-left hover:shadow-lg ${
                        formData.profession === 'vidracaria'
                          ? 'border-navy bg-navy-50 shadow-md ring-2 ring-navy ring-offset-2'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`p-2 rounded-lg ${
                          formData.profession === 'vidracaria' ? 'bg-navy text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          <AppWindow className="w-5 h-5" />
                        </div>
                        <h3 className={`font-bold text-base ${
                          formData.profession === 'vidracaria' ? 'text-navy' : 'text-slate-700'
                        }`}>
                          Vidraçaria
                        </h3>
                      </div>
                      <p className="text-xs text-slate-600">
                        Instalação, manutenção e reparo de vidros
                      </p>
                    </button>

                    {/* Serralheria */}
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, profession: 'serralheria', segment: 'metalwork' })}
                      className={`p-4 rounded-xl border-2 transition-all text-left hover:shadow-lg ${
                        formData.profession === 'serralheria'
                          ? 'border-navy bg-navy-50 shadow-md ring-2 ring-navy ring-offset-2'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`p-2 rounded-lg ${
                          formData.profession === 'serralheria' ? 'bg-navy text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          <Wrench className="w-5 h-5" />
                        </div>
                        <h3 className={`font-bold text-base ${
                          formData.profession === 'serralheria' ? 'text-navy' : 'text-slate-700'
                        }`}>
                          Serralheria
                        </h3>
                      </div>
                      <p className="text-xs text-slate-600">
                        Trabalhos em metal, portões e estruturas
                      </p>
                    </button>

                    {/* Chaveiro */}
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, profession: 'chaveiro', segment: 'locksmith' })}
                      className={`p-4 rounded-xl border-2 transition-all text-left hover:shadow-lg ${
                        formData.profession === 'chaveiro'
                          ? 'border-navy bg-navy-50 shadow-md ring-2 ring-navy ring-offset-2'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`p-2 rounded-lg ${
                          formData.profession === 'chaveiro' ? 'bg-navy text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          <Key className="w-5 h-5" />
                        </div>
                        <h3 className={`font-bold text-base ${
                          formData.profession === 'chaveiro' ? 'text-navy' : 'text-slate-700'
                        }`}>
                          Chaveiro
                        </h3>
                      </div>
                      <p className="text-xs text-slate-600">
                        Serviços de chaveiro e segurança
                      </p>
                    </button>

                    {/* Marido de Aluguel */}
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, profession: 'marido-de-aluguel', segment: 'handyman' })}
                      className={`p-4 rounded-xl border-2 transition-all text-left hover:shadow-lg ${
                        formData.profession === 'marido-de-aluguel'
                          ? 'border-navy bg-navy-50 shadow-md ring-2 ring-navy ring-offset-2'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`p-2 rounded-lg ${
                          formData.profession === 'marido-de-aluguel' ? 'bg-navy text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          <Wrench className="w-5 h-5" />
                        </div>
                        <h3 className={`font-bold text-base ${
                          formData.profession === 'marido-de-aluguel' ? 'text-navy' : 'text-slate-700'
                        }`}>
                          Marido de Aluguel
                        </h3>
                      </div>
                      <p className="text-xs text-slate-600">
                        Manutenção e reparos residenciais
                      </p>
                    </button>
                  </div>
                  {!formData.profession && (
                    <p className="text-xs text-red-600 mt-2">⚠️ Por favor, selecione um tipo de serviço para continuar</p>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Marca & PDF */}
            {activeTab === 'marca' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-navy mb-4">Logo da Empresa</h2>
                    <div className="flex items-center gap-4">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label
                        htmlFor="logo-upload"
                        className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                      >
                        <Upload className="w-5 h-5" />
                        {compressing ? 'Comprimindo...' : uploading ? 'Enviando...' : 'Selecionar Logo'}
                      </label>
                      {logoPreview && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRemoveLogo}
                          className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                          Remover
                        </Button>
                      )}
                    </div>
                    {logoPreview && (
                      <div className="mt-4">
                        <div className="inline-block p-4 border border-slate-200 rounded-lg bg-white">
                          <img
                            src={logoPreview}
                            alt="Logo preview"
                            className="max-h-32 max-w-64 object-contain"
                          />
                        </div>
                      </div>
                    )}
                    {!logoPreview && logoUrl && (
                      <div className="mt-4">
                        <div className="inline-block p-4 border border-slate-200 rounded-lg bg-white">
                          <img
                            src={logoUrl}
                            alt="Logo atual"
                            className="max-h-32 max-w-64 object-contain"
                          />
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-slate-500 mt-2">
                      O logo aparecerá no cabeçalho do sistema e dos PDFs.
                    </p>
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-navy mb-4">Cores do Tema</h2>
                    
                    {/* Preset Colors */}
                    <div className="mb-4">
                      <p className="text-xs text-slate-600 mb-2">Cores pré-definidas:</p>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { name: 'Navy', value: '#0F172A' },
                          { name: 'Azul', value: '#1E40AF' },
                          { name: 'Verde', value: '#059669' },
                          { name: 'Amarelo', value: '#D97706' },
                          { name: 'Vermelho', value: '#DC2626' },
                          { name: 'Roxo', value: '#7C3AED' },
                          { name: 'Rosa', value: '#DB2777' },
                          { name: 'Teal', value: '#0D9488' },
                        ].map((color) => (
                          <button
                            key={color.value}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, primaryColor: color.value });
                              setPdfSettings({ ...pdfSettings, primaryColor: color.value });
                            }}
                            className={`p-2 rounded-lg border-2 transition-all ${
                              pdfSettings.primaryColor === color.value
                                ? 'border-navy bg-navy-50 ring-2 ring-navy ring-offset-1'
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                          >
                            <div
                              className="w-full h-8 rounded border border-slate-300"
                              style={{ backgroundColor: color.value }}
                            />
                            <span className="text-xs font-medium text-slate-700 mt-1 block">{color.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Color Picker */}
                    <div className="border-t border-slate-200 pt-4">
                      <p className="text-xs text-slate-600 mb-2">Cor personalizada:</p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={pdfSettings.primaryColor}
                            onChange={(e) => {
                              setPdfSettings({ ...pdfSettings, primaryColor: e.target.value });
                              setFormData({ ...formData, primaryColor: e.target.value });
                            }}
                            className="h-12 w-16 rounded-lg border-2 border-slate-300 cursor-pointer"
                            title="Selecionar cor personalizada"
                          />
                        </div>
                        <Input
                          value={pdfSettings.primaryColor}
                          onChange={(e) => {
                            setPdfSettings({ ...pdfSettings, primaryColor: e.target.value });
                            setFormData({ ...formData, primaryColor: e.target.value });
                          }}
                          placeholder="#0F172A"
                          className="flex-1 max-w-xs"
                        />
                      </div>
                    </div>

                    {/* Secondary Color */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Cor Secundária (Hex)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={pdfSettings.secondaryColor}
                          onChange={(e) => setPdfSettings({ ...pdfSettings, secondaryColor: e.target.value })}
                          className="w-16 h-10 border border-slate-300 rounded-lg cursor-pointer"
                        />
                        <Input
                          value={pdfSettings.secondaryColor}
                          onChange={(e) => setPdfSettings({ ...pdfSettings, secondaryColor: e.target.value })}
                          placeholder="#2563EB"
                          className="flex-1 max-w-xs"
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Cor de destaque/accent nos PDFs</p>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-navy mb-4">Configurações do PDF</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Título do Documento
                        </label>
                        <Input
                          value={pdfSettings.documentTitle}
                          onChange={(e) => setPdfSettings({ ...pdfSettings, documentTitle: e.target.value })}
                          placeholder="ORÇAMENTO DE SERVIÇOS"
                        />
                        <p className="text-xs text-slate-500 mt-1">Título que aparece no topo dos PDFs</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Texto do Rodapé
                        </label>
                        <textarea
                          value={pdfSettings.customFooterText}
                          onChange={(e) => setPdfSettings({ ...pdfSettings, customFooterText: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                          rows={2}
                          placeholder="Ex: Obrigado pela preferência! Visite nosso site."
                        />
                        <p className="text-xs text-slate-500 mt-1">Texto que aparece no rodapé dos PDFs (opcional)</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Termos Legais / Garantia
                        </label>
                        <textarea
                          value={pdfSettings.legalTerms}
                          onChange={(e) => setPdfSettings({ ...pdfSettings, legalTerms: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                          rows={4}
                          placeholder="Ex: Garantia de 90 dias contra defeitos de execução..."
                        />
                        <p className="text-xs text-slate-500 mt-1">Texto padrão sobre garantia e termos de serviço</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={pdfSettings.showCnpj}
                          onChange={(e) => setPdfSettings({ ...pdfSettings, showCnpj: e.target.checked })}
                          className="w-5 h-5 text-navy focus:ring-navy border-slate-300 rounded"
                          id="showCnpj"
                        />
                        <label htmlFor="showCnpj" className="text-sm font-medium text-slate-700 cursor-pointer">
                          Exibir CNPJ nos documentos
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-navy mb-4">Assinatura Digital</h2>
                    <div className="flex items-center gap-4">
                      <input
                        ref={signatureInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleSignatureSelect}
                        className="hidden"
                        id="signature-upload"
                      />
                      <label
                        htmlFor="signature-upload"
                        className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                      >
                        <Upload className="w-5 h-5" />
                        {compressingSignature ? 'Comprimindo...' : uploading ? 'Enviando...' : 'Selecionar Assinatura'}
                      </label>
                      {signaturePreview && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRemoveSignature}
                          className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                          Remover
                        </Button>
                      )}
                    </div>
                    {signaturePreview && (
                      <div className="mt-4">
                        <div className="inline-block p-4 border border-slate-200 rounded-lg bg-white">
                          <img
                            src={signaturePreview}
                            alt="Assinatura preview"
                            className="max-h-32 max-w-64 object-contain"
                          />
                        </div>
                      </div>
                    )}
                    {!signaturePreview && signatureUrl && (
                      <div className="mt-4">
                        <div className="inline-block p-4 border border-slate-200 rounded-lg bg-white">
                          <img
                            src={signatureUrl}
                            alt="Assinatura atual"
                            className="max-h-32 max-w-64 object-contain"
                          />
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-slate-500 mt-2">
                      A assinatura aparecerá nos PDFs de orçamentos e recibos.
                    </p>
                  </div>
                </div>

                {/* Live Preview - Right Side (Desktop) */}
                <div className="lg:col-span-1">
                  <div className="sticky top-6">
                    <PDFPreview
                      companyName={formData.name}
                      logoUrl={logoPreview || logoUrl}
                      primaryColor={pdfSettings.primaryColor}
                      documentTitle={pdfSettings.documentTitle}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Contrato & Termos */}
            {activeTab === 'contrato' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-navy mb-2">Contrato Padrão</h2>
                  <p className="text-sm text-slate-600 mb-4">
                    Defina o texto padrão do contrato. Use variáveis que serão substituídas automaticamente.
                  </p>
                  
                  <ContractVariablesToolbar onInsert={handleInsertVariable} />
                  
                  <textarea
                    ref={contractTextareaRef}
                    value={formData.contractTemplate}
                    onChange={(e) => setFormData({ ...formData, contractTemplate: e.target.value })}
                    placeholder="CONTRATO DE PRESTAÇÃO DE SERVIÇOS..."
                    rows={20}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy font-mono text-sm"
                  />
                </div>
              </div>
            )}

            {/* Tab 4: Ajustes & Financeiro */}
            {activeTab === 'ajustes' && (
              <div className="space-y-6">
                {/* Payment Settings */}
                <div>
                  <h2 className="text-xl font-bold text-navy mb-4">Configurações de Pagamento</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Desconto PIX (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={paymentSettings.pixDiscount}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, pixDiscount: parseFloat(e.target.value) || 0 })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                          placeholder="5"
                        />
                        <p className="text-xs text-slate-500 mt-1">Desconto aplicado em pagamentos via PIX</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Máximo de Parcelas
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="12"
                          value={paymentSettings.maxInstallments}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, maxInstallments: parseInt(e.target.value) || 1 })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                          placeholder="3"
                        />
                        <p className="text-xs text-slate-500 mt-1">Número máximo de parcelas permitidas</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Observações de Pagamento
                      </label>
                      <textarea
                        value={paymentSettings.paymentNotes}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, paymentNotes: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                        rows={3}
                        placeholder="Ex: Entrada de 50% + restante na entrega."
                      />
                      <p className="text-xs text-slate-500 mt-1">Texto padrão que aparece nos orçamentos sobre condições de pagamento</p>
                    </div>
                  </div>
                </div>

                {/* Services Management */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-navy">Meus Serviços Personalizados</h2>
                      <p className="text-sm text-slate-600 mt-1">
                        Adicione os serviços que sua empresa oferece. Eles aparecerão no catálogo ao criar orçamentos.
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setEditingService(null);
                        setServiceForm({ name: '', description: '', defaultPrice: 0, type: 'unit', category: 'manutencao' });
                        setShowServiceModal(true);
                      }}
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar Serviço
                    </Button>
                  </div>

                  {/* Service Filter Tabs */}
                  <div className="flex gap-2 mb-6 border-b border-slate-200">
                    <button
                      onClick={() => setServiceFilter('all')}
                      className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                        serviceFilter === 'all'
                          ? 'border-navy text-navy'
                          : 'border-transparent text-slate-600 hover:text-navy'
                      }`}
                    >
                      Todos ({services.length})
                    </button>
                    <button
                      onClick={() => setServiceFilter('instalacao')}
                      className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                        serviceFilter === 'instalacao'
                          ? 'border-navy text-navy'
                          : 'border-transparent text-slate-600 hover:text-navy'
                      }`}
                    >
                      Instalação ({services.filter(s => s.category === 'instalacao').length})
                    </button>
                    <button
                      onClick={() => setServiceFilter('manutencao')}
                      className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                        serviceFilter === 'manutencao'
                          ? 'border-navy text-navy'
                          : 'border-transparent text-slate-600 hover:text-navy'
                      }`}
                    >
                      Manutenção ({services.filter(s => s.category === 'manutencao').length})
                    </button>
                  </div>
                  
                  {(() => {
                    const filteredServices = serviceFilter === 'all' 
                      ? services 
                      : services.filter(s => s.category === serviceFilter);
                    
                    return filteredServices.length === 0 ? (
                      <p className="text-center text-slate-500 py-8">
                        {serviceFilter === 'all' 
                          ? 'Nenhum serviço cadastrado. Clique em "Adicionar Serviço" para começar.'
                          : `Nenhum serviço de ${serviceFilter === 'instalacao' ? 'instalação' : 'manutenção'} cadastrado.`
                        }
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {filteredServices.map((service) => (
                        <div
                          key={service.id}
                          className="p-4 border border-slate-200 rounded-lg bg-slate-50 flex justify-between items-start"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Package className="w-5 h-5 text-navy" />
                              <h3 className="font-bold text-navy">{service.name}</h3>
                              <span className="px-2 py-1 bg-navy-100 text-navy-700 rounded text-xs">
                                {service.type === 'unit' ? 'Unidade' : service.type === 'meter' ? 'Metro' : 'Pacote'}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 mb-2">{service.description}</p>
                            <p className="text-sm font-medium text-navy">
                              Preço padrão: R$ {service.defaultPrice.toFixed(2)}
                            </p>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditService(service)}
                              className="flex items-center gap-1"
                            >
                              <Edit2 className="w-4 h-4" />
                              <span className="hidden sm:inline">Editar</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteService(service.id)}
                              className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span className="hidden sm:inline">Excluir</span>
                            </Button>
                          </div>
                        </div>
                      ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Service Modal */}
        {showServiceModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-navy">
                  {editingService ? 'Editar Serviço' : 'Novo Serviço'}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowServiceModal(false);
                    setEditingService(null);
                    setServiceForm({ name: '', description: '', defaultPrice: 0, type: 'unit', category: 'manutencao' });
                  }}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <Input
                  label="Nome do Serviço *"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  placeholder="Ex: Troca de Roldanas"
                  required
                />
                
                <Input
                  label="Descrição *"
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  placeholder="Descrição detalhada do serviço"
                  required
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Preço Padrão (R$) *"
                    type="number"
                    min="0"
                    step="0.01"
                    value={serviceForm.defaultPrice === 0 ? '' : serviceForm.defaultPrice.toString()}
                    onChange={(e) => setServiceForm({ ...serviceForm, defaultPrice: parseFloat(e.target.value) || 0 })}
                    placeholder="Ex: 150,00"
                    required
                    className="text-lg"
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Tipo *
                    </label>
                    <select
                      value={serviceForm.type}
                      onChange={(e) => setServiceForm({ ...serviceForm, type: e.target.value as any })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                    >
                      <option value="unit">Por Unidade</option>
                      <option value="meter">Por Metro</option>
                      <option value="package">Pacote</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Categoria *
                  </label>
                  <select
                    value={serviceForm.category}
                    onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value as 'instalacao' | 'manutencao' })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                  >
                    <option value="manutencao">Manutenção</option>
                    <option value="instalacao">Instalação</option>
                  </select>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowServiceModal(false);
                      setEditingService(null);
                      setServiceForm({ name: '', description: '', defaultPrice: 0, type: 'unit', category: 'manutencao' });
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleSaveService}
                    className="flex-1"
                  >
                    {editingService ? 'Salvar Alterações' : 'Criar Serviço'}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Sticky Save Button Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-50 p-4">
        <div className="max-w-7xl mx-auto flex justify-end">
          <Button
            variant="primary"
            size="lg"
            onClick={handleSave}
            disabled={saving || uploading || compressing || compressingSignature}
            className="flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
