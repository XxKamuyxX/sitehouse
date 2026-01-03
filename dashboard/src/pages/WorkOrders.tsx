import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { CheckCircle2, Circle, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Link } from 'react-router-dom';
import { pdf } from '@react-pdf/renderer';
import { ReceiptPDF } from '../components/ReceiptPDF';

interface WorkOrder {
  id: string;
  quoteId: string;
  clientName: string;
  scheduledDate: string;
  technician: string;
  status: 'scheduled' | 'in-progress' | 'completed';
  checklist: { task: string; completed: boolean }[];
  notes: string;
}

export function WorkOrders() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkOrders();
  }, []);

  const loadWorkOrders = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'workOrders'));
      const ordersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as WorkOrder[];
      setWorkOrders(ordersData);
    } catch (error) {
      console.error('Error loading work orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusLabels = {
    scheduled: 'Agendado',
    'in-progress': 'Em Andamento',
    completed: 'Concluído',
  };

  const statusColors = {
    scheduled: 'bg-blue-100 text-blue-700',
    'in-progress': 'bg-yellow-100 text-yellow-700',
    completed: 'bg-green-100 text-green-700',
  };

  const handleGenerateReceipt = async (order: WorkOrder) => {
    try {
      // Buscar dados do orçamento relacionado
      let quoteData = null;
      if (order.quoteId) {
        const quoteDoc = await getDoc(doc(db, 'quotes', order.quoteId));
        if (quoteDoc.exists()) {
          quoteData = quoteDoc.data();
        }
      }

      const receiptDoc = (
        <ReceiptPDF
          clientName={order.clientName}
          workOrderId={order.id}
          scheduledDate={order.scheduledDate}
          completedDate={new Date().toISOString()}
          technician={order.technician}
          checklist={order.checklist}
          notes={order.notes}
          items={quoteData?.items || []}
          total={quoteData?.total || 0}
          warranty={quoteData?.warranty || '90 dias'}
          cnpj="42.721.809/0001-52"
        />
      );

      const blob = await pdf(receiptDoc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Recibo_${order.clientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating receipt:', error);
      alert('Erro ao gerar recibo');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-navy">Ordens de Serviço</h1>
          <p className="text-slate-600 mt-1">Gerencie as ordens de serviço</p>
        </div>

        {loading ? (
          <Card>
            <p className="text-center text-slate-600 py-8">Carregando...</p>
          </Card>
        ) : workOrders.length === 0 ? (
          <Card>
            <p className="text-center text-slate-600 py-8">Nenhuma ordem de serviço encontrada</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {workOrders.map((order) => (
              <Card key={order.id}>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-navy">{order.clientName}</h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}
                        >
                          {statusLabels[order.status]}
                        </span>
                      </div>
                      <div className="text-sm text-slate-600 space-y-1">
                        <p>Data Agendada: {new Date(order.scheduledDate).toLocaleDateString('pt-BR')}</p>
                        <p>Técnico: {order.technician}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link to={`/work-orders/${order.id}`}>
                        <Button variant="outline">Ver Detalhes</Button>
                      </Link>
                      {order.status === 'completed' && (
                        <Button
                          variant="secondary"
                          onClick={() => handleGenerateReceipt(order)}
                          className="flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Gerar Recibo
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Checklist Preview */}
                  {order.checklist && order.checklist.length > 0 && (
                    <div className="pt-4 border-t border-slate-200">
                      <p className="text-sm font-medium text-slate-700 mb-2">Checklist:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {order.checklist.slice(0, 4).map((item, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            {item.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-300" />
                            )}
                            <span className={item.completed ? 'text-slate-600 line-through' : 'text-slate-700'}>
                              {item.task}
                            </span>
                          </div>
                        ))}
                        {order.checklist.length > 4 && (
                          <p className="text-sm text-slate-500">
                            +{order.checklist.length - 4} itens
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

