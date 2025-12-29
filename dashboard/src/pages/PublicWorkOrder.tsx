import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Loader2, Download } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { ReceiptPDF } from '../components/ReceiptPDF';

interface WorkOrder {
  id: string;
  quoteId: string;
  clientName: string;
  scheduledDate: string;
  technician: string;
  status: string;
  checklist: { task: string; completed: boolean }[];
  notes: string;
  photos?: string[];
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
        setError('Ordem de serviço não encontrada');
        setLoading(false);
        return;
      }

      const osData = osDoc.data();
      setWorkOrder({
        id: osDoc.id,
        ...osData,
      } as WorkOrder);

      // Load quote if available
      if (osData.quoteId) {
        const quoteDoc = await getDoc(doc(db, 'quotes', osData.quoteId));
        if (quoteDoc.exists()) {
          setQuote(quoteDoc.data());
        }
      }
    } catch (err) {
      console.error('Error loading work order:', err);
      setError('Erro ao carregar ordem de serviço');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!workOrder || !quote) return;

    try {
      const doc = (
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
        />
      );

      const blob = await pdf(doc).toBlob();
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

        {/* Photos */}
        {workOrder.photos && workOrder.photos.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-navy mb-4">Fotos</h2>
            <div className="grid grid-cols-2 gap-4">
              {workOrder.photos.map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt={`Foto ${index + 1}`}
                  className="w-full h-48 object-cover rounded-lg"
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



