import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Save, Upload, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useCompany } from '../hooks/useCompany';
import { useStorage } from '../hooks/useStorage';
import { useAuth } from '../contexts/AuthContext';
import { compressFile } from '../utils/compressImage';

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
  });
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [compressingSignature, setCompressingSignature] = useState(false);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        cnpj: company.cnpj || '',
        address: company.address || '',
        phone: company.phone || '',
        email: company.email || '',
        primaryColor: (company as any).primaryColor || '#0F172A',
      });
      setLogoUrl(company.logoUrl || null);
      setLogoPreview(company.logoUrl || null);
      setSignatureUrl((company as any).signatureUrl || null);
      setSignaturePreview((company as any).signatureUrl || null);
    }
  }, [company]);

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

    setSaving(true);
    try {
      await updateCompany({
        name: formData.name,
        cnpj: formData.cnpj || undefined,
        address: formData.address,
        phone: formData.phone,
        email: formData.email || undefined,
        logoUrl: logoUrl || undefined,
        signatureUrl: signatureUrl || undefined,
        primaryColor: formData.primaryColor,
      });
      alert('Dados da empresa salvos com sucesso!');
    } catch (error: any) {
      console.error('Error saving company data:', error);
      alert('Erro ao salvar dados da empresa');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Cor do Tema (Opcional)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="h-10 w-20 rounded border border-slate-300 cursor-pointer"
                />
                <Input
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  placeholder="#0F172A"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Cor principal usada no tema do sistema (para uso futuro).
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-navy mb-4">Informações da Empresa</h2>
          <div className="space-y-4">
            <Input
              label="CNPJ"
              value={formData.cnpj}
              onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
              placeholder="00.000.000/0000-00"
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
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="contato@empresa.com.br"
            />
          </div>
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
      </div>
    </Layout>
  );
}
