/**
 * ESTRUTURA DE DADOS - GÊMEO DIGITAL (SIMULADOR DE ENGENHARIA)
 * 
 * Este arquivo define os tipos TypeScript para o sistema de Gêmeo Digital
 * que permite simular e calcular projetos de vidraçaria com precisão física.
 */

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// TIPOS BASE
// ============================================================================

/**
 * Identificadores únicos dos motores de engenharia disponíveis
 */
export type EngineId = 
  | 'sacada_ks'           // Sacada KS (sistema de envidraçamento de sacada)
  | 'janela_correr'       // Janela de Correr (2, 4, 6 folhas)
  | 'janela_maximar'      // Janela Maxim-Ar
  | 'janela_basculante'   // Janela Basculante
  | 'porta_pivotante'     // Porta de Abrir (Pivotante)
  | 'porta_correr'        // Porta de Correr
  | 'box_frontal'         // Box Frontal
  | 'box_canto'           // Box de Canto (L)
  | 'guarda_corpo_torre'  // Guarda-Corpo Sistema Torre
  | 'guarda_corpo_botao'  // Guarda-Corpo Sistema Botão
  | 'guarda_corpo_perfil' // Guarda-Corpo Perfil U
  | 'espelho_simples'     // Espelho Simples
  | 'vidro_fixo';         // Vidro Fixo (vitrines, divisórias)

/**
 * Métodos de cálculo de preço
 */
export type PricingMethod = 'm2' | 'linear' | 'fixed' | 'unit';

/**
 * Status de processamento do cálculo de engenharia
 */
export type EngineStatus = 'pending' | 'calculated' | 'error' | 'manual_override';

// ============================================================================
// REGRAS FÍSICAS (Engine Config)
// ============================================================================

/**
 * Configuração das regras físicas e de engenharia do projeto
 * Estas regras determinam como o sistema calcula dimensões, cortes e materiais
 */
export interface RegrasFisicas {
  // --- Geometria e Estrutura ---
  
  /** Indica se o sistema possui pivô central (ex: sacada KS) */
  tem_pivo?: boolean;
  
  /** Número de folhas/painéis do sistema */
  numero_folhas?: number;
  
  /** Tipo de movimento das folhas */
  tipo_movimento?: 'correr' | 'abrir' | 'basculante' | 'fixo' | 'empilhavel';
  
  /** Folgas e Espaçamentos (em milímetros) */
  folgas: {
    /** Folga padrão entre vidro e perfil (ex: 15mm) */
    padrao: number;
    
    /** Folga lateral (esquerda/direita) */
    lateral?: number;
    
    /** Folga superior */
    superior?: number;
    
    /** Folga inferior */
    inferior?: number;
    
    /** Espaço para empilhamento de folhas (sacada KS) */
    empilhamento?: number;
  };
  
  // --- Materiais e Espessuras ---
  
  /** Espessuras de vidro permitidas (em mm) */
  espessuras_vidro_permitidas: number[];
  
  /** Espessura de vidro padrão recomendada (em mm) */
  espessura_vidro_padrao: number;
  
  /** Tipos de vidro permitidos */
  tipos_vidro_permitidos?: ('temperado' | 'laminado' | 'comum' | 'blindex')[];
  
  /** Tipo de perfil/alumínio usado */
  tipo_perfil?: string; // ex: 'linha_25', 'linha_30', 'slim'
  
  // --- Limitações e Validações ---
  
  /** Dimensões mínimas permitidas (em metros) */
  dimensoes_minimas: {
    largura: number;
    altura: number;
  };
  
  /** Dimensões máximas permitidas (em metros) */
  dimensoes_maximas: {
    largura: number;
    altura: number;
  };
  
  /** Área máxima por folha de vidro (em m²) */
  area_maxima_folha?: number;
  
  /** Peso máximo suportado por folha (em kg) */
  peso_maximo_folha?: number;
  
  // --- Cálculos Automáticos ---
  
  /** Indica se deve calcular automaticamente o número de folhas baseado na largura */
  calcular_folhas_automatico?: boolean;
  
  /** Largura mínima por folha para cálculo automático (em metros) */
  largura_minima_folha?: number;
  
