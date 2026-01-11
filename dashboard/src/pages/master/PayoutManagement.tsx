import { Layout } from '../../components/Layout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DollarSign, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, getDoc, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { getTierName } from '../../utils/referralTiers';

interface PayoutRequest {
  id: string;
  companyId: string;
  amount: number;
  pixKey: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  requestedAt: any;
  paidAt?: any;
  companyName?: string;
  companyTier?: string;
  ownerName?: string;
  ownerEmail?: string;
}

export function PayoutManagement() {
  const [pendingRequests, setPendingRequests] = useState<PayoutRequest[]>([]);
  const [paidRequests, setPaidRequests] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('pending');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      
      // Load all payout requests (Master can see all, no companyId filter)
      // Try to order by requestedAt, but handle if field doesn't exist
      let snapshot;
      try {
        const requestsQuery = query(
          collection(db, 'payout_requests'),
          orderBy('requestedAt', 'desc')
        );
        snapshot = await getDocs(requestsQuery);
      } catch (orderByError: any) {
        // If orderBy fails (e.g., missing index or field), try without ordering
        console.warn('OrderBy failed, trying without order:', orderByError);
        const requestsQuery = query(collection(db, 'payout_requests'));
        snapshot = await getDocs(requestsQuery);
      }
      
      // Handle empty collection gracefully
      if (!snapshot || snapshot.empty) {
        setPendingRequests([]);
        setPaidRequests([]);
        return;
      }
      
      const requests: PayoutRequest[] = [];
      
      // Enrich with company data
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const request: PayoutRequest = {
          id: docSnap.id,
          companyId: data.companyId,
          amount: data.amount,
          pixKey: data.pixKey,
          status: data.status,
          requestedAt: data.requestedAt,
          paidAt: data.paidAt,
        };
        
        // Get company data
        try {
          const companyDoc = await getDoc(doc(db, 'companies', data.companyId));
          if (companyDoc.exists()) {
            const companyData = companyDoc.data();
            request.companyName = companyData.name || 'N/A';
            const activeReferrals = companyData.referralStats?.activeReferrals || 0;
            request.companyTier = getTierName(activeReferrals);
            
            // Get owner/user data
            const usersQuery = query(
              collection(db, 'users'),
              where('companyId', '==', data.companyId),
              where('role', '==', 'admin')
            );
            const usersSnapshot = await getDocs(usersQuery);
            if (!usersSnapshot.empty) {
              const userData = usersSnapshot.docs[0].data();
              request.ownerName = userData.name || 'N/A';
              request.ownerEmail = userData.email || 'N/A';
            }
          }
        } catch (error) {
          console.error(`Error loading company data for ${data.companyId}:`, error);
        }
        
        requests.push(request);
      }
      
      // Sort manually if orderBy failed (fallback)
      requests.sort((a, b) => {
        const dateA = a.requestedAt?.toDate?.() || a.requestedAt?.seconds ? new Date(a.requestedAt.seconds * 1000) : new Date(0);
        const dateB = b.requestedAt?.toDate?.() || b.requestedAt?.seconds ? new Date(b.requestedAt.seconds * 1000) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      
      // Separate pending and paid
      setPendingRequests(requests.filter(r => r.status === 'pending'));
      setPaidRequests(requests.filter(r => r.status === 'paid'));
    } catch (error: any) {
      console.error('Error loading payout requests:', error);
      // Only show alert for actual errors, not empty collections
      if (error.code !== 'permission-denied' && error.message) {
        alert(`Erro ao carregar solicitações de saque: ${error.message}`);
      } else if (error.code === 'permission-denied') {
        alert('Erro de permissão. Verifique as regras do Firestore.');
      } else {
        // Silent fail for empty collections
        setPendingRequests([]);
        setPaidRequests([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (request: PayoutRequest) => {
    if (!confirm(`Confirmar pagamento de R$ ${request.amount.toFixed(2)} para ${request.companyName}?`)) {
      return;
    }

    setProcessingId(request.id);
    try {
      // 1. Get company wallet
      const companyDoc = await getDoc(doc(db, 'companies', request.companyId));
      if (!companyDoc.exists()) {
        throw new Error('Empresa não encontrada');
      }

      const companyData = companyDoc.data();
      const currentAvailable = companyData.wallet?.available || 0;
      const currentTotalPaid = companyData.wallet?.totalPaid || 0;

      // 2. Validate available balance
      if (currentAvailable < request.amount) {
        alert(`Erro: Saldo disponível (R$ ${currentAvailable.toFixed(2)}) é menor que o valor solicitado (R$ ${request.amount.toFixed(2)}).`);
        return;
      }

      // 3. Update company wallet (deduct from available, add to totalPaid)
      await updateDoc(doc(db, 'companies', request.companyId), {
        'wallet.available': currentAvailable - request.amount,
        'wallet.totalPaid': currentTotalPaid + request.amount,
        updatedAt: serverTimestamp(),
      });

      // 4. Update payout request status
      await updateDoc(doc(db, 'payout_requests', request.id), {
        status: 'paid',
        paidAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      alert('Pagamento processado com sucesso!');
      await loadRequests();
    } catch (error: any) {
      console.error('Error processing payout:', error);
      alert(`Erro ao processar pagamento: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (request: PayoutRequest) => {
    if (!confirm(`Rejeitar solicitação de saque de R$ ${request.amount.toFixed(2)} de ${request.companyName}?`)) {
      return;
    }

    setProcessingId(request.id);
    try {
      await updateDoc(doc(db, 'payout_requests', request.id), {
        status: 'rejected',
        updatedAt: serverTimestamp(),
      });

      alert('Solicitação rejeitada.');
      await loadRequests();
    } catch (error: any) {
      console.error('Error rejecting payout:', error);
      alert(`Erro ao rejeitar solicitação: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    try {
      const d = date?.toDate ? date.toDate() : date?.seconds ? new Date(date.seconds * 1000) : new Date(date);
      return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'N/A';
    }
  };

  const displayRequests = filter === 'all' 
    ? [...pendingRequests, ...paidRequests]
    : filter === 'pending'
    ? pendingRequests
    : paidRequests;

  const totalPending = pendingRequests.reduce((sum, r) => sum + r.amount, 0);
  const totalPaid = paidRequests.reduce((sum, r) => sum + r.amount, 0);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-navy">Gerenciamento de Saques</h1>
          <p className="text-slate-600 mt-1">Aprove e processe solicitações de saque dos afiliados</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-yellow-500 border-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingRequests.length}</p>
                <p className="text-xs text-slate-500 mt-1">R$ {totalPending.toFixed(2)}</p>
              </div>
              <Clock className="w-12 h-12 text-yellow-500 opacity-50" />
            </div>
          </Card>

          <Card className="border-green-500 border-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Pagos</p>
                <p className="text-2xl font-bold text-green-600">{paidRequests.length}</p>
                <p className="text-xs text-slate-500 mt-1">R$ {totalPaid.toFixed(2)}</p>
              </div>
              <CheckCircle2 className="w-12 h-12 text-green-500 opacity-50" />
            </div>
          </Card>

          <Card className="border-blue-500 border-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Processado</p>
                <p className="text-2xl font-bold text-blue-600">{pendingRequests.length + paidRequests.length}</p>
                <p className="text-xs text-slate-500 mt-1">R$ {(totalPending + totalPaid).toFixed(2)}</p>
              </div>
              <DollarSign className="w-12 h-12 text-blue-500 opacity-50" />
            </div>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b border-slate-200">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 font-medium transition-colors ${
              filter === 'pending'
                ? 'border-b-2 border-navy text-navy'
                : 'text-slate-600 hover:text-navy'
            }`}
          >
            Pendentes ({pendingRequests.length})
          </button>
          <button
            onClick={() => setFilter('paid')}
            className={`px-4 py-2 font-medium transition-colors ${
              filter === 'paid'
                ? 'border-b-2 border-navy text-navy'
                : 'text-slate-600 hover:text-navy'
            }`}
          >
            Pagos ({paidRequests.length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 font-medium transition-colors ${
              filter === 'all'
                ? 'border-b-2 border-navy text-navy'
                : 'text-slate-600 hover:text-navy'
            }`}
          >
            Todos ({pendingRequests.length + paidRequests.length})
          </button>
        </div>

        {/* Requests Table */}
        <Card>
          {loading ? (
            <p className="text-center text-slate-600 py-8">Carregando solicitações...</p>
          ) : displayRequests.length === 0 ? (
            <p className="text-center text-slate-600 py-8">
              {filter === 'pending' 
                ? 'Nenhuma solicitação pendente' 
                : filter === 'paid'
                ? 'Nenhuma solicitação paga'
                : 'Nenhuma solicitação encontrada'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Empresa</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Proprietário</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Valor</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Chave PIX</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Tier</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Data Solicitação</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {displayRequests.map((request) => {
                    const statusMap = {
                      pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
                      approved: { label: 'Aprovado', color: 'bg-blue-100 text-blue-800' },
                      paid: { label: 'Pago', color: 'bg-green-100 text-green-800' },
                      rejected: { label: 'Rejeitado', color: 'bg-red-100 text-red-800' },
                    };
                    const statusInfo = statusMap[request.status] || statusMap.pending;

                    return (
                      <tr key={request.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <div className="font-medium text-navy">{request.companyName || 'N/A'}</div>
                          <div className="text-xs text-slate-500">{request.ownerEmail || 'N/A'}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-slate-700">{request.ownerName || 'N/A'}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-navy">R$ {request.amount.toFixed(2).replace('.', ',')}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-slate-700 font-mono">{request.pixKey}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-navy-100 text-navy-700 rounded text-xs font-medium capitalize">
                            {request.companyTier || 'N/A'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-slate-600">{formatDate(request.requestedAt)}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {request.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleMarkAsPaid(request)}
                                disabled={processingId === request.id}
                                className="flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                {processingId === request.id ? 'Processando...' : 'Marcar como Pago'}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReject(request)}
                                disabled={processingId === request.id}
                                className="flex items-center gap-1 border-red-600 text-red-600 hover:bg-red-50"
                              >
                                <XCircle className="w-4 h-4" />
                                Rejeitar
                              </Button>
                            </div>
                          )}
                          {request.status === 'paid' && request.paidAt && (
                            <div className="text-xs text-slate-500">
                              Pago em: {formatDate(request.paidAt)}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}
