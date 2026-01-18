/**
 * TIPOS E CONFIGURAÇÕES BASE - MOTORES DE RENDERIZAÇÃO
 * 
 * Este arquivo define os contratos (interfaces) que todos os motores de
 * renderização devem seguir. É o "contrato universal" entre o sistema
 * e os diferentes tipos de esquadrias (Sacada, Janela, Portão, etc).
 * 
 * OBJETIVO: Padronizar as variáveis e regras para manutenibilidade e escalabilidade.
 * 
 * USO:
 * import { EngineProps, EngineRules, EngineOutput } from './engines/types';
 */

// ============================================================================
// TIPOS BÁSICOS
// ============================================================================

/**
 * IDs dos motores de renderização disponíveis
 */
export type EngineId = 
  | 'sacada_ks'           // Sacada KS (envidraçamento empilhável)
  | 'janela_correr'       // Janela de Correr (2, 4, 6 folhas)
  | 'janela_maximar'      // Janela Maxim-Ar
  | 'janela_basculante'   // Janela Basculante
  | 'porta_pivotante'     // Porta de Abrir (Pivotante)
  | 'porta_correr'        // Porta de Correr
  | 'box_frontal'         // Box de Banheiro Frontal
  | 'box_canto'           // Box de Canto (L)
  | 'guarda_corpo_torre'  // Guarda-Corpo Sistema Torre
  | 'guarda_corpo_botao'  // Guarda-Corpo Sistema Botão
  | 'guarda_corpo_perfil' // Guarda-Corpo Perfil U
  | 'espelho_simples'     // Espelho Simples
  | 'vidro_fixo';         // Vidro Fixo (vitrines, divisórias)

/**
 * Status do processo de renderização
 */
export type RenderStatus = 'idle' | 'rendering' | 'success' | 'error';

/**
 * Tipo de movimento das folhas/painéis
 */
export type TipoMovimento = 
  | 'correr'        // Desliza horizontalmente
  | 'abrir'         // Abre como porta (pivotante)
  | 'basculante'    // Inclina no eixo horizontal
  | 'maximar'       // Inclina no eixo horizontal (parte superior)
  | 'empilhavel'    // Empilha lateralmente (sacada KS)
  | 'fixo'          // Não se move
  | 'sanfonado';    // Dobra como sanfona

/**
 * Vista de renderização
 */
export type VistaRenderizacao = 
  | 'frontal'       // Vista de frente
  | 'lateral'       // Vista de lado
  | 'superior'      // Vista de cima
  | '3d';           // Vista 3D

// ============================================================================
// PROPS DO COMPONENTE (Entrada do Usuário)
// ============================================================================

/**
 * Props que todo componente simulador deve receber
 * 
 * Estas são as propriedades passadas pelo sistema para o motor de renderização.
 * O motor usa essas props para desenhar o projeto no canvas/SVG.
 * 
 * @example
 * <SacadaKSEngine 
 *   largura={6.5}
 *   altura={2.4}
 *   quantidade_folhas={8}
 *   cor_vidro_id="incolor"
 *   cor_perfil_id="branco_fosco"
 * />
 */
export interface EngineProps {
  // --- DIMENSÕES FÍSICAS (em metros) ---
  
  /**
   * Largura total do projeto (em metros)
   * Ex: 6.5 = 6 metros e 50 centímetros
   */
  largura: number;
  
  /**
   * Altura total do projeto (em metros)
   * Ex: 2.4 = 2 metros e 40 centímetros
   */
  altura: number;
  
  /**
   * Profundidade/espessura (em metros)
   * Usado em alguns sistemas como box de canto
   * OPCIONAL: pode ser null para sistemas 2D
   */
  profundidade?: number | null;
  
  // --- CONFIGURAÇÃO DE FOLHAS/PAINÉIS ---
  
  /**
   * Quantidade de folhas/painéis de vidro
   * Ex: 8 folhas para sacada KS, 4 folhas para janela
   */
  quantidade_folhas: number;
  
