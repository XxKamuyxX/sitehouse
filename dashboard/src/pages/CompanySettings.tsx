import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Save, Upload, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useCompany } from '../hooks/useCompany';
import { useStorage } from '../hooks/useStorage';
import { useCompanyId } from '../lib/queries';

export function CompanySettings() {
  const { company, loading, updateCompany } = useCompany();
  const companyId = useCompanyId();
  const { uploadImage, uploading } = useStorage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    address: '',
    phone: '',
    email: '',
  });
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        cnpj: company.cnpj || '',
        address: company.address || '',
        phone: company.phone || '',
        email: company.email || '',
      });
      setLogoUrl(company.logoUrl || null);
      setLogoPreview(company.logoUrl || null);
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
      // Upload to Firebase Storage
      const storagePath = `logos/${companyId}/logo.png`;
      const url = await uploadImage(file, storagePath);
      setLogoUrl(url);
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Erro ao fazer upload do logo');
      setLogoPreview(null);
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl(null);
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
          <h2 className="text-xl font-bold text-navy mb-4">Informações da Empresa</h2>
          <div className="space-y-4">
            <Input
              label="Nome da Empresa *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome que aparecerá nos PDFs"
              required
            />

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
          <h2 className="text-xl font-bold text-navy mb-4">Logo da Empresa</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Logo (PNG, JPG ou SVG)
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
                  {uploading ? 'Enviando...' : 'Selecionar Logo'}
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
                O logo aparecerá no cabeçalho dos PDFs. Se não houver logo, será exibido apenas o nome da empresa.
              </p>
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button
            variant="primary"
            size="lg"
            onClick={handleSave}
            disabled={saving || uploading}
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
