/**
 * CONSTANTES DE MATERIAIS - VIDROS E ALUMÍNIOS
 * 
 * Este arquivo contém as definições visuais realistas de materiais
 * para renderização de projetos no sistema de Gêmeo Digital.
 * 
 * VIDROS: Usam rgba com transparência para simular a translucidez real
 * ALUMÍNIOS: Usam linear-gradient para simular reflexos metálicos e cilindricidade
 * 
 * USO:
 * import { CORES_VIDRO, CORES_ALUMINIO } from './constants/materiais';
 */

// ============================================================================
// VIDROS (RGBA + Transparência)
// ============================================================================

/**
 * Cores de vidro com transparência realista
 * 
 * Propriedades:
 * - id: Identificador único
 * - nome: Nome comercial
 * - cor: rgba principal (para fundo)
 * - borda: rgba da borda (vidro empilhado/borda)
 * - opacity: Opacidade base (0-1)
 * - blur: Desfoque CSS (para vidros jateados/acidatos)
 * - reflexo: Gradiente de reflexo (opcional)
 */
export const CORES_VIDRO = {
  // --- VIDROS TRANSPARENTES ---
  
  incolor: {
    id: 'incolor',
    nome: 'Vidro Incolor',
    descricao: 'Transparente com leve tom azulado',
    cor: 'rgba(230, 245, 250, 0.15)',           // Azul bem claro e transparente
    borda: 'rgba(180, 215, 230, 0.8)',          // Borda mais visível
    opacity: 0.15,
    blur: null,
    reflexo: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(230,245,250,0.1) 50%, rgba(255,255,255,0.3) 100%)',
    categoria: 'transparente',
  },
  
  extra_clear: {
    id: 'extra_clear',
    nome: 'Vidro Extra Clear',
    descricao: 'Super transparente, sem tom azulado',
    cor: 'rgba(245, 250, 252, 0.1)',
    borda: 'rgba(200, 220, 230, 0.7)',
    opacity: 0.1,
    blur: null,
    reflexo: 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(245,250,252,0.05) 50%, rgba(255,255,255,0.4) 100%)',
    categoria: 'transparente',
  },
  
  // --- VIDROS COLORIDOS ---
  
  fume: {
    id: 'fume',
    nome: 'Vidro Fumê',
    descricao: 'Cinza escuro translúcido',
    cor: 'rgba(60, 65, 70, 0.5)',               // Cinza escuro translúcido
    borda: 'rgba(30, 35, 40, 0.95)',            // Quase preto quando empilha
    opacity: 0.5,
    blur: null,
    reflexo: 'linear-gradient(135deg, rgba(100,105,110,0.3) 0%, rgba(40,45,50,0.6) 50%, rgba(80,85,90,0.4) 100%)',
    categoria: 'colorido',
  },
  
  fume_extra: {
    id: 'fume_extra',
    nome: 'Vidro Fumê Extra',
    descricao: 'Cinza muito escuro, quase preto',
    cor: 'rgba(40, 42, 45, 0.7)',
    borda: 'rgba(20, 22, 25, 0.98)',
    opacity: 0.7,
    blur: null,
    reflexo: 'linear-gradient(135deg, rgba(70,72,75,0.4) 0%, rgba(30,32,35,0.8) 50%, rgba(60,62,65,0.5) 100%)',
    categoria: 'colorido',
  },
  
  verde: {
    id: 'verde',
    nome: 'Vidro Verde',
    descricao: 'Verde clássico de vidro temperado',
    cor: 'rgba(180, 220, 190, 0.35)',           // Verde esverdeado translúcido
    borda: 'rgba(100, 150, 120, 0.85)',         // Verde mais intenso na borda
    opacity: 0.35,
    blur: null,
    reflexo: 'linear-gradient(135deg, rgba(200,230,210,0.3) 0%, rgba(160,200,180,0.4) 50%, rgba(180,220,190,0.3) 100%)',
    categoria: 'colorido',
  },
  
  bronze: {
    id: 'bronze',
    nome: 'Vidro Bronze',
    descricao: 'Marrom translúcido (tom #cd7f32)',
    cor: 'rgba(205, 127, 50, 0.4)',             // Bronze #cd7f32 translúcido
    borda: 'rgba(163, 101, 40, 0.85)',          // Bronze mais escuro na borda
    opacity: 0.4,
    blur: null,
    reflexo: 'linear-gradient(135deg, rgba(225,147,70,0.3) 0%, rgba(185,107,30,0.5) 50%, rgba(205,127,50,0.4) 100%)',
    categoria: 'colorido',
  },
  
  bronze_refletivo: {
    id: 'bronze_refletivo',
    nome: 'Vidro Bronze Refletivo',
    descricao: 'Bronze #cd7f32 com película refletiva',
    cor: 'rgba(205, 127, 50, 0.5)',
    borda: 'rgba(163, 101, 40, 0.9)',
    opacity: 0.5,
    blur: null,
    reflexo: 'linear-gradient(135deg, rgba(235,157,80,0.6) 0%, rgba(175,97,20,0.7) 50%, rgba(205,127,50,0.5) 100%)',
    categoria: 'refletivo',
  },
  
  azul: {
    id: 'azul',
    nome: 'Vidro Azul',
    descricao: 'Azul translúcido',
    cor: 'rgba(150, 180, 210, 0.35)',
    borda: 'rgba(90, 130, 170, 0.85)',
    opacity: 0.35,
    blur: null,
    reflexo: 'linear-gradient(135deg, rgba(180,210,240,0.3) 0%, rgba(130,160,200,0.4) 50%, rgba(160,190,220,0.3) 100%)',
    categoria: 'colorido',
  },
  
  // --- VIDROS JATEADOS / ACIDATOS (com blur) ---
  
  jateado_incolor: {
    id: 'jateado_incolor',
    nome: 'Vidro Jateado Incolor',
    descricao: 'Incolor fosco (jateamento)',
    cor: 'rgba(240, 245, 248, 0.7)',
    borda: 'rgba(200, 215, 225, 0.9)',
    opacity: 0.7,
    blur: 'blur(8px)',                          // Efeito de desfoque
    reflexo: 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(230,235,240,0.6) 50%, rgba(250,252,255,0.4) 100%)',
    categoria: 'jateado',
  },
  
  jateado_branco: {
    id: 'jateado_branco',
    nome: 'Vidro Jateado Branco',
    descricao: 'Branco leitoso fosco',
    cor: 'rgba(250, 252, 255, 0.85)',
    borda: 'rgba(220, 230, 240, 0.95)',
    opacity: 0.85,
    blur: 'blur(10px)',
    reflexo: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(240,245,250,0.7) 50%, rgba(255,255,255,0.5) 100%)',
    categoria: 'jateado',
  },
  
  acidato: {
    id: 'acidato',
    nome: 'Vidro Acidato',
    descricao: 'Fosco translúcido (ácido)',
    cor: 'rgba(235, 240, 245, 0.75)',
    borda: 'rgba(190, 205, 220, 0.92)',
    opacity: 0.75,
    blur: 'blur(12px)',
    reflexo: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(225,235,245,0.6) 50%, rgba(245,250,255,0.5) 100%)',
    categoria: 'jateado',
  },
  
  // --- VIDROS ESPECIAIS ---
  
  preto: {
    id: 'preto',
    nome: 'Vidro Preto',
    descricao: 'Preto opaco com reflexo',
    cor: 'rgba(30, 32, 35, 0.85)',
    borda: 'rgba(10, 12, 15, 0.98)',
    opacity: 0.85,
    blur: null,
    reflexo: 'linear-gradient(135deg, rgba(60,65,70,0.5) 0%, rgba(20,22,25,0.9) 50%, rgba(50,55,60,0.6) 100%)',
    categoria: 'especial',
  },
  
  espelhado: {
    id: 'espelhado',
    nome: 'Vidro Espelhado',
    descricao: 'Efeito espelho refletivo',
    cor: 'rgba(180, 185, 190, 0.3)',
    borda: 'rgba(140, 145, 150, 0.8)',
    opacity: 0.3,
    blur: null,
    reflexo: 'linear-gradient(135deg, rgba(220,225,230,0.7) 0%, rgba(160,165,170,0.5) 25%, rgba(200,205,210,0.8) 50%, rgba(170,175,180,0.6) 75%, rgba(210,215,220,0.7) 100%)',
    categoria: 'refletivo',
  },
};

