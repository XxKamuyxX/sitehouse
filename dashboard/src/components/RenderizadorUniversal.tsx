/**
 * RENDERIZADOR UNIVERSAL
 * 
 * Componente que renderiza qualquer tipo de projeto de vidraçaria
 * baseado nas regras de engenharia (engine_config).
 * 
 * Modos:
 * - interactive: Com controles, zoom, interação (padrão)
 * - static: Sem controles, para thumbnails (Studio Mode)
 * 
 * USO:
 * <RenderizadorUniversal
 *   config={engineConfig}
 *   props={engineProps}
 *   mode="static"
 *   width={400}
 *   height={300}
 * />
 */

import React, { useRef, useEffect, useState } from 'react';
import { EngineProps, EngineRules, EngineOutput, EngineValidacao } from '../engines/types';
import { getCorVidro, getCorAluminio } from '../constants/materiais';

interface RenderizadorUniversalProps {
  /** Configuração do motor (engine_config) */
  config: {
    engine_id: string;
    regras_fisicas: any;
    mapeamento_materiais?: any;
  };
  
  /** Props do usuário (dimensões, cores, etc) */
  props: EngineProps;
  
  /** Modo de renderização */
  mode?: 'interactive' | 'static';
  
  /** Largura do canvas */
  width?: number;
  
  /** Altura do canvas */
  height?: number;
  
  /** Callback quando renderização completa */
  onRenderComplete?: (output: EngineOutput) => void;
  
  /** Callback de erro */
  onError?: (error: any) => void;
}

