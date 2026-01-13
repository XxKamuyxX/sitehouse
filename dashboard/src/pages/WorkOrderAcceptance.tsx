import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

interface WorkOrder {
  id: string;
  clientName: string;
  status: string;
  clientAccepted?: boolean;
  acceptedAt?: any;
}

export function WorkOrderAcceptance() {
  const { osId } = useParams<{ osId: string }>();
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (osId) {
      loadWorkOrder();
    }
  }, [osId]);

  const loadWorkOrder = async () => {
    try {
      if (!osId) return;
      const docRef = doc(db, 'workOrders', osId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setLoading(false);
        return;
      }

      const data = docSnap.data();
      setWorkOrder({
        id: docSnap.id,
        clientName: data.clientName || '',
        status: data.status || '',
        clientAccepted: data.clientAccepted || false,
        acceptedAt: data.acceptedAt,
      });

      if (data.clientAccepted) {
        setAccepted(true);
      }
    } catch (error) {
      console.error('Error loading work order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!osId || !workOrder) return;

    if (!confirm('Confirma que recebeu os serviços/produtos em perfeitas condições?')) {
      return;
    }

    setAccepting(true);
    try {
      // Get client IP (simplified - in production, get from request headers)
      const clientIp = 'unknown'; // Could be enhanced with a backend endpoint

      await updateDoc(doc(db, 'workOrders', osId), {
        clientAccepted: true,
        acceptedAt: serverTimestamp(),
        clientIp: clientIp,
      });

      setAccepted(true);
      setWorkOrder({
        ...workOrder,
        clientAccepted: true,
        acceptedAt: new Date(),
      });

      alert('Aceite confirmado com sucesso! Obrigado.');
    } catch (error) {
      console.error('Error accepting work order:', error);
      alert('Erro ao confirmar aceite. Tente novamente.');
    } finally {
      setAccepting(false);
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

  if (!workOrder) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-navy mb-2">Ordem de Serviço não encontrada</h1>
            <p className="text-slate-600">O link pode estar incorreto ou a ordem de serviço foi removida.</p>
          </div>
        </Card>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <div className="text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-green-700 mb-2">Aceite Confirmado!</h1>
            <p className="text-slate-600 mb-4">
              O recebimento do serviço foi confirmado em{' '}
              {workOrder.acceptedAt?.toDate ? 
                new Date(workOrder.acceptedAt.toDate()).toLocaleString('pt-BR') :
                new Date(workOrder.acceptedAt).toLocaleString('pt-BR')
              }
            </p>
            <p className="text-sm text-slate-500">
              Cliente: {workOrder.clientName}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-navy mb-4">Confirmação de Recebimento</h1>
          <p className="text-slate-600 mb-6">
            Cliente: <strong>{workOrder.clientName}</strong>
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-slate-700 text-sm">
              Declaro que recebi os serviços/produtos em perfeitas condições e confirmo o recebimento.
            </p>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleAccept}
            disabled={accepting}
            className="w-full"
          >
            {accepting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Confirmando...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Confirmar Recebimento
              </>
            )}
          </Button>

          <p className="text-xs text-slate-500 mt-4">
            Ao confirmar, você está declarando que recebeu o serviço conforme descrito na ordem de serviço.
          </p>
        </div>
      </Card>
    </div>
  );
}