// ============================================================================
// ALUMÍNIOS (Linear Gradients)
// ============================================================================

/**
 * Cores de alumínio com gradientes para simular reflexos metálicos
 * 
 * Propriedades:
 * - id: Identificador único
 * - nome: Nome comercial
 * - cor_base: Cor base (fallback)
 * - gradiente: CSS linear-gradient para dar volume
 * - acabamento: Tipo de acabamento (fosco, brilhante, anodizado, texturizado)
 * - brilho: Intensidade do brilho (0-1)
 */
export const CORES_ALUMINIO = {
  // --- ALUMÍNIOS NATURAIS ---
  
  natural_fosco: {
    id: 'natural_fosco',
    nome: 'Alumínio Natural Fosco',
    descricao: 'Cinza claro com acabamento fosco',
    cor_base: '#C8D0D8',
    gradiente: 'linear-gradient(90deg, #D8E0E8 0%, #C0C8D0 20%, #D0D8E0 40%, #B8C0C8 60%, #C8D0D8 80%, #D0D8E0 100%)',
    acabamento: 'fosco',
    brilho: 0.3,
    sombra: 'rgba(0, 0, 0, 0.15)',
    categoria: 'natural',
  },
  
  natural_brilhante: {
    id: 'natural_brilhante',
    nome: 'Alumínio Natural Brilhante',
    descricao: 'Cinza claro com alto brilho',
    cor_base: '#D0D8E0',
    gradiente: 'linear-gradient(90deg, #E8F0F8 0%, #C8D0D8 15%, #F0F8FF 30%, #D0D8E0 50%, #E0E8F0 70%, #C0C8D0 85%, #E8F0F8 100%)',
    acabamento: 'brilhante',
    brilho: 0.8,
    sombra: 'rgba(0, 0, 0, 0.2)',
    categoria: 'natural',
  },
  
  anodizado_natural: {
    id: 'anodizado_natural',
    nome: 'Alumínio Anodizado Natural',
    descricao: 'Cinza médio anodizado',
    cor_base: '#B0B8C0',
    gradiente: 'linear-gradient(90deg, #C0C8D0 0%, #A8B0B8 25%, #B8C0C8 50%, #A0A8B0 75%, #B0B8C0 100%)',
    acabamento: 'anodizado',
    brilho: 0.5,
    sombra: 'rgba(0, 0, 0, 0.18)',
    categoria: 'natural',
  },
  
  // --- ALUMÍNIOS PRETOS ---
  
  preto_fosco: {
    id: 'preto_fosco',
    nome: 'Alumínio Preto Fosco',
    descricao: 'Preto com acabamento fosco',
    cor_base: '#2C2F33',
    gradiente: 'linear-gradient(90deg, #3A3D41 0%, #28282C 20%, #34363A 40%, #262629 60%, #2E3034 80%, #32353A 100%)',
    acabamento: 'fosco',
    brilho: 0.2,
    sombra: 'rgba(0, 0, 0, 0.4)',
    categoria: 'preto',
  },
  
  preto_brilhante: {
    id: 'preto_brilhante',
    nome: 'Alumínio Preto Brilhante',
    descricao: 'Preto com alto brilho',
    cor_base: '#25282C',
    gradiente: 'linear-gradient(90deg, #40454A 0%, #20232A 15%, #48505A 30%, #282C32 50%, #38404A 70%, #222528 85%, #40454A 100%)',
    acabamento: 'brilhante',
    brilho: 0.7,
    sombra: 'rgba(0, 0, 0, 0.5)',
    categoria: 'preto',
  },
  
  preto_anodizado: {
    id: 'preto_anodizado',
    nome: 'Alumínio Preto Anodizado',
    descricao: 'Preto anodizado (cinza chumbo)',
    cor_base: '#35383D',
    gradiente: 'linear-gradient(90deg, #45484D 0%, #2D3035 25%, #3D4045 50%, #2A2D32 75%, #35383D 100%)',
    acabamento: 'anodizado',
    brilho: 0.45,
    sombra: 'rgba(0, 0, 0, 0.35)',
    categoria: 'preto',
  },
  
  // --- ALUMÍNIOS BRANCOS ---
  
  branco_fosco: {
    id: 'branco_fosco',
    nome: 'Alumínio Branco Fosco',
    descricao: 'Branco com leve cinza nas bordas',
    cor_base: '#F5F7FA',
    gradiente: 'linear-gradient(90deg, #FFFFFF 0%, #E8EDF2 20%, #F8FAFB 40%, #E0E5EA 60%, #F0F5F8 80%, #FFFFFF 100%)',
    acabamento: 'fosco',
    brilho: 0.3,
    sombra: 'rgba(0, 0, 0, 0.08)',
    categoria: 'branco',
  },
  
  branco_brilhante: {
    id: 'branco_brilhante',
    nome: 'Alumínio Branco Brilhante',
    descricao: 'Branco puro com alto brilho',
    cor_base: '#FAFCFF',
    gradiente: 'linear-gradient(90deg, #FFFFFF 0%, #F0F5FA 15%, #FFFFFF 30%, #F5F8FB 50%, #FFFFFF 70%, #EDF2F7 85%, #FFFFFF 100%)',
    acabamento: 'brilhante',
    brilho: 0.75,
    sombra: 'rgba(0, 0, 0, 0.1)',
    categoria: 'branco',
  },
  
  // --- ALUMÍNIOS BRONZE/CHAMPAGNE ---
  
  bronze: {
    id: 'bronze',
    nome: 'Alumínio Bronze',
    descricao: 'Bronze metálico #cd7f32',
    cor_base: '#CD7F32',
    gradiente: 'linear-gradient(90deg, #E59750 0%, #B56F28 20%, #DD8F48 40%, #A56520 60%, #CD7F32 80%, #E59750 100%)',
    acabamento: 'anodizado',
    brilho: 0.55,
    sombra: 'rgba(163, 101, 40, 0.3)',
    categoria: 'metalico',
  },
  
  champagne: {
    id: 'champagne',
    nome: 'Alumínio Champagne',
    descricao: 'Bege dourado metálico',
    cor_base: '#C8B88A',
    gradiente: 'linear-gradient(90deg, #D8C89A 0%, #B8A878 20%, #D0C090 40%, #B0A070 60%, #C8B88A 80%, #D8C89A 100%)',
    acabamento: 'anodizado',
    brilho: 0.6,
    sombra: 'rgba(150, 130, 90, 0.25)',
    categoria: 'metalico',
  },
  
  dourado: {
    id: 'dourado',
    nome: 'Alumínio Dourado',
    descricao: 'Dourado metálico',
    cor_base: '#D4AF37',
    gradiente: 'linear-gradient(90deg, #E8C547 0%, #C49B2A 20%, #DDB83D 40%, #BC9328 60%, #D4AF37 80%, #E8C547 100%)',
    acabamento: 'anodizado',
    brilho: 0.7,
    sombra: 'rgba(180, 140, 30, 0.3)',
    categoria: 'metalico',
  },
  
  // --- ALUMÍNIOS ESPECIAIS ---
  
  prata_metalico: {
    id: 'prata_metalico',
    nome: 'Alumínio Prata Metálico',
    descricao: 'Prata com reflexos metálicos',
    cor_base: '#B8C0C8',
    gradiente: 'linear-gradient(90deg, #D0D8E0 0%, #A8B0B8 15%, #C8D0D8 30%, #A0A8B0 50%, #C0C8D0 70%, #98A0A8 85%, #D0D8E0 100%)',
    acabamento: 'anodizado',
    brilho: 0.65,
    sombra: 'rgba(0, 0, 0, 0.2)',
    categoria: 'metalico',
  },
  
  cobre: {
    id: 'cobre',
    nome: 'Alumínio Cobre',
    descricao: 'Tom de cobre metálico',
    cor_base: '#B87333',
    gradiente: 'linear-gradient(90deg, #C88343 0%, #A86328 20%, #C07D38 40%, #A05B25 60%, #B87333 80%, #C88343 100%)',
    acabamento: 'anodizado',
    brilho: 0.6,
    sombra: 'rgba(140, 80, 30, 0.3)',
    categoria: 'metalico',
  },
  
  grafite: {
    id: 'grafite',
    nome: 'Alumínio Grafite',
    descricao: 'Cinza escuro metálico',
    cor_base: '#4A4F54',
    gradiente: 'linear-gradient(90deg, #5A5F64 0%, #3A3F44 25%, #525760 50%, #38393E 75%, #4A4F54 100%)',
    acabamento: 'anodizado',
    brilho: 0.5,
    sombra: 'rgba(0, 0, 0, 0.3)',
    categoria: 'cinza',
  },
};

