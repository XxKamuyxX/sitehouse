import { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  address: string;
  condominium: string;
  phone: string;
  email: string;
  origin?: string; // Origem do cliente (Instagram, Facebook, WhatsApp, etc.)
}

interface ClientFormProps {
  client?: Client;
  onSave: (client: Omit<Client, 'id'>) => void;
  onCancel: () => void;
  vipCondominiums: string[];
}

export function ClientForm({ client, onSave, onCancel, vipCondominiums }: ClientFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    condominium: '',
    phone: '',
    email: '',
    origin: '',
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        address: client.address,
        condominium: client.condominium,
        phone: client.phone,
        email: client.email,
        origin: client.origin || '',
      });
    }
  }, [client]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-navy">
            {client ? 'Editar Cliente' : 'Novo Cliente'}
          </h2>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome Completo *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Telefone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="(31) 99999-9999"
          />

          <Input
            label="Endereço (Rua e Número)"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Ex: Rua das Flores, 123"
          />

          {/* Advanced Fields Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-navy transition-colors w-full justify-between p-2 rounded-lg hover:bg-slate-50"
          >
            <span className="font-medium">Mais Detalhes</span>
            {showAdvanced ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {/* Advanced Fields */}
          {showAdvanced && (
            <div className="space-y-4 pt-2 border-t border-slate-200">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Condomínio
            </label>
            <input
              type="text"
              list="condominiums"
              value={formData.condominium}
              onChange={(e) => setFormData({ ...formData, condominium: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                  placeholder="Nome do condomínio (opcional)"
            />
            <datalist id="condominiums">
              {vipCondominiums.map((condo) => (
                <option key={condo} value={condo} />
              ))}
            </datalist>
          </div>

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com (opcional)"
          />
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <Button type="submit" variant="primary" className="flex-1">
              {client ? 'Salvar Alterações' : 'Criar Cliente'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancelar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}


