import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getDocs, addDoc, updateDoc, deleteDoc, doc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ClientForm } from '../components/ClientForm';
import { useCompanyId, queryWithCompanyId } from '../lib/queries';

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
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const companyId = useCompanyId();

  useEffect(() => {
    if (companyId) {
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
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (clientData: Omit<Client, 'id'>) => {
    if (!companyId) {
      alert('Erro: companyId não encontrado. Por favor, recarregue a página.');
      return;
    }
    
    try {
      const dataWithCompany = { 
        ...clientData, 
        companyId,
      };
      
      if (editingClient) {
        await updateDoc(doc(db, 'clients', editingClient.id), dataWithCompany);
      } else {
        // Add createdAt only for new clients
        await addDoc(collection(db, 'clients'), {
          ...dataWithCompany,
          createdAt: new Date(),
        });
      }
      await loadClients();
      setShowForm(false);
      setEditingClient(null);
    } catch (error) {
      console.error('Error saving client:', error);
      alert('Erro ao salvar cliente');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
    try {
      await deleteDoc(doc(db, 'clients', id));
      await loadClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Erro ao excluir cliente');
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setShowForm(true);
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => (
              <Card key={client.id}>
                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-bold text-navy">{client.name}</h3>
                    <p className="text-sm text-gold font-medium">{client.condominium}</p>
                  </div>
                  <div className="space-y-1 text-sm text-slate-600">
                    <p>{client.address}</p>
                    <p>{client.phone}</p>
                    <p>{client.email}</p>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-slate-200">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(client)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(client.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}




