import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Save, CheckCircle2, XCircle, User, Building2, CreditCard, LogOut, HelpCircle, Upload, X, Lock } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { db } from '../lib/firebase';
import { SubscribeButton } from '../components/SubscribeButton';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../hooks/useCompany';
import { useStorage } from '../hooks/useStorage';
import { compressFile } from '../utils/compressImage';

type Tab = 'perfil' | 'empresa' | 'assinatura';

export function Settings() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, userMetadata, signOut } = useAuth();
  const { company, updateCompany } = useCompany();
  const { uploadImage, uploading } = useStorage();
  const [activeTab, setActiveTab] = useState<Tab>('perfil');
  const [checkoutStatus, setCheckoutStatus] = useState<'success' | 'cancel' | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Password change modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Profile form
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  
  // Company form
  const [companyData, setCompanyData] = useState({
    name: '',
    cnpj: '',
    address: '',
  });
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'success' || status === 'cancel') {
      setCheckoutStatus(status);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams]);

  useEffect(() => {
    loadData();
  }, [user, userMetadata, company]);

  const loadData = async () => {
    if (!user || !userMetadata) {
      setLoading(false);
      return;
    }

    try {
      // Load user profile data
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setProfileData({
          name: userData.name || '',
          email: userData.email || user?.email || '',
          phone: userData.phone || '',
        });
      }

      // Load company data
      if (company) {
        setCompanyData({
          name: company.name || '',
          cnpj: company.cnpj || '',
          address: company.address || '',
        });
        setLogoUrl(company.logoUrl || null);
        setLogoPreview(company.logoUrl || null);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: profileData.name,
        phone: profileData.phone,
        updatedAt: new Date(),
      });
      alert('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Erro ao salvar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCompany = async () => {
    if (!company) return;

    setSaving(true);
    try {
      await updateCompany({
        name: companyData.name,
        cnpj: companyData.cnpj,
        address: companyData.address,
        logoUrl: logoUrl || undefined,
      });
      alert('Dados da empresa atualizados com sucesso!');
    } catch (error) {
      console.error('Error saving company:', error);
      alert('Erro ao salvar dados da empresa');
    } finally {
      setSaving(false);
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
      setCompressing(true);
      const compressedFile = await compressFile(file);
      setCompressing(false);

      const companyId = userMetadata?.companyId;
      if (!companyId) {
        alert('Erro: Empresa não encontrada');
        return;
      }

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

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      alert('Preencha todos os campos');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('As senhas não coincidem');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (!user || !user.email) {
      alert('Erro: Usuário não encontrado');
      return;
    }

    setChangingPassword(true);
    try {
      // Reauthenticate user
      const credential = EmailAuthProvider.credential(user.email, passwordData.currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, passwordData.newPassword);

      alert('Senha alterada com sucesso!');
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      console.error('Error changing password:', error);
      if (error.code === 'auth/wrong-password') {
        alert('Senha atual incorreta');
      } else if (error.code === 'auth/weak-password') {
        alert('A senha é muito fraca. Use uma senha mais forte.');
      } else {
        alert('Erro ao alterar senha. Tente novamente.');
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    if (confirm('Tem certeza que deseja sair?')) {
      await signOut();
      navigate('/login');
    }
  };

  const formatPhone = (value: string) => {
    // Remove all non-numeric characters
    const numbers = value.replace(/\D/g, '');
    
    // Apply mask: (XX) XXXXX-XXXX
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
    } else {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setProfileData({ ...profileData, phone: formatted });
  };

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      // CPF: XXX.XXX.XXX-XX
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4').replace(/[-.]$/, '');
    } else {
      // CNPJ: XX.XXX.XXX/XXXX-XX
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5').replace(/[-./]$/, '');
    }
  };

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value);
    setCompanyData({ ...companyData, cnpj: formatted });
  };

  const handleSave = () => {
    if (activeTab === 'perfil') {
      handleSaveProfile();
    } else if (activeTab === 'empresa') {
      handleSaveCompany();
    }
  };

  // Support WhatsApp - can be moved to environment variable or config
  const supportWhatsApp = process.env.REACT_APP_SUPPORT_WHATSAPP || '5531972224582';
  const supportMessage = encodeURIComponent('Olá! Preciso de ajuda com o sistema.');

  if (loading) {
    return (
      <Layout>
        <Card>
          <p className="text-center text-slate-600 py-8">Carregando configurações...</p>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 pb-24">
        <div>
          <h1 className="text-3xl font-bold text-navy">Configurações</h1>
          <p className="text-slate-600 mt-1">Gerencie seu perfil, empresa e assinatura</p>
        </div>

        {/* Checkout Status Messages */}
        {checkoutStatus === 'success' && (
          <Card className="mb-6 border-green-500 border-2 bg-green-50">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              <div>
                <h3 className="font-bold text-green-800">Pagamento processado com sucesso!</h3>
                <p className="text-sm text-green-700">Sua assinatura foi ativada. Obrigado!</p>
              </div>
            </div>
          </Card>
        )}

        {checkoutStatus === 'cancel' && (
          <Card className="mb-6 border-yellow-500 border-2 bg-yellow-50">
            <div className="flex items-center gap-3">
              <XCircle className="w-6 h-6 text-yellow-600" />
              <div>
                <h3 className="font-bold text-yellow-800">Pagamento cancelado</h3>
                <p className="text-sm text-yellow-700">Você pode tentar novamente quando quiser.</p>
              </div>
            </div>
          </Card>
        )}

        {/* Tabs */}
        <div className="border-b border-slate-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('perfil')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'perfil'
                  ? 'border-navy text-navy'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Perfil
              </div>
            </button>
            <button
              onClick={() => setActiveTab('empresa')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'empresa'
                  ? 'border-navy text-navy'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Empresa
              </div>
            </button>
            <button
              onClick={() => setActiveTab('assinatura')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'assinatura'
                  ? 'border-navy text-navy'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Assinatura
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'perfil' && (
          <Card>
            <h2 className="text-xl font-bold text-navy mb-6">Dados Pessoais</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nome Completo
                </label>
                <Input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  placeholder="Seu nome completo"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  value={profileData.email}
                  disabled
                  className="w-full bg-slate-50"
                />
                <p className="text-xs text-slate-500 mt-1">O email não pode ser alterado</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Telefone/WhatsApp
                </label>
                <Input
                  type="text"
                  value={profileData.phone}
                  onChange={handlePhoneChange}
                  placeholder="(11) 99999-9999"
                  className="w-full"
                  maxLength={15}
                />
              </div>

              <div className="pt-4 border-t border-slate-200">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Senha
                </label>
                <Button
                  variant="outline"
                  onClick={() => setShowPasswordModal(true)}
                  className="flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  Alterar Senha
                </Button>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'empresa' && (
          <Card>
            <h2 className="text-xl font-bold text-navy mb-6">Dados da Empresa</h2>
            <p className="text-sm text-slate-600 mb-6">
              Essas informações aparecerão nos cabeçalhos dos PDFs de orçamentos e ordens de serviço.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nome da Empresa (Fantasia)
                </label>
                <Input
                  type="text"
                  value={companyData.name}
                  onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                  placeholder="Nome da sua empresa"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  CNPJ/CPF (Opcional)
                </label>
                <Input
                  type="text"
                  value={companyData.cnpj}
                  onChange={handleCNPJChange}
                  placeholder="00.000.000/0000-00 ou 000.000.000-00"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Endereço Completo
                </label>
                <Input
                  type="text"
                  value={companyData.address}
                  onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                  placeholder="Rua, número, bairro, cidade - UF, CEP"
                  className="w-full"
                />
              </div>

              <div className="pt-4 border-t border-slate-200">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Logo da Empresa
                </label>
                <div className="flex items-start gap-4">
                  <div className="w-32 h-32 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-slate-50 overflow-hidden">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain" />
                    ) : (
                      <div className="text-center p-4">
                        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-xs text-slate-500">Carregar Logo</p>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading || compressing}
                        className="flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        {uploading || compressing ? 'Carregando...' : 'Escolher Logo'}
                      </Button>
                      {logoPreview && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRemoveLogo}
                          className="flex items-center gap-2 text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                          Remover
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      Recomendado: imagem quadrada (100x100px ou maior), formato PNG ou JPG
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'assinatura' && (
          <Card>
            <h2 className="text-xl font-bold text-navy mb-6">Assinatura</h2>
            <div className="space-y-4">
              {(() => {
                // Check if trial has expired
                const trialEndDate = userMetadata?.trialEndsAt 
                  ? (userMetadata.trialEndsAt?.toDate ? userMetadata.trialEndsAt.toDate() : new Date(userMetadata.trialEndsAt))
                  : null;
                const isTrialExpired = trialEndDate ? new Date() > trialEndDate : false;
                const isActive = userMetadata?.subscriptionStatus === 'active' || userMetadata?.subscriptionStatus === 'trialing';
                
                if (isTrialExpired && !isActive) {
                  return (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <p className="text-sm font-semibold text-yellow-800 mb-1">
                        ⚠️ Seu período de teste acabou
                      </p>
                      <p className="text-xs text-yellow-700">
                        Assine agora para continuar gerenciando seu negócio
                      </p>
                    </div>
                  );
                }
                
                if (!isTrialExpired) {
                  return (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <p className="text-sm font-semibold text-green-800 mb-1">
                        🎁 7 dias grátis para testar
                      </p>
                      <p className="text-xs text-green-700">
                        Após o período de teste, cobrança mensal automática
                      </p>
                    </div>
                  );
                }
                
                return null;
              })()}
              <div className="bg-slate-50 rounded-lg p-4 mb-4">
                <p className="text-slate-700 mb-2">
                  <strong>Plano:</strong> Mensal - R$ 40,00/mês
                </p>
                <p className="text-sm text-slate-500">
                  Pagamento via Cartão de Crédito (recomendado para período de teste) ou Boleto. Renovação automática mensal.
                </p>
              </div>
              <SubscribeButton
                fullWidth={false}
                className="w-full md:w-auto"
              />
              {company?.stripeCustomerId && (
                <div className="pt-4 border-t border-slate-200">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        // Call API to create customer portal session
                        const response = await fetch('/api/stripe/create-portal-session', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            companyId: company.id,
                            returnUrl: window.location.href,
                          }),
                        });

                        if (!response.ok) {
                          throw new Error('Failed to create portal session');
                        }

                        const data = await response.json();
                        if (data.url) {
                          window.location.href = data.url;
                        }
                      } catch (error) {
                        console.error('Error opening customer portal:', error);
                        alert('Erro ao abrir portal de gerenciamento. Entre em contato com o suporte.');
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    Gerenciar Assinatura
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <a
              href={`https://wa.me/${supportWhatsApp}?text=${supportMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-slate-600 hover:text-navy flex items-center gap-2"
            >
              <HelpCircle className="w-4 h-4" />
              Precisa de ajuda? Falar com Suporte
            </a>
          </div>
          <div className="flex items-center gap-3">
            {activeTab !== 'assinatura' && (
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              Sair da Conta
            </Button>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-navy">Alterar Senha</h3>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Senha Atual
                </label>
                <Input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder="Digite sua senha atual"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nova Senha
                </label>
                <Input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="Digite sua nova senha (mín. 6 caracteres)"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Confirmar Nova Senha
                </label>
                <Input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="Confirme sua nova senha"
                  className="w-full"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  variant="primary"
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                  className="flex-1"
                >
                  {changingPassword ? 'Alterando...' : 'Alterar Senha'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </Layout>
  );
}