  /**
   * Espessura do vidro (em milímetros)
   * Ex: 8 = vidro de 8mm
   * Padrões comuns: 4, 6, 8, 10, 12mm
   */
  espessura_vidro: number;
  
  // --- SELEÇÃO DE MATERIAIS ---
  
  /**
   * ID da cor do vidro (referencia materiais.js)
   * Ex: 'incolor', 'fume', 'verde', 'bronze'
   * @see src/constants/materiais.js - CORES_VIDRO
   */
  cor_vidro_id: string;
  
  /**
   * ID da cor do perfil de alumínio (referencia materiais.js)
   * Ex: 'branco_fosco', 'preto_anodizado', 'bronze'
   * @see src/constants/materiais.js - CORES_ALUMINIO
   */
  cor_perfil_id: string;
  
  // --- CONFIGURAÇÃO VISUAL ---
  
  /**
   * Vista de renderização desejada
   * Padrão: 'frontal'
   */
  vista?: VistaRenderizacao;
  
  /**
   * Exibir cotas/dimensões no desenho
   * Padrão: false
   */
  exibir_cotas?: boolean;
  
  /**
   * Exibir grade de referência
   * Padrão: false
   */
  exibir_grade?: boolean;
  
  /**
   * Zoom aplicado ao desenho (1 = 100%)
   * Padrão: 1
   */
  zoom?: number;
  
  /**
   * Largura do canvas em pixels
   * Padrão: 800
   */
  canvas_largura?: number;
  
  /**
   * Altura do canvas em pixels
   * Padrão: 600
   */
  canvas_altura?: number;
  
  // --- CALLBACKS ---
  
  /**
   * Callback chamado quando a renderização é concluída
   * Retorna os dados calculados (dimensões, validações, etc)
   */
  onRenderComplete?: (output: EngineOutput) => void;
  
  /**
   * Callback chamado quando ocorre um erro
   */
  onError?: (error: EngineError) => void;
  
  /**
   * Callback chamado durante a renderização (para loading state)
   */
  onRenderProgress?: (progress: number) => void;
}

// ============================================================================
// REGRAS DO MOTOR (Configuração do Banco de Dados)
// ============================================================================

/**
 * Regras de engenharia que vêm do banco de dados (engine_config)
 * 
 * Estas regras definem como o motor deve calcular e renderizar o projeto.
 * Cada tipo de esquadria (sacada, janela, etc) tem suas próprias regras.
 * 
 * @example
 * const regras: EngineRules = {
 *   permite_abertura_dupla: true,
 *   largura_minima_folha: 0.5,
 *   fator_empilhamento: 0.04,
 *   // ...
 * };
 */
export interface EngineRules {
  // --- GEOMETRIA BÁSICA ---
  
  /**
   * Tipo de movimento das folhas
   * Define como as folhas se movem (correr, abrir, empilhar, etc)
   */
  tipo_movimento: TipoMovimento;
  
  /**
   * Indica se o sistema possui pivô central
   * Ex: Sacada KS tem pivô, janela de correr não tem
   */
  tem_pivo: boolean;
  
  /**
   * Indica se as folhas podem abrir para ambos os lados
   * Ex: Porta pivotante pode abrir para dentro ou para fora
   */
  permite_abertura_dupla: boolean;
  
  // --- FOLGAS E ESPAÇAMENTOS (em milímetros) ---
  
  /**
   * Folga padrão entre vidro e perfil (em mm)
   * Ex: 15 = 1.5cm de folga padrão
   * USO: Garante que o vidro não encoste no perfil
   */
  folga_padrao: number;
  
  /**
   * Folga lateral (esquerda/direita) em mm
   * Ex: 20 = 2cm de folga em cada lateral
   * USO: Espaço entre a borda do vidro e a parede/marco
   */
  folga_lateral: number;
  
