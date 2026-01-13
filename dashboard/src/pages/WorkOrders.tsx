import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { CheckCircle2, Circle, Download, Trash2, Plus, Search, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getDocs, doc, getDoc, deleteDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Link, useNavigate } from 'react-router-dom';
import { pdf } from '@react-pdf/renderer';
import { ReceiptPDF } from '../components/ReceiptPDF';
import { queryWithCompanyId } from '../lib/queries';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../hooks/useCompany';
import { TutorialGuide } from '../components/TutorialGuide';

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

interface Client {
  id: string;
  name: string;
  address: string;
  condominium: string;
  phone: string;
  email: string;
}

export function WorkOrders() {
  const navigate = useNavigate();
  const { userMetadata } = useAuth();
  const companyId = userMetadata?.companyId;
  const { company } = useCompany();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showClientSelector, setShowClientSelector] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');

  useEffect(() => {
    if (companyId) {
      loadWorkOrders();
      loadClients();
    }
  }, [companyId]);

  const loadClients = async () => {
    if (!companyId) return;
    try {
      const q = queryWithCompanyId('clients', companyId);
      const snapshot = await getDocs(q);
      const clientsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Client[];
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const handleCreateWorkOrder = async () => {
    if (!selectedClientId || !companyId) {
      alert('Selecione um cliente');
      return;
    }

    const selectedClient = clients.find((c) => c.id === selectedClientId);
    if (!selectedClient) return;

    try {
      const workOrderData = {
        clientId: selectedClientId,
        clientName: selectedClient.name,
        clientPhone: selectedClient.phone,
        clientAddress: selectedClient.address,
        scheduledDate: new Date().toISOString().split('T')[0],
        technician: '',
        status: 'scheduled' as const,
        checklist: [],
        notes: '',
        companyId: companyId, // MANDATORY: Required by security rules
        createdAt: serverTimestamp(), // Use serverTimestamp for consistency
      };

      console.log('Creating work order with data:', { ...workOrderData, createdAt: '[serverTimestamp]' });
      const docRef = await addDoc(collection(db, 'workOrders'), workOrderData);
      setShowClientSelector(false);
      setSelectedClientId('');
      setClientSearch('');
      navigate(`/work-orders/${docRef.id}`);
    } catch (error: any) {
      console.error('Error creating work order:', error);
      alert(`Erro ao criar ordem de serviço: ${error.message}`);
    }
  };

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.phone.includes(clientSearch) ||
    client.email.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const loadWorkOrders = async () => {
    if (!companyId) return;
    
    try {
      const q = queryWithCompanyId('workOrders', companyId);
      const snapshot = await getDocs(q);
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
      // Buscar dados completos da OS
      const orderDoc = await getDoc(doc(db, 'workOrders', order.id));
      const orderData = orderDoc.exists() ? orderDoc.data() : null;

      // Buscar dados do orçamento relacionado
      let quoteData = null;
      if (order.quoteId) {
        const quoteDoc = await getDoc(doc(db, 'quotes', order.quoteId));
        if (quoteDoc.exists()) {
          quoteData = quoteDoc.data();
        }
      }

      // Convert logo to base64 to avoid CORS issues
      let logoBase64: string | null = null;
      if (company?.logoUrl) {
        const { getBase64ImageFromUrl } = await import('../utils/imageToBase64');
        logoBase64 = await getBase64ImageFromUrl(company.logoUrl);
      }

      const receiptDoc = (
        <ReceiptPDF
          clientName={order.clientName}
          workOrderId={order.id}
          scheduledDate={order.scheduledDate}
          scheduledTime={orderData?.scheduledTime}
          completedDate={new Date().toISOString()}
          technician={order.technician}
          checklist={order.checklist || []}
          notes={order.notes || ''}
          items={quoteData?.items || []}
          total={quoteData?.total || 0}
          warranty={quoteData?.warranty || '90 dias'}
          photos={orderData?.photos || []}
          hasRisk={orderData?.hasRisk || false}
          companyData={company ? {
            name: company.name,
            address: company.address,
            phone: company.phone,
            email: company.email || '',
            logoUrl: logoBase64 || company.logoUrl || undefined,
            cnpj: company.cnpj || '',
          } : undefined}
          manualServices={orderData?.manualServices || []}
          manualServicesTotal={orderData?.totalPrice || 0}
          clientAccepted={orderData?.clientAccepted || false}
          acceptedAt={orderData?.acceptedAt}
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

  const handleDeleteWorkOrder = async (order: WorkOrder) => {
    if (!confirm(`Tem certeza que deseja excluir a ordem de serviço de ${order.clientName}?\n\nEsta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'workOrders', order.id));
      alert('Ordem de serviço excluída com sucesso!');
      loadWorkOrders(); // Reload the list
    } catch (error) {
      console.error('Error deleting work order:', error);
      alert('Erro ao excluir ordem de serviço');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy">Ordens de Serviço</h1>
          <p className="text-slate-600 mt-1">Gerencie as ordens de serviço</p>
        </div>
          <Button
            id="btn-add-os"
            variant="primary"
            size="lg"
            onClick={() => setShowClientSelector(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nova OS
          </Button>
        </div>

        {/* Client Selector Modal */}
        {showClientSelector && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-navy">Selecione o Cliente</h2>
                <button onClick={() => {
                  setShowClientSelector(false);
                  setSelectedClientId('');
                  setClientSearch('');
                }} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    placeholder="Buscar cliente..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                    autoFocus
                  />
                </div>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {filteredClients.length === 0 ? (
                    <p className="text-center text-slate-600 py-4">Nenhum cliente encontrado</p>
                  ) : (
                    filteredClients.map((client) => (
                      <div
                        key={client.id}
                        className={`p-3 cursor-pointer transition-all border rounded-lg ${
                          selectedClientId === client.id
                            ? 'border-navy bg-navy-50'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                        onClick={() => setSelectedClientId(client.id)}
                      >
                        <h3 className="font-bold text-navy">{client.name}</h3>
                        <p className="text-sm text-slate-600">{client.phone}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowClientSelector(false);
                      setSelectedClientId('');
                      setClientSearch('');
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleCreateWorkOrder}
                    disabled={!selectedClientId}
                    className="flex-1"
                  >
                    Criar OS
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {loading ? (
          <Card>
            <p className="text-center text-slate-600 py-8">Carregando...</p>
          </Card>
        ) : workOrders.length === 0 ? (
          <Card>
            <p className="text-center text-slate-600 py-8">Nenhuma ordem de serviço encontrada</p>
          </Card>
        ) : (
          <div id="kanban-board" className="space-y-4">
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
                    <div className="flex gap-2 flex-wrap">
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
                      <Button
                        variant="outline"
                        onClick={() => handleDeleteWorkOrder(order)}
                        className="flex items-center gap-2 border-red-600 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Excluir
                      </Button>
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

        {/* Tutorial Guide */}
        <TutorialGuide
          tutorialKey="workOrdersSeen"
          steps={[
            {
              target: '#kanban-board',
              content: 'Aqui você gerencia suas ordens de serviço.',
              placement: 'top',
            },
            {
              target: '#btn-add-os',
              content: 'Abra uma nova OS para instalação ou manutenção.',
              placement: 'bottom',
            },
          ]}
        />
      </div>
    </Layout>
  );
}

