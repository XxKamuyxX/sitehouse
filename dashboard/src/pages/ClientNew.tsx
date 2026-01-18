import { Layout } from '../components/Layout';
import { ClientForm } from '../components/ClientForm';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

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

interface Client {
  id: string;
  name: string;
  address: string;
  condominium: string;
  phone: string;
  email: string;
  origin?: string; // Origem do cliente
}

export function ClientNew() {
  const navigate = useNavigate();
  const { userMetadata } = useAuth();
  const companyId = userMetadata?.companyId;

  const handleSave = async (clientData: Omit<Client, 'id'>) => {
    // CRITICAL: Validate companyId before attempting any operation
    if (!companyId) {
      alert('Erro: Empresa não identificada. Por favor, recarregue a página.');
      return;
    }

    try {
      // CRITICAL: companyId MUST be explicitly included in the payload
      const newClientData = {
        ...clientData,
        companyId: companyId, // MANDATORY: Explicitly include companyId
        createdAt: new Date(),
      };
      await addDoc(collection(db, 'clients'), newClientData);
      navigate('/clients');
    } catch (error: any) {
      console.error('Error saving client:', error);
      const errorMessage = error?.message || 'Erro desconhecido';
      alert(`Erro ao salvar cliente: ${errorMessage}\n\nVerifique o console para mais detalhes.`);
    }
  };

  const handleCancel = () => {
    navigate('/clients');
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/clients')}
          className="text-slate-600 hover:text-navy mb-4"
        >
          ← Voltar
        </button>
        <ClientForm
          onSave={handleSave}
          onCancel={handleCancel}
          vipCondominiums={VIP_CONDOMINIUMS}
        />
      </div>
    </Layout>
  );
}

