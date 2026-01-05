import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Plus, FileText, ClipboardList, MessageCircle, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getDocs, addDoc, doc, getDoc, deleteDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Link, useNavigate } from 'react-router-dom';
import { DatePickerModal } from '../components/DatePickerModal';
import { queryWithCompanyId } from '../lib/queries';
import { useAuth } from '../contexts/AuthContext';

interface Quote {
  id: string;
  clientName: string;
  status: 'draft' | 'sent' | 'approved' | 'cancelled';
  total: number;
  createdAt: any;
}

const statusLabels = {
  draft: 'Rascunho',
  sent: 'Enviado',
  approved: 'Aprovado',
  cancelled: 'Cancelado',
};

const statusColors = {
  draft: 'bg-slate-100 text-slate-700',
  sent: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export function Quotes() {
  const { userMetadata } = useAuth();
  const companyId = userMetadata?.companyId;
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (companyId) {
      loadQuotes();
    }
  }, [companyId]);

  const loadQuotes = async () => {
    if (!companyId) return;
    
    try {
      const q = queryWithCompanyId('quotes', companyId);
      const snapshot = await getDocs(q);
      const quotesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Quote[];
      setQuotes(quotesData);
    } catch (error) {
      console.error('Error loading quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const sanitizePhone = (phone: string): string => {
    if (!phone) return '';
    // Remove spaces, parentheses, dashes
    let cleaned = phone.replace(/[\s\(\)\-]/g, '');
    
    // Remove leading + if exists
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    }
    
    // If doesn't start with '55', add Brazil country code
    if (!cleaned.startsWith('55')) {
      cleaned = '55' + cleaned;
    }
    
    return cleaned;
  };

  const handleSendWhatsApp = async (quote: Quote) => {
    try {
      // Get client phone from quote or fetch client
      const quoteDoc = await getDoc(doc(db, 'quotes', quote.id));
      if (!quoteDoc.exists()) {
        alert('Orçamento não encontrado');
        return;
      }

      const quoteData = quoteDoc.data();
      const clientId = quoteData.clientId;
      
      if (!clientId) {
        alert('Cliente não encontrado no orçamento');
        return;
      }

      const clientDoc = await getDoc(doc(db, 'clients', clientId));
      if (!clientDoc.exists()) {
        alert('Cliente não encontrado');
        return;
      }

      const clientData = clientDoc.data();
      const phone = clientData.phone;

      if (!phone || phone.trim() === '') {
        alert('Cliente sem telefone cadastrado');
        return;
      }

      const sanitizedPhone = sanitizePhone(phone);
      const publicLink = `${window.location.origin}/p/${quote.id}`;
      const message = `Olá ${quote.clientName}, aqui está o link do seu orçamento na House Manutenção: ${publicLink}`;
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${sanitizedPhone}?text=${encodedMessage}`;
      
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      alert('Erro ao abrir WhatsApp');
    }
  };

  const convertToWorkOrder = (quote: Quote) => {
    if (quote.status !== 'approved') {
      alert('Apenas orçamentos aprovados podem ser convertidos em Ordem de Serviço');
      return;
    }

    setSelectedQuote(quote);
    setShowDatePicker(true);
  };

  const handleDateConfirm = async (date: Date, time?: string) => {
    if (!selectedQuote || !companyId) return;

    try {
      const workOrderData: any = {
        quoteId: selectedQuote.id,
        clientName: selectedQuote.clientName,
        scheduledDate: date.toISOString(),
        scheduledTime: time || '09:00',
        technician: '',
        status: 'scheduled',
        notes: '',
        companyId,
        createdAt: new Date(),
      };

      await addDoc(collection(db, 'workOrders'), workOrderData);
      alert('Ordem de Serviço criada com sucesso!');
      setShowDatePicker(false);
      setSelectedQuote(null);
      navigate('/work-orders');
    } catch (error) {
      console.error('Error creating work order:', error);
      alert('Erro ao criar Ordem de Serviço');
    }
  };

  const handleDeleteQuote = async (quote: Quote) => {
    if (!confirm(`Tem certeza que deseja excluir o orçamento de ${quote.clientName}?\n\nEsta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'quotes', quote.id));
      alert('Orçamento excluído com sucesso!');
      loadQuotes(); // Reload the list
    } catch (error) {
      console.error('Error deleting quote:', error);
      alert('Erro ao excluir orçamento');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-navy">Orçamentos</h1>
            <p className="text-slate-600 mt-1">Gerencie seus orçamentos</p>
          </div>
          <Link to="/quotes/new">
            <Button variant="primary" size="lg" className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Novo Orçamento
            </Button>
          </Link>
        </div>

        {loading ? (
          <Card>
            <p className="text-center text-slate-600 py-8">Carregando...</p>
          </Card>
        ) : quotes.length === 0 ? (
          <Card>
            <p className="text-center text-slate-600 py-8">Nenhum orçamento encontrado</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {quotes.map((quote) => (
              <Card key={quote.id}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-navy">{quote.clientName}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[quote.status]}`}
                      >
                        {statusLabels[quote.status]}
                      </span>
                    </div>
                    <p className="text-slate-600">
                      Total: <span className="font-bold text-navy">{formatCurrency(quote.total)}</span>
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Link to={`/quotes/${quote.id}`}>
                      <Button variant="outline" size="sm">
                        <FileText className="w-4 h-4 mr-1" />
                        Ver
                      </Button>
                    </Link>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleSendWhatsApp(quote)}
                      className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </Button>
                    {quote.status === 'approved' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => convertToWorkOrder(quote)}
                        className="flex items-center gap-1"
                      >
                        <ClipboardList className="w-4 h-4" />
                        Criar OS
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteQuote(quote)}
                      className="flex items-center gap-1 border-red-600 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Excluir
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {showDatePicker && (
          <DatePickerModal
            onConfirm={handleDateConfirm}
            onCancel={() => {
              setShowDatePicker(false);
              setSelectedQuote(null);
            }}
            title="Agendar Ordem de Serviço"
            message="Selecione a data para agendar a ordem de serviço:"
          />
        )}
      </div>
    </Layout>
  );
}

