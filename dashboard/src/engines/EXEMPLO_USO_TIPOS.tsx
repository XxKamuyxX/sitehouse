/**
 * EXEMPLO DE USO DOS TIPOS DE MOTOR
 * 
 * Este arquivo demonstra como usar as interfaces e tipos definidos
 * em types.ts para criar um motor de renderização.
 * 
 * NÃO É PARA SER USADO EM PRODUÇÃO - É APENAS REFERÊNCIA
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  EngineProps,
  EngineRules,
  EngineOutput,
  EngineState,
  EngineValidacao,
  FolhaCalculada,
  DENSIDADE_VIDRO,
  CONVERSOES,
  ENGINE_DEFAULTS,
} from './types';
import { getCorVidro, getCorAluminio } from '../constants/materiais';

// ============================================================================
// EXEMPLO 1: PROPS BÁSICAS PARA UM MOTOR
// ============================================================================

/**
 * Exemplo de props mínimas para renderizar uma sacada KS
 */
const exemploPropsMinimas: EngineProps = {
  largura: 6.5,              // 6.5 metros
  altura: 2.4,               // 2.4 metros
  quantidade_folhas: 8,      // 8 folhas de vidro
  espessura_vidro: 8,        // Vidro 8mm
  cor_vidro_id: 'incolor',   // Vidro incolor
  cor_perfil_id: 'branco_fosco', // Perfil branco fosco
};

/**
 * Exemplo de props completas com todas as opções
 */
const exemploPropsCompletas: EngineProps = {
  // Dimensões
  largura: 6.5,
  altura: 2.4,
  profundidade: null,
  
  // Folhas
  quantidade_folhas: 8,
  espessura_vidro: 8,
  
  // Materiais
  cor_vidro_id: 'incolor',
  cor_perfil_id: 'branco_fosco',
  
  // Visual
  vista: 'frontal',
  exibir_cotas: true,
  exibir_grade: false,
  zoom: 1.2,
  canvas_largura: 1024,
  canvas_altura: 768,
  
  // Callbacks
  onRenderComplete: (output) => {
    console.log('Renderização concluída:', output);
  },
  onError: (error) => {
    console.error('Erro na renderização:', error);
  },
  onRenderProgress: (progress) => {
    console.log(`Progresso: ${progress}%`);
  },
};

// ============================================================================
// EXEMPLO 2: REGRAS DE ENGENHARIA (do Banco de Dados)
// ============================================================================

/**
 * Exemplo de regras para Sacada KS
 */
const exemploRegrasSacadaKS: EngineRules = {
  // Geometria
  tipo_movimento: 'empilhavel',
  tem_pivo: true,
  permite_abertura_dupla: false,
  
  // Folgas (em mm)
  folga_padrao: 15,
  folga_lateral: 20,
  folga_superior: 15,
  folga_inferior: 15,
  fator_empilhamento: 0.04,       // 4cm por folha quando empilhada
  
  // Limites de folha
  largura_minima_folha: 0.5,      // Mínimo 50cm
  largura_maxima_folha: 1.0,      // Máximo 1m
  area_maxima_folha: 2.5,         // Máximo 2.5m²
  peso_maximo_folha: 50,          // Máximo 50kg
  
  // Altura
  altura_minima: 1.2,
  altura_maxima: 3.0,
  
  // Espessuras permitidas
  espessuras_vidro_permitidas: [6, 8, 10],
  espessura_vidro_padrao: 8,
  tipos_vidro_permitidos: ['temperado'],
  tipo_vidro_obrigatorio: 'temperado',
  
  // Perfil
  tipo_perfil: 'linha_ks_standard',
  espessura_perfil: 30,
  
  // Cálculo automático
  calcular_folhas_automatico: true,
  exigir_numero_folhas_par: true,
  permitir_folhas_asimetricas: false,
  
  // Acessórios obrigatórios
  acessorios_obrigatorios: [
    {
      nome: 'Pivô Central KS',
      quantidade_formula: '1',
      preco_unitario: 450.00,
    },
    {
      nome: 'Roldana',
      quantidade_formula: 'numero_folhas * 4',
      preco_unitario: 15.00,
    },
  ],
  
  // Renderização
  espessura_linha_perfil: 2,
  exibir_reflexos: true,
  exibir_sombras: true,
};

