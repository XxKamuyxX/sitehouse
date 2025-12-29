import { useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { X } from 'lucide-react';

interface DatePickerModalProps {
  onConfirm: (date: Date) => void;
  onCancel: () => void;
  title?: string;
  message?: string;
}

export function DatePickerModal({ onConfirm, onCancel, title = 'Selecionar Data', message }: DatePickerModalProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) {
      alert('Selecione uma data');
      return;
    }
    onConfirm(new Date(selectedDate));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-navy">{title}</h2>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {message && (
          <p className="text-slate-600 mb-4">{message}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Data Agendada
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
              required
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" variant="primary" className="flex-1">
              Confirmar
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



