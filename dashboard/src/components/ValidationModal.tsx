/**
 * MODAL DE VALIDAÇÃO DE ENGENHARIA
 * 
 * Permite ao vidraceiro validar visualmente o projeto antes de enviar
 * 
 * Funcionalidades:
 * - Renderização do projeto com RenderizadorUniversal
 * - Checklist automático baseado nas regras do motor
 * - Alertas de problemas detectados
 * - Sugestões de correção
 */

import React, { useMemo } from 'react';
import { X, AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { RenderizadorUniversal } from './RenderizadorUniversal';

// ============================================================================
// TIPOS
// ============================================================================

interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
}

interface ValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    serviceName: string;
    dimensions?: {
      width: number;
      height: number;
    };
    glassColor?: string;
    profileColor?: string;
    quantity?: number;
    engine_config_snapshot?: any;
    resultado_calculo?: any;
  };
}

// ============================================================================
// REGRAS DE VALIDAÇÃO
// ============================================================================

function validateEngineering(item: ValidationModalProps['item']): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  if (!item.engine_config_snapshot) {
    issues.push({
      type: 'info',
      message: 'Este item não possui configuração de motor de engenharia.',
      suggestion: 'Valores serão calculados manualmente. Para cálculos automáticos, use um template com motor.',
    });
    return issues;
  }

  const { dimensions, engine_config_snapshot } = item;
  const { regras_fisicas } = engine_config_snapshot || {};

  if (!dimensions) {
    issues.push({
      type: 'error',
      message: 'Dimensões não definidas',
      suggestion: 'Defina largura e altura antes de validar.',
    });
    return issues;
  }

  const { width, height } = dimensions;
  const engineId = engine_config_snapshot.engine_id;

  // ========================================================================
  // VALIDAÇÕES GENÉRICAS
  // ========================================================================

  // Dimensão mínima geral
  if (width < 0.3 || height < 0.3) {
    issues.push({
      type: 'error',
      message: 'Dimensões muito pequenas',
      suggestion: 'Largura e altura devem ser maiores que 30cm.',
    });
  }

  // Dimensão máxima geral
  if (width > 10 || height > 4) {
    issues.push({
      type: 'warning',
      message: 'Dimensões muito grandes',
      suggestion: 'Verifique se as medidas estão corretas. Dimensões acima de 10m x 4m são incomuns.',
    });
  }

  // Proporção esquisita
  const ratio = width / height;
  if (ratio > 5 || ratio < 0.2) {
    issues.push({
      type: 'warning',
      message: 'Proporção incomum',
      suggestion: `Proporção largura/altura é ${ratio.toFixed(2)}. Verifique se está correta.`,
    });
  }

  // ========================================================================
  // VALIDAÇÕES POR TIPO DE MOTOR
  // ========================================================================

  // SACADA KS
  if (engineId === 'sacada_ks') {
    const numFolhas = regras_fisicas?.quantidade_folhas || 4;
    const larguraFolha = (width * 1000) / numFolhas; // mm

    // Largura de folha muito pequena
    if (larguraFolha < 400) {
      issues.push({
        type: 'error',
        message: 'Folhas muito estreitas',
        suggestion: `Com ${numFolhas} folhas, cada uma terá ${larguraFolha.toFixed(0)}mm. Mínimo recomendado: 400mm.`,
      });
    }

    // Largura de folha muito grande
    if (larguraFolha > 1200) {
      issues.push({
        type: 'warning',
        message: 'Folhas muito largas',
        suggestion: `Com ${numFolhas} folhas, cada uma terá ${larguraFolha.toFixed(0)}mm. Considere adicionar mais folhas.`,
      });
    }

    // Altura muito alta para KS
    if (height > 2.8) {
      issues.push({
        type: 'warning',
        message: 'Altura acima do comum para KS',
        suggestion: `Altura de ${height}m pode dificultar empilhamento. Verifique se é viável.`,
      });
    }

    // Peso estimado
    const areaTotal = width * height; // m²
    const pesoVidro8mm = areaTotal * 20; // kg (aprox)
    if (pesoVidro8mm > 150) {
      issues.push({
        type: 'warning',
        message: 'Projeto pesado',
        suggestion: `Peso estimado: ${pesoVidro8mm.toFixed(0)}kg. Certifique-se de que a estrutura suporta.`,
      });
    }
  }

  // JANELA DE CORRER
  if (engineId === 'janela_correr') {
    const numFolhas = regras_fisicas?.quantidade_folhas || 2;
    const larguraFolha = (width * 1000) / (numFolhas / 2); // mm (cada trilho tem metade das folhas)

    // 2 folhas com largura muito grande
    if (numFolhas === 2 && width > 3.0) {
      issues.push({
        type: 'warning',
        message: 'Risco de empenamento',
        suggestion: `Janela de 2 folhas com ${width}m pode empenar. Considere 4 folhas ou reforço central.`,
      });
    }

    // Folha muito larga
    if (larguraFolha > 1500) {
      issues.push({
        type: 'error',
        message: 'Folha muito larga',
        suggestion: `Cada folha terá ${larguraFolha.toFixed(0)}mm. Máximo recomendado: 1500mm.`,
      });
    }

    // Altura muito baixa
    if (height < 0.6) {
      issues.push({
        type: 'warning',
        message: 'Janela muito baixa',
        suggestion: `Altura de ${height}m é incomum para janelas. Verifique a medida.`,
      });
    }
  }

  // BOX DE BANHEIRO
  if (engineId === 'box_frontal' || engineId === 'box_canto') {
    // Largura mínima para box
    if (width < 0.7) {
      issues.push({
        type: 'error',
        message: 'Box muito estreito',
        suggestion: `Largura de ${width}m é muito pequena. Mínimo recomendado: 70cm.`,
      });
    }

    // Altura padrão
    if (height < 1.8 || height > 2.1) {
      issues.push({
        type: 'info',
        message: 'Altura não padrão',
        suggestion: `Altura padrão de box: 1.9m. Você definiu ${height}m.`,
      });
    }

    // Espessura de vidro
    const espessura = regras_fisicas?.espessura_vidro_padrao || 8;
    if (espessura < 8) {
      issues.push({
        type: 'error',
        message: 'Vidro muito fino para box',
        suggestion: `Espessura de ${espessura}mm é insuficiente. Mínimo para box: 8mm.`,
      });
    }
  }

  // GUARDA-CORPO
  if (engineId === 'guarda_corpo_torre') {
    // Altura mínima de segurança
    if (height < 1.0) {
      issues.push({
        type: 'error',
        message: 'Guarda-corpo muito baixo',
        suggestion: `Altura de ${height}m não atende normas de segurança. Mínimo: 1.0m (NBR 14718).`,
      });
    }

    // Altura máxima comum
    if (height > 1.3) {
      issues.push({
        type: 'info',
        message: 'Guarda-corpo alto',
        suggestion: `Altura padrão: 1.1m. Você definiu ${height}m.`,
      });
    }

    // Espessura de vidro para segurança
    const espessura = regras_fisicas?.espessura_vidro_padrao || 8;
    if (espessura < 10) {
      issues.push({
        type: 'warning',
        message: 'Vidro fino para guarda-corpo',
        suggestion: `Espessura de ${espessura}mm pode ser insuficiente. Recomendado: 10mm ou 12mm temperado/laminado.`,
      });
    }
  }

  // ========================================================================
  // VALIDAÇÕES DE CORES E MATERIAIS
  // ========================================================================

  const glassColor = item.glassColor;
  const profileColor = item.profileColor;

  // Vidro jateado em área externa
  if (glassColor?.includes('jateado') && engineId !== 'box_frontal') {
    issues.push({
      type: 'info',
      message: 'Vidro jateado em área externa',
      suggestion: 'Vidro jateado pode acumular sujeira em ambientes externos. Considere vidro liso.',
    });
  }

  // Perfil branco em área externa
  if (profileColor?.includes('branco') && (engineId === 'sacada_ks' || engineId === 'guarda_corpo_torre')) {
    issues.push({
      type: 'info',
      message: 'Perfil branco em área externa',
      suggestion: 'Perfil branco pode amarelar com exposição ao sol. Considere alumínio natural ou preto.',
    });
  }

  // ========================================================================
  // VALIDAÇÕES DE CÁLCULOS
  // ========================================================================

  if (item.resultado_calculo) {
    const { lista_materiais } = item.resultado_calculo;
    
    // Sem materiais calculados
    if (!lista_materiais || lista_materiais.length === 0) {
      issues.push({
        type: 'warning',
        message: 'Nenhum material calculado',
        suggestion: 'Sistema não conseguiu calcular materiais automaticamente. Revise manualmente.',
      });
    }

    // Quantidade de vidro muito alta
    const vidroItem = lista_materiais?.find((m: any) => m.nome.toLowerCase().includes('vidro'));
    if (vidroItem && vidroItem.quantidade > 50) {
      issues.push({
        type: 'warning',
        message: 'Área de vidro muito grande',
        suggestion: `Quantidade de vidro: ${vidroItem.quantidade.toFixed(1)} ${vidroItem.unidade}. Verifique se está correto.`,
      });
    }
  }

  // ========================================================================
  // SEM PROBLEMAS DETECTADOS
  // ========================================================================

  if (issues.length === 0) {
    issues.push({
      type: 'info',
      message: 'Nenhum problema detectado',
      suggestion: 'O projeto passou em todas as validações automáticas. Revise visualmente antes de enviar.',
    });
  }

  return issues;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function ValidationModal({ isOpen, onClose, item }: ValidationModalProps) {
  const issues = useMemo(() => validateEngineering(item), [item]);

  const errorCount = issues.filter((i) => i.type === 'error').length;
  const warningCount = issues.filter((i) => i.type === 'warning').length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Validação de Engenharia</h2>
            <p className="text-sm text-slate-600 mt-1">{item.serviceName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT: RENDERIZAÇÃO */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-3">Visualização do Projeto</h3>
                
                {/* Informações Básicas */}
                <div className="bg-slate-50 rounded-xl p-4 mb-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-slate-500">Largura</p>
                      <p className="font-bold text-slate-800">{item.dimensions?.width || 0}m</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Altura</p>
                      <p className="font-bold text-slate-800">{item.dimensions?.height || 0}m</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Cor do Vidro</p>
                      <p className="font-bold text-slate-800 capitalize">{item.glassColor || 'Não definida'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Cor do Perfil</p>
                      <p className="font-bold text-slate-800 capitalize">{item.profileColor || 'Não definida'}</p>
                    </div>
                  </div>
                </div>

                {/* Renderização */}
                {item.engine_config_snapshot && item.dimensions ? (
                  <div className="bg-white border-2 border-slate-200 rounded-xl overflow-hidden">
                    <RenderizadorUniversal
                      config={item.engine_config_snapshot}
                      props={{
                        largura: item.dimensions.width,
                        altura: item.dimensions.height,
                        quantidade_folhas: item.engine_config_snapshot.regras_fisicas?.quantidade_folhas || 4,
                        espessura_vidro: item.engine_config_snapshot.regras_fisicas?.espessura_vidro_padrao || 8,
                        cor_vidro_id: item.glassColor || 'incolor',
                        cor_perfil_id: item.profileColor || 'branco_fosco',
                      }}
                      mode="interactive"
                      width={500}
                      height={400}
                    />
                  </div>
                ) : (
                  <div className="bg-slate-100 rounded-xl p-8 text-center">
                    <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-600">Renderização não disponível</p>
                    <p className="text-sm text-slate-500 mt-1">Este item não possui motor de engenharia configurado</p>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: CHECKLIST */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-slate-800">Checklist Automático</h3>
                <div className="flex items-center gap-2">
                  {errorCount > 0 && (
                    <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">
                      {errorCount} erro{errorCount > 1 ? 's' : ''}
                    </span>
                  )}
                  {warningCount > 0 && (
                    <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded-full">
                      {warningCount} aviso{warningCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Lista de Issues */}
              <div className="space-y-3">
                {issues.map((issue, index) => (
                  <div
                    key={index}
                    className={`rounded-xl p-4 border-2 ${
                      issue.type === 'error'
                        ? 'bg-red-50 border-red-200'
                        : issue.type === 'warning'
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {issue.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />}
                      {issue.type === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />}
                      {issue.type === 'info' && <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />}
                      
                      <div className="flex-1">
                        <p
                          className={`font-bold text-sm ${
                            issue.type === 'error'
                              ? 'text-red-800'
                              : issue.type === 'warning'
                              ? 'text-yellow-800'
                              : 'text-blue-800'
                          }`}
                        >
                          {issue.message}
                        </p>
                        {issue.suggestion && (
                          <p
                            className={`text-xs mt-1 ${
                              issue.type === 'error'
                                ? 'text-red-600'
                                : issue.type === 'warning'
                                ? 'text-yellow-600'
                                : 'text-blue-600'
                            }`}
                          >
                            💡 {issue.suggestion}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Resumo */}
              <div className="bg-slate-100 rounded-xl p-4 mt-4">
                <p className="text-xs text-slate-600 text-center">
                  {errorCount > 0
                    ? '⚠️ Corrija os erros antes de enviar ao cliente'
                    : warningCount > 0
                    ? '✓ Nenhum erro crítico. Revise os avisos antes de prosseguir'
                    : '✓ Projeto validado! Pronto para enviar'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white border-2 border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
          >
            Fechar
          </button>
          {errorCount === 0 && (
            <button
              onClick={onClose}
              className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Aprovar Projeto
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
