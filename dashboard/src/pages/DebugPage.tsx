import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';

export function DebugPage() {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    try {
      const q = query(
        collection(db, 'quotes'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const snapshot = await getDocs(q);
      const quotesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setQuotes(quotesData);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p>Carregando...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-purple-600 text-white rounded-lg p-6">
          <h1 className="text-3xl font-bold">🔍 Debug - Últimos Orçamentos</h1>
          <p className="mt-1 opacity-90">Verificação de engine_config_snapshot</p>
        </div>

        {/* Quotes List */}
        <div className="space-y-4">
          {quotes.map((quote, qIdx) => (
            <Card key={quote.id}>
              <div className="space-y-4">
                {/* Quote Info */}
                <div className="border-b pb-3">
                  <h2 className="text-lg font-bold text-gray-900">
                    Orçamento #{qIdx + 1}
                  </h2>
                  <p className="text-sm text-gray-500 font-mono">{quote.id}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Criado: {quote.createdAt?.toDate?.()?.toLocaleString() || 'N/A'}
                  </p>
                </div>

                {/* Items */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-700">
                    Items ({quote.items?.length || 0}):
                  </h3>
                  
                  {!quote.items || quote.items.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">Nenhum item</p>
                  ) : (
                    quote.items.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="border-l-4 pl-4 py-2"
                        style={{
                          borderLeftColor: item.engine_config_snapshot
                            ? '#10b981'
                            : '#ef4444'
                        }}
                      >
                        <div className="space-y-2">
                          {/* Item Header */}
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-gray-800">
                              Item {idx + 1}: {item.serviceName || 'Sem nome'}
                            </h4>
                            {item.engine_config_snapshot ? (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                                ✓ COM engine_config
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                                ✗ SEM engine_config
                              </span>
                            )}
                          </div>

                          {/* Item Details */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <span className="text-gray-500">Instalação:</span>
                              <span className="ml-2 font-mono">
                                {item.isInstallation ? '✓ Sim' : '✗ Não'}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Usa Engenharia:</span>
                              <span className="ml-2 font-mono">
                                {item.usar_engenharia ? '✓ Sim' : '✗ Não'}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Lado Abertura:</span>
                              <span className="ml-2 font-mono">
                                {item.ladoAbertura || '(vazio)'}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Dimensões:</span>
                              <span className="ml-2 font-mono">
                                {item.dimensions
                                  ? `${item.dimensions.width}x${item.dimensions.height}`
                                  : '(vazio)'}
                              </span>
                            </div>
                          </div>

                          {/* Engine Config (se existir) */}
                          {item.engine_config_snapshot && (
                            <div className="mt-3 bg-gray-50 p-3 rounded">
                              <p className="text-xs font-semibold text-gray-600 mb-2">
                                📦 engine_config_snapshot:
                              </p>
                              <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                                {JSON.stringify(item.engine_config_snapshot, null, 2)}
                              </pre>
                            </div>
                          )}

                          {/* Debug Extra */}
                          <details className="text-xs text-gray-500">
                            <summary className="cursor-pointer hover:text-gray-700">
                              🔍 Ver dados completos do item
                            </summary>
                            <pre className="mt-2 bg-gray-50 p-2 rounded border overflow-x-auto">
                              {JSON.stringify(item, null, 2)}
                            </pre>
                          </details>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Instructions */}
        <Card>
          <div className="space-y-3">
            <h3 className="font-bold text-gray-900">📋 Como Interpretar:</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>
                  <strong>Verde COM engine_config:</strong> Item foi criado corretamente
                  com a nova versão do código. Deve renderizar no modal de validação.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600">✗</span>
                <span>
                  <strong>Vermelho SEM engine_config:</strong> Item antigo ou criado antes
                  da atualização. NÃO vai renderizar.
                </span>
              </li>
            </ul>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Atenção:</strong> Se todos estiverem vermelhos, significa que o
                código atualizado não está rodando. Tente:
              </p>
              <ol className="mt-2 ml-4 list-decimal text-sm text-yellow-800 space-y-1">
                <li>Parar o servidor (Ctrl+C no terminal do Vite)</li>
                <li>Limpar cache: <code className="bg-yellow-100 px-1">rm -rf node_modules/.vite</code></li>
                <li>Reiniciar: <code className="bg-yellow-100 px-1">npm run dev</code></li>
                <li>Recarregar navegador: <strong>Ctrl + Shift + R</strong></li>
              </ol>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