  /**
   * Folga superior (topo) em mm
   * Ex: 15 = 1.5cm de folga no topo
   * USO: Espaço entre o vidro e o trilho/marco superior
   */
  folga_superior: number;
  
  /**
   * Folga inferior (base) em mm
   * Ex: 15 = 1.5cm de folga na base
   * USO: Espaço entre o vidro e o trilho/marco inferior
   */
  folga_inferior: number;
  
  /**
   * Fator de empilhamento (em metros)
   * Ex: 0.04 = cada folha ocupa 4cm no eixo Z quando empilhada
   * USO: Calcula o espaço necessário quando todas as folhas estão abertas
   * APLICAÇÃO: Sacada KS (empilhamento lateral)
   */
  fator_empilhamento?: number;
  
  /**
   * Sobreposição entre folhas adjacentes (em metros)
   * Ex: 0.05 = folhas se sobrepõem em 5cm
   * USO: Em janelas de correr, quanto as folhas se sobrepõem
   */
  sobreposicao_folhas?: number;
  
  // --- DIMENSÕES E LIMITES ---
  
  /**
   * Largura mínima por folha (em metros)
   * Ex: 0.5 = folha não pode ter menos de 50cm de largura
   * USO: Validação durante o cálculo automático de folhas
   */
  largura_minima_folha: number;
  
  /**
   * Largura máxima por folha (em metros)
   * Ex: 1.0 = folha não pode ter mais de 1m de largura
   * USO: Define quando é necessário adicionar mais folhas
   */
  largura_maxima_folha: number;
  
  /**
   * Área máxima por folha (em m²)
   * Ex: 2.5 = folha não pode ter mais de 2.5m²
   * USO: Limitação estrutural (peso, resistência)
   */
  area_maxima_folha: number;
  
  /**
   * Peso máximo suportado por folha (em kg)
   * Ex: 50 = folha não pode pesar mais de 50kg
   * USO: Validação de segurança (peso do vidro + estrutura)
   */
  peso_maximo_folha: number;
  
  /**
   * Altura mínima total do sistema (em metros)
   * Ex: 1.05 = altura mínima de 1.05m (norma para guarda-corpo)
   * USO: Validação de conformidade com normas técnicas
   */
  altura_minima?: number;
  
  /**
   * Altura máxima total do sistema (em metros)
   * Ex: 3.0 = altura máxima de 3 metros
   * USO: Limitação estrutural ou de transporte
   */
  altura_maxima?: number;
  
  // --- ESPESSURAS PERMITIDAS ---
  
  /**
   * Lista de espessuras de vidro permitidas (em mm)
   * Ex: [6, 8, 10] = aceita vidros de 6mm, 8mm ou 10mm
   * USO: Validação da entrada do usuário
   */
  espessuras_vidro_permitidas: number[];
  
  /**
   * Espessura de vidro recomendada (em mm)
   * Ex: 8 = recomenda vidro de 8mm para este sistema
   * USO: Valor padrão no formulário
   */
  espessura_vidro_padrao: number;
  
  // --- TIPOS DE VIDRO ---
  
  /**
   * Tipos de vidro permitidos
   * Ex: ['temperado', 'laminado'] = aceita apenas esses tipos
   * USO: Validação e filtro de opções
   */
  tipos_vidro_permitidos?: ('temperado' | 'laminado' | 'comum' | 'blindex')[];
  
  /**
   * Tipo de vidro obrigatório
   * Ex: 'temperado' = sistema só funciona com vidro temperado
   * USO: Validação de segurança (ex: box de banheiro)
   */
  tipo_vidro_obrigatorio?: 'temperado' | 'laminado' | 'blindex';
  
  // --- PERFIS E ESTRUTURA ---
  
  /**
   * Tipo de perfil de alumínio usado
   * Ex: 'linha_25', 'linha_30', 'slim', 'torre_inox'
   * USO: Informação técnica, define espessura e resistência
   */
  tipo_perfil: string;
  