  /** Largura máxima por folha para cálculo automático (em metros) */
  largura_maxima_folha?: number;
  
  // --- Hardware e Acessórios ---
  
  /** Lista de acessórios obrigatórios */
  acessorios_obrigatorios?: Array<{
    nome: string;
    quantidade_formula?: string; // ex: 'numero_folhas * 2' para dobradiças
    preco_unitario?: number;
  }>;
  
  /** Lista de acessórios opcionais */
  acessorios_opcionais?: Array<{
    nome: string;
    preco_unitario: number;
  }>;
  
  // --- Regras Especiais ---
  
  /** Regras customizadas específicas do sistema (formato JSON flexível) */
  regras_customizadas?: Record<string, any>;
}

/**
 * Mapeamento entre cores/materiais do orçamento e representação visual no desenho
 */
export interface MapeamentoMateriais {
  /** Mapeamento de cores de vidro */
  vidro: {
    [corId: string]: {
      /** Nome da cor (ex: "Incolor", "Verde", "Fumê") */
      nome: string;
      
      /** Código hexadecimal da cor para renderização */
      hex: string;
      
      /** Opacidade (0-1) */
      opacity?: number;
      
      /** URL de textura (opcional, para vidros com padrões) */
      texture_url?: string;
    };
  };
  
  /** Mapeamento de cores de perfis/alumínio */
  perfil: {
    [corId: string]: {
      nome: string;
      hex: string;
      acabamento?: 'fosco' | 'brilhante' | 'anodizado' | 'texturizado';
    };
  };
  
  /** Cores de acessórios (puxadores, fechos, etc) */
  acessorios?: {
    [corId: string]: {
      nome: string;
      hex: string;
    };
  };
}

// ============================================================================
// ENGINE CONFIG (Configuração do Motor de Engenharia)
// ============================================================================

/**
 * Configuração completa do motor de engenharia que será salva no Template
 */
export interface EngineConfig {
  /** Identificador único do motor de engenharia */
  engine_id: EngineId;
  
  /** Nome descritivo do sistema de engenharia */
  engine_name: string;
  
  /** Versão da engine (para controle de compatibilidade) */
  engine_version: string;
  
  /** Regras físicas e de cálculo do sistema */
  regras_fisicas: RegrasFisicas;
  
  /** Mapeamento de materiais para renderização visual */
  mapeamento_materiais: MapeamentoMateriais;
  
  /** Metadados adicionais */
  metadata?: {
    /** Data da última atualização das regras */
    ultima_atualizacao?: Timestamp | Date;
    
    /** Autor/responsável pela configuração */
    autor?: string;
    
    /** Notas técnicas ou observações */
    notas?: string;
  };
}

// ============================================================================
// TEMPLATE (Coleção: templates)
// ============================================================================

/**
 * Template de projeto que contém a configuração de engenharia
 * Armazenado na coleção 'templates' do Firestore
 */
export interface Template {
  /** ID do documento no Firestore */
  id?: string;
  
  /** Nome do template (ex: "Sacada KS", "Janela 4 Folhas") */
  name: string;
  
  /** Categoria do projeto */
  category: string;
  
  /** URL da imagem ilustrativa do projeto */
  imageUrl: string;
  
  /** Configuração do motor de engenharia (NOVO CAMPO) */
  engine_config?: EngineConfig;
  
  /** Data de criação */
  createdAt: Timestamp | Date;
  
  /** Data da última atualização */
  updatedAt?: Timestamp | Date;
  
  /** Indica se o template está ativo/visível */
  active?: boolean;
  
  /** Tags para busca e filtros */
  tags?: string[];
}

// ============================================================================
// RESULTADO DO CÁLCULO (Snapshot)
// ============================================================================

/**
 * Resultado do cálculo de engenharia realizado pela engine
 */
export interface ResultadoCalculo {
  /** Status do cálculo */
  status: EngineStatus;
  
  /** Timestamp do cálculo */
  calculado_em?: Timestamp | Date;
  
