import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Clock, MapPin, DollarSign } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getDocs, where, Timestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { queryWithCompanyId } from '../lib/queries';

interface WorkOrder {
  id: string;
  clientName: string;
  clientAddress?: string;
  scheduledDate: string;
  scheduledTime?: string;
  status: 'scheduled' | 'in-progress' | 'completed';
  technician: string;
  quoteId?: string;
  total?: number;
}

export function TechDashboard() {
  const { user, userMetadata } = useAuth();
  const companyId = userMetadata?.companyId;
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [cashReceived, setCashReceived] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    if (user?.uid && companyId) {
      loadTodayWorkOrders();
    }
  }, [user, companyId]);

  const loadTodayWorkOrders = async () => {
    if (!companyId || !user?.uid) return;
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const q = queryWithCompanyId(
        'workOrders',
        companyId,
        where('technician', '==', user.uid),
        where('scheduledDate', '>=', Timestamp.fromDate(today)),
        where('scheduledDate', '<', Timestamp.fromDate(tomorrow))
      );

      const snapshot = await getDocs(q);
      const orders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as WorkOrder[];

      // Sort by scheduled time
      orders.sort((a, b) => {
        const timeA = a.scheduledTime || '00:00';
        const timeB = b.scheduledTime || '00:00';
        return timeA.localeCompare(timeB);
      });

      setWorkOrders(orders);
    } catch (error) {
      console.error('Error loading work orders:', error);
      alert('Erro ao carregar ordens de serviço');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: 'scheduled' | 'in-progress' | 'completed') => {
    try {
      await updateDoc(doc(db, 'workOrders', orderId), {
        status: newStatus,
        ...(newStatus === 'completed' ? { completedDate: Timestamp.now() } : {}),
      });
      loadTodayWorkOrders();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Erro ao atualizar status');
    }
  };

  const handleCashReceived = async (orderId: string, amount: number) => {
    try {
      setCashReceived({ ...cashReceived, [orderId]: amount });
      // Here you would save to a separate collection or document field
      // For now, just storing in local state
    } catch (error) {
      console.error('Error saving cash received:', error);
    }
  };

  const getWazeUrl = (address: string) => {
    return `https://waze.com/ul?q=${encodeURIComponent(address)}`;
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

  if (loading) {
    return (
      <Layout>
        <Card>
          <p className="text-center text-slate-600 py-8">Carregando...</p>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-navy">
              Olá, {userMetadata?.name || user?.email?.split('@')[0] || 'Técnico'}
            </h1>
            <p className="text-slate-600 mt-1">Sua rota de hoje</p>
          </div>
          <div className="bg-amber-100 px-4 py-2 rounded-lg">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-700" />
              <span className="font-bold text-amber-700">
                Comissão: R$ {Object.values(cashReceived).reduce((sum, val) => sum + val, 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Today's Route */}
        <Card>
          <h2 className="text-xl font-bold text-navy mb-4">Minha Rota Hoje</h2>
          {workOrders.length === 0 ? (
            <p className="text-center text-slate-600 py-8">Nenhuma ordem de serviço agendada para hoje</p>
          ) : (
            <div className="space-y-4">
              {workOrders.map((order) => (
                <div
                  key={order.id}
                  className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Clock className="w-5 h-5 text-slate-400" />
                        <span className="font-bold text-slate-900">
                          {order.scheduledTime || '09:00'}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}
                        >
                          {statusLabels[order.status]}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-navy mb-2">{order.clientName}</h3>
                      {order.clientAddress && (
                        <div className="flex items-center gap-2 text-slate-600 mb-2">
                          <MapPin className="w-4 h-4" />
                          <a
                            href={getWazeUrl(order.clientAddress)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-blue-600 underline"
                          >
                            {order.clientAddress}
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      {order.status === 'scheduled' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleStatusChange(order.id, 'in-progress')}
                        >
                          Cheguei no Local
                        </Button>
                      )}
                      {order.status === 'in-progress' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleStatusChange(order.id, 'completed')}
                        >
                          Finalizar Serviço
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Cash Received Section */}
        <Card>
          <h2 className="text-xl font-bold text-navy mb-4">Prestação de Contas</h2>
          <div className="space-y-4">
            {workOrders
              .filter((o) => o.status === 'completed')
              .map((order) => (
                <div key={order.id} className="flex items-center gap-4 border-b border-slate-200 pb-4">
                  <div className="flex-1">
                    <p className="font-semibold text-navy">{order.clientName}</p>
                    <p className="text-sm text-slate-600">
                      Valor: R$ {order.total?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">Recebido:</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={cashReceived[order.id] || 0}
                      onChange={(e) => handleCashReceived(order.id, parseFloat(e.target.value) || 0)}
                      className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              ))}
            {workOrders.filter((o) => o.status === 'completed').length === 0 && (
              <p className="text-center text-slate-600 py-4">
                Complete serviços para registrar valores recebidos
              </p>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