// ============================================================================
// HELPERS E UTILITÁRIOS
// ============================================================================

/**
 * Retorna o objeto de cor de vidro pelo ID
 * @param {string} id - ID da cor (ex: 'incolor', 'fume')
 * @returns {object|null} - Objeto da cor ou null se não encontrado
 */
export const getCorVidro = (id) => {
  return CORES_VIDRO[id] || null;
};

/**
 * Retorna o objeto de cor de alumínio pelo ID
 * @param {string} id - ID da cor (ex: 'branco_fosco', 'preto_anodizado')
 * @returns {object|null} - Objeto da cor ou null se não encontrado
 */
export const getCorAluminio = (id) => {
  return CORES_ALUMINIO[id] || null;
};

/**
 * Retorna lista de IDs de vidros por categoria
 * @param {string} categoria - Categoria ('transparente', 'colorido', 'jateado', etc)
 * @returns {array} - Array de IDs
 */
export const getVidrosPorCategoria = (categoria) => {
  return Object.keys(CORES_VIDRO).filter(
    (id) => CORES_VIDRO[id].categoria === categoria
  );
};

/**
 * Retorna lista de IDs de alumínios por categoria
 * @param {string} categoria - Categoria ('natural', 'preto', 'branco', etc)
 * @returns {array} - Array de IDs
 */