  /** Dimensões calculadas */
  dimensoes_calculadas?: {
    /** Largura total do projeto (em metros) */
    largura_total: number;
    
    /** Altura total do projeto (em metros) */
    altura_total: number;
    
    /** Área total (em m²) */
    area_total: number;
    
    /** Dimensões individuais de cada folha/painel */
    folhas?: Array<{
      /** Número/identificação da folha */
      numero: number;
      
      /** Largura da folha (em metros) */
      largura: number;
      
      /** Altura da folha (em metros) */
      altura: number;
      
      /** Área da folha (em m²) */
      area: number;
      
      /** Peso estimado (em kg) */
      peso_estimado?: number;
    }>;
  };
  
  /** Lista de materiais calculada (BOM - Bill of Materials) */
  lista_materiais?: Array<{
    /** Tipo do material (vidro, perfil, acessório) */
    tipo: 'vidro' | 'perfil' | 'acessorio' | 'outro';
    
    /** Descrição do material */
    descricao: string;
    
    /** Quantidade calculada */
    quantidade: number;
    
    /** Unidade de medida */
    unidade: 'm2' | 'm' | 'un' | 'kg';
    
    /** Preço unitário (opcional, pode ser calculado depois) */
    preco_unitario?: number;
    
    /** Subtotal (quantidade * preço_unitário) */
    subtotal?: number;
  }>;
  
  /** Validações e avisos */
  validacoes?: Array<{
    /** Tipo de validação */
    tipo: 'erro' | 'aviso' | 'info';
    
    /** Mensagem */
    mensagem: string;
    
    /** Campo relacionado (opcional) */
    campo?: string;
  }>;
  
  /** Dados brutos do cálculo (para debug) */
  dados_brutos?: Record<string, any>;
}

// ============================================================================
// ITEM DO ORÇAMENTO (Coleção: quotes -> array items)
// ============================================================================

/**
 * Item individual de um orçamento
 * Contém um snapshot da configuração de engenharia + possibilidade de override
 */
export interface OrcamentoItem {
  // --- Campos Existentes (mantidos) ---
  serviceId: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  isCustom?: boolean;
  
  // --- Campos de Preço/Dimensões (mantidos) ---
  pricingMethod?: PricingMethod;
  dimensions?: {
    width: number;
    height: number;
    area?: number;
  };
  
  // --- Campos Visuais (mantidos) ---
  glassColor?: string;
  glassThickness?: string;
  profileColor?: string;
  isInstallation?: boolean;
  imageUrl?: string;
  templateId?: string;
  description?: string;
  
  // --- NOVO: Configuração de Engenharia (Snapshot) ---
  
  /**
   * Snapshot da configuração de engenharia do template
   * Copiado do template no momento da criação do orçamento
   */
  engine_config_snapshot?: EngineConfig;
  
  /**
   * Overrides específicos deste orçamento
   * Permite sobrescrever valores do snapshot para este projeto específico
   * Ex: mudar folga de 15mm para 10mm apenas neste projeto
   */
  engine_overrides?: {
    /** Overrides de regras físicas */
    regras_fisicas?: Partial<RegrasFisicas>;
    
    /** Overrides de mapeamento de materiais */
    mapeamento_materiais?: Partial<MapeamentoMateriais>;
    
    /** Comentário explicando o motivo do override */
    motivo_override?: string;
  };
  
  /**
   * Resultado do cálculo de engenharia para este item
   */
  resultado_calculo?: ResultadoCalculo;
  
  /**
   * Indica se o cálculo de engenharia está habilitado para este item
   * Pode ser desabilitado para itens simples ou orçamentos manuais
   */
  usar_engenharia?: boolean;
}

// ============================================================================
// ORÇAMENTO COMPLETO (Coleção: quotes)
// ============================================================================

/**
 * Documento completo de orçamento no Firestore
 */
export interface Orcamento {
  /** ID do documento no Firestore */
  id?: string;
  
  /** ID da empresa dona do orçamento */
  companyId: string;
  
  /** ID do cliente */
  clientId: string;
  
  /** Nome do cliente (denormalizado para performance) */
  clientName: string;
  
  /** Lista de itens do orçamento */
  items: OrcamentoItem[];
  
  /** Subtotal (soma de todos os itens) */
  subtotal: number;
  
  /** Desconto aplicado */
  discount: number;
  
  /** Total final (subtotal - desconto) */
  total: number;
  
