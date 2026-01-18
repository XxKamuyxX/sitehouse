import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Star, Loader2, CheckCircle2 } from 'lucide-react';

interface WorkOrder {
  id: string;
  clientName: string;
  status: string;
  feedbackSubmitted?: boolean;
  feedbackRating?: number;
}

export function Feedback() {
  const { osId } = useParams<{ osId: string }>();
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleReviewUrl, setGoogleReviewUrl] = useState<string | null>(null);

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

      const docRef = doc(db, 'workOrders', osId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setError('Ordem de serviço não encontrada');
        setLoading(false);
        return;
      }

      const data = docSnap.data();
      const wo = {
        id: docSnap.id,
        ...data,
      } as WorkOrder;

      setWorkOrder(wo);
      
      if (wo.feedbackSubmitted) {
        setSubmitted(true);
        setRating(wo.feedbackRating || 0);
      }

      // Load company data to get Google Review URL
      const companyId = (data as any).companyId;
      if (companyId) {
        try {
          const companyQuery = query(collection(db, 'companies'), where('__name__', '==', companyId));
          const companySnapshot = await getDocs(companyQuery);
          if (!companySnapshot.empty) {
            const companyData = companySnapshot.docs[0].data();
            const reviewUrl = (companyData as any).googleReviewUrl || (companyData as any).googleReviewLink;
            if (reviewUrl) {
              setGoogleReviewUrl(reviewUrl);
            }
          }
        } catch (err) {
          console.error('Error loading company data:', err);
        }
      }
    } catch (err) {
      console.error('Error loading work order:', err);
      setError('Erro ao carregar ordem de serviço');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!osId || !rating) return;

    setSubmitting(true);
    try {
      await updateDoc(doc(db, 'workOrders', osId), {
        feedbackSubmitted: true,
        feedbackRating: rating,
        feedbackDate: new Date(),
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      alert('Erro ao enviar feedback. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleReview = () => {
    if (googleReviewUrl) {
      window.open(googleReviewUrl, '_blank');
    } else {
      alert('Link de avaliação não configurado. Entre em contato com a empresa.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-navy animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Carregando...</p>
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

  if (workOrder.status !== 'completed') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-navy mb-2">Aguarde</h1>
          <p className="text-slate-600 mb-6">
            Esta ordem de serviço ainda não foi concluída. Você receberá o link de feedback quando o serviço for finalizado.
          </p>
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

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <img src="/logo.png" alt="House Manutenção" className="h-20 w-20 object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-navy mb-2">Avalie Nossos Serviços</h1>
          <p className="text-slate-600">
            Olá, <span className="font-medium text-navy">{workOrder.clientName}</span>!
          </p>
          <p className="text-slate-600 mt-1">
            Sua opinião é muito importante para nós.
          </p>
        </div>

        {submitted ? (
          /* Thank You Message */
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-navy mb-2">Obrigado pelo seu Feedback!</h2>
            <p className="text-slate-600 mb-6">
              Sua avaliação foi registrada com sucesso.
            </p>
            
            {/* Show Stars */}
            <div className="flex justify-center gap-1 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-8 h-8 ${
                    star <= rating
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-slate-300'
                  }`}
                />
              ))}
            </div>

            {/* Google Review Button - Only show if 5 stars and URL is available */}
            {rating === 5 && googleReviewUrl && (
              <div className="mt-6">
                <button
                  onClick={handleGoogleReview}
                  className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Avaliar no Google
                </button>
                <p className="text-sm text-slate-600 mt-3">
                  Ajude outros clientes conhecendo nosso trabalho!
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Rating Form */
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-xl font-bold text-navy mb-6 text-center">
              Como você avalia nosso serviço?
            </h2>

            {/* Stars */}
            <div className="flex justify-center gap-2 mb-8">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-12 h-12 ${
                      star <= (hoveredRating || rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Rating Labels */}
            {rating > 0 && (
              <div className="text-center mb-6">
                <p className="text-lg font-medium text-navy">
                  {rating === 1 && 'Péssimo'}
                  {rating === 2 && 'Ruim'}
                  {rating === 3 && 'Regular'}
                  {rating === 4 && 'Bom'}
                  {rating === 5 && 'Excelente'}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div className="text-center">
              <button
                onClick={handleSubmit}
                disabled={!rating || submitting}
                className="bg-navy text-white py-3 px-8 rounded-lg font-medium hover:bg-navy-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Avaliação'
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

