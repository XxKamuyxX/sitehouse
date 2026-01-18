import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Plus, FileText, MessageCircle, Trash2, MoreVertical, Eye } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { getDocs, addDoc, doc, getDoc, deleteDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { DatePickerModal } from '../components/DatePickerModal';
import { queryWithCompanyId } from '../lib/queries';
import { useAuth } from '../contexts/AuthContext';
import { TutorialGuide } from '../components/TutorialGuide';
import { ValidationModal } from '../components/ValidationModal';
// Removed useSecurityGate - phone verification is now handled globally at /activate
import { PaywallModal } from '../components/PaywallModal';

interface Quote {
  id: string;
  clientName?: string;
  status: 'draft' | 'sent' | 'approved' | 'cancelled';
  total: number;
  createdAt: any;
  items?: any[];
  clientId?: string;
}

type StatusFilter = 'all' | 'draft' | 'sent' | 'approved' | 'cancelled';

const statusLabels = {
  draft: 'Rascunho',
  sent: 'Enviado',
  approved: 'Aprovado',
  cancelled: 'Cancelado',
};

const statusColors = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export function Quotes() {
  const { userMetadata } = useAuth();
  const companyId = userMetadata?.companyId;
  const navigate = useNavigate();
  // Removed verifyGate - phone verification is now handled globally
  const [showPaywall, setShowPaywall] = useState(false);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [filteredQuotes, setFilteredQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [selectedItemForValidation, setSelectedItemForValidation] = useState<any>(null);

  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  // Listen for paywall modal trigger
  useEffect(() => {
    const handleOpenPaywall = () => setShowPaywall(true);
    window.addEventListener('openSubscriptionModal', handleOpenPaywall);
    return () => window.removeEventListener('openSubscriptionModal', handleOpenPaywall);
  }, []);

  useEffect(() => {
    if (companyId) {
      loadQuotes();
    }
  }, [companyId]);

  // Filter quotes based on search and status
  useEffect(() => {
    let filtered = quotes;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((quote) => quote.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((quote) => {
        const clientName = quote.clientName || '';
        return clientName.toLowerCase().includes(searchLower);
      });
    }

    setFilteredQuotes(filtered);
  }, [quotes, searchTerm, statusFilter]);

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

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Data não disponível';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const getItemCount = (quote: Quote) => {
    if (quote.items && Array.isArray(quote.items)) {
      return quote.items.length;
    }
    return 0;
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
      const clientName = quote.clientName || 'Cliente';
      const message = `Olá ${clientName}, aqui está o link do seu orçamento na House Manutenção: ${publicLink}`;
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
    setOpenMenuId(null);
  };

  const handleDateConfirm = async (date: Date, time?: string) => {
    if (!selectedQuote || !companyId) return;

    try {
      if (!companyId) {
        alert('Erro: Empresa não identificada.');
        return;
      }

      const workOrderData: any = {
        quoteId: selectedQuote.id,
        clientName: selectedQuote.clientName,
        scheduledDate: date.toISOString(),
        scheduledTime: time || '09:00',
        technician: '',
        status: 'scheduled',
        notes: '',
        companyId: companyId,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'workOrders'), workOrderData);
      alert('Ordem de Serviço criada com sucesso!');
      setShowDatePicker(false);
      setSelectedQuote(null);
      navigate('/admin/work-orders');
    } catch (error) {
      console.error('Error creating work order:', error);
      alert('Erro ao criar Ordem de Serviço');
    }
  };

  const handleDeleteQuote = async (quote: Quote) => {
    if (!confirm(`Tem certeza que deseja excluir este orçamento?\n\nEsta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'quotes', quote.id));
      alert('Orçamento excluído com sucesso!');
      loadQuotes();
      setOpenMenuId(null);
    } catch (error) {
      console.error('Error deleting quote:', error);
      alert('Erro ao excluir orçamento');
    }
  };

  const handleValidateProject = async (quote: Quote) => {
    // Buscar detalhes completos do orçamento
    try {
      const quoteDoc = await getDoc(doc(db, 'quotes', quote.id));
      if (!quoteDoc.exists()) {
        alert('Orçamento não encontrado');
        return;
      }

      const quoteData = quoteDoc.data();
      const items = quoteData.items || [];

      // Se tiver apenas 1 item, abrir modal direto
      if (items.length === 1) {
        setSelectedItemForValidation(items[0]);
        setShowValidationModal(true);
        return;
      }

      // Se tiver múltiplos itens, perguntar qual validar
      if (items.length > 1) {
        // Por enquanto, validar o primeiro item
        // TODO: Adicionar seletor de item em modal futuro
        setSelectedItemForValidation(items[0]);
        setShowValidationModal(true);
        return;
      }

      alert('Este orçamento não possui itens para validar');
    } catch (error) {
      console.error('Error validating project:', error);
      alert('Erro ao validar projeto');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-navy">Orçamentos</h1>
            <p className="text-slate-600 mt-1">Gerencie seus orçamentos</p>
          </div>
          <Button
            id="btn-new-quote"
            variant="primary"
            size="lg"
            className="flex items-center gap-2"
            onClick={() => navigate('/admin/quotes/new')}
          >
            <Plus className="w-5 h-5" />
            Novo Orçamento
          </Button>
        </div>

        {/* Search Bar */}
        <Card>
          <Input
            placeholder="Buscar por cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </Card>

        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-navy text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setStatusFilter('draft')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              statusFilter === 'draft'
                ? 'bg-navy text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Rascunho
          </button>
          <button
            onClick={() => setStatusFilter('sent')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              statusFilter === 'sent'
                ? 'bg-navy text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Enviado
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              statusFilter === 'approved'
                ? 'bg-navy text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Aprovado
          </button>
        </div>

        {/* Quotes List */}
        {loading ? (
          <Card>
            <p className="text-center text-slate-600 py-8">Carregando...</p>
          </Card>
        ) : filteredQuotes.length === 0 ? (
          <Card>
            <p className="text-center text-slate-600 py-8">
              {searchTerm || statusFilter !== 'all' 
                ? 'Nenhum orçamento encontrado com os filtros aplicados'
                : 'Nenhum orçamento encontrado'}
            </p>
          </Card>
        ) : (
          <div id="quote-list" className="space-y-4">
            {filteredQuotes.map((quote) => {
              const itemCount = getItemCount(quote);
              return (
                <Card key={quote.id} className="p-4 mb-4">
                  {/* Header Row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-gray-900">
                        {quote.clientName ? (
                          quote.clientName
                        ) : (
                          <span className="text-gray-500 italic">Cliente a Definir</span>
                        )}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[quote.status]}`}
                      >
                        {statusLabels[quote.status]}
                      </span>
                      <div className="relative" ref={(el) => (menuRefs.current[quote.id] = el)}>
                        <button
                          onClick={() => setOpenMenuId(openMenuId === quote.id ? null : quote.id)}
                          className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
                          aria-label="Mais opções"
                        >
                          <MoreVertical className="w-5 h-5 text-slate-600" />
                        </button>
                        {openMenuId === quote.id && (
                          <div className="absolute right-0 top-8 bg-white border border-slate-200 rounded-lg shadow-lg z-10 min-w-[160px]">
                            {quote.status === 'approved' && (
                              <button
                                onClick={() => convertToWorkOrder(quote)}
                                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 rounded-t-lg"
                              >
                                <FileText className="w-4 h-4" />
                                Criar OS
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteQuote(quote)}
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

                  {/* Content Row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Criado em {formatDate(quote.createdAt)}</span>
                      {itemCount > 0 && <span>{itemCount} {itemCount === 1 ? 'item' : 'itens'}</span>}
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      {formatCurrency(quote.total || 0)}
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleValidateProject(quote)}
                      className="flex items-center justify-center gap-2 border-purple-200 text-purple-700 hover:bg-purple-50"
                      title="Validar Projeto"
                    >
                      <Eye className="w-4 h-4" />
                      Validar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendWhatsApp(quote)}
                      className="flex items-center justify-center gap-2 border-green-200 text-green-700 hover:bg-green-50"
                      title="Enviar via WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/admin/quotes/${quote.id}`)}
                      className="flex items-center justify-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100"
                      title="Ver Detalhes"
                    >
                      <FileText className="w-4 h-4" />
                      Detalhes
                    </Button>
                  </div>
                </Card>
              );
            })}
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

        {/* Validation Modal */}
        {showValidationModal && selectedItemForValidation && (
          <ValidationModal
            isOpen={showValidationModal}
            onClose={() => {
              setShowValidationModal(false);
              setSelectedItemForValidation(null);
            }}
            item={selectedItemForValidation}
          />
        )}

        {/* Tutorial Guide */}
        <TutorialGuide
          tutorialKey="quotesSeen"
          steps={[
            {
              target: '#btn-new-quote',
              content: 'Clique aqui para criar seu primeiro orçamento profissional.',
              placement: 'bottom',
            },
            {
              target: '#quote-list',
              content: 'Seus orçamentos ficam listados aqui. Acompanhe o status de aprovação.',
              placement: 'top',
            },
          ]}
        />

        {/* Paywall Modal */}
        <PaywallModal
          isOpen={showPaywall}
          onClose={() => setShowPaywall(false)}
        />
      </div>
    </Layout>
  );
}
