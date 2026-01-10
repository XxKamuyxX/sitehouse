import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Save, CheckCircle2, XCircle } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SubscribeButton } from '../components/SubscribeButton';

interface ServiceConfig {
  id: string;
  name: string;
  description: string;
  type: 'unit' | 'meter' | 'package';
  defaultPrice: number;
}

export function Settings() {
  const [searchParams] = useSearchParams();
  const [checkoutStatus, setCheckoutStatus] = useState<'success' | 'cancel' | null>(null);

  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'success' || status === 'cancel') {
      setCheckoutStatus(status);
      // Clear URL parameter after showing message
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams]);

  const [services, setServices] = useState<ServiceConfig[]>([
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
  ]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'config'));
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        if (data.services) setServices(data.services);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePDFConfig = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'config'), {
        services,
        updatedAt: new Date(),
      }, { merge: true });
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleServiceChange = (index: number, field: keyof ServiceConfig, value: any) => {
    const newServices = [...services];
    newServices[index] = { ...newServices[index], [field]: value };
    setServices(newServices);
  };

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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-navy">Configurações</h1>
          <p className="text-slate-600 mt-1">Configure os serviços disponíveis</p>
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

        {/* Subscription Section */}
        <Card className="mb-6">
          <h2 className="text-xl font-bold text-navy mb-4">Assinatura</h2>
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-green-800 mb-1">
                🎁 7 dias grátis para testar
              </p>
              <p className="text-xs text-green-700">
                Após o período de teste, cobrança mensal automática
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 mb-4">
              <p className="text-slate-700 mb-2">
                <strong>Plano:</strong> Mensal - R$ 40,00/mês
              </p>
              <p className="text-sm text-slate-500">
                Pagamento via Cartão (recomendado para período de teste), PIX ou Boleto. Renovação automática mensal.
              </p>
            </div>
            <SubscribeButton
              fullWidth={false}
              className="w-full md:w-auto"
            />
          </div>
        </Card>

        {/* Services Configuration */}
        <Card>
          <h2 className="text-xl font-bold text-navy mb-4">Configuração de Serviços</h2>
          <div className="space-y-4">
            {services.map((service, index) => (
              <div key={service.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Nome</label>
                    <input
                      type="text"
                      value={service.name}
                      onChange={(e) => handleServiceChange(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Descrição</label>
                    <input
                      type="text"
                      value={service.description}
                      onChange={(e) => handleServiceChange(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Tipo</label>
                    <select
                      value={service.type}
                      onChange={(e) => handleServiceChange(index, 'type', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy text-sm"
                    >
                      <option value="unit">Unidade</option>
                      <option value="meter">Metro</option>
                      <option value="package">Pacote</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Preço Padrão</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={service.defaultPrice}
                      onChange={(e) => handleServiceChange(index, 'defaultPrice', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>


        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            variant="primary"
            size="lg"
            onClick={handleSavePDFConfig}
            disabled={saving}
            className="flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </div>
    </Layout>
  );
}