  /**
   * Espessura do perfil de alumínio (em mm)
   * Ex: 25 = perfil linha 25 (2.5cm de espessura)
   * USO: Cálculo de dimensões e renderização
   */
  espessura_perfil?: number;
  
  // --- CÁLCULO AUTOMÁTICO ---
  
  /**
   * Indica se deve calcular automaticamente o número de folhas
   * baseado na largura total e limites min/max
   * Ex: true = sistema calcula quantas folhas são necessárias
   * USO: Modo automático vs manual
   */
  calcular_folhas_automatico: boolean;
  
  /**
   * Indica se o número de folhas deve ser par
   * Ex: true = sempre arredonda para número par (2, 4, 6, 8)
   * USO: Sistemas simétricos (janelas de correr)
   */
  exigir_numero_folhas_par?: boolean;
  
  /**
   * Indica se permite folhas com larguras diferentes
   * Ex: false = todas as folhas têm a mesma largura
   * USO: Simplificação ou customização
   */
  permitir_folhas_asimetricas?: boolean;
  
  // --- ACESSÓRIOS E HARDWARE ---
  
  /**
   * Lista de acessórios obrigatórios com fórmulas de quantidade
   * Ex: { nome: 'Roldana', quantidade_formula: 'numero_folhas * 4' }
   * USO: Cálculo automático de materiais
   */
  acessorios_obrigatorios?: Array<{
    nome: string;
    quantidade_formula: string;
    preco_unitario?: number;
  }>;
  
  /**
   * Lista de acessórios opcionais
   * USO: Sugestões para o usuário
   */
  acessorios_opcionais?: Array<{
    nome: string;
    descricao?: string;
    preco_unitario: number;
  }>;
  
  // --- RENDERIZAÇÃO ---
  
  /**
   * Cor de fundo do desenho (rgba)
   * Padrão: transparente
   */
  cor_fundo_desenho?: string;
  
  /**
   * Espessura das linhas de perfil (em pixels)
   * Ex: 2 = linhas de 2px de espessura
   * USO: Estilo visual do desenho
   */
  espessura_linha_perfil?: number;
  
  /**
   * Exibir reflexos no vidro
   * Padrão: true
   */
  exibir_reflexos?: boolean;
  
  /**
   * Exibir sombras
   * Padrão: true
   */
  exibir_sombras?: boolean;
  
  // --- REGRAS CUSTOMIZADAS ---
  
  /**
   * Regras específicas do sistema (formato livre)
   * Ex: { angulo_abertura_maxima: 180, raio_curvatura: 0.5 }
   * USO: Regras únicas de sistemas específicos
   */
  regras_customizadas?: Record<string, any>;
}

// ============================================================================
// SAÍDA DO MOTOR (Resultado da Renderização)
// ============================================================================

/**
 * Dados de uma folha individual calculada
 */
export interface FolhaCalculada {
  /**
   * Número/índice da folha (1, 2, 3, ...)
   */
  numero: number;
  
  /**
   * Largura da folha (em metros)
   */
  largura: number;
  
  /**
   * Altura da folha (em metros)
   */
  altura: number;
  
  /**
   * Área da folha (em m²)
   */
  area: number;
  
  /**
   * Peso estimado da folha (em kg)
   * Calculo: área * espessura * 2.5 (densidade vidro temperado)
   */
  peso_estimado: number;
  
  /**
   * Posição X no desenho (em pixels ou metros)
   */
  posicao_x: number;
  
  /**
   * Posição Y no desenho (em pixels ou metros)
   */
  posicao_y: number;
  
  /**
   * Indica se a folha é fixa (não se move)
   */
  fixa?: boolean;
  
  /**
   * Direção de movimento (para folhas móveis)
   */
  direcao_movimento?: 'esquerda' | 'direita' | 'cima' | 'baixo' | 'nenhuma';
}

/**
 * Validação ou aviso gerado pelo motor
 */
