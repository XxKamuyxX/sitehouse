import { Button } from './ui/Button';
import { ArrowLeft } from 'lucide-react';

interface InstallationServiceSelectorProps {
  category: string;
  onSelectService: (service: { name: string; description: string }) => void;
  onBack: () => void;
}

const INSTALLATION_SERVICES: Record<string, Array<{ name: string; description: string }>> = {
  box: [
    { name: 'Box de Banheiro (Vidro Temperado)', description: 'Instalação completa de box com vidro temperado' },
    { name: 'Box de Canto', description: 'Box de canto com perfil de alumínio' },
    { name: 'Box Frontal', description: 'Box frontal com portas de correr' },
    { name: 'Box com Porta Pivotante', description: 'Box com sistema pivotante' },
    { name: 'Outro tipo de Box', description: 'Box personalizado' },
  ],
  janela: [
    { name: 'Janela de Correr', description: 'Janela de vidro temperado com perfil de alumínio' },
    { name: 'Janela Maxim-Ar', description: 'Janela basculante com sistema maxim-ar' },
    { name: 'Janela Fixa', description: 'Janela fixa de vidro temperado' },
    { name: 'Janela de Abrir', description: 'Janela com sistema de abertura' },
    { name: 'Outro tipo de Janela', description: 'Janela personalizada' },
  ],
  porta: [
    { name: 'Porta de Vidro Temperado', description: 'Porta de correr de vidro temperado' },
    { name: 'Porta Pivotante', description: 'Porta pivotante de vidro' },
    { name: 'Porta de Abrir', description: 'Porta de vidro com dobradiças' },
    { name: 'Porta de Correr', description: 'Porta de correr com perfil de alumínio' },
    { name: 'Outro tipo de Porta', description: 'Porta personalizada' },
  ],
  sacada: [
    { name: 'Envidraçamento de Sacada', description: 'Fechamento completo de sacada com vidros' },
    { name: 'Guarda-Corpo de Vidro', description: 'Guarda-corpo de vidro temperado' },
    { name: 'Cortina de Vidro', description: 'Sistema de cortina de vidro' },
    { name: 'Outro tipo de Envidraçamento', description: 'Envidraçamento personalizado' },
  ],
  outros: [
    { name: 'Espelho', description: 'Instalação de espelho personalizado' },
    { name: 'Fixos/Vitrines', description: 'Vitrines e vidros fixos' },
    { name: 'Blindex', description: 'Instalação de blindex' },
    { name: 'Coberturas de Vidro', description: 'Coberturas e telhados de vidro' },
    { name: 'Outro Serviço', description: 'Serviço personalizado de instalação' },
  ],
};

const CATEGORY_LABELS: Record<string, string> = {
  box: 'Box',
  janela: 'Janela',
  porta: 'Porta',
  sacada: 'Sacada',
  outros: 'Outros',
};

export function InstallationServiceSelector({ category, onSelectService, onBack }: InstallationServiceSelectorProps) {
  const services = INSTALLATION_SERVICES[category] || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <h2 className="text-xl font-bold text-secondary">
          Instalação de {CATEGORY_LABELS[category]}
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
