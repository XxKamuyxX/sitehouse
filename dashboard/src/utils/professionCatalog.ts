/**
 * Profession-based service catalog
 * Defines standard installation and maintenance items for each profession
 */

export type Profession = 'vidracaria' | 'serralheria' | 'chaveiro' | 'marido-de-aluguel' | 'eletrica-hidraulica';

export interface CatalogItem {
  id: string;
  name: string;
  description: string;
  category: 'installation' | 'maintenance';
  defaultPrice?: number;
  pricingMethod: 'm2' | 'linear' | 'fixed' | 'unit';
  requiresDimensions?: boolean;
  metadata?: {
    glassThickness?: string[];
    profileColor?: string[];
    [key: string]: any;
  };
}

export const PROFESSION_CATALOG: Record<Profession, {
  installation: CatalogItem[];
  maintenance: CatalogItem[];
}> = {
  vidracaria: {
    installation: [
      {
        id: 'box-padrao',
        name: 'Box Padrão',
        description: 'Box de vidro temperado para banheiro',
        category: 'installation',
        pricingMethod: 'm2',
        requiresDimensions: true,
        metadata: {
          glassThickness: ['8mm', '10mm', '12mm'],
          profileColor: ['Branco', 'Chrome', 'Preto'],
        },
      },
      {
        id: 'cortina-vidro',
        name: 'Cortina de Vidro',
        description: 'Cortina de vidro para sacada ou área externa',
        category: 'installation',
        pricingMethod: 'm2',
        requiresDimensions: true,
        metadata: {
          glassThickness: ['8mm', '10mm', '12mm'],
        },
      },
      {
        id: 'guarda-corpo',
        name: 'Guarda-corpo',
        description: 'Guarda-corpo de vidro para escada ou varanda',
        category: 'installation',
        pricingMethod: 'linear',
        requiresDimensions: true,
        metadata: {
          glassThickness: ['8mm', '10mm', '12mm'],
        },
      },
      {
        id: 'porta-vidro',
        name: 'Porta de Vidro',
        description: 'Porta de vidro temperado',
        category: 'installation',
        pricingMethod: 'm2',
        requiresDimensions: true,
        metadata: {
          glassThickness: ['8mm', '10mm', '12mm'],
        },
      },
      {
        id: 'janela-vidro',
        name: 'Janela de Vidro',
        description: 'Janela de vidro temperado',
        category: 'installation',
        pricingMethod: 'm2',
        requiresDimensions: true,
        metadata: {
          glassThickness: ['6mm', '8mm', '10mm'],
        },
      },
      {
        id: 'divisoria-vidro',
        name: 'Divisória de Vidro',
        description: 'Divisória interna de vidro',
        category: 'installation',
        pricingMethod: 'm2',
        requiresDimensions: true,
        metadata: {
          glassThickness: ['8mm', '10mm', '12mm'],
        },
      },
    ],
    maintenance: [
      {
        id: 'troca-roldanas',
        name: 'Troca de Roldanas',
        description: 'Substituição de roldanas do box ou cortina',
        category: 'maintenance',
        pricingMethod: 'unit',
        defaultPrice: 50,
      },
      {
        id: 'troca-fechadura',
        name: 'Troca de Fechadura',
        description: 'Substituição de fechadura do box',
        category: 'maintenance',
        pricingMethod: 'unit',
        defaultPrice: 80,
      },
      {
        id: 'vedacao',
        name: 'Vedação',
        description: 'Substituição da vedação do box',
        category: 'maintenance',
        pricingMethod: 'linear',
        defaultPrice: 35,
      },
      {
        id: 'higienizacao',
        name: 'Higienização',
        description: 'Limpeza profunda e higienização completa',
        category: 'maintenance',
        pricingMethod: 'fixed',
        defaultPrice: 200,
      },
      {
        id: 'limpeza',
        name: 'Limpeza',
        description: 'Limpeza profissional dos vidros e trilhos',
        category: 'maintenance',
        pricingMethod: 'fixed',
        defaultPrice: 150,
      },
      {
        id: 'ajuste-portas',
        name: 'Ajuste de Portas',
        description: 'Ajuste e regulagem de portas de vidro',
        category: 'maintenance',
        pricingMethod: 'unit',
        defaultPrice: 100,
      },
    ],
  },
  chaveiro: {
    installation: [
      {
        id: 'fechadura-digital',
        name: 'Fechadura Digital',
        description: 'Instalação de fechadura digital com senha ou biometria',
        category: 'installation',
        pricingMethod: 'fixed',
        defaultPrice: 800,
      },
      {
        id: 'fechadura-tetra',
        name: 'Fechadura Tetra',
        description: 'Instalação de fechadura tetra (código)',
        category: 'installation',
        pricingMethod: 'fixed',
        defaultPrice: 600,
      },
      {
        id: 'portao-automatico',
        name: 'Portão Automático',
        description: 'Instalação de motor para portão automático',
        category: 'installation',
        pricingMethod: 'fixed',
        defaultPrice: 1500,
      },
      {
        id: 'tranca-portao',
        name: 'Tranca de Portão',
        description: 'Instalação de tranca elétrica para portão',
        category: 'installation',
        pricingMethod: 'fixed',
        defaultPrice: 400,
      },
      {
        id: 'cerca-eletrica',
        name: 'Cerca Elétrica',
        description: 'Instalação de cerca elétrica',
        category: 'installation',
        pricingMethod: 'linear',
        requiresDimensions: true,
        defaultPrice: 50,
      },
    ],
    maintenance: [
      {
        id: 'abertura',
        name: 'Abertura de Porta',
        description: 'Abertura de porta trancada (emergência)',
        category: 'maintenance',
        pricingMethod: 'fixed',
        defaultPrice: 150,
      },
      {
        id: 'copia-chave',
        name: 'Cópia de Chave',
        description: 'Cópia simples de chave',
        category: 'maintenance',
        pricingMethod: 'unit',
        defaultPrice: 15,
      },
      {
        id: 'copia-chave-tetra',
        name: 'Cópia de Chave Tetra',
        description: 'Cópia de chave tetra codificada',
        category: 'maintenance',
        pricingMethod: 'unit',
        defaultPrice: 80,
      },
      {
        id: 'troca-segredo',
        name: 'Troca de Segredo',
        description: 'Troca do segredo interno da fechadura',
        category: 'maintenance',
        pricingMethod: 'unit',
        defaultPrice: 120,
      },
      {
        id: 'manutencao-fechadura',
        name: 'Manutenção de Fechadura',
        description: 'Limpeza e lubrificação de fechadura',
        category: 'maintenance',
        pricingMethod: 'fixed',
        defaultPrice: 80,
      },
      {
        id: 'reparo-portao',
        name: 'Reparo de Portão',
        description: 'Reparo e ajuste de portão automático',
        category: 'maintenance',
        pricingMethod: 'fixed',
        defaultPrice: 200,
      },
    ],
  },
  serralheria: {
    installation: [
      {
        id: 'portao-metalico',
        name: 'Portão Metálico',
        description: 'Instalação de portão metálico',
        category: 'installation',
        pricingMethod: 'm2',
        requiresDimensions: true,
      },
      {
        id: 'grade-protecao',
        name: 'Grade de Proteção',
        description: 'Instalação de grade de proteção para janelas',
        category: 'installation',
        pricingMethod: 'm2',
        requiresDimensions: true,
      },
      {
        id: 'porta-metalica',
        name: 'Porta Metálica',
        description: 'Instalação de porta metálica de segurança',
        category: 'installation',
        pricingMethod: 'fixed',
        defaultPrice: 1200,
      },
    ],
    maintenance: [
      {
        id: 'pintura-metal',
        name: 'Pintura de Metal',
        description: 'Pintura e tratamento anticorrosivo',
        category: 'maintenance',
        pricingMethod: 'm2',
        requiresDimensions: true,
        defaultPrice: 60,
      },
      {
        id: 'solda-reparo',
        name: 'Solda e Reparo',
        description: 'Reparo em estruturas metálicas',
        category: 'maintenance',
        pricingMethod: 'fixed',
        defaultPrice: 200,
      },
    ],
  },
  'marido-de-aluguel': {
    installation: [
      {
        id: 'instalacao-geral',
        name: 'Instalação Geral',
        description: 'Instalação de diversos itens residenciais',
        category: 'installation',
        pricingMethod: 'fixed',
        defaultPrice: 150,
      },
      {
        id: 'montagem-moveis',
        name: 'Montagem de Móveis',
        description: 'Montagem de móveis planejados ou prontos',
        category: 'installation',
        pricingMethod: 'fixed',
        defaultPrice: 200,
      },
    ],
    maintenance: [
      {
        id: 'reparo-geral',
        name: 'Reparo Geral',
        description: 'Reparos diversos em residências',
        category: 'maintenance',
        pricingMethod: 'fixed',
        defaultPrice: 150,
      },
      {
        id: 'visita-tecnica',
        name: 'Visita Técnica',
        description: 'Diagnóstico e avaliação técnica',
        category: 'maintenance',
        pricingMethod: 'fixed',
        defaultPrice: 100,
      },
    ],
  },
  'eletrica-hidraulica': {
    installation: [
      {
        id: 'instalacao-eletrica',
        name: 'Instalação Elétrica',
        description: 'Instalação de pontos elétricos e circuitos',
        category: 'installation',
        pricingMethod: 'fixed',
        defaultPrice: 250,
      },
      {
        id: 'instalacao-hidraulica',
        name: 'Instalação Hidráulica',
        description: 'Instalação de encanamento e pontos hidráulicos',
        category: 'installation',
        pricingMethod: 'fixed',
        defaultPrice: 300,
      },
    ],
    maintenance: [
      {
        id: 'reparo-eletrico',
        name: 'Reparo Elétrico',
        description: 'Reparo em instalações elétricas',
        category: 'maintenance',
        pricingMethod: 'fixed',
        defaultPrice: 150,
      },
      {
        id: 'reparo-hidraulico',
        name: 'Reparo Hidráulico',
        description: 'Reparo em vazamentos e instalações hidráulicas',
        category: 'maintenance',
        pricingMethod: 'fixed',
        defaultPrice: 180,
      },
      {
        id: 'desentupimento',
        name: 'Desentupimento',
        description: 'Desentupimento de canos e ralos',
        category: 'maintenance',
        pricingMethod: 'fixed',
        defaultPrice: 200,
      },
    ],
  },
};

/**
 * Get catalog items for a profession
 */
export function getProfessionCatalog(profession: Profession | string | undefined): {
  installation: CatalogItem[];
  maintenance: CatalogItem[];
} {
  if (!profession || !(profession in PROFESSION_CATALOG)) {
    // Default to vidracaria if profession is not recognized
    return PROFESSION_CATALOG.vidracaria;
  }
  return PROFESSION_CATALOG[profession as Profession];
}