/**
 * Exemplo de regras para Janela 4 Folhas
 */
const exemploRegrasJanela4Folhas: EngineRules = {
  // Geometria
  tipo_movimento: 'correr',
  tem_pivo: false,
  permite_abertura_dupla: false,
  
  // Folgas
  folga_padrao: 12,
  folga_lateral: 15,
  folga_superior: 12,
  folga_inferior: 12,
  sobreposicao_folhas: 0.05,      // 5cm de sobreposição
  
  // Limites
  largura_minima_folha: 0.6,
  largura_maxima_folha: 1.2,
  area_maxima_folha: 1.8,
  peso_maximo_folha: 35,
  
  // Espessuras
  espessuras_vidro_permitidas: [4, 6, 8],
  espessura_vidro_padrao: 6,
  tipos_vidro_permitidos: ['temperado', 'laminado', 'comum'],
  
  // Perfil
  tipo_perfil: 'linha_25_esquadria',
  espessura_perfil: 25,
  
  // Cálculo
  calcular_folhas_automatico: false, // Sempre 4 folhas
  permitir_folhas_asimetricas: false,
  
  // Regras customizadas
  regras_customizadas: {
    folhas_fixas: [1, 4],           // Folhas 1 e 4 são fixas
    folhas_moveis: [2, 3],          // Folhas 2 e 3 são móveis
  },
  
  // Renderização
  espessura_linha_perfil: 2,
  exibir_reflexos: true,
  exibir_sombras: true,
};

// ============================================================================
// EXEMPLO 3: FUNÇÃO DE VALIDAÇÃO
// ============================================================================

/**
 * Valida as props e regras antes de renderizar
 */
function validarEntradas(
  props: EngineProps,
  rules: EngineRules
): EngineValidacao[] {
  const validacoes: EngineValidacao[] = [];
  
  // Validar largura
  if (rules.altura_minima && props.altura < rules.altura_minima) {
    validacoes.push({
      tipo: 'erro',
      mensagem: `Altura mínima é ${rules.altura_minima}m`,
      campo: 'altura',
      valor_atual: props.altura,
      valor_esperado: rules.altura_minima,
    });
  }
  
  if (rules.altura_maxima && props.altura > rules.altura_maxima) {
    validacoes.push({
      tipo: 'erro',
      mensagem: `Altura máxima é ${rules.altura_maxima}m`,
      campo: 'altura',
      valor_atual: props.altura,
      valor_esperado: rules.altura_maxima,
    });
  }
  
  // Validar espessura de vidro
  if (!rules.espessuras_vidro_permitidas.includes(props.espessura_vidro)) {
    validacoes.push({
      tipo: 'erro',
      mensagem: `Espessura de vidro não permitida. Use: ${rules.espessuras_vidro_permitidas.join(', ')}mm`,
      campo: 'espessura_vidro',
    });
  }
  
  // Validar cor de vidro
  const corVidro = getCorVidro(props.cor_vidro_id);
  if (!corVidro) {
    validacoes.push({
      tipo: 'erro',
      mensagem: `Cor de vidro "${props.cor_vidro_id}" não encontrada`,
      campo: 'cor_vidro_id',
    });
  }
  
  // Validar cor de perfil
  const corPerfil = getCorAluminio(props.cor_perfil_id);
  if (!corPerfil) {
    validacoes.push({
      tipo: 'erro',
      mensagem: `Cor de perfil "${props.cor_perfil_id}" não encontrada`,
      campo: 'cor_perfil_id',
    });
  }
  
  // Avisos
  if (props.quantidade_folhas > 10) {
    validacoes.push({
      tipo: 'aviso',
      mensagem: 'Número de folhas muito alto. Verifique se está correto.',
      campo: 'quantidade_folhas',
    });
  }
  
  return validacoes;
}