export const RenderizadorUniversal: React.FC<RenderizadorUniversalProps> = ({
  config,
  props,
  mode = 'interactive',
  width = 800,
  height = 600,
  onRenderComplete,
  onError,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<'idle' | 'rendering' | 'success' | 'error'>('idle');
  const [validacoes, setValidacoes] = useState<EngineValidacao[]>([]);

  useEffect(() => {
    renderizar();
  }, [config, props]);

  const renderizar = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      setStatus('rendering');

      // Limpar canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Fundo (só em modo interativo)
      if (mode === 'interactive') {
        // Fundo de "parede" (cinza claro)
        ctx.fillStyle = '#F8F9FA';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        // Fundo branco puro (modo static)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Buscar cores
      const corVidro = getCorVidro(props.cor_vidro_id);
      const corPerfil = getCorAluminio(props.cor_perfil_id);

      if (!corVidro || !corPerfil) {
        throw new Error('Cores não encontradas');
      }

      // Calcular escala para caber no canvas
      const rules = config.regras_fisicas;
      const folgas = rules.folgas || {};
      
      // Dimensões em metros
      const larguraMetros = props.largura;
      const alturaMetros = props.altura;
      
      // Margem no canvas (px)
      const margin = mode === 'static' ? 20 : 40;
      
      // Calcular escala (metros → pixels)
      const escalaLargura = (canvas.width - margin * 2) / larguraMetros;
      const escalaAltura = (canvas.height - margin * 2) / alturaMetros;
      const escala = Math.min(escalaLargura, escalaAltura);
      
      // Dimensões em pixels
      const larguraPx = larguraMetros * escala;
      const alturaPx = alturaMetros * escala;
      
      // Centralizar
      const offsetX = (canvas.width - larguraPx) / 2;
      const offsetY = (canvas.height - alturaPx) / 2;

      // Renderizar baseado no tipo de motor
      const engineId = config.engine_id;

      if (engineId === 'sacada_ks') {
        renderizarSacadaKS(ctx, offsetX, offsetY, larguraPx, alturaPx, props, rules, corVidro, corPerfil);
      } else if (engineId === 'janela_correr') {
        renderizarJanelaCorrer(ctx, offsetX, offsetY, larguraPx, alturaPx, props, rules, corVidro, corPerfil);
      } else if (engineId === 'box_frontal') {
        renderizarBoxFrontal(ctx, offsetX, offsetY, larguraPx, alturaPx, props, rules, corVidro, corPerfil);
      } else if (engineId === 'guarda_corpo_torre') {
        renderizarGuardaCorpo(ctx, offsetX, offsetY, larguraPx, alturaPx, props, rules, corVidro, corPerfil);
      } else {
        // Renderização genérica
        renderizarGenerico(ctx, offsetX, offsetY, larguraPx, alturaPx, props, rules, corVidro, corPerfil);
      }

      // Adicionar cotas (só em modo interativo)
      if (mode === 'interactive' && props.exibir_cotas) {
        desenharCotas(ctx, offsetX, offsetY, larguraPx, alturaPx, larguraMetros, alturaMetros);
      }

      // Output
      const output: EngineOutput = {
        status: 'success',
        timestamp: new Date(),
        largura_efetiva: props.largura,
        altura_efetiva: props.altura,
        area_total_vidro: props.largura * props.altura,
        peso_total_estimado: 0,
        quantidade_folhas: props.quantidade_folhas,
        folhas: [],
        metros_perfil: (props.largura + props.altura) * 2,
        validacoes: [],
        projeto_valido: true,
        imagem_data_url: canvas.toDataURL(),
        engine_id: config.engine_id as any,
        engine_version: '1.0.0',
        props_originais: props,
        regras_aplicadas: rules,
      };

      setStatus('success');
      onRenderComplete?.(output);
    } catch (error: any) {
      console.error('Erro na renderização:', error);
      setStatus('error');
      onError?.(error);
    }
  };

  // Funções auxiliares para desenhar labels e setas
  const desenharNumeroFolha = (ctx: CanvasRenderingContext2D, x: number, y: number, numero: number, w: number) => {
    const fontSize = Math.max(Math.min(w * 0.06, 14), 10);
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`F${numero}`, x - 8, y - 8);
  };

  const desenharSeta = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    direction: 'left' | 'right'
  ) => {
    const centerX = x + w / 2;
    const centerY = y + h / 2;
    const arrowSize = Math.min(w * 0.3, 40);

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 2;

    if (direction === 'left') {
      // Seta para esquerda
      ctx.beginPath();
      ctx.moveTo(centerX - arrowSize / 2, centerY);
      ctx.lineTo(centerX + arrowSize / 2, centerY - arrowSize / 3);
      ctx.lineTo(centerX + arrowSize / 2, centerY + arrowSize / 3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      // Seta para direita
      ctx.beginPath();
      ctx.moveTo(centerX + arrowSize / 2, centerY);
      ctx.lineTo(centerX - arrowSize / 2, centerY - arrowSize / 3);
      ctx.lineTo(centerX - arrowSize / 2, centerY + arrowSize / 3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  };

  const desenharLabelTipo = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    tipo: 'FIXO' | 'PIVÔ' | 'MÓVEL'
  ) => {
    const fontSize = Math.max(Math.min(w * 0.05, 11), 8);
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    // Cor baseada no tipo
    if (tipo === 'PIVÔ') {
      ctx.fillStyle = 'rgba(37, 99, 235, 0.7)'; // Azul
    } else if (tipo === 'FIXO') {
      ctx.fillStyle = 'rgba(100, 116, 139, 0.7)'; // Cinza
    } else {
      ctx.fillStyle = 'rgba(34, 197, 94, 0.7)'; // Verde
    }

    ctx.fillText(tipo, x + w / 2, y + h - 8);
  };

  // Renderização específica para Sacada KS
  const renderizarSacadaKS = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    props: EngineProps,
    rules: any,
    corVidro: any,
    corPerfil: any
  ) => {
    const numFolhas = props.quantidade_folhas;
    const larguraFolha = w / numFolhas;
    const ladoAbertura = (props as any).ladoAbertura || 'esquerda';

    // Determinar qual é o pivô
    const indicePivo = ladoAbertura === 'esquerda' ? 0 : numFolhas - 1;

    for (let i = 0; i < numFolhas; i++) {
      const folhaX = x + i * larguraFolha;
      const isPivo = i === indicePivo;

      // Vidro (com gradiente)
      const gradVidro = ctx.createLinearGradient(folhaX, y, folhaX + larguraFolha, y + h);
      gradVidro.addColorStop(0, corVidro.cor);
      gradVidro.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
      gradVidro.addColorStop(1, corVidro.cor);
      ctx.fillStyle = gradVidro;
      ctx.fillRect(folhaX + 2, y + 2, larguraFolha - 4, h - 4);

      // Perfil (simulando gradiente metálico)
      ctx.strokeStyle = corPerfil.cor_base;
      ctx.lineWidth = isPivo ? 4 : 3; // Pivô tem perfil mais grosso
      ctx.strokeRect(folhaX, y, larguraFolha, h);

      // Linha de divisão entre folhas
      if (i < numFolhas - 1) {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(folhaX + larguraFolha, y);
        ctx.lineTo(folhaX + larguraFolha, y + h);
        ctx.stroke();
      }

      // Labels e setas (só em modo interativo)
      if (mode === 'interactive') {
        // Número da folha
        desenharNumeroFolha(ctx, folhaX + larguraFolha, y + h, i + 1, larguraFolha);

        if (isPivo) {
          // Label "PIVÔ"
          desenharLabelTipo(ctx, folhaX, y, larguraFolha, h, 'PIVÔ');
        } else {
          // Seta de direção
          desenharSeta(ctx, folhaX, y, larguraFolha, h, ladoAbertura === 'esquerda' ? 'left' : 'right');
          // Label "MÓVEL"
          desenharLabelTipo(ctx, folhaX, y, larguraFolha, h, 'MÓVEL');
        }
      }
    }

    // Pivô central (linha visual) - apenas se tem pivô nas regras
    if (rules.tem_pivo) {
      const pivoX = ladoAbertura === 'esquerda' ? x + larguraFolha / 2 : x + w - larguraFolha / 2;
      ctx.fillStyle = '#888';
      ctx.fillRect(pivoX - 3, y, 6, h);
    }
  };

  // Renderização específica para Janela de Correr
  const renderizarJanelaCorrer = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    props: EngineProps,
    rules: any,
    corVidro: any,
    corPerfil: any
  ) => {
    const numFolhas = props.quantidade_folhas;
    const larguraFolha = w / numFolhas;
    const ladoAbertura = (props as any).ladoAbertura || 'esquerda';

    for (let i = 0; i < numFolhas; i++) {
      const folhaX = x + i * larguraFolha;
      const offset = i % 2 === 0 ? 0 : 5; // Folhas alternadas (trilho)
      const isTrilhoFrontal = i % 2 === 0;

      // Vidro
      ctx.fillStyle = corVidro.cor;
      ctx.fillRect(folhaX + 4 + offset, y + 4 + offset, larguraFolha - 8, h - 8);

      // Perfil
      ctx.strokeStyle = corPerfil.cor_base;
      ctx.lineWidth = 4;
      ctx.strokeRect(folhaX + offset, y + offset, larguraFolha, h);

      // Labels e setas (só em modo interativo)
      if (mode === 'interactive') {
        // Número da folha
        desenharNumeroFolha(ctx, folhaX + larguraFolha + offset, y + h + offset, i + 1, larguraFolha);

        // Seta de direção (folhas são de correr, sempre móveis)
        desenharSeta(ctx, folhaX + offset, y + offset, larguraFolha, h, ladoAbertura === 'esquerda' ? 'left' : 'right');
        
        // Label do trilho
        const labelTrilho = isTrilhoFrontal ? 'FRONTAL' : 'FUNDO';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillStyle = isTrilhoFrontal ? 'rgba(34, 197, 94, 0.7)' : 'rgba(100, 116, 139, 0.7)';
        ctx.textAlign = 'center';
        ctx.fillText(labelTrilho, folhaX + larguraFolha / 2 + offset, y + 20 + offset);
      }
    }

    // Marco externo
    ctx.strokeStyle = corPerfil.cor_base;
    ctx.lineWidth = 6;
    ctx.strokeRect(x - 3, y - 3, w + 6, h + 6);
  };

  // Renderização específica para Box Frontal
  const renderizarBoxFrontal = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    props: EngineProps,
    rules: any,
    corVidro: any,
    corPerfil: any
  ) => {
    const larguraFolha = w / 2;

    // Folha 1 (fixa)
    ctx.fillStyle = corVidro.cor;
    ctx.fillRect(x + 4, y + 4, larguraFolha - 8, h - 8);
    ctx.strokeStyle = corPerfil.cor_base;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, larguraFolha, h);

    // Folha 2 (móvel, com offset)
    ctx.fillStyle = corVidro.cor;
    ctx.fillRect(x + larguraFolha + 8, y + 4, larguraFolha - 12, h - 8);
    ctx.strokeStyle = corPerfil.cor_base;
    ctx.lineWidth = 3;
    ctx.strokeRect(x + larguraFolha + 4, y, larguraFolha - 4, h);

    // Trilhos
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y - 5);
    ctx.lineTo(x + w, y - 5);
    ctx.moveTo(x, y + h + 5);
    ctx.lineTo(x + w, y + h + 5);
    ctx.stroke();
  };

  // Renderização específica para Guarda-Corpo
  const renderizarGuardaCorpo = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    props: EngineProps,
    rules: any,
    corVidro: any,
    corPerfil: any
  ) => {
    // Vidro fixo
    ctx.fillStyle = corVidro.cor;
    ctx.fillRect(x + 10, y + 10, w - 20, h - 20);

    // Torres de inox (laterais)
    const gradTorre = ctx.createLinearGradient(x, y, x + 10, y);
    gradTorre.addColorStop(0, '#B8C0C8');
    gradTorre.addColorStop(0.5, '#D0D8E0');
    gradTorre.addColorStop(1, '#A8B0B8');

    ctx.fillStyle = gradTorre;
    ctx.fillRect(x, y, 10, h);
    ctx.fillRect(x + w - 10, y, 10, h);

    // Grampos (simulados)
    ctx.fillStyle = '#888';
    for (let i = 0; i < 4; i++) {
      const grampoY = y + (h / 5) * (i + 1);
      ctx.fillRect(x + 5, grampoY - 2, 10, 4);
      ctx.fillRect(x + w - 15, grampoY - 2, 10, 4);
    }
  };

  // Renderização genérica (fallback)
  const renderizarGenerico = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    props: EngineProps,
    rules: any,
    corVidro: any,
    corPerfil: any
  ) => {
    // Vidro simples
    ctx.fillStyle = corVidro.cor;
    ctx.fillRect(x + 4, y + 4, w - 8, h - 8);

    // Perfil
    ctx.strokeStyle = corPerfil.cor_base;
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, w, h);
  };

  // Desenhar cotas (dimensões)
  const desenharCotas = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    larguraM: number,
    alturaM: number
  ) => {
    ctx.strokeStyle = '#E91E63';
    ctx.fillStyle = '#E91E63';
    ctx.lineWidth = 1;
    ctx.font = '12px Arial';

    // Cota horizontal (largura)
    ctx.beginPath();
    ctx.moveTo(x, y - 15);
    ctx.lineTo(x + w, y - 15);
    ctx.stroke();
    ctx.fillText(`${larguraM.toFixed(2)}m`, x + w / 2 - 20, y - 20);

    // Cota vertical (altura)
    ctx.beginPath();
    ctx.moveTo(x - 15, y);
    ctx.lineTo(x - 15, y + h);
    ctx.stroke();
    ctx.save();
    ctx.translate(x - 20, y + h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${alturaM.toFixed(2)}m`, -20, 0);
    ctx.restore();
  };

  return (
    <div className={`relative ${mode === 'static' ? '' : 'border border-slate-200 rounded-lg overflow-hidden'}`}>
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={mode === 'static' ? 'block' : 'block bg-white'}
      />

      {/* Status (só em modo interativo) */}
      {mode === 'interactive' && status === 'rendering' && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-slate-600 mt-2">Renderizando...</p>
          </div>
        </div>
      )}

      {mode === 'interactive' && status === 'error' && (
        <div className="absolute inset-0 bg-red-50 flex items-center justify-center">
          <div className="text-center text-red-600">
            <p className="font-medium">Erro na renderização</p>
            <p className="text-sm mt-1">Verifique a configuração</p>
          </div>
        </div>
      )}
    </div>
  );
};
