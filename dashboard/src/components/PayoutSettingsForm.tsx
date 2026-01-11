import { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Card } from './ui/Card';
import { X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface PayoutSettingsFormProps {
  onClose: () => void;
  onSave?: () => void;
}

export function PayoutSettingsForm({ onClose, onSave }: PayoutSettingsFormProps) {
  const { user, userMetadata } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    pixKey: '',
    pixKeyType: 'CPF',
    bankName: '',
    agency: '',
    accountNumber: '',
    accountType: 'Corrente',
    holderName: '',
    holderCpf: '',
  });

  useEffect(() => {
    if (userMetadata?.payoutInfo) {
      setFormData({
        pixKey: userMetadata.payoutInfo.pixKey || '',
        pixKeyType: userMetadata.payoutInfo.pixKeyType || 'CPF',
        bankName: userMetadata.payoutInfo.bankName || '',
        agency: userMetadata.payoutInfo.agency || '',
        accountNumber: userMetadata.payoutInfo.accountNumber || '',
        accountType: userMetadata.payoutInfo.accountType || 'Corrente',
        holderName: userMetadata.payoutInfo.holderName || '',
        holderCpf: userMetadata.payoutInfo.holderCpf || '',
      });
    }
  }, [userMetadata]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.pixKey.trim()) {
      alert('Por favor, informe a chave PIX');
      return;
    }

    if (!formData.holderName.trim()) {
      alert('Por favor, informe o nome do titular');
      return;
    }

    if (!user?.uid) {
      alert('Erro: Usuário não identificado');
      return;
    }

    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        payoutInfo: {
          pixKey: formData.pixKey.trim(),
          pixKeyType: formData.pixKeyType,
          bankName: formData.bankName.trim() || '',
          agency: formData.agency.trim() || '',
          accountNumber: formData.accountNumber.trim() || '',
          accountType: formData.accountType,
          holderName: formData.holderName.trim(),
          holderCpf: formData.holderCpf.trim() || '',
        },
        updatedAt: new Date(),
      });

      alert('Dados bancários salvos com sucesso!');
      onSave?.();
      onClose();
      
      // Reload page to refresh user metadata
      window.location.reload();
    } catch (error: any) {
      console.error('Error saving payout info:', error);
      alert(`Erro ao salvar dados bancários: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Dados Bancários para Saque</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Chave PIX <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.pixKeyType}
              onChange={(e) => setFormData({ ...formData, pixKeyType: e.target.value })}
              options={[
                { value: 'CPF', label: 'CPF' },
                { value: 'EMAIL', label: 'E-mail' },
                { value: 'PHONE', label: 'Telefone' },
                { value: 'RANDOM', label: 'Chave Aleatória' },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chave PIX <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={formData.pixKey}
              onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
              placeholder="Informe sua chave PIX"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Titular <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={formData.holderName}
              onChange={(e) => setFormData({ ...formData, holderName: e.target.value })}
              placeholder="Nome completo do titular"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CPF do Titular
            </label>
            <Input
              type="text"
              value={formData.holderCpf}
              onChange={(e) => setFormData({ ...formData, holderCpf: e.target.value })}
              placeholder="000.000.000-00"
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Dados Bancários (Opcional)
            </h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Banco
            </label>
            <Input
              type="text"
              value={formData.bankName}
              onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
              placeholder="Nome do banco"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Agência
              </label>
              <Input
                type="text"
                value={formData.agency}
                onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
                placeholder="0000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número da Conta
              </label>
              <Input
                type="text"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                placeholder="00000-0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Conta
            </label>
            <Select
              value={formData.accountType}
              onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
              options={[
                { value: 'Corrente', label: 'Corrente' },
                { value: 'Poupança', label: 'Poupança' },
              ]}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Salvando...' : 'Salvar Dados'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