// ============================================================================
// EXEMPLO 4: FUNÇÃO DE CÁLCULO DE FOLHAS
// ============================================================================

/**
 * Calcula as dimensões de cada folha
 */
function calcularFolhas(
  props: EngineProps,
  rules: EngineRules
): FolhaCalculada[] {
  const folhas: FolhaCalculada[] = [];
  
  // Largura disponível (descontando folgas laterais)
  const larguraDisponivel = props.largura - (rules.folga_lateral * 2 * CONVERSOES.MM_PARA_M);
  
  // Altura disponível (descontando folgas superior e inferior)
  const alturaDisponivel = props.altura - 
    (rules.folga_superior * CONVERSOES.MM_PARA_M) - 
    (rules.folga_inferior * CONVERSOES.MM_PARA_M);
  
  // Largura de cada folha
  const larguraFolha = larguraDisponivel / props.quantidade_folhas;
  
  // Criar array de folhas
  for (let i = 0; i < props.quantidade_folhas; i++) {
    const numero = i + 1;
    const area = larguraFolha * alturaDisponivel;
    
    // Calcular peso (vidro temperado: 2.5 kg/m² por mm)
    const peso = area * props.espessura_vidro * DENSIDADE_VIDRO.temperado;
    
    // Posição X (distribuída uniformemente)
    const posicao_x = i * larguraFolha;
    
    folhas.push({
      numero,
      largura: larguraFolha,
      altura: alturaDisponivel,
      area,
      peso_estimado: peso,
      posicao_x,
      posicao_y: 0,
      fixa: rules.regras_customizadas?.folhas_fixas?.includes(numero) || false,
      direcao_movimento: 'esquerda', // Simplificado
    });
  }
  
  return folhas;
}

// ============================================================================
// EXEMPLO 5: COMPONENTE REACT USANDO OS TIPOS
// ============================================================================

interface EngineRendererProps {
  props: EngineProps;
  rules: EngineRules;
}