export interface EngineValidacao {
  /**
   * Tipo de validação
   */
  tipo: 'erro' | 'aviso' | 'info';
  
  /**
   * Mensagem descritiva
   */
  mensagem: string;
  
  /**
   * Campo relacionado (se aplicável)
   */
  campo?: string;
  
  /**
   * Valor atual (para erros de limite)
   */
  valor_atual?: number;
  
  /**
   * Valor esperado/limite
   */
  valor_esperado?: number;
}

/**
 * Erro do motor de renderização
 */
export interface EngineError {
  /**
   * Código do erro
   */
  codigo: string;
  
  /**
   * Mensagem de erro
   */
  mensagem: string;
  
  /**
   * Detalhes técnicos (para debug)
   */
  detalhes?: any;
  
  /**
   * Stack trace (em desenvolvimento)
   */
  stack?: string;
}

/**
 * Saída completa do motor de renderização
 * 
 * Este é o resultado final que o motor retorna após calcular
 * e renderizar o projeto.
 */
export interface EngineOutput {
  /**
   * Status da renderização
   */
  status: RenderStatus;
  
  /**
   * Timestamp da renderização
   */
  timestamp: Date;
  
  /**
   * Tempo de renderização (em ms)
   */
  tempo_renderizacao?: number;
  
  // --- DIMENSÕES CALCULADAS ---
  
  /**
   * Largura total efetiva (após aplicar folgas)
   */
  largura_efetiva: number;
  
  /**
   * Altura total efetiva (após aplicar folgas)
   */
  altura_efetiva: number;
  
  /**
   * Área total de vidro (em m²)
   */
  area_total_vidro: number;
  
  /**
   * Peso total estimado (em kg)
   */
  peso_total_estimado: number;
  
  /**
   * Quantidade de folhas calculada
   */
  quantidade_folhas: number;
  
  /**
   * Array com dados de cada folha
   */
  folhas: FolhaCalculada[];
  
  // --- MATERIAIS CALCULADOS ---
  
  /**
   * Metros lineares de perfil necessários
   */
  metros_perfil: number;
  
  /**
   * Quantidade de acessórios calculada
   */
  acessorios_calculados?: Array<{
    nome: string;
    quantidade: number;
    unidade: string;
  }>;
  
  // --- VALIDAÇÕES ---
  
  /**
   * Lista de validações/avisos/erros
   */
  validacoes: EngineValidacao[];
  
  /**
   * Indica se o projeto é válido (sem erros críticos)
   */
  projeto_valido: boolean;
  
  // --- DADOS DO DESENHO ---
  
  /**
   * Data URL do canvas renderizado (base64 PNG)
   * Ex: 'data:image/png;base64,iVBORw0KGgoAAAANS...'
   * USO: Exibir ou salvar a imagem do projeto
   */
  imagem_data_url?: string;
  
  /**
   * SVG do desenho (string XML)
   * USO: Desenho vetorial escalável
   */
  svg_string?: string;
  
  /**
   * Dados brutos do canvas (para debug)
   */
  canvas_data?: any;
  
  // --- METADADOS ---
  
  /**
   * ID do motor usado
   */
  engine_id: EngineId;
  
  /**
   * Versão do motor
   */
  engine_version: string;
  
  /**
   * Props originais usadas na renderização
   */
  props_originais: EngineProps;
  
  /**
   * Regras aplicadas
   */
  regras_aplicadas: EngineRules;
}

// ============================================================================
// CONTEXTO/STATE DO MOTOR
// ============================================================================

/**
 * Estado interno do motor de renderização
 * 
 * Usado para controlar o processo de renderização e manter
 * referências aos objetos do canvas.
 */
export interface EngineState {
  /**
   * Status atual
   */
  status: RenderStatus;
  
  /**
   * Progresso da renderização (0-100)
   */
  progresso: number;
  
  /**
   * Referência ao elemento canvas
   */
  canvasRef?: HTMLCanvasElement | null;
  