  /** Status do orçamento */
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired';
  
  /** Garantia oferecida */
  warranty?: string;
  
  /** Observações gerais */
  observations?: string;
  
  /** Data de criação */
  createdAt: Timestamp | Date;
  
  /** Data de atualização */
  updatedAt?: Timestamp | Date;
  
  /** Data de expiração do orçamento */
  expiresAt?: Timestamp | Date;
  
  /** Configurações de pagamento */
  paymentSettings?: {
    /** Desconto para pagamento em PIX (%) */
    pixDiscount?: number;
    
    /** Número máximo de parcelas */
    maxInstallments?: number;
    
    /** Notas sobre pagamento */
    notes?: string;
  };
}

// ============================================================================
// EXEMPLOS DE JSON REAL
// ============================================================================

/**
 * EXEMPLO 1: SACADA KS (Envidraçamento de Sacada)
 * Sistema de empilhamento de folhas de vidro para sacadas
 */
export const EXEMPLO_SACADA_KS: Template = {
  name: 'Sacada KS - Envidraçamento',
  category: 'Envidraçamento',
  imageUrl: 'https://storage.googleapis.com/gestor-vitreo/templates/sacada-ks.jpg',
  createdAt: new Date('2026-01-18'),
  active: true,
  tags: ['sacada', 'envidraçamento', 'empilhavel'],
  
  engine_config: {
    engine_id: 'sacada_ks',
    engine_name: 'Sacada KS - Sistema de Empilhamento',
    engine_version: '1.0.0',
    
    regras_fisicas: {
      tem_pivo: true,
      numero_folhas: 6, // Valor padrão, pode ser customizado
      tipo_movimento: 'empilhavel',
      
      folgas: {
        padrao: 15, // 15mm de folga padrão
        lateral: 20, // 20mm nas laterais
        superior: 15,
        inferior: 15,
        empilhamento: 40, // 40mm de espaço para empilhar as folhas
      },
      
      espessuras_vidro_permitidas: [6, 8, 10],
      espessura_vidro_padrao: 8,
      tipos_vidro_permitidos: ['temperado'],
      tipo_perfil: 'linha_ks_standard',
      
      dimensoes_minimas: {
        largura: 1.5, // 1,5m de largura mínima
        altura: 1.2,  // 1,2m de altura mínima
      },
      
      dimensoes_maximas: {
        largura: 12.0, // 12m de largura máxima
        altura: 3.0,   // 3m de altura máxima
      },
      
      area_maxima_folha: 2.5, // 2,5m² por folha de vidro
      peso_maximo_folha: 50,  // 50kg por folha
      
      calcular_folhas_automatico: true,
      largura_minima_folha: 0.5, // Mínimo 50cm por folha
      largura_maxima_folha: 1.0, // Máximo 1m por folha
      
      acessorios_obrigatorios: [
        {
          nome: 'Pivô Central KS',
          quantidade_formula: '1', // 1 pivô por sistema
          preco_unitario: 450.00,
        },
        {
          nome: 'Perfil Trilho Superior',
          quantidade_formula: 'largura_total', // Metros lineares
          preco_unitario: 120.00, // Por metro
        },
        {
          nome: 'Perfil Trilho Inferior',
          quantidade_formula: 'largura_total',
          preco_unitario: 110.00,
        },
        {
          nome: 'Roldana',
          quantidade_formula: 'numero_folhas * 4', // 4 roldanas por folha
          preco_unitario: 15.00,
        },
        {
          nome: 'Fecho Imantado',
          quantidade_formula: 'numero_folhas',
          preco_unitario: 35.00,
        },
      ],
      
      acessorios_opcionais: [
        {
          nome: 'Trava de Segurança',
          preco_unitario: 85.00,
        },
        {
          nome: 'Vedação de Escova',
          preco_unitario: 25.00, // Por metro
        },
      ],
      
      regras_customizadas: {
        permitir_folhas_asimetricas: false,
        exigir_numero_folhas_par: true,
        calcular_peso_estrutura: true,
      },
    },
    
    mapeamento_materiais: {
      vidro: {
        'incolor': {
          nome: 'Vidro Incolor',
          hex: '#E8F4F8',
          opacity: 0.3,
        },
        'verde': {
          nome: 'Vidro Verde',
          hex: '#C8E6C9',
          opacity: 0.4,
        },
        'fume': {
          nome: 'Vidro Fumê',
          hex: '#90A4AE',
          opacity: 0.5,
        },
        'bronze': {
          nome: 'Vidro Bronze',
          hex: '#BCAAA4',
          opacity: 0.4,
        },
      },
      
      perfil: {
        'branco': {
          nome: 'Alumínio Branco',
          hex: '#FFFFFF',
          acabamento: 'fosco',
        },
        'preto': {
          nome: 'Alumínio Preto',
          hex: '#212121',
          acabamento: 'anodizado',
        },
        'bronze': {
          nome: 'Alumínio Bronze',
          hex: '#8D6E63',
          acabamento: 'anodizado',
        },
        'natural': {
          nome: 'Alumínio Natural',
          hex: '#E0E0E0',
          acabamento: 'anodizado',
        },
      },
      
      acessorios: {
        'cromado': {
          nome: 'Cromado',
          hex: '#C0C0C0',
        },
        'preto_fosco': {
          nome: 'Preto Fosco',
          hex: '#424242',
        },
      },
    },
    
    metadata: {
      ultima_atualizacao: new Date('2026-01-18'),
      autor: 'Equipe Gestor Vitreo',
      notas: 'Configuração padrão para sistema KS. Testado e validado em centenas de instalações.',
    },
  },
};

