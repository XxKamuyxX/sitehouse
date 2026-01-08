import { Button } from './ui/Button';
import { ArrowLeft } from 'lucide-react';

interface MaintenanceServiceSelectorProps {
  category: string;
  onSelectService: (service: { name: string; description: string }) => void;
  onBack: () => void;
}

const MAINTENANCE_SERVICES: Record<string, Array<{ name: string; description: string }>> = {
  box: [
    { name: 'Troca de Roldanas', description: 'Substituição por roldanas premium' },
    { name: 'Vedação/Silicone', description: 'Substituição da vedação e aplicação de silicone' },
    { name: 'Regulagem', description: 'Ajuste e regulagem do sistema' },
    { name: 'Limpeza', description: 'Limpeza profissional dos vidros e trilhos' },
    { name: 'Higienização', description: 'Limpeza profunda e higienização completa' },
  ],
  janela: [
    { name: 'Troca de Roldanas', description: 'Substituição por roldanas premium' },
    { name: 'Vedação/Silicone', description: 'Substituição da vedação e aplicação de silicone' },
    { name: 'Regulagem', description: 'Ajuste e regulagem do sistema' },
    { name: 'Limpeza', description: 'Limpeza profissional dos vidros e trilhos' },
    { name: 'Colagem de Vidro', description: 'Colagem profissional de vidros soltos' },
  ],
  porta: [
    { name: 'Troca de Roldanas', description: 'Substituição por roldanas premium' },
    { name: 'Vedação/Silicone', description: 'Substituição da vedação e aplicação de silicone' },
    { name: 'Regulagem', description: 'Ajuste e regulagem do sistema' },
    { name: 'Limpeza', description: 'Limpeza profissional dos vidros e trilhos' },
    { name: 'Blindagem', description: 'Blindagem nos trilhos para proteção' },
  ],
  sacada: [
    { name: 'Troca de Roldanas', description: 'Substituição por roldanas premium' },
    { name: 'Vedação/Silicone', description: 'Substituição da vedação e aplicação de silicone' },
    { name: 'Regulagem', description: 'Ajuste e regulagem do sistema' },
    { name: 'Limpeza', description: 'Limpeza profissional dos vidros e trilhos' },
    { name: 'Manutenção Preventiva', description: 'Manutenção preventiva completa' },
  ],
  outros: [
    { name: 'Visita Técnica/Diagnóstico', description: 'Diagnóstico completo do sistema' },
    { name: 'Reparo Geral', description: 'Reparo geral conforme necessidade' },
    { name: 'Outro Serviço', description: 'Serviço personalizado' },
  ],
};

const CATEGORY_LABELS: Record<string, string> = {
  box: 'Box',
  janela: 'Janela',
  porta: 'Porta',
  sacada: 'Sacada',
  outros: 'Outros',
};

export function MaintenanceServiceSelector({ category, onSelectService, onBack }: MaintenanceServiceSelectorProps) {
  const services = MAINTENANCE_SERVICES[category] || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <h2 className="text-xl font-bold text-secondary">
          Manutenção de {CATEGORY_LABELS[category]}
        </h2>
      </div>

      <div className="space-y-3">
        {services.map((service) => (
          <button
            key={service.name}
            onClick={() => onSelectService(service)}
            className="w-full p-4 border-2 border-slate-200 rounded-lg hover:border-primary transition-all bg-white hover:bg-glass-blue text-left"
          >
            <h3 className="font-bold text-secondary mb-1">{service.name}</h3>
            <p className="text-sm text-slate-600">{service.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
