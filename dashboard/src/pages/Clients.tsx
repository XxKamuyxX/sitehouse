import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Plus, Search, Edit, Trash2, FileText, MoreVertical, Wrench, MessageCircle, FolderOpen } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDocs, addDoc, updateDoc, deleteDoc, doc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ClientForm } from '../components/ClientForm';
import { queryWithCompanyId } from '../lib/queries';
import { useAuth } from '../contexts/AuthContext';

interface Client {
  id: string;
  name: string;
  address: string;
  condominium: string;
  phone: string;
  email: string;
}

const VIP_CONDOMINIUMS = [
  'Belvedere',
  'Vila da Serra',
  'Nova Lima',
  'Alphaville Lagoa dos Ingleses',
  'Vale dos Cristais',
  'Olympus',
  'Four Seasons',
  'Beverly Hills',
];

export function Clients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const { userMetadata } = useAuth();
  const companyId = userMetadata?.companyId;

  useEffect(() => {
    if (companyId) {
      loadClients();
    }
  }, [companyId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId && menuRefs.current[openMenuId]) {
        if (!menuRefs.current[openMenuId]?.contains(event.target as Node)) {
          setOpenMenuId(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

  const loadClients = async () => {
    if (!companyId) {
      console.error('Cannot load clients: companyId is not available');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const q = queryWithCompanyId('clients', companyId);
      const snapshot = await getDocs(q);
      const clientsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Client[];
      setClients(clientsData);
    } catch (error: any) {
      console.error('Error loading clients:', error);
      if (error.code === 'permission-denied') {
        alert('Erro de permissão ao carregar clientes. Verifique se você tem acesso a esta empresa.');
      } else {
        alert(`Erro ao carregar clientes: ${error.message || 'Erro desconhecido'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (clientData: Omit<Client, 'id'>) => {
    // CRITICAL: Validate companyId before attempting any operation
    if (!companyId) {
      alert('Erro: Empresa não identificada. Por favor, recarregue a página.');
      return;
    }
    
    try {
      if (editingClient) {
        // Update existing client
        const updateData = {
          ...clientData,
          companyId: companyId, // MANDATORY: Explicitly include companyId
        };
        await updateDoc(doc(db, 'clients', editingClient.id), updateData);
      } else {
        // Create new client - CRITICAL: companyId MUST be in the payload
        const newClientData = {
          ...clientData,
          companyId: companyId, // MANDATORY: Explicitly include companyId
          createdAt: serverTimestamp(), // Use serverTimestamp for consistency
        };
        console.log('Creating client with data:', { ...newClientData, createdAt: '[serverTimestamp]' });
        await addDoc(collection(db, 'clients'), newClientData);
      }
      await loadClients();
      setShowForm(false);
      setEditingClient(null);
    } catch (error: any) {
      console.error('Error saving client:', error);
      const errorMessage = error?.message || 'Erro desconhecido';
      alert(`Erro ao salvar cliente: ${errorMessage}\n\nVerifique o console para mais detalhes.`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
    try {
      await deleteDoc(doc(db, 'clients', id));
      await loadClients();
      setOpenMenuId(null);
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Erro ao excluir cliente');
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setShowForm(true);
    setOpenMenuId(null);
  };

  const handleCreateWorkOrder = async (client: Client) => {
    if (!companyId) {
      alert('Erro: Empresa não identificada');
      return;
    }

    try {
      const workOrderData = {
        clientId: client.id,
        clientName: client.name,
        clientPhone: client.phone,
        clientAddress: client.address,
        scheduledDate: new Date().toISOString().split('T')[0],
        technician: '',
        status: 'scheduled' as const,
        checklist: [],
        notes: '',
        companyId: companyId,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'workOrders'), workOrderData);
      navigate(`/admin/work-orders/${docRef.id}`);
    } catch (error: any) {
      console.error('Error creating work order:', error);
      alert(`Erro ao criar ordem de serviço: ${error.message}`);
    }
  };

  const handleWhatsApp = (phone: string) => {
    // Clean phone number: remove all non-numeric characters
    const cleanPhone = phone.replace(/\D/g, '');
    // Open WhatsApp with the phone number
    window.open(`https://wa.me/55${cleanPhone}`, '_blank');
  };

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.condominium.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-navy">Clientes</h1>
            <p className="text-slate-600 mt-1">Gerencie seu cadastro de clientes</p>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={() => {
              setEditingClient(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Novo Cliente
          </Button>
        </div>

        {/* Search */}
        <Card>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nome ou condomínio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
            />
          </div>
        </Card>

        {/* Client Form Modal */}
        {showForm && (
          <ClientForm
            client={editingClient || undefined}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditingClient(null);
            }}
            vipCondominiums={VIP_CONDOMINIUMS}
          />
        )}

        {/* Clients List */}
        {loading ? (
          <Card>
            <p className="text-center text-slate-600 py-8">Carregando...</p>
          </Card>
        ) : filteredClients.length === 0 ? (
          <Card>
            <p className="text-center text-slate-600 py-8">
              {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map((client) => (
              <Card key={client.id} className="p-4">
                <div className="space-y-3">
                  {/* Header with Name and Dropdown Menu */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-navy">{client.name}</h3>
                      <p className="text-sm text-gold font-medium">{client.condominium}</p>
                    </div>
                    <div className="relative" ref={(el) => (menuRefs.current[client.id] = el)}>
                      <button
                        onClick={() => setOpenMenuId(openMenuId === client.id ? null : client.id)}
                        className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
                        aria-label="Mais opções"
                      >
                        <MoreVertical className="w-5 h-5 text-slate-600" />
                      </button>
                      {openMenuId === client.id && (
                        <div className="absolute right-0 top-8 bg-white border border-slate-200 rounded-lg shadow-lg z-10 min-w-[160px]">
                          <button
                            onClick={() => handleEdit(client)}
                            className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 rounded-t-lg"
                          >
                            <Edit className="w-4 h-4" />
                            Editar Cliente
                          </button>
                          <button
                            onClick={() => handleDelete(client.id)}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-b-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                            Excluir Cliente
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Info Section */}
                  <div className="space-y-2 text-sm text-slate-600">
                    <p className="truncate" title={client.address}>
                      {client.address}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="flex-1">{client.phone}</span>
                      <button
                        onClick={() => handleWhatsApp(client.phone)}
                        className="p-1.5 rounded-lg bg-green-50 hover:bg-green-100 transition-colors"
                        aria-label="Abrir WhatsApp"
                        title="Abrir WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4 text-green-600" />
                      </button>
                    </div>
                    <p className="truncate" title={client.email}>
                      {client.email}
                    </p>
                  </div>

                  {/* Action Grid */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/admin/quotes/new?clientId=${client.id}`)}
                      className="flex items-center justify-center gap-1.5"
                    >
                      <FileText className="w-4 h-4" />
                      Orçar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCreateWorkOrder(client)}
                      className="flex items-center justify-center gap-1.5 border-orange-300 text-orange-700 hover:bg-orange-50"
                    >
                      <Wrench className="w-4 h-4" />
                      Nova OS
                    </Button>
                  </div>

                  {/* History Link */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/admin/quotes?clientName=${encodeURIComponent(client.name)}`)}
                    className="w-full flex items-center justify-center gap-2 text-slate-600 hover:text-navy hover:bg-slate-50"
                  >
                    <FolderOpen className="w-4 h-4" />
                    Ver Histórico / Detalhes
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
