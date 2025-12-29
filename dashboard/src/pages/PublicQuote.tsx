import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface QuoteItem {
  serviceName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Quote {
  id: string;
  clientName: string;
  items: QuoteItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: string;
  warranty?: string;
  observations?: string;
  createdAt?: any;
}

export function PublicQuote() {
  const { quoteId } = useParams<{ quoteId: string }>();
  // Support both /p/:quoteId and /p/quote/:quoteId
  const actualQuoteId = quoteId;
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (actualQuoteId) {
      loadQuote();
    }
  }, [actualQuoteId]);

  const loadQuote = async () => {
    try {
      if (!quoteId) {
        setError('ID do orçamento não fornecido');
        setLoading(false);
        return;
      }

      if (!actualQuoteId) {
        setError('ID do orçamento não fornecido');
        setLoading(false);
        return;
      }
      const quoteDoc = await getDoc(doc(db, 'quotes', actualQuoteId));
      if (!quoteDoc.exists()) {
        setError('Orçamento não encontrado');
        setLoading(false);
        return;
      }

      setQuote({
        id: quoteDoc.id,
        ...quoteDoc.data(),
      } as Quote);
    } catch (err) {
      console.error('Error loading quote:', err);
      setError('Erro ao carregar orçamento');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!quoteId || !quote) return;

    if (quote.status === 'approved') {
      alert('Este orçamento já foi aprovado');
      return;
    }

    if (!confirm('Deseja aprovar este orçamento?')) {
      return;
    }

    setUpdating(true);
    try {
      await updateDoc(doc(db, 'quotes', quoteId), {
        status: 'approved',
        updatedAt: new Date(),
      });
      setQuote({ ...quote, status: 'approved' });
      alert('Orçamento Aprovado com Sucesso!');
    } catch (err) {
      console.error('Error approving quote:', err);
      alert('Erro ao aprovar orçamento. Tente novamente.');
    } finally {
      setUpdating(false);
    }
  };

  const handleReject = async () => {
    const idToUse = actualQuoteId;
    if (!idToUse || !quote) return;

    if (quote.status === 'rejected') {
      alert('Este orçamento já foi rejeitado');
      return;
    }

    if (!confirm('Deseja rejeitar este orçamento?')) {
      return;
    }

    setUpdating(true);
    try {
      await updateDoc(doc(db, 'quotes', idToUse), {
        status: 'rejected',
        updatedAt: new Date(),
      });
      setQuote({ ...quote, status: 'rejected' });
      alert('Orçamento rejeitado');
    } catch (err) {
      console.error('Error rejecting quote:', err);
      alert('Erro ao rejeitar orçamento. Tente novamente.');
    } finally {
      setUpdating(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: any) => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-navy animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Carregando orçamento...</p>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-navy mb-2">Erro</h1>
          <p className="text-slate-600 mb-6">{error || 'Orçamento não encontrado'}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-2 bg-navy text-white rounded-lg hover:bg-navy-800 transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const isApproved = quote.status === 'approved';
  const isRejected = quote.status === 'rejected';

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-center mb-6">
            <img src="/logo.png" alt="House Manutenção" className="h-20 w-20 object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-navy text-center mb-2">Orçamento</h1>
          <p className="text-center text-slate-600">
            {quote.createdAt && `Emitido em ${formatDate(quote.createdAt)}`}
          </p>
        </div>

        {/* Status Banner */}
        {isApproved && (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              <p className="text-green-800 font-medium">Este orçamento já foi aprovado</p>
            </div>
          </div>
        )}

        {isRejected && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <XCircle className="w-6 h-6 text-red-600" />
              <p className="text-red-800 font-medium">Este orçamento foi rejeitado</p>
            </div>
          </div>
        )}

        {/* Client Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-navy mb-4">Cliente</h2>
          <p className="text-lg text-slate-700">{quote.clientName}</p>
        </div>

        {/* Services List */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-navy mb-4">Serviços</h2>
          <div className="space-y-4">
            {quote.items && quote.items.length > 0 ? (
              quote.items.map((item, index) => (
                <div key={index} className="border-b border-slate-200 pb-4 last:border-0">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-medium text-navy">{item.serviceName}</h3>
                      <p className="text-sm text-slate-600">
                        {item.quantity}x {formatCurrency(item.unitPrice)}
                      </p>
                    </div>
                    <p className="font-bold text-navy">{formatCurrency(item.total)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-600">Nenhum serviço adicionado</p>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="space-y-3">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-medium">{formatCurrency(quote.subtotal || 0)}</span>
            </div>
            {quote.discount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Desconto:</span>
                <span className="font-medium text-red-600">- {formatCurrency(quote.discount)}</span>
              </div>
            )}
            <div className="pt-3 border-t-2 border-navy flex justify-between">
              <span className="text-xl font-bold text-navy">Total:</span>
              <span className="text-xl font-bold text-navy">{formatCurrency(quote.total || 0)}</span>
            </div>
          </div>
        </div>

        {/* Warranty */}
        {quote.warranty && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-navy mb-2">Garantia</h3>
            <p className="text-slate-700">{quote.warranty}</p>
          </div>
        )}

        {/* Observations */}
        {quote.observations && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-navy mb-2">Observações</h3>
            <p className="text-slate-700">{quote.observations}</p>
          </div>
        )}

        {/* Actions */}
        {!isApproved && !isRejected && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleApprove}
                disabled={updating}
                className="flex-1 bg-green-600 text-white py-4 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {updating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Aprovar Orçamento
                  </>
                )}
              </button>
              <button
                onClick={handleReject}
                disabled={updating}
                className="flex-1 bg-red-600 text-white py-4 px-6 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {updating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5" />
                    Rejeitar
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-slate-600 text-sm">
          <p>House Manutenção - Especialistas em Cortinas de Vidro</p>
          <p className="mt-1">Rua Rio Grande do Norte, 726, Savassi, Belo Horizonte - MG</p>
          <p className="mt-1">Telefone: (31) 98279-8513</p>
        </div>
      </div>
    </div>
  );
}