/**
 * EXEMPLO 2: JANELA 4 FOLHAS DE CORRER
 * Janela tradicional com 4 folhas de vidro em sistema de correr
 */
export const EXEMPLO_JANELA_4_FOLHAS: Template = {
  name: 'Janela 4 Folhas de Correr',
  category: 'Janelas',
  imageUrl: 'https://storage.googleapis.com/gestor-vitreo/templates/janela-4-folhas.jpg',
  createdAt: new Date('2026-01-18'),
  active: true,
  tags: ['janela', 'correr', '4-folhas'],
  
  engine_config: {
    engine_id: 'janela_correr',
    engine_name: 'Janela de Correr - 4 Folhas',
    engine_version: '1.0.0',
    
    regras_fisicas: {
      tem_pivo: false,
      numero_folhas: 4,
      tipo_movimento: 'correr',
      
      folgas: {
        padrao: 12, // 12mm de folga padrão
        lateral: 15,
        superior: 12,
        inferior: 12,
      },
      
      espessuras_vidro_permitidas: [4, 6, 8],
      espessura_vidro_padrao: 6,
      tipos_vidro_permitidos: ['temperado', 'laminado', 'comum'],
      tipo_perfil: 'linha_25_esquadria',
      
      dimensoes_minimas: {
        largura: 1.2,
        altura: 1.0,
      },
      
      dimensoes_maximas: {
        largura: 3.0,
        altura: 2.2,
      },
      
      area_maxima_folha: 1.8,
      peso_maximo_folha: 35,
      
      calcular_folhas_automatico: false, // Sempre 4 folhas
      
      acessorios_obrigatorios: [
        {
          nome: 'Marco de Alumínio',
          quantidade_formula: '(largura_total + altura_total) * 2', // Perímetro
          preco_unitario: 85.00,
        },
        {
          nome: 'Trilho de Correr',
          quantidade_formula: 'largura_total * 2', // Superior e inferior
          preco_unitario: 65.00,
        },
        {
          nome: 'Roldana de Nylon',
          quantidade_formula: 'numero_folhas * 2', // 2 por folha
          preco_unitario: 12.00,
        },
        {
          nome: 'Fecho Concha',
          quantidade_formula: '2', // 2 fechos
          preco_unitario: 18.00,
        },
        {
          nome: 'Trava de Segurança',
          quantidade_formula: '2',
          preco_unitario: 22.00,
        },
      ],
      
      acessorios_opcionais: [
        {
          nome: 'Tela Mosquiteiro',
          preco_unitario: 180.00,
        },
        {
          nome: 'Persiana Integrada',
          preco_unitario: 450.00,
        },
      ],
      
      regras_customizadas: {
        folhas_fixas: [1, 4], // Folhas 1 e 4 são fixas, 2 e 3 correm
        sobreposicao_folhas: 0.05, // 5cm de sobreposição
        permitir_numero_folhas_variavel: false,
      },
    },
    
    mapeamento_materiais: {
      vidro: {
        'incolor': {
          nome: 'Vidro Incolor Transparente',
          hex: '#F5F9FA',
          opacity: 0.2,
        },
        'verde': {
          nome: 'Vidro Verde',
          hex: '#C8E6C9',
          opacity: 0.35,
        },
        'fume': {
          nome: 'Vidro Fumê',
          hex: '#9E9E9E',
          opacity: 0.45,
        },
        'laminado_incolor': {
          nome: 'Laminado Incolor',
          hex: '#E3F2FD',
          opacity: 0.25,
        },
      },
      
      perfil: {
        'branco': {
          nome: 'Alumínio Branco',
          hex: '#FAFAFA',
          acabamento: 'fosco',
        },
        'preto': {
          nome: 'Alumínio Preto',
          hex: '#263238',
          acabamento: 'anodizado',
        },
        'champagne': {
          nome: 'Alumínio Champagne',
          hex: '#D7CCC8',
          acabamento: 'anodizado',
        },
        'bronze': {
          nome: 'Alumínio Bronze',
          hex: '#8D6E63',
          acabamento: 'anodizado',
        },
      },
      
      acessorios: {
        'cromado': {
          nome: 'Cromado Brilhante',
          hex: '#E0E0E0',
        },
        'preto_fosco': {
          nome: 'Preto Fosco',
          hex: '#37474F',
        },
        'dourado': {
          nome: 'Dourado',
          hex: '#FFD700',
        },
      },
    },
    
    metadata: {
      ultima_atualizacao: new Date('2026-01-18'),
      autor: 'Equipe Gestor Vitreo',
      notas: 'Modelo clássico de janela 4 folhas. Folhas 1 e 4 fixas, folhas 2 e 3 móveis.',
    },
  },
};

