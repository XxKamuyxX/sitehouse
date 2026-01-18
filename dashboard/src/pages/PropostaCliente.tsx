/**
 * PROPOSTA CLIENTE - Página Pública
 * 
 * Página de visualização da proposta para o cliente final.
 * Rota: /p/:orcamentoId
 * 
 * Funcionalidades:
 * - Layout Mobile-First
 * - Accordion animado (framer-motion)
 * - Renderização interativa (se item tiver engine_config)
 * - Botão WhatsApp flutuante
 * - Loading elegante
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  ChevronUp, 
  Loader2, 
  AlertCircle,
  CheckCircle,
  MessageCircle,
  Calendar,
  Package,
  Ruler
} from 'lucide-react';
import { RenderizadorUniversal } from '../components/RenderizadorUniversal';

// ============================================================================
// TIPOS
// ============================================================================

interface QuoteItem {
  serviceName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  dimensions?: {
    width: number;
    height: number;
  };
  glassColor?: string;
  profileColor?: string;
  imageUrl?: string;
  engine_config_snapshot?: any;
  resultado_calculo?: any;
  description?: string;
}

interface Quote {
  id: string;
  clientName: string;
  companyId: string;
  items: QuoteItem[];
  total: number;
  status: string;
  createdAt: any;
  expiresAt?: any;
  companyName?: string;
  companyLogo?: string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function PropostaCliente() {
  const { orcamentoId } = useParams<{ orcamentoId: string }>();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedItem, setExpandedItem] = useState<number | null>(null);

  useEffect(() => {
    loadQuote();
  }, [orcamentoId]);

  const loadQuote = async () => {
    if (!orcamentoId) {
      setError('ID do orçamento não fornecido');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const quoteDoc = await getDoc(doc(db, 'quotes', orcamentoId));

      if (!quoteDoc.exists()) {
        setError('Orçamento não encontrado');
        return;
      }

      const quoteData = { id: quoteDoc.id, ...quoteDoc.data() } as Quote;
      
      // Buscar dados da empresa se tiver companyId
      if (quoteData.companyId) {
        try {
          const companyDoc = await getDoc(doc(db, 'companies', quoteData.companyId));
          if (companyDoc.exists()) {
            const companyData = companyDoc.data();
            quoteData.companyName = companyData.name || 'Vidraçaria';
            quoteData.companyLogo = companyData.logoUrl;
          }
        } catch (err) {
          console.warn('Erro ao buscar dados da empresa:', err);
        }
      }

      setQuote(quoteData);
    } catch (err: any) {
      console.error('Erro ao carregar orçamento:', err);
      setError('Erro ao carregar orçamento');
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (index: number) => {
    setExpandedItem(expandedItem === index ? null : index);
  };

  const handleWhatsAppApproval = () => {
    if (!quote) return;

    const message = `Olá! Aprovei o orçamento #${quote.id.substring(0, 8)} no valor de R$ ${quote.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Gostaria de prosseguir com o pedido.`;
    
    const whatsappUrl = `https://wa.me/5511999999999?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Carregando proposta...</p>
          <p className="text-sm text-slate-500 mt-1">Aguarde um momento</p>
        </motion.div>
      </div>
    );
  }

  // ============================================================================
  // ERROR STATE
  // ============================================================================

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-slate-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Oops!</h1>
          <p className="text-slate-600 mb-6">{error || 'Orçamento não encontrado'}</p>
          <a
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Voltar ao Início
          </a>
        </motion.div>
      </div>
    );
  }

  // ============================================================================
  // SUCCESS STATE
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-100 pb-24">
      {/* HEADER */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-lg sticky top-0 z-40"
      >
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            {/* Logo */}
            <div className="flex items-center gap-3">
              {quote.companyLogo ? (
                <img
                  src={quote.companyLogo}
                  alt="Logo"
                  className="h-10 w-10 object-contain"
                />
              ) : (
                <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
              )}
              <div>
                <h1 className="font-bold text-slate-800 text-lg leading-tight">
                  {quote.companyName || 'Vidraçaria'}
                </h1>
                <p className="text-xs text-slate-500">Proposta Comercial</p>
              </div>
            </div>

            {/* Status Badge */}
            <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Ativa
            </div>
          </div>

          {/* Cliente e Valor */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs opacity-90 mb-1">Cliente</p>
                <p className="font-bold text-lg">{quote.clientName}</p>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-90 mb-1">Valor Total</p>
                <p className="font-bold text-2xl">
                  R$ {quote.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* LISTA DE ITENS */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-4"
        >
          <h2 className="text-lg font-bold text-slate-800 mb-1">
            Itens da Proposta
          </h2>
          <p className="text-sm text-slate-500">
            {quote.items.length} {quote.items.length === 1 ? 'item' : 'itens'} • Clique para ver detalhes
          </p>
        </motion.div>

        <div className="space-y-4">
          {quote.items.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              {/* CARD FECHADO (Sempre visível) */}
              <button
                onClick={() => toggleItem(index)}
                className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors text-left"
              >
                {/* Miniatura */}
                <div className="flex-shrink-0 w-20 h-20 bg-slate-100 rounded-lg overflow-hidden">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.serviceName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-8 h-8 text-slate-400" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 mb-1 truncate">
                    {item.serviceName}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      {item.quantity}x
                    </span>
                    {item.dimensions && (
                      <span className="flex items-center gap-1">
                        <Ruler className="w-3 h-3" />
                        {item.dimensions.width}m x {item.dimensions.height}m
                      </span>
                    )}
                  </div>
                </div>

                {/* Preço e Ícone */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Valor</p>
                    <p className="font-bold text-blue-600">
                      R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  {expandedItem === index ? (
                    <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  )}
                </div>
              </button>

              {/* CARD EXPANDIDO (Accordion) */}
              <AnimatePresence>
                {expandedItem === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-slate-200 overflow-hidden"
                  >
                    <div className="p-4 bg-slate-50">
                      {/* Descrição */}
                      {item.description && (
                        <div className="mb-4">
                          <p className="text-sm text-slate-600">{item.description}</p>
                        </div>
                      )}

                      {/* Detalhes */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-white rounded-lg p-3">
                          <p className="text-xs text-slate-500 mb-1">Quantidade</p>
                          <p className="font-bold text-slate-800">{item.quantity}x</p>
                        </div>
                        <div className="bg-white rounded-lg p-3">
                          <p className="text-xs text-slate-500 mb-1">Valor Unitário</p>
                          <p className="font-bold text-slate-800">
                            R$ {item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        {item.dimensions && (
                          <>
                            <div className="bg-white rounded-lg p-3">
                              <p className="text-xs text-slate-500 mb-1">Largura</p>
                              <p className="font-bold text-slate-800">{item.dimensions.width}m</p>
                            </div>
                            <div className="bg-white rounded-lg p-3">
                              <p className="text-xs text-slate-500 mb-1">Altura</p>
                              <p className="font-bold text-slate-800">{item.dimensions.height}m</p>
                            </div>
                          </>
                        )}
                        {item.glassColor && (
                          <div className="bg-white rounded-lg p-3">
                            <p className="text-xs text-slate-500 mb-1">Cor do Vidro</p>
                            <p className="font-bold text-slate-800 capitalize">{item.glassColor}</p>
                          </div>
                        )}
                        {item.profileColor && (
                          <div className="bg-white rounded-lg p-3">
                            <p className="text-xs text-slate-500 mb-1">Cor do Perfil</p>
                            <p className="font-bold text-slate-800 capitalize">{item.profileColor}</p>
                          </div>
                        )}
                      </div>

                      {/* Renderização Interativa */}
                      {item.engine_config_snapshot && item.dimensions ? (
                        <div className="bg-white rounded-xl p-4 mb-4">
                          <p className="text-xs text-slate-500 mb-3 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            Visualização Interativa
                          </p>
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
                            width={400}
                            height={300}
                          />
                        </div>
                      ) : item.imageUrl ? (
                        <div className="bg-white rounded-xl overflow-hidden mb-4">
                          <img
                            src={item.imageUrl}
                            alt={item.serviceName}
                            className="w-full h-auto"
                          />
                        </div>
                      ) : null}

                      {/* Materiais Calculados */}
                      {item.resultado_calculo?.lista_materiais && (
                        <div className="bg-white rounded-xl p-4">
                          <p className="text-xs font-bold text-slate-700 mb-3">
                            Materiais Inclusos
                          </p>
                          <div className="space-y-2">
                            {item.resultado_calculo.lista_materiais.map((material: any, idx: number) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span className="text-slate-600">
                                  {material.nome} ({material.quantidade} {material.unidade})
                                </span>
                                <span className="font-medium text-slate-800">
                                  R$ {(material.quantidade * material.preco_unitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Validade */}
        {quote.expiresAt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-900">Validade da Proposta</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Esta proposta é válida até{' '}
                  {quote.expiresAt.toDate().toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* BOTÃO WHATSAPP FLUTUANTE */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent pointer-events-none z-50"
      >
        <div className="max-w-4xl mx-auto pointer-events-auto">
          <button
            onClick={handleWhatsAppApproval}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-green-500/50 hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
          >
            <MessageCircle className="w-6 h-6" />
            Aprovar pelo WhatsApp
          </button>
        </div>
      </motion.div>
    </div>
  );
}
