/**
 * SMART GLASS PANEL - Painel de Vidro Inteligente
 * 
 * Componente reutilizável que exibe informações técnicas sobre uma folha de vidro
 * 
 * Funcionalidades:
 * - Numeração da folha (F1, F2, F3...)
 * - Identificação de tipo (Móvel, Fixo, Pivô)
 * - Setas de direção de abertura
 * - Visual técnico e profissional
 * 
 * Props:
 * - index: Número da folha (0, 1, 2...)
 * - type: 'movel' | 'fixo' | 'pivo'
 * - direction: 'left' | 'right' | null
 * - width: Largura em pixels
 * - height: Altura em pixels
 * - style: Objeto de estilos CSS
 * - showLabels: Se deve exibir rótulos (default: true)
 */

import React from 'react';
import { ArrowLeft, ArrowRight, Lock, RotateCw } from 'lucide-react';

// ============================================================================
// TIPOS
// ============================================================================

export interface SmartGlassPanelProps {
  index: number;
  type: 'movel' | 'fixo' | 'pivo';
  direction?: 'left' | 'right' | null;
  width: number;
  height: number;
  style?: React.CSSProperties;
  showLabels?: boolean;
  className?: string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function SmartGlassPanel({
  index,
  type,
  direction = null,
  width,
  height,
  style = {},
  showLabels = true,
  className = '',
}: SmartGlassPanelProps) {
  // Número da folha (F1, F2, F3...)
  const folhaNumero = `F${index + 1}`;

  // Ícone baseado no tipo
  const getTypeIcon = () => {
    switch (type) {
      case 'fixo':
        return <Lock className="w-4 h-4 text-slate-600 opacity-60" />;
      case 'pivo':
        return <RotateCw className="w-4 h-4 text-blue-600 opacity-60" />;
      default:
        return null;
    }
  };

  // Label baseado no tipo
  const getTypeLabel = () => {
    switch (type) {
      case 'fixo':
        return 'FIXO';
      case 'pivo':
        return 'PIVÔ';
      case 'movel':
        return 'MÓVEL';
      default:
        return '';
    }
  };

  // Cor do label baseado no tipo
  const getTypeColor = () => {
    switch (type) {
      case 'fixo':
        return 'text-slate-700 bg-slate-100';
      case 'pivo':
        return 'text-blue-700 bg-blue-100';
      case 'movel':
        return 'text-green-700 bg-green-100';
      default:
        return 'text-slate-700 bg-slate-100';
    }
  };

  return (
    <div
      className={`relative ${className}`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        ...style,
      }}
    >
      {/* SETA DE DIREÇÃO (Centro) */}
      {showLabels && type === 'movel' && direction && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {direction === 'left' ? (
            <ArrowLeft
              className="text-slate-600"
              style={{
                width: Math.min(width * 0.4, 60),
                height: Math.min(width * 0.4, 60),
                opacity: 0.3,
                strokeWidth: 1.5,
              }}
            />
          ) : (
            <ArrowRight
              className="text-slate-600"
              style={{
                width: Math.min(width * 0.4, 60),
                height: Math.min(width * 0.4, 60),
                opacity: 0.3,
                strokeWidth: 1.5,
              }}
            />
          )}
        </div>
      )}

      {/* ÍCONE DE TIPO (Centro - Para Fixo e Pivô) */}
      {showLabels && (type === 'fixo' || type === 'pivo') && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`${getTypeColor()} rounded-full p-3 opacity-70`}>
            {getTypeIcon()}
          </div>
        </div>
      )}

      {/* NUMERAÇÃO DA FOLHA (Inferior Direito) */}
      {showLabels && (
        <div className="absolute bottom-2 right-2 pointer-events-none">
          <div
            className="px-2 py-0.5 bg-slate-800/80 rounded text-white font-mono text-xs font-bold"
            style={{
              fontSize: Math.max(Math.min(width * 0.08, 12), 9),
            }}
          >
            {folhaNumero}
          </div>
        </div>
      )}

      {/* IDENTIFICAÇÃO DE TIPO (Inferior Centro) */}
      {showLabels && type !== 'movel' && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 pointer-events-none">
          <div
            className={`px-2 py-0.5 rounded font-bold ${getTypeColor()}`}
            style={{
              fontSize: Math.max(Math.min(width * 0.06, 10), 8),
            }}
          >
            {getTypeLabel()}
          </div>
        </div>
      )}

      {/* BADGE DE TIPO NO TOPO (Para Móvel com Direção) */}
      {showLabels && type === 'movel' && direction && (
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 pointer-events-none">
          <div
            className="px-2 py-0.5 rounded font-bold bg-green-100 text-green-700 flex items-center gap-1"
            style={{
              fontSize: Math.max(Math.min(width * 0.06, 10), 8),
            }}
          >
            {direction === 'left' ? (
              <>
                <ArrowLeft className="w-3 h-3" />
                <span>ESQUERDA</span>
              </>
            ) : (
              <>
                <ArrowRight className="w-3 h-3" />
                <span>DIREITA</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* BORDA VISUAL (Opcional) */}
      {type === 'pivo' && (
        <div
          className="absolute inset-0 border-2 border-dashed border-blue-500 opacity-40 pointer-events-none rounded"
          style={{
            borderWidth: Math.max(Math.min(width * 0.01, 2), 1),
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// VARIANTES DE FÁCIL USO
// ============================================================================

/**
 * Folha Móvel com direção
 */
export function FolhaMovel(props: Omit<SmartGlassPanelProps, 'type'>) {
  return <SmartGlassPanel {...props} type="movel" />;
}

/**
 * Folha Fixa
 */
export function FolhaFixa(props: Omit<SmartGlassPanelProps, 'type' | 'direction'>) {
  return <SmartGlassPanel {...props} type="fixo" direction={null} />;
}

/**
 * Folha Pivô
 */
export function FolhaPivo(props: Omit<SmartGlassPanelProps, 'type' | 'direction'>) {
  return <SmartGlassPanel {...props} type="pivo" direction={null} />;
}