export const getAluminiosPorCategoria = (categoria) => {
  return Object.keys(CORES_ALUMINIO).filter(
    (id) => CORES_ALUMINIO[id].categoria === categoria
  );
};

/**
 * Retorna todas as cores de vidro como array
 * @returns {array} - Array de objetos de cores
 */
export const getTodasCoresVidro = () => {
  return Object.values(CORES_VIDRO);
};

/**
 * Retorna todas as cores de alumínio como array
 * @returns {array} - Array de objetos de cores
 */
export const getTodasCoresAluminio = () => {
  return Object.values(CORES_ALUMINIO);
};

// ============================================================================
// CATEGORIAS (para filtros/menus)
// ============================================================================

export const CATEGORIAS_VIDRO = [
  { id: 'transparente', nome: 'Transparentes', icon: '💎' },
  { id: 'colorido', nome: 'Coloridos', icon: '🎨' },
  { id: 'jateado', nome: 'Jateados/Foscos', icon: '❄️' },
  { id: 'refletivo', nome: 'Refletivos', icon: '✨' },
  { id: 'especial', nome: 'Especiais', icon: '⭐' },
];

export const CATEGORIAS_ALUMINIO = [
  { id: 'natural', nome: 'Naturais', icon: '⚪' },
  { id: 'preto', nome: 'Pretos', icon: '⚫' },
  { id: 'branco', nome: 'Brancos', icon: '🤍' },
  { id: 'metalico', nome: 'Metálicos', icon: '🥇' },
  { id: 'cinza', nome: 'Cinzas', icon: '🩶' },
];

