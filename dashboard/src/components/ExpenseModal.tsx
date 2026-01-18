import { useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { X } from 'lucide-react';

interface ExpenseModalProps {
  onSave: (expense: {
    description: string;
    amount: number;
    category: string;
    paymentDate: Date;
    paid: boolean;
  }) => void;
  onCancel: () => void;
}

export function ExpenseModal({ onSave, onCancel }: ExpenseModalProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState('outras');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paid, setPaid] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || amount <= 0) {
      alert('Preencha a descrição e o valor');
      return;
    }

    onSave({
      description,
      amount,
      category,
      paymentDate: new Date(paymentDate),
      paid,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-navy">Nova Despesa</h2>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Descrição"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />

          <Input
            label="Valor (R$)"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            required
          />

          <Select
            label="Categoria"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={[
              { value: 'marketing', label: 'Marketing' },
              { value: 'mao-de-obra', label: 'Mão de Obra' },
              { value: 'alimentacao', label: 'Alimentação' },
              { value: 'estacionamento', label: 'Estacionamento' },
              { value: 'ferramentas', label: 'Ferramentas' },
              { value: 'outras', label: 'Outras' },
            ]}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Data do Pagamento
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="paid"
              checked={paid}
              onChange={(e) => setPaid(e.target.checked)}
              className="w-4 h-4 text-navy border-slate-300 rounded focus:ring-navy"
            />
            <label htmlFor="paid" className="text-sm text-slate-700">
              Já foi pago
            </label>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" variant="primary" className="flex-1">
              Salvar
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