  /**
   * Contexto 2D do canvas
   */
  ctx?: CanvasRenderingContext2D | null;
  
  /**
   * Erro atual (se houver)
   */
  erro?: EngineError | null;
  
  /**
   * Resultado da última renderização
   */
  resultado?: EngineOutput | null;
  
  /**
   * Indica se está em modo interativo
   */
  modo_interativo?: boolean;
  
  /**
   * Zoom atual aplicado
   */
  zoom_atual?: number;
}

// ============================================================================
// INTERFACE DO COMPONENTE MOTOR
// ============================================================================

/**
 * Interface que todo componente de motor deve implementar
 * 
 * Garante consistência entre todos os motores de renderização.
 */
export interface EngineComponent {
  /**
   * Props do componente
   */
  props: EngineProps;
  
  /**
   * Regras de engenharia
   */
  rules: EngineRules;
  
  /**
   * Inicializa o motor
   */
  initialize(): void;
  
  /**
   * Renderiza o projeto
   */
  render(): Promise<EngineOutput>;
  
  /**
   * Valida as entradas
   */
  validate(): EngineValidacao[];
  
  /**
   * Calcula dimensões das folhas
   */
  calcularFolhas(): FolhaCalculada[];
  
  /**
   * Limpa o canvas
   */
  clear(): void;
  
  /**
   * Destroi o motor e libera recursos
   */
  destroy(): void;
}

// ============================================================================
// HELPERS DE CÁLCULO
// ============================================================================

/**
 * Resultado do cálculo de peso
 */
export interface PesoCalculado {
  /**
   * Peso do vidro (kg)
   */
  vidro: number;
  
  /**
   * Peso dos perfis (kg)
   */
  perfis: number;
  
  /**
   * Peso dos acessórios (kg)
   */
  acessorios: number;
  
  /**
   * Peso total (kg)
   */
  total: number;
}

/**
 * Parâmetros para cálculo de peso de vidro
 */
export interface CalculoPesoVidroParams {
  /**
   * Área do vidro (m²)
   */
  area: number;
  
  /**
   * Espessura do vidro (mm)
   */
  espessura: number;
  
  /**
   * Tipo de vidro (afeta densidade)
   */
  tipo?: 'temperado' | 'laminado' | 'comum';
}

// ============================================================================
// CONSTANTES
// ============================================================================

/**
 * Densidades de vidro (kg/m² por mm de espessura)
 */
export const DENSIDADE_VIDRO = {
  temperado: 2.5,   // Vidro temperado: 2.5 kg/m² por mm
  laminado: 2.6,    // Vidro laminado: 2.6 kg/m² por mm (mais pesado)
  comum: 2.5,       // Vidro comum: 2.5 kg/m² por mm
  blindex: 2.7,     // Vidro blindado: 2.7 kg/m² por mm (mais pesado ainda)
} as const;

/**
 * Conversões de unidades
 */
export const CONVERSOES = {
  MM_PARA_M: 0.001,        // 1mm = 0.001m
  M_PARA_MM: 1000,         // 1m = 1000mm
  CM_PARA_M: 0.01,         // 1cm = 0.01m
  M_PARA_CM: 100,          // 1m = 100cm
  POLEGADA_PARA_MM: 25.4,  // 1" = 25.4mm
} as const;

/**
 * Valores padrão para props opcionais
 */
export const ENGINE_DEFAULTS = {
  vista: 'frontal' as VistaRenderizacao,
  exibir_cotas: false,
  exibir_grade: false,
  zoom: 1,
  canvas_largura: 800,
  canvas_altura: 600,
  espessura_linha_perfil: 2,
  exibir_reflexos: true,
  exibir_sombras: true,
} as const;

// ============================================================================
// EXPORTAÇÕES
// ============================================================================

export default {
  DENSIDADE_VIDRO,
  CONVERSOES,
  ENGINE_DEFAULTS,
};