/**
 * EXEMPLO 3: ITEM DE ORÇAMENTO COM OVERRIDE
 * Exemplo de como um item fica no orçamento, com possibilidade de customização
 */
export const EXEMPLO_ITEM_ORCAMENTO_SACADA: OrcamentoItem = {
  // Campos básicos do item
  serviceId: 'template_sacada_ks_001',
  serviceName: 'Sacada KS - Envidraçamento 8 Folhas',
  quantity: 1,
  unitPrice: 0, // Será calculado pela engine
  total: 0,     // Será calculado pela engine
  
  // Configuração de preço
  pricingMethod: 'm2',
  dimensions: {
    width: 6.5,  // 6,5 metros de largura
    height: 2.4, // 2,4 metros de altura
    area: 15.6,  // 6,5 * 2,4 = 15,6m²
  },
  
  // Seleções do cliente
  glassColor: 'incolor',
  glassThickness: '8mm',
  profileColor: 'branco',
  isInstallation: true,
  imageUrl: 'https://storage.googleapis.com/gestor-vitreo/templates/sacada-ks.jpg',
  templateId: 'template_sacada_ks',
  description: 'Envidraçamento de sacada com sistema KS, 8 folhas de vidro temperado 8mm',
  
  // SNAPSHOT da configuração de engenharia (copiada do template)
  engine_config_snapshot: EXEMPLO_SACADA_KS.engine_config,
  
  // OVERRIDE específico deste orçamento
  // Exemplo: cliente pediu folga reduzida de 10mm ao invés de 15mm
  engine_overrides: {
    regras_fisicas: {
      folgas: {
        padrao: 10,      // Mudado de 15mm para 10mm
        lateral: 15,     // Mantido
        superior: 10,    // Mudado de 15mm para 10mm
        inferior: 10,    // Mudado de 15mm para 10mm
        empilhamento: 35, // Mudado de 40mm para 35mm
      },
      numero_folhas: 8, // Mudado de 6 para 8 folhas
    },
    motivo_override: 'Cliente solicitou mais folhas e folga reduzida para melhor vedação',
  },
  
  // Flag indicando que a engenharia está ativa
  usar_engenharia: true,
  
  // Resultado do cálculo (será preenchido pela engine)
  resultado_calculo: {
    status: 'calculated',
    calculado_em: new Date('2026-01-18T14:30:00'),
    
    dimensoes_calculadas: {
      largura_total: 6.5,
      altura_total: 2.4,
      area_total: 15.6,
      
      folhas: [
        { numero: 1, largura: 0.8125, altura: 2.37, area: 1.926, peso_estimado: 36.8 },
        { numero: 2, largura: 0.8125, altura: 2.37, area: 1.926, peso_estimado: 36.8 },
        { numero: 3, largura: 0.8125, altura: 2.37, area: 1.926, peso_estimado: 36.8 },
        { numero: 4, largura: 0.8125, altura: 2.37, area: 1.926, peso_estimado: 36.8 },
        { numero: 5, largura: 0.8125, altura: 2.37, area: 1.926, peso_estimado: 36.8 },
        { numero: 6, largura: 0.8125, altura: 2.37, area: 1.926, peso_estimado: 36.8 },
        { numero: 7, largura: 0.8125, altura: 2.37, area: 1.926, peso_estimado: 36.8 },
        { numero: 8, largura: 0.8125, altura: 2.37, area: 1.926, peso_estimado: 36.8 },
      ],
    },
    
    lista_materiais: [
      {
        tipo: 'vidro',
        descricao: 'Vidro Temperado Incolor 8mm',
        quantidade: 15.6,
        unidade: 'm2',
        preco_unitario: 180.00,
        subtotal: 2808.00,
      },
      {
        tipo: 'perfil',
        descricao: 'Perfil Trilho Superior KS',
        quantidade: 6.5,
        unidade: 'm',
        preco_unitario: 120.00,
        subtotal: 780.00,
      },
      {
        tipo: 'perfil',
        descricao: 'Perfil Trilho Inferior KS',
        quantidade: 6.5,
        unidade: 'm',
        preco_unitario: 110.00,
        subtotal: 715.00,
      },
      {
        tipo: 'acessorio',
        descricao: 'Pivô Central KS',
        quantidade: 1,
        unidade: 'un',
        preco_unitario: 450.00,
        subtotal: 450.00,
      },
      {
        tipo: 'acessorio',
        descricao: 'Roldana',
        quantidade: 32, // 8 folhas * 4 roldanas
        unidade: 'un',
        preco_unitario: 15.00,
        subtotal: 480.00,
      },
      {
        tipo: 'acessorio',
        descricao: 'Fecho Imantado',
        quantidade: 8,
        unidade: 'un',
        preco_unitario: 35.00,
        subtotal: 280.00,
      },
    ],
    
    validacoes: [
      {
        tipo: 'info',
        mensagem: 'Projeto calculado com sucesso. Todas as dimensões estão dentro dos limites.',
      },
      {
        tipo: 'aviso',
        mensagem: 'Folga customizada de 10mm. Verifique compatibilidade com o perfil utilizado.',
        campo: 'folgas.padrao',
      },
    ],
  },
};

/**
 * EXEMPLO 4: ORÇAMENTO COMPLETO COM MÚLTIPLOS ITENS
 */
export const EXEMPLO_ORCAMENTO_COMPLETO: Orcamento = {
  companyId: 'company_123',
  clientId: 'client_456',
  clientName: 'João Silva',
  
  items: [
    EXEMPLO_ITEM_ORCAMENTO_SACADA,
    // Poderia ter mais itens aqui
  ],
  
  subtotal: 5513.00, // Soma dos subtotais da lista de materiais
  discount: 0,
  total: 5513.00,
  
  status: 'draft',
  warranty: '12 meses de garantia contra defeitos de fabricação',
  observations: 'Instalação prevista para 15 dias após aprovação. Pagamento: 50% antecipado, 50% na entrega.',
  
  createdAt: new Date('2026-01-18T14:00:00'),
  expiresAt: new Date('2026-01-28T23:59:59'), // Válido por 10 dias
  
  paymentSettings: {
    pixDiscount: 5,
    maxInstallments: 3,
    notes: 'Entrada de 50% + restante na conclusão',
  },
};