// ============================================================================
// EXEMPLO DE USO
// ============================================================================

/**
 * EXEMPLO DE USO EM COMPONENTE REACT:
 * 
 * import { CORES_VIDRO, CORES_ALUMINIO } from './constants/materiais';
 * 
 * // 1. Renderizar vidro
 * const VidroComponent = ({ corId }) => {
 *   const cor = CORES_VIDRO[corId];
 *   
 *   return (
 *     <div style={{
 *       background: cor.reflexo || cor.cor,
 *       border: `2px solid ${cor.borda}`,
 *       backdropFilter: cor.blur,
 *       opacity: cor.opacity,
 *     }}>
 *       Vidro {cor.nome}
 *     </div>
 *   );
 * };
 * 
 * // 2. Renderizar perfil de alumínio
 * const PerfilComponent = ({ corId }) => {
 *   const cor = CORES_ALUMINIO[corId];
 *   
 *   return (
 *     <div style={{
 *       background: cor.gradiente,
 *       boxShadow: `0 2px 4px ${cor.sombra}`,
 *     }}>
 *       Perfil {cor.nome}
 *     </div>
 *   );
 * };
 * 
 * // 3. Seletor de cores
 * const SeletorCores = ({ tipo, onChange }) => {
 *   const cores = tipo === 'vidro' ? CORES_VIDRO : CORES_ALUMINIO;
 *   
 *   return (
 *     <select onChange={(e) => onChange(e.target.value)}>
 *       {Object.values(cores).map(cor => (
 *         <option key={cor.id} value={cor.id}>
 *           {cor.nome}
 *         </option>
 *       ))}
 *     </select>
 *   );
 * };
 */

// ============================================================================
// EXPORTAÇÕES DEFAULT
// ============================================================================

export default {
  CORES_VIDRO,
  CORES_ALUMINIO,
  CATEGORIAS_VIDRO,
  CATEGORIAS_ALUMINIO,
  getCorVidro,
  getCorAluminio,
  getVidrosPorCategoria,
  getAluminiosPorCategoria,
  getTodasCoresVidro,
  getTodasCoresAluminio,
};
