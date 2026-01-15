/**
 * Industry Service Categories Mapping
 * Maps company industry/segment to installation categories with icons
 */

import * as LucideIcons from 'lucide-react';

export interface ServiceCategory {
  id: string;
  label: string;
  icon: keyof typeof LucideIcons;
  catalogName?: string; // For backward compatibility with existing catalog
}

export type IndustryType = 'glazier' | 'locksmith' | 'plumber' | 'handyman' | 'electrician' | 'hvac';

export const INDUSTRY_CATEGORIES: Record<IndustryType, ServiceCategory[]> = {
  glazier: [
    { id: 'janelas', label: 'Janelas', icon: 'AppWindow', catalogName: 'Janela de Vidro' },
    { id: 'portas', label: 'Portas', icon: 'DoorOpen', catalogName: 'Porta de Vidro' },
    { id: 'box', label: 'Box', icon: 'Bath', catalogName: 'Box Padrão' },
    { id: 'guarda-corpo', label: 'Guarda-Corpo', icon: 'Shield', catalogName: 'Guarda-corpo' },
    { id: 'envidracamento', label: 'Sacada', icon: 'Blinds', catalogName: 'Cortina de Vidro' },
    { id: 'espelhos', label: 'Espelho', icon: 'Frame', catalogName: 'Divisória de Vidro' },
    { id: 'fixos', label: 'Fixo', icon: 'Square', catalogName: 'Divisória de Vidro' },
    { id: 'outros', label: 'Outro', icon: 'Plus' },
  ],
  locksmith: [
    { id: 'abertura', label: 'Aberturas', icon: 'Unlock' },
    { id: 'copias', label: 'Cópias de Chaves', icon: 'Key' },
    { id: 'fechaduras', label: 'Instalação/Troca', icon: 'Lock' },
    { id: 'automotivo', label: 'Automotivo', icon: 'Car' },
    { id: 'cofres', label: 'Cofres', icon: 'Shield' },
    { id: 'outros', label: 'Outro', icon: 'Plus' },
  ],
  plumber: [
    { id: 'vazamento', label: 'Caça Vazamentos', icon: 'Droplets' },
    { id: 'loucas', label: 'Inst. Louças/Metais', icon: 'Bath' },
    { id: 'tubulacao', label: 'Tubulação/Esgoto', icon: 'Pipette' },
    { id: 'caixa_agua', label: 'Caixa D\'água', icon: 'Waves' },
    { id: 'desentupimento', label: 'Desentupimento', icon: 'CircleOff' },
    { id: 'outros', label: 'Outro', icon: 'Plus' },
  ],
  handyman: [
    { id: 'montagem', label: 'Montagem Móveis', icon: 'Hammer' },
    { id: 'instalacao', label: 'Instalações Gerais', icon: 'Settings' },
    { id: 'pequenos_reparos', label: 'Pequenos Reparos', icon: 'Wrench' },
    { id: 'eletrica_basica', label: 'Elétrica Básica', icon: 'Zap' },
    { id: 'hidraulica_basica', label: 'Hidráulica Básica', icon: 'Droplet' },
    { id: 'outros', label: 'Outro', icon: 'Plus' },
  ],
  electrician: [
    { id: 'instalacao', label: 'Instalação Elétrica', icon: 'Zap' },
    { id: 'manutencao', label: 'Manutenção', icon: 'Wrench' },
    { id: 'troca', label: 'Troca de Componentes', icon: 'Settings' },
    { id: 'painel', label: 'Painel Elétrico', icon: 'Square' },
    { id: 'iluminacao', label: 'Iluminação', icon: 'Lightbulb' },
    { id: 'outros', label: 'Outro', icon: 'Plus' },
  ],
  hvac: [
    { id: 'instalacao', label: 'Instalação', icon: 'Wind' },
    { id: 'manutencao', label: 'Manutenção', icon: 'Wrench' },
    { id: 'limpeza', label: 'Limpeza', icon: 'Sparkles' },
    { id: 'reparo', label: 'Reparo', icon: 'Wrench' },
    { id: 'outros', label: 'Outro', icon: 'Plus' },
  ],
};

/**
 * Get categories for a specific industry
 */
export function getCategoriesForIndustry(industry: string | undefined | null): ServiceCategory[] {
  if (!industry) {
    // Default to glazier if no industry specified
    return INDUSTRY_CATEGORIES.glazier;
  }
  
  const normalizedIndustry = industry.toLowerCase();
  
  // Map common industry names to our types
  const industryMap: Record<string, IndustryType> = {
    'vidracaria': 'glazier',
    'vidraceiro': 'glazier',
    'glazier': 'glazier',
    'chaveiro': 'locksmith',
    'locksmith': 'locksmith',
    'hidraulica': 'plumber',
    'plumber': 'plumber',
    'marido-de-aluguel': 'handyman',
    'handyman': 'handyman',
    'eletrica': 'electrician',
    'electrician': 'electrician',
    'eletricista': 'electrician',
    'climatizacao': 'hvac',
    'hvac': 'hvac',
    'ar-condicionado': 'hvac',
  };
  
  const mappedIndustry = industryMap[normalizedIndustry] || 'glazier';
  return INDUSTRY_CATEGORIES[mappedIndustry] || INDUSTRY_CATEGORIES.glazier;
}

/**
 * Get icon component from string name
 */
export function getIconComponent(iconName: string): any {
  const IconComponent = (LucideIcons as any)[iconName];
  return IconComponent || LucideIcons.Plus;
}
