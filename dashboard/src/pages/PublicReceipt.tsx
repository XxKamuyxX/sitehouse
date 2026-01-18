import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Loader2, Download, Star } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { ReceiptPDF } from '../components/ReceiptPDF';

interface ManualService {
  id: string;
  description: string;
  price?: number;
}

interface Receipt {
  id: string;
  workOrderId: string;
  clientName: string;
  amount: number;
  paymentDate: any;
  items?: any[];
  notes?: string;
  companyId?: string;
  manualServices?: ManualService[];
  manualServicesTotal?: number;
}

export function PublicReceipt() {
  const { receiptId } = useParams<{ receiptId: string }>();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [workOrder, setWorkOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (receiptId) {
      loadReceipt();
    }
  }, [receiptId]);

  const loadReceipt = async () => {
    try {
      if (!receiptId) {
        setError('ID do recibo não fornecido');
        setLoading(false);
        return;
      }

      const receiptDoc = await getDoc(doc(db, 'receipts', receiptId));
      if (!receiptDoc.exists()) {
        setError('Recibo não encontrado');
        setLoading(false);
        return;
      }

      const receiptData = receiptDoc.data();
      setReceipt({
        id: receiptDoc.id,
        ...receiptData,
      } as Receipt);

      // Load work order if available
      if (receiptData.workOrderId) {
        const woDoc = await getDoc(doc(db, 'workOrders', receiptData.workOrderId));
        if (woDoc.exists()) {
          setWorkOrder(woDoc.data());
        }
      }
    } catch (err) {
      console.error('Error loading receipt:', err);
      setError('Erro ao carregar recibo');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!receipt || !workOrder) return;

    try {
      // Load company data if companyId exists
      let companyData = undefined;
      if (receipt.companyId || (workOrder as any).companyId) {
        const companyId = receipt.companyId || (workOrder as any).companyId;
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
          clientName={receipt.clientName}
          workOrderId={workOrder.id || receipt.workOrderId}
          scheduledDate={workOrder.scheduledDate || new Date().toISOString()}
          completedDate={receipt.paymentDate?.toDate ? receipt.paymentDate.toDate() : new Date()}
          technician={workOrder.technician || ''}
          checklist={workOrder.checklist || []}
          notes={receipt.notes || workOrder.notes || ''}
          items={receipt.items || []}
          total={receipt.amount}
          warranty={workOrder.warranty}
          companyData={companyData}
          manualServices={receipt.manualServices || workOrder.manualServices || []}
          manualServicesTotal={receipt.manualServicesTotal || workOrder.totalPrice || 0}
        />
      );

      const blob = await pdf(pdfDoc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Recibo_${receipt.clientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
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
          <p className="text-slate-600">Carregando recibo...</p>
        </div>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-navy mb-2">Erro</h1>
          <p className="text-slate-600 mb-6">{error || 'Recibo não encontrado'}</p>
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
          <h1 className="text-3xl font-bold text-navy text-center mb-2">Recibo de Pagamento</h1>
          <p className="text-center text-slate-600">
            {receipt.paymentDate && `Emitido em ${formatDate(receipt.paymentDate)}`}
          </p>
        </div>

        {/* Client Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-navy mb-4">Cliente</h2>
          <p className="text-lg text-slate-700">{receipt.clientName}</p>
        </div>

        {/* Payment Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-navy mb-4">Informações de Pagamento</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-600">Valor Pago:</span>
              <span className="font-bold text-navy text-xl">{formatCurrency(receipt.amount)}</span>
            </div>
            {receipt.paymentDate && (
              <div className="flex justify-between">
                <span className="text-slate-600">Data do Pagamento:</span>
                <span className="font-medium text-navy">{formatDate(receipt.paymentDate)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Services */}
        {receipt.items && receipt.items.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-navy mb-4">Serviços</h2>
            <div className="space-y-4">
              {receipt.items.map((item: any, index: number) => (
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
          </div>
        )}

        {/* Notes */}
        {receipt.notes && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-navy mb-4">Observações</h2>
            <p className="text-slate-700">{receipt.notes}</p>
          </div>
        )}

        {/* Feedback Section */}
        {workOrder && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-navy mb-4 text-center">Avalie nosso Serviço</h2>
            {submitted ? (
              <div className="text-center">
                <div className="flex justify-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-8 h-8 ${
                        star <= rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-slate-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-slate-600 mb-4">Obrigado pela sua avaliação!</p>
                {rating === 5 && (
                  <button
                    onClick={() => {
                      const googleReviewUrl = 'https://g.page/r/CbwrbzEhhph2EAE/review';
                      window.open(googleReviewUrl, '_blank');
                    }}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Avaliar no Google
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center">
                <div className="flex justify-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-10 h-10 ${
                          star <= (hoveredRating || rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <button
                  onClick={async () => {
                    if (!rating || !workOrder?.id) return;
                    setSubmitting(true);
                    try {
                      await updateDoc(doc(db, 'workOrders', workOrder.id), {
                        feedbackSubmitted: true,
                        feedbackRating: rating,
                        feedbackDate: new Date(),
                      });
                      setSubmitted(true);
                    } catch (err) {
                      console.error('Error submitting feedback:', err);
                      alert('Erro ao enviar feedback');
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  disabled={!rating || submitting}
                  className="px-6 py-2 bg-navy text-white rounded-lg hover:bg-navy-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Enviando...' : 'Enviar Avaliação'}
                </button>
              </div>
            )}
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

