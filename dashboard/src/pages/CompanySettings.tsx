import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Save, Upload, X, Plus, Edit2, Trash2, Package } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useCompany } from '../hooks/useCompany';
import { useStorage } from '../hooks/useStorage';
import { useAuth } from '../contexts/AuthContext';
import { compressFile } from '../utils/compressImage';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { queryWithCompanyId } from '../lib/queries';

export function CompanySettings() {
  const { company, loading, updateCompany } = useCompany();
  const { userMetadata } = useAuth();
  const companyId = userMetadata?.companyId;
  const { uploadImage, uploading } = useStorage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    address: '',
    phone: '',
    email: '',
    primaryColor: '#0F172A',
    googleReviewUrl: '',
    contractTemplate: '',
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
  }>>([]);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<{ id: string; name: string; description: string; defaultPrice: number; type: 'unit' | 'meter' | 'package' } | null>(null);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    defaultPrice: 0,
    type: 'unit' as 'unit' | 'meter' | 'package',
  });

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        cnpj: company.cnpj || '',
        address: company.address || '',
        phone: company.phone || '',
        email: company.email || '',
        primaryColor: (company as any).primaryColor || '#0F172A',
        googleReviewUrl: (company as any).googleReviewUrl || '',
        contractTemplate: (company as any).contractTemplate || '',
      });
      setLogoUrl(company.logoUrl || null);
      setLogoPreview(company.logoUrl || null);
      setSignatureUrl((company as any).signatureUrl || null);
      setSignaturePreview((company as any).signatureUrl || null);
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
        // Create new service
        await addDoc(collection(db, 'services'), {
          name: serviceForm.name,
          description: serviceForm.description,
          defaultPrice: serviceForm.defaultPrice,
          type: serviceForm.type,
          companyId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        alert('Serviço criado com sucesso!');
      }
      
      setShowServiceModal(false);
      setEditingService(null);
      setServiceForm({ name: '', description: '', defaultPrice: 0, type: 'unit' });
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

  const handleSave = async () => {
    if (!formData.name || !formData.address || !formData.phone) {
      alert('Preencha pelo menos Nome, Endereço e Telefone');
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
      };

      // Only include logoUrl and signatureUrl if they exist
      if (logoUrl) {
        rawData.logoUrl = logoUrl;
      }
      if (signatureUrl) {
        rawData.signatureUrl = signatureUrl;
      }

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

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-navy">Dados da Empresa</h1>
          <p className="text-slate-600 mt-1">Configure as informações da sua empresa para aparecer nos PDFs</p>
        </div>

        <Card>
          <h2 className="text-xl font-bold text-navy mb-4">Personalização da Marca</h2>
          <div className="space-y-4">
            <Input
              label="Nome de Exibição *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome que aparecerá no sistema e nos PDFs"
              required
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Logo da Empresa
              </label>
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
                  <p className="text-sm text-slate-600 mb-2">Preview:</p>
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
                  <p className="text-sm text-slate-600 mb-2">Logo atual:</p>
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
                O logo aparecerá no cabeçalho do sistema e dos PDFs. Se não houver logo, será exibido apenas o nome da empresa.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Cor do Tema (Opcional)
              </label>
              
              {/* Preset Colors */}
              <div className="mb-4">
                <p className="text-xs text-slate-600 mb-2">Cores pré-definidas:</p>
                <div className="flex flex-wrap gap-2">
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
                      onClick={() => setFormData({ ...formData, primaryColor: color.value })}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                        formData.primaryColor === color.value
                          ? 'border-navy bg-navy-50'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div
                        className="w-6 h-6 rounded border border-slate-300"
                        style={{ backgroundColor: color.value }}
                      />
                      <span className="text-xs font-medium text-slate-700">{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Color Picker */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="h-12 w-16 rounded-lg border-2 border-slate-300 cursor-pointer"
                    title="Selecionar cor personalizada"
                  />
                  <span className="text-xs text-slate-600">Personalizada</span>
                </div>
                <Input
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  placeholder="#0F172A"
                  className="flex-1 max-w-xs"
                />
              </div>
              
              {/* Preview */}
              <div className="mt-3 p-3 rounded-lg border border-slate-200 bg-slate-50">
                <p className="text-xs text-slate-600 mb-2">Preview:</p>
                <div 
                  className="h-8 rounded flex items-center justify-center text-white font-medium text-sm"
                  style={{ backgroundColor: formData.primaryColor }}
                >
                  Cor selecionada
                </div>
              </div>
              
              <p className="text-xs text-slate-500 mt-2">
                Cor principal usada no tema do sistema (para uso futuro).
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-navy mb-4">Informações da Empresa</h2>
          
          {/* Basic Information */}
          <div className="mb-6 pb-6 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Informações Básicas *</h3>
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
            </div>
          </div>

          {/* Advanced Information */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Informações Avançadas</h3>
            <div className="space-y-4">
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
        </Card>

        {/* Services Management */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-navy">Meus Serviços</h2>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingService(null);
                setServiceForm({ name: '', description: '', defaultPrice: 0, type: 'unit' });
                setShowServiceModal(true);
              }}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar Serviço
            </Button>
          </div>
          
          {services.length === 0 ? (
            <p className="text-center text-slate-500 py-8">
              Nenhum serviço cadastrado. Clique em "Adicionar Serviço" para começar.
            </p>
          ) : (
            <div className="space-y-3">
              {services.map((service) => (
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
                  <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto">
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
          )}
        </Card>

        {/* Contract Template */}
        <Card>
          <h2 className="text-xl font-bold text-secondary mb-4">Contrato Padrão</h2>
          <p className="text-sm text-slate-600 mb-4">
            Defina o texto padrão do contrato. Use variáveis como {'{CLIENT_NAME}'}, {'{CLIENT_ADDRESS}'}, {'{DELIVERY_DATE}'}, {'{TOTAL}'} que serão substituídas automaticamente.
          </p>
          <textarea
            value={formData.contractTemplate}
            onChange={(e) => setFormData({ ...formData, contractTemplate: e.target.value })}
            placeholder="CONTRATO DE PRESTAÇÃO DE SERVIÇOS

Pelo presente instrumento particular de contrato de prestação de serviços, de um lado {'{COMPANY_NAME}'}, inscrita no CNPJ sob o nº {'{COMPANY_CNPJ}'}, com sede em {'{COMPANY_ADDRESS}'}, doravante denominada CONTRATADA, e de outro lado {'{CLIENT_NAME}'}, {'{CLIENT_CPF_CNPJ}'}, RG {'{CLIENT_RG}'}, residente e domiciliado em {'{CLIENT_ADDRESS}'}, doravante denominado CONTRATANTE, têm entre si justo e contratado o seguinte:

CLÁUSULA 1ª - DO OBJETO
O presente contrato tem por objeto a prestação de serviços de instalação/manutenção de vidros conforme especificado no orçamento anexo, no valor total de R$ {'{TOTAL}'}.

CLÁUSULA 2ª - DO PRAZO
O serviço terá início em {'{START_DATE}'} e será concluído até {'{DELIVERY_DATE}'}.

CLÁUSULA 3ª - DO PAGAMENTO
O pagamento será efetuado da seguinte forma: {'{PAYMENT_DETAILS}'} através de {'{PAYMENT_METHOD}'}.

CLÁUSULA 4ª - DAS OBRIGAÇÕES DA CONTRATADA
A CONTRATADA se compromete a executar os serviços com qualidade e dentro do prazo estabelecido.

CLÁUSULA 5ª - DAS OBRIGAÇÕES DO CONTRATANTE
O CONTRATANTE se compromete a fornecer acesso ao local e condições adequadas para a execução dos serviços.

CLÁUSULA 6ª - DA GARANTIA
Os serviços executados terão garantia de 90 (noventa) dias contra defeitos de execução.

E, por estarem assim justos e contratados, firmam o presente contrato em duas vias de igual teor e forma, na presença das testemunhas abaixo assinadas.

{'{CITY}'}, {'{DATE}'}

_________________________________
{'{COMPANY_NAME}'}
CNPJ: {'{COMPANY_CNPJ}'}

_________________________________
{'{CLIENT_NAME}'}
CPF/CNPJ: {'{CLIENT_CPF_CNPJ}'}

Testemunhas:
{'{WITNESS1_NAME}'} - CPF: {'{WITNESS1_CPF}'}
{'{WITNESS2_NAME}'} - CPF: {'{WITNESS2_CPF}'}"
            rows={20}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
          />
          <p className="text-xs text-slate-500 mt-2">
            Variáveis disponíveis: {'{CLIENT_NAME}'}, {'{CLIENT_CPF_CNPJ}'}, {'{CLIENT_RG}'}, {'{CLIENT_ADDRESS}'}, {'{START_DATE}'}, {'{DELIVERY_DATE}'}, {'{PAYMENT_METHOD}'}, {'{PAYMENT_DETAILS}'}, {'{TOTAL}'}, {'{COMPANY_NAME}'}, {'{COMPANY_CNPJ}'}, {'{COMPANY_ADDRESS}'}, {'{WITNESS1_NAME}'}, {'{WITNESS1_CPF}'}, {'{WITNESS2_NAME}'}, {'{WITNESS2_CPF}'}, {'{DATE}'}, {'{CITY}'}
          </p>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-navy mb-4">Assinatura Digital</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Assinatura da Empresa (para PDFs)
              </label>
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
                  <p className="text-sm text-slate-600 mb-2">Preview:</p>
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
                  <p className="text-sm text-slate-600 mb-2">Assinatura atual:</p>
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
        </Card>

        <div className="flex justify-end">
          <Button
            variant="primary"
            size="lg"
            onClick={handleSave}
            disabled={saving || uploading || compressing || compressingSignature}
            className="flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Salvando...' : 'Salvar Dados'}
          </Button>
        </div>

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
                    setServiceForm({ name: '', description: '', defaultPrice: 0, type: 'unit' });
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
                
                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowServiceModal(false);
                      setEditingService(null);
                      setServiceForm({ name: '', description: '', defaultPrice: 0, type: 'unit' });
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
    </Layout>
  );
}
