/**
 * STUDIO PAGE - Gerador de Thumbnails
 * 
 * Ferramenta interna para gerar miniaturas dos templates automaticamente.
 * Renderiza múltiplas configurações em modo "static" para screenshots.
 * 
 * ACESSO: Apenas Admin Master
 * ROTA: /admin/studio
 * 
 * USO:
 * 1. Navegue para /admin/studio
 * 2. Visualize todas as configurações renderizadas
 * 3. Clique com botão direito → "Salvar imagem como"
 * 4. Use como thumbnail do template
 */

import React, { useState } from 'react';
import { Layout } from '../../components/Layout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { RenderizadorUniversal } from '../../components/RenderizadorUniversal';
import { EngineProps } from '../../engines/types';
import { Download, Copy, Check } from 'lucide-react';

// ============================================================================
// CATÁLOGO DE CONFIGURAÇÕES (Hardcoded)
// ============================================================================

interface CatalogItem {
  id: string;
  nome: string;
  descricao: string;
  engine_config: {
    engine_id: string;
    regras_fisicas: any;
    mapeamento_materiais?: any;
  };
  props: EngineProps;
}

const CATALOG: CatalogItem[] = [
  // -------------------------------------------------------------------------
  // SACADA KS
  // -------------------------------------------------------------------------
  {
    id: 'sacada_ks_8_folhas_incolor',
    nome: 'Sacada KS 8 Folhas - Incolor',
    descricao: '6.5m x 2.4m, vidro incolor, perfil branco fosco',
    engine_config: {
      engine_id: 'sacada_ks',
      regras_fisicas: {
        tipo_movimento: 'empilhavel',
        tem_pivo: true,
        folgas: { padrao: 15, lateral: 20, superior: 15, inferior: 15 },
      },
    },
    props: {
      largura: 6.5,
      altura: 2.4,
      quantidade_folhas: 8,
      espessura_vidro: 8,
      cor_vidro_id: 'incolor',
      cor_perfil_id: 'branco_fosco',
    },
  },
  {
    id: 'sacada_ks_10_folhas_fume',
    nome: 'Sacada KS 10 Folhas - Fumê',
    descricao: '8.0m x 2.6m, vidro fumê, perfil preto anodizado',
    engine_config: {
      engine_id: 'sacada_ks',
      regras_fisicas: {
        tipo_movimento: 'empilhavel',
        tem_pivo: true,
        folgas: { padrao: 15, lateral: 20, superior: 15, inferior: 15 },
      },
    },
    props: {
      largura: 8.0,
      altura: 2.6,
      quantidade_folhas: 10,
      espessura_vidro: 8,
      cor_vidro_id: 'fume',
      cor_perfil_id: 'preto_anodizado',
    },
  },
  {
    id: 'sacada_ks_6_folhas_verde',
    nome: 'Sacada KS 6 Folhas - Verde',
    descricao: '5.0m x 2.2m, vidro verde, perfil bronze',
    engine_config: {
      engine_id: 'sacada_ks',
      regras_fisicas: {
        tipo_movimento: 'empilhavel',
        tem_pivo: true,
        folgas: { padrao: 15, lateral: 20, superior: 15, inferior: 15 },
      },
    },
    props: {
      largura: 5.0,
      altura: 2.2,
      quantidade_folhas: 6,
      espessura_vidro: 8,
      cor_vidro_id: 'verde',
      cor_perfil_id: 'bronze',
    },
  },

  // -------------------------------------------------------------------------
  // JANELA DE CORRER
  // -------------------------------------------------------------------------
  {
    id: 'janela_4_folhas_incolor',
    nome: 'Janela 4 Folhas - Incolor',
    descricao: '2.0m x 1.5m, vidro incolor, perfil branco fosco',
    engine_config: {
      engine_id: 'janela_correr',
      regras_fisicas: {
        tipo_movimento: 'correr',
        tem_pivo: false,
        folgas: { padrao: 12, lateral: 15, superior: 12, inferior: 12 },
      },
    },
    props: {
      largura: 2.0,
      altura: 1.5,
      quantidade_folhas: 4,
      espessura_vidro: 6,
      cor_vidro_id: 'incolor',
      cor_perfil_id: 'branco_fosco',
    },
  },
  {
    id: 'janela_2_folhas_fume',
    nome: 'Janela 2 Folhas - Fumê',
    descricao: '1.2m x 1.2m, vidro fumê, perfil preto fosco',
    engine_config: {
      engine_id: 'janela_correr',
      regras_fisicas: {
        tipo_movimento: 'correr',
        tem_pivo: false,
        folgas: { padrao: 12, lateral: 15, superior: 12, inferior: 12 },
      },
    },
    props: {
      largura: 1.2,
      altura: 1.2,
      quantidade_folhas: 2,
      espessura_vidro: 6,
      cor_vidro_id: 'fume',
      cor_perfil_id: 'preto_fosco',
    },
  },
  {
    id: 'janela_6_folhas_verde',
    nome: 'Janela 6 Folhas - Verde',
    descricao: '3.6m x 1.8m, vidro verde, perfil natural fosco',
    engine_config: {
      engine_id: 'janela_correr',
      regras_fisicas: {
        tipo_movimento: 'correr',
        tem_pivo: false,
        folgas: { padrao: 12, lateral: 15, superior: 12, inferior: 12 },
      },
    },
    props: {
      largura: 3.6,
      altura: 1.8,
      quantidade_folhas: 6,
      espessura_vidro: 6,
      cor_vidro_id: 'verde',
      cor_perfil_id: 'natural_fosco',
    },
  },

  // -------------------------------------------------------------------------
  // BOX DE BANHEIRO
  // -------------------------------------------------------------------------
  {
    id: 'box_frontal_incolor',
    nome: 'Box Frontal - Incolor',
    descricao: '1.2m x 1.9m, vidro incolor 8mm',
    engine_config: {
      engine_id: 'box_frontal',
      regras_fisicas: {
        tipo_movimento: 'correr',
        tem_pivo: false,
        folgas: { padrao: 10, lateral: 15, superior: 10, inferior: 10 },
      },
    },
    props: {
      largura: 1.2,
      altura: 1.9,
      quantidade_folhas: 2,
      espessura_vidro: 8,
      cor_vidro_id: 'incolor',
      cor_perfil_id: 'natural_brilhante',
    },
  },
  {
    id: 'box_frontal_fume',
    nome: 'Box Frontal - Fumê',
    descricao: '1.4m x 2.0m, vidro fumê 8mm',
    engine_config: {
      engine_id: 'box_frontal',
      regras_fisicas: {
        tipo_movimento: 'correr',
        tem_pivo: false,
        folgas: { padrao: 10, lateral: 15, superior: 10, inferior: 10 },
      },
    },
    props: {
      largura: 1.4,
      altura: 2.0,
      quantidade_folhas: 2,
      espessura_vidro: 8,
      cor_vidro_id: 'fume',
      cor_perfil_id: 'preto_brilhante',
    },
  },

  // -------------------------------------------------------------------------
  // GUARDA-CORPO
  // -------------------------------------------------------------------------
  {
    id: 'guarda_corpo_torre_incolor',
    nome: 'Guarda-Corpo Torre - Incolor',
    descricao: '3.0m x 1.1m, vidro incolor 10mm, torres inox',
    engine_config: {
      engine_id: 'guarda_corpo_torre',
      regras_fisicas: {
        tipo_movimento: 'fixo',
        tem_pivo: false,
        folgas: { padrao: 0, lateral: 50, superior: 0, inferior: 0 },
      },
    },
    props: {
      largura: 3.0,
      altura: 1.1,
      quantidade_folhas: 1,
      espessura_vidro: 10,
      cor_vidro_id: 'incolor',
      cor_perfil_id: 'prata_metalico',
    },
  },
  {
    id: 'guarda_corpo_torre_fume',
    nome: 'Guarda-Corpo Torre - Fumê',
    descricao: '4.0m x 1.15m, vidro fumê 10mm, torres inox',
    engine_config: {
      engine_id: 'guarda_corpo_torre',
      regras_fisicas: {
        tipo_movimento: 'fixo',
        tem_pivo: false,
        folgas: { padrao: 0, lateral: 50, superior: 0, inferior: 0 },
      },
    },
    props: {
      largura: 4.0,
      altura: 1.15,
      quantidade_folhas: 1,
      espessura_vidro: 10,
      cor_vidro_id: 'fume',
      cor_perfil_id: 'prata_metalico',
    },
  },

  // -------------------------------------------------------------------------
  // VIDROS ESPECIAIS
  // -------------------------------------------------------------------------
  {
    id: 'vidro_fixo_extra_clear',
    nome: 'Vidro Fixo - Extra Clear',
    descricao: '2.5m x 2.8m, vidro extra clear 10mm',
    engine_config: {
      engine_id: 'vidro_fixo',
      regras_fisicas: {
        tipo_movimento: 'fixo',
        tem_pivo: false,
        folgas: { padrao: 10, lateral: 10, superior: 10, inferior: 10 },
      },
    },
    props: {
      largura: 2.5,
      altura: 2.8,
      quantidade_folhas: 1,
      espessura_vidro: 10,
      cor_vidro_id: 'extra_clear',
      cor_perfil_id: 'natural_fosco',
    },
  },
  {
    id: 'vidro_fixo_bronze',
    nome: 'Vidro Fixo - Bronze',
    descricao: '3.0m x 2.5m, vidro bronze 8mm',
    engine_config: {
      engine_id: 'vidro_fixo',
      regras_fisicas: {
        tipo_movimento: 'fixo',
        tem_pivo: false,
        folgas: { padrao: 10, lateral: 10, superior: 10, inferior: 10 },
      },
    },
    props: {
      largura: 3.0,
      altura: 2.5,
      quantidade_folhas: 1,
      espessura_vidro: 8,
      cor_vidro_id: 'bronze',
      cor_perfil_id: 'bronze',
    },
  },
];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function StudioPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleDownload = (id: string, nome: string) => {
    const canvas = document.querySelector(`[data-canvas-id="${id}"] canvas`) as HTMLCanvasElement;
    if (!canvas) return;

    // Converter para PNG e baixar
    const link = document.createElement('a');
    link.download = `${id}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Studio Mode</h1>
              <p className="mt-1 opacity-90">Gerador de Thumbnails Automático</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{CATALOG.length}</p>
              <p className="text-sm opacity-90">Configurações</p>
            </div>
          </div>
        </div>

        {/* Instruções */}
        <Card>
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 text-blue-600 rounded-full p-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-secondary mb-2">Como Usar:</h3>
              <ol className="space-y-1 text-sm text-slate-600 list-decimal list-inside">
                <li>Visualize todas as configurações renderizadas abaixo</li>
                <li>Clique em "Baixar PNG" para salvar a imagem</li>
                <li>Use a imagem como thumbnail ao criar o template no Template Manager</li>
                <li>Copie o ID para referência futura</li>
              </ol>
              <p className="text-xs text-slate-500 mt-2">
                💡 Dica: As imagens estão em modo "static" (sem controles, fundo branco, 400x300px)
              </p>
            </div>
          </div>
        </Card>

        {/* Grid de Thumbnails */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CATALOG.map((item) => (
            <Card key={item.id}>
              <div className="space-y-3">
                {/* Título */}
                <div>
                  <h3 className="font-bold text-secondary">{item.nome}</h3>
                  <p className="text-xs text-slate-500 mt-1">{item.descricao}</p>
                </div>

                {/* Canvas */}
                <div
                  data-canvas-id={item.id}
                  className="border border-slate-200 rounded-lg overflow-hidden bg-white"
                >
                  <RenderizadorUniversal
                    config={item.engine_config}
                    props={item.props}
                    mode="static"
                    width={400}
                    height={300}
                  />
                </div>

                {/* Metadados */}
                <div className="text-xs text-slate-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Dimensões:</span>
                    <span className="font-mono">{item.props.largura}m x {item.props.altura}m</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Folhas:</span>
                    <span className="font-mono">{item.props.quantidade_folhas}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vidro:</span>
                    <span className="font-mono">{item.props.cor_vidro_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Perfil:</span>
                    <span className="font-mono">{item.props.cor_perfil_id}</span>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleDownload(item.id, item.nome)}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Baixar PNG
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyId(item.id)}
                    className="flex items-center gap-1"
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="w-3 h-3 text-green-600" />
                        <span className="text-green-600">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        ID
                      </>
                    )}
                  </Button>
                </div>

                {/* ID (discreto) */}
                <p className="text-xs text-slate-400 font-mono truncate">
                  {item.id}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* Footer Info */}
        <Card>
          <div className="text-center text-sm text-slate-600">
            <p>
              📸 <strong>{CATALOG.length} thumbnails</strong> geradas automaticamente
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Renderização em tempo real usando os motores de engenharia
            </p>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
