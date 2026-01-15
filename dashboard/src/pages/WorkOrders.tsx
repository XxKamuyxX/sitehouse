import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { FileCheck, Trash2, Plus, Search, X, MoreVertical, Calendar, User, MessageCircle, Edit } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
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
  quoteId?: string;
  clientId?: string;
  clientName: string;
  clientPhone?: string;
  scheduledDate: string;
  scheduledTime?: string;
  technician?: string;
  technicianId?: string;
  status: 'scheduled' | 'in-progress' | 'completed';
  checklist: { task: string; completed: boolean }[];
  notes: string;
  totalPrice?: number;
}

interface Client {
  id: string;
  name: string;
  address: string;
  condominium: string;
  phone: string;
  email: string;
}

type StatusFilter = 'all' | 'scheduled' | 'in-progress' | 'completed';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    if (companyId) {
      loadWorkOrders();
      loadClients();
    }
  }, [companyId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId && menuRefs.current[openMenuId] && !menuRefs.current[openMenuId]?.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

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
        companyId: companyId,
        createdAt: serverTimestamp(),
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
    'in-progress': 'bg-orange-100 text-orange-700',
    completed: 'bg-green-100 text-green-700',
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    
    if (isToday) return 'Hoje';
    if (isTomorrow) return 'Amanhã';
    
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const sanitizePhone = (phone: string): string => {
    if (!phone) return '';
    let cleaned = phone.replace(/[\s\(\)\-]/g, '');
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    }
    if (!cleaned.startsWith('55')) {
      cleaned = '55' + cleaned;
    }
    return cleaned;
  };

  const handleSendWhatsApp = (order: WorkOrder) => {
    try {
      const phone = order.clientPhone || '';
      if (!phone || phone.trim() === '') {
        alert('Cliente sem telefone cadastrado');
        return;
      }

      const sanitizedPhone = sanitizePhone(phone);
      const scheduledDate = formatDate(order.scheduledDate);
      const scheduledTime = order.scheduledTime || '09:00';
      const message = `Olá ${order.clientName}, sobre sua visita técnica agendada para ${scheduledDate} às ${scheduledTime}.`;
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${sanitizedPhone}?text=${encodedMessage}`;
      
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      console.error('Error opening WhatsApp:', error);
      alert('Erro ao abrir WhatsApp');
    }
  };

  const handleGenerateReceipt = async (order: WorkOrder) => {
    try {
      const orderDoc = await getDoc(doc(db, 'workOrders', order.id));
      const orderData = orderDoc.exists() ? orderDoc.data() : null;

      let quoteData = null;
      if (order.quoteId) {
        const quoteDoc = await getDoc(doc(db, 'quotes', order.quoteId));
        if (quoteDoc.exists()) {
          quoteData = quoteDoc.data();
        }
      }

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
          technician={order.technician || ''}
          checklist={order.checklist || []}
          notes={order.notes || ''}
          items={quoteData?.items || []}
          total={quoteData?.total || order.totalPrice || 0}
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
      setOpenMenuId(null);
      loadWorkOrders();
    } catch (error) {
      console.error('Error deleting work order:', error);
      alert('Erro ao excluir ordem de serviço');
    }
  };

  // Filter work orders based on search and status
  const filteredWorkOrders = workOrders.filter((order) => {
    const matchesSearch = searchQuery === '' || 
      order.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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

        {/* Search & Filter Header */}
        <Card className="p-4">
          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por cliente ou OS..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-navy text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Todas ({workOrders.length})
              </button>
              <button
                onClick={() => setStatusFilter('scheduled')}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  statusFilter === 'scheduled'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Agendadas ({workOrders.filter(o => o.status === 'scheduled').length})
              </button>
              <button
                onClick={() => setStatusFilter('in-progress')}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  statusFilter === 'in-progress'
                    ? 'bg-orange-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Em Andamento ({workOrders.filter(o => o.status === 'in-progress').length})
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  statusFilter === 'completed'
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Concluídas ({workOrders.filter(o => o.status === 'completed').length})
              </button>
            </div>
          </div>
        </Card>

        {/* Client Selector Modal */}
        {showClientSelector && (
          <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
            <Card className="w-full max-w-md h-[90vh] md:h-auto flex flex-col">
              <div className="flex justify-between items-center mb-4 px-4 pt-4">
                <h2 className="text-xl font-bold text-navy">Selecione o Cliente</h2>
                <button onClick={() => {
                  setShowClientSelector(false);
                  setSelectedClientId('');
                  setClientSearch('');
                }} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex flex-col flex-1 overflow-hidden px-4">
                <div className="relative mb-4">
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
                <div className="flex-1 overflow-y-auto pb-20">
                  {filteredClients.length === 0 ? (
                    <p className="text-center text-slate-600 py-4">Nenhum cliente encontrado</p>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {filteredClients.map((client) => (
                        <li key={client.id}>
                          <button
                            onClick={() => setSelectedClientId(client.id)}
                            className={`w-full flex flex-row items-center justify-between p-3 transition-colors ${
                              selectedClientId === client.id
                                ? 'bg-navy-50 border-l-4 border-l-navy'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <span className="text-sm font-semibold text-gray-900">{client.name}</span>
                            <span className="text-xs text-gray-500">{client.phone || ''}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-3 z-50 md:relative md:border-t md:border-gray-200 md:p-3">
                <div className="max-w-md mx-auto flex gap-2">
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
        ) : filteredWorkOrders.length === 0 ? (
          <Card>
            <p className="text-center text-slate-600 py-8">
              {searchQuery || statusFilter !== 'all' 
                ? 'Nenhuma ordem de serviço encontrada com os filtros aplicados'
                : 'Nenhuma ordem de serviço encontrada'}
            </p>
          </Card>
        ) : (
          <div id="kanban-board" className="space-y-4">
            {filteredWorkOrders.map((order) => (
              <Card key={order.id} className="p-4 mb-4 shadow-sm">
                {/* Header Row */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-gray-900">{order.clientName}</h3>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[order.status]} ${
                        order.status === 'in-progress' ? 'animate-pulse' : ''
                      }`}
                    >
                      {statusLabels[order.status]}
                    </span>
                    <div className="relative" ref={(el) => (menuRefs.current[order.id] = el)}>
                      <button
                        onClick={() => setOpenMenuId(openMenuId === order.id ? null : order.id)}
                        className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
                        aria-label="Mais opções"
                      >
                        <MoreVertical className="w-5 h-5 text-slate-600" />
                      </button>
                      {openMenuId === order.id && (
                        <div className="absolute right-0 top-8 bg-white border border-slate-200 rounded-lg shadow-lg z-10 min-w-[160px]">
                          <Link
                            to={`/work-orders/${order.id}`}
                            onClick={() => setOpenMenuId(null)}
                            className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 rounded-t-lg"
                          >
                            <Edit className="w-4 h-4" />
                            Editar
                          </Link>
                          <button
                            onClick={() => handleDeleteWorkOrder(order)}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-b-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                            Excluir
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content Row (Details) */}
                <div className="space-y-1 mb-3">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(order.scheduledDate)}</span>
                    {order.scheduledTime && (
                      <span className="text-slate-400">às {order.scheduledTime}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-slate-600" />
                    <span className={order.technician ? 'text-slate-600' : 'text-gray-400 italic'}>
                      {order.technician || 'Não atribuído'}
                    </span>
                  </div>
                </div>

                {/* Action Footer (Contextual Buttons) */}
                <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-200">
                  {order.status === 'completed' ? (
                    <>
                      <Button
                        variant="primary"
                        onClick={() => handleGenerateReceipt(order)}
                        className="flex items-center justify-center gap-2 bg-navy hover:bg-navy-700"
                      >
                        <FileCheck className="w-4 h-4" />
                        Gerar Recibo
                      </Button>
                      <Link to={`/work-orders/${order.id}`}>
                        <Button variant="outline" className="w-full">
                          Ver Detalhes
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link to={`/work-orders/${order.id}`}>
                        <Button variant="primary" className="w-full">
                          Ver Detalhes
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        onClick={() => handleSendWhatsApp(order)}
                        className="flex items-center justify-center gap-2 border-green-600 text-green-700 hover:bg-green-50"
                      >
                        <MessageCircle className="w-4 h-4" />
                        WhatsApp
                      </Button>
                    </>
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