const EngineRenderer: React.FC<EngineRendererProps> = ({ props, rules }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<EngineState>({
    status: 'idle',
    progresso: 0,
  });
  
  useEffect(() => {
    renderizar();
  }, [props, rules]);
  
  const renderizar = async () => {
    // Atualizar estado
    setState(prev => ({ ...prev, status: 'rendering', progresso: 0 }));
    
    // Validar
    const validacoes = validarEntradas(props, rules);
    const temErros = validacoes.some(v => v.tipo === 'erro');
    
    if (temErros) {
      setState(prev => ({
        ...prev,
        status: 'error',
        erro: {
          codigo: 'VALIDATION_ERROR',
          mensagem: 'Erro de validação',
          detalhes: validacoes,
        },
      }));
      props.onError?.({
        codigo: 'VALIDATION_ERROR',
        mensagem: 'Erro de validação',
      });
      return;
    }
    
    // Calcular folhas
    setState(prev => ({ ...prev, progresso: 30 }));
    const folhas = calcularFolhas(props, rules);
    
    // Renderizar no canvas
    setState(prev => ({ ...prev, progresso: 60 }));
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Desenhar (simplificado)
    const corVidro = getCorVidro(props.cor_vidro_id);
    const corPerfil = getCorAluminio(props.cor_perfil_id);
    
    if (corVidro && corPerfil) {
      folhas.forEach(folha => {
        // Desenhar vidro
        ctx.fillStyle = corVidro.cor;
        ctx.fillRect(
          folha.posicao_x * 100, // Escala simples
          folha.posicao_y * 100,
          folha.largura * 100,
          folha.altura * 100
        );
        
        // Desenhar borda (perfil)
        ctx.strokeStyle = corPerfil.cor_base;
        ctx.lineWidth = rules.espessura_linha_perfil || 2;
        ctx.strokeRect(
          folha.posicao_x * 100,
          folha.posicao_y * 100,
          folha.largura * 100,
          folha.altura * 100
        );
      });
    }
    
    // Criar output
    setState(prev => ({ ...prev, progresso: 90 }));
    
    const areaTotal = folhas.reduce((sum, f) => sum + f.area, 0);
    const pesoTotal = folhas.reduce((sum, f) => sum + f.peso_estimado, 0);
    
    const output: EngineOutput = {
      status: 'success',
      timestamp: new Date(),
      tempo_renderizacao: 150, // Simplificado
      
      largura_efetiva: props.largura,
      altura_efetiva: props.altura,
      area_total_vidro: areaTotal,
      peso_total_estimado: pesoTotal,
      quantidade_folhas: props.quantidade_folhas,
      folhas,
      
      metros_perfil: (props.largura + props.altura) * 2,
      
      validacoes,
      projeto_valido: !temErros,
      
      imagem_data_url: canvas.toDataURL(),
      
      engine_id: 'sacada_ks',
      engine_version: '1.0.0',
      props_originais: props,
      regras_aplicadas: rules,
    };
    
    // Finalizar
    setState(prev => ({
      ...prev,
      status: 'success',
      progresso: 100,
      resultado: output,
    }));
    
    props.onRenderComplete?.(output);
  };
  
  return (
    <div className="engine-renderer">
      <canvas
        ref={canvasRef}
        width={props.canvas_largura || ENGINE_DEFAULTS.canvas_largura}
        height={props.canvas_altura || ENGINE_DEFAULTS.canvas_altura}
        style={{ border: '1px solid #ccc' }}
      />
      
      {state.status === 'rendering' && (
        <div className="progress">
          Renderizando... {state.progresso}%
        </div>
      )}
      
      {state.status === 'error' && (
        <div className="error">
          Erro: {state.erro?.mensagem}
        </div>
      )}
      
      {state.resultado && (
        <div className="resultado">
          <h3>Resultado:</h3>
          <p>Área total: {state.resultado.area_total_vidro.toFixed(2)} m²</p>
          <p>Peso total: {state.resultado.peso_total_estimado.toFixed(2)} kg</p>
          <p>Folhas: {state.resultado.quantidade_folhas}</p>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// EXEMPLO 6: USO DO COMPONENTE
// ============================================================================

export function ExemploUsoCompleto() {
  return (
    <div>
      <h1>Exemplo de Renderizador de Sacada KS</h1>
      
      <EngineRenderer
        props={exemploPropsCompletas}
        rules={exemploRegrasSacadaKS}
      />
    </div>
  );
}

// ============================================================================
// EXEMPLO 7: HELPERS DE CÁLCULO
// ============================================================================

/**
 * Calcula o peso de uma folha de vidro
 */
export function calcularPesoVidro(params: {
  area: number;
  espessura: number;
  tipo?: 'temperado' | 'laminado' | 'comum';
}): number {
  const { area, espessura, tipo = 'temperado' } = params;
  const densidade = DENSIDADE_VIDRO[tipo];
  return area * espessura * densidade;
}

/**
 * Converte milímetros para metros
 */
export function mmParaMetros(mm: number): number {
  return mm * CONVERSOES.MM_PARA_M;
}

/**
 * Converte metros para milímetros
 */
export function metrosParaMm(m: number): number {
  return m * CONVERSOES.M_PARA_MM;
}

/**
 * Formata valor em metros para exibição
 */
export function formatarMetros(metros: number): string {
  return `${metros.toFixed(2)}m`;
}

/**
 * Formata valor em m² para exibição
 */
export function formatarM2(m2: number): string {
  return `${m2.toFixed(2)}m²`;
}

/**
 * Formata peso em kg para exibição
 */
export function formatarPeso(kg: number): string {
  return `${kg.toFixed(1)}kg`;
}

// ============================================================================
// EXPORTAÇÕES PARA REFERÊNCIA
// ============================================================================

export {
  exemploPropsMinimas,
  exemploPropsCompletas,
  exemploRegrasSacadaKS,
  exemploRegrasJanela4Folhas,
  validarEntradas,
  calcularFolhas,
  EngineRenderer,
};
