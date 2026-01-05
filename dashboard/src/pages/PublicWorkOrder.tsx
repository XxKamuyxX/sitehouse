import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Loader2, Download, CheckCircle2, XCircle } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { ReceiptPDF } from '../components/ReceiptPDF';

interface Leaf {
  id: number;
  status: 'perfect' | 'attention' | 'damaged';
  defects: string[];
  photo?: string;
}

interface GeneralChecklistItem {
  task: string;
  completed: boolean;
  value?: string;
}

interface WorkOrder {
  id: string;
  quoteId: string;
  clientName: string;
  scheduledDate: string;
  scheduledTime?: string;
  technician: string;
  status: string;
  checklist: { task: string; completed: boolean }[];
  notes: string;
  photos?: string[];
  companyId?: string;
  technicalInspection?: {
    leaves: Leaf[];
    generalChecklist: GeneralChecklistItem[];
  };
}

export function PublicWorkOrder() {
  const { osId } = useParams<{ osId: string }>();
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (osId) {
      loadWorkOrder();
    }
  }, [osId]);

  const loadWorkOrder = async () => {
    try {
      if (!osId) {
        setError('ID da ordem de serviço não fornecido');
        setLoading(false);
        return;
      }

      const osDoc = await getDoc(doc(db, 'workOrders', osId));
      if (!osDoc.exists()) {
        setError('Ordem de serviço não encontrada. Verifique se o link está correto.');
        setLoading(false);
        return;
      }

      const osData = osDoc.data();
      setWorkOrder({
        id: osDoc.id,
        ...osData,
      } as WorkOrder);

      // Load quote if available (optional, don't fail if quote doesn't exist)
      if (osData.quoteId) {
        try {
          const quoteDoc = await getDoc(doc(db, 'quotes', osData.quoteId));
          if (quoteDoc.exists()) {
            setQuote(quoteDoc.data());
          }
        } catch (quoteErr) {
          console.warn('Could not load quote:', quoteErr);
          // Continue without quote data
        }
      }
    } catch (err: any) {
      console.error('Error loading work order:', err);
      // Provide more specific error messages
      if (err?.code === 'permission-denied') {
        setError('Acesso negado. Verifique se o link está correto ou entre em contato com o suporte.');
      } else if (err?.code === 'unavailable') {
        setError('Serviço temporariamente indisponível. Tente novamente em alguns instantes.');
      } else {
        setError('Erro ao carregar ordem de serviço. Verifique se o link está correto.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!workOrder || !quote) return;

    try {
      // Load company data if companyId exists
      let companyData = undefined;
      if (workOrder.companyId || (quote as any).companyId) {
        const companyId = workOrder.companyId || (quote as any).companyId;
        const companyDocRef = doc(db, 'companies', companyId);
        const companyDoc = await getDoc(companyDocRef);
        if (companyDoc.exists()) {
          const company = companyDoc.data();
          companyData = {
            name: company.name as string,
            address: company.address as string,
            phone: company.phone as string,
            email: company.email as string | undefined,
            logoUrl: company.logoUrl as string | undefined,
            cnpj: company.cnpj as string | undefined,
          };
        }
      }

      const pdfDoc = (
        <ReceiptPDF
          clientName={workOrder.clientName}
          workOrderId={workOrder.id}
          scheduledDate={workOrder.scheduledDate}
          completedDate={new Date().toISOString()}
          technician={workOrder.technician}
          checklist={workOrder.checklist || []}
          notes={workOrder.notes}
          items={quote.items || []}
          total={quote.total || 0}
          warranty={quote.warranty}
          companyData={companyData}
        />
      );

      const blob = await pdf(pdfDoc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `OS_${workOrder.clientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erro ao gerar PDF');
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
          <p className="text-slate-600">Carregando ordem de serviço...</p>
        </div>
      </div>
    );
  }

  if (error || !workOrder) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-navy mb-2">Erro</h1>
          <p className="text-slate-600 mb-6">{error || 'Ordem de serviço não encontrada'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center justify-center">
              <img src="/logo.png" alt="House Manutenção" className="h-16 w-16 object-contain" />
            </div>
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy-800 transition-colors flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download PDF
            </button>
          </div>
          <h1 className="text-3xl font-bold text-navy text-center mb-2">Ordem de Serviço</h1>
          <p className="text-center text-slate-600">
            {workOrder.scheduledDate && `Agendada para ${formatDate(workOrder.scheduledDate)}`}
          </p>
        </div>

        {/* Client Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-navy mb-4">Cliente</h2>
          <p className="text-lg text-slate-700">{workOrder.clientName}</p>
        </div>

        {/* Services */}
        {quote && quote.items && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-navy mb-4">Serviços</h2>
            <div className="space-y-4">
              {quote.items.map((item: any, index: number) => (
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
              ))}
            </div>
            <div className="pt-4 border-t-2 border-navy flex justify-between mt-4">
              <span className="text-xl font-bold text-navy">Total:</span>
              <span className="text-xl font-bold text-navy">{formatCurrency(quote.total || 0)}</span>
            </div>
          </div>
        )}

        {/* Checklist */}
        {workOrder.checklist && workOrder.checklist.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-navy mb-4">Checklist</h2>
            <div className="space-y-2">
              {workOrder.checklist.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  {item.completed ? (
                    <span className="text-green-600">✓</span>
                  ) : (
                    <span className="text-slate-300">○</span>
                  )}
                  <span className={item.completed ? 'text-slate-600 line-through' : 'text-slate-700'}>
                    {item.task}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Technical Inspection - Leaves */}
        {workOrder.technicalInspection && workOrder.technicalInspection.leaves && workOrder.technicalInspection.leaves.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-navy mb-4">Vistoria Técnica - Folhas</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
              {workOrder.technicalInspection.leaves.map((leaf) => {
                const getStatusColor = () => {
                  switch (leaf.status) {
                    case 'perfect':
                      return 'bg-green-100 border-green-500 text-green-700';
                    case 'attention':
                      return 'bg-yellow-100 border-yellow-500 text-yellow-700';
                    case 'damaged':
                      return 'bg-red-100 border-red-500 text-red-700';
                    default:
                      return 'bg-slate-100 border-slate-300 text-slate-700';
                  }
                };

                const getStatusLabel = () => {
                  switch (leaf.status) {
                    case 'perfect':
                      return 'Perfeito';
                    case 'attention':
                      return 'Atenção';
                    case 'damaged':
                      return 'Danificado';
                    default:
                      return '';
                  }
                };

                return (
                  <div
                    key={leaf.id}
                    className={`p-4 border-2 rounded-lg ${getStatusColor()}`}
                  >
                    <p className="font-bold text-center mb-2">Folha {leaf.id}</p>
                    <p className="text-xs text-center mb-2">{getStatusLabel()}</p>
                    {leaf.defects.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium mb-1">Defeitos:</p>
                        <div className="flex flex-wrap gap-1">
                          {leaf.defects.map((defect, idx) => (
                            <span key={idx} className="text-xs bg-white/50 px-2 py-1 rounded">
                              {defect}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {leaf.photo && (
                      <img
                        src={leaf.photo}
                        alt={`Folha ${leaf.id}`}
                        className="mt-2 w-full h-24 object-cover rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Erro+ao+carregar';
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Technical Inspection - General Checklist */}
        {workOrder.technicalInspection && workOrder.technicalInspection.generalChecklist && workOrder.technicalInspection.generalChecklist.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-navy mb-4">Checklist Geral</h2>
            <div className="space-y-3">
              {workOrder.technicalInspection.generalChecklist.map((item, index) => {
                // Itens simples (sem valor)
                if (!item.value && item.task !== 'Guia' && !item.task.includes('Trilhos')) {
                  return (
                    <div key={index} className="flex items-center gap-3 p-2">
                      {item.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-slate-300" />
                      )}
                      <span className={item.completed ? 'text-slate-600' : 'text-slate-700'}>
                        {item.task}
                      </span>
                    </div>
                  );
                }

                // Guia
                if (item.task === 'Guia' && item.value) {
                  return (
                    <div key={index} className="p-3 bg-navy-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-navy">Guia:</span>
                        <span className="text-navy">
                          {item.value === 'com-guia' ? 'Com Guia' : item.value === 'sem-guia' ? 'Sem Guia' : `${item.value} unidades`}
                        </span>
                      </div>
                    </div>
                  );
                }

                // Trilhos
                if (item.task.includes('Trilhos') && item.value) {
                  const getTrilhoLabel = () => {
                    if (item.task.includes('Amassado')) return 'Amassado';
                    if (item.task.includes('Ressecado')) return 'Ressecado';
                    if (item.task.includes('Sujo')) return 'Sujo';
                    return '';
                  };

                  const getLevelLabel = (value: string) => {
                    switch (value) {
                      case 'leve':
                        return 'Leve';
                      case 'moderado':
                        return 'Moderado';
                      case 'intenso':
                        return 'Intenso';
                      default:
                        return value;
                    }
                  };

                  return (
                    <div key={index} className="p-3 bg-navy-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-navy">Trilhos - {getTrilhoLabel()}:</span>
                        <span className="text-navy font-bold">{getLevelLabel(item.value)}</span>
                      </div>
                    </div>
                  );
                }

                return null;
              })}
            </div>
          </div>
        )}

        {/* Photos from Technical Inspection */}
        {workOrder.technicalInspection && workOrder.technicalInspection.leaves && (
          (() => {
            const photosWithLabels = workOrder.technicalInspection.leaves
              .filter(leaf => leaf.photo)
              .map(leaf => ({
                url: leaf.photo!,
                label: `Folha ${leaf.id}${leaf.defects.length > 0 ? ` - ${leaf.defects.join(', ')}` : ''}`
              }));

            return photosWithLabels.length > 0 ? (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-bold text-navy mb-4">Fotos da Vistoria</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {photosWithLabels.map((photo, index) => (
                    <div key={index} className="space-y-2">
                      <img
                        src={photo.url}
                        alt={photo.label}
                        className="w-full h-48 object-cover rounded-lg border border-slate-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Erro+ao+carregar';
                        }}
                      />
                      <p className="text-xs text-slate-600 text-center">{photo.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null;
          })()
        )}

        {/* General Photos */}
        {workOrder.photos && workOrder.photos.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-navy mb-4">Fotos do Serviço</h2>
            <div className="grid grid-cols-2 gap-4">
              {workOrder.photos.map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt={`Foto ${index + 1}`}
                  className="w-full h-48 object-cover rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Erro+ao+carregar';
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {workOrder.notes && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-navy mb-4">Observações</h2>
            <p className="text-slate-700">{workOrder.notes}</p>
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



