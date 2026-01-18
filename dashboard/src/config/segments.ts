// Icon names are stored as strings to be dynamically imported when needed

export interface VisualCategory {
  id: string;
  label: string;
  icon: string; // Icon name from lucide-react
}

export interface SegmentConfig {
  label: string;
  units: string[];
  features: string[];
  visualCategories: VisualCategory[];
}

export const SEGMENTS: Record<string, SegmentConfig> = {
  glazier: {
    label: "Vidraceiro",
    units: ["m²", "un", "m"],
    features: ["manual_price", "linear_meter", "area_calculation"],
    visualCategories: [
      { id: 'janelas', label: 'Janelas', icon: 'AppWindow' },
      { id: 'portas', label: 'Portas', icon: 'DoorOpen' },
      { id: 'box', label: 'Box (Banheiro)', icon: 'Bath' },
      { id: 'guarda-corpo', label: 'Guarda-Corpo', icon: 'Shield' },
      { id: 'envidracamento', label: 'Envidraçamento/Sacada', icon: 'Blinds' },
      { id: 'espelhos', label: 'Espelhos', icon: 'Frame' },
      { id: 'fixos', label: 'Fixos/Vitrines', icon: 'Square' },
      { id: 'outros', label: 'Outros/Manual', icon: 'Plus' }
    ]
  },
  locksmith: {
    label: "Chaveiro",
    units: ["un", "serviço", "cópia"],
    features: ["manual_price"],
    visualCategories: [
      { id: 'abertura', label: 'Aberturas', icon: 'Unlock' },
      { id: 'copias', label: 'Cópias de Chaves', icon: 'Key' },
      { id: 'fechaduras', label: 'Instalação/Troca', icon: 'Lock' },
      { id: 'automotivo', label: 'Automotivo', icon: 'Car' },
      { id: 'cofres', label: 'Cofres', icon: 'Shield' }
    ]
  },
  plumber: {
    label: "Hidráulica",
    units: ["ponto", "m", "un", "dia"],
    features: ["manual_price", "linear_meter"],
    visualCategories: [
      { id: 'vazamento', label: 'Caça Vazamentos', icon: 'Droplets' },
      { id: 'loucas', label: 'Inst. Louças/Metais', icon: 'Bath' },
      { id: 'tubulacao', label: 'Tubulação/Esgoto', icon: 'Pipette' },
      { id: 'caixa_agua', label: 'Caixa D\'água', icon: 'Waves' },
      { id: 'desentupimento', label: 'Desentupimento', icon: 'CircleOff' }
    ]
  },
  handyman: {
    label: "Marido de Aluguel",
    units: ["hora", "serviço", "diária", "un"],
    features: ["manual_price"],
    visualCategories: [
      { id: 'montagem', label: 'Montagem Móveis', icon: 'Hammer' },
      { id: 'instalacao', label: 'Instalações Gerais', icon: 'Settings' },
      { id: 'pequenos_reparos', label: 'Pequenos Reparos', icon: 'Wrench' },
      { id: 'eletrica_basica', label: 'Elétrica Básica', icon: 'Zap' },
      { id: 'hidraulica_basica', label: 'Hidráulica Básica', icon: 'Droplet' }
    ]
  }
};

// Helper function to get segment config
export function getSegmentConfig(segmentId: string): SegmentConfig | undefined {
  return SEGMENTS[segmentId];
}

// Helper function to get all segment IDs
export function getAllSegmentIds(): string[] {
  return Object.keys(SEGMENTS);
}

// Helper function to get segment label
export function getSegmentLabel(segmentId: string): string {
  return SEGMENTS[segmentId]?.label || segmentId;
}
