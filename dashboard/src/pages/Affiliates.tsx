import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Copy, CheckCircle2, TrendingUp, Wallet, Clock, DollarSign, Gift } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCompany } from '../hooks/useCompany';
import { REFERRAL_TIERS, getTierForReferrals } from '../utils/referralTiers';
import { collection, addDoc, query, where, getDocs, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { X } from 'lucide-react';

export function Affiliates() {
  const { company, loading } = useCompany();
  const { userMetadata } = useAuth();
  const [copied, setCopied] = useState(false);
  const [showPayoutSettingsModal, setShowPayoutSettingsModal] = useState(false);
  const [requestingWithdraw, setRequestingWithdraw] = useState(false);
  const [withdrawHistory, setWithdrawHistory] = useState<Array<{
    id: string;
    amount: number;
    pixKey: string;
    status: 'pending' | 'approved' | 'paid' | 'rejected';
    requestedAt: any;
    paidAt?: any;
  }>>([]);

  useEffect(() => {
    if (company?.id) {
      loadWithdrawHistory();
    }
  }, [company?.id]);

  const loadWithdrawHistory = async () => {
    if (!company?.id) return;
    
    try {
      const requestsQuery = query(
        collection(db, 'payout_requests'),
        where('companyId', '==', company.id),
        orderBy('requestedAt', 'desc'),
        limit(10)
      );
      const snapshot = await getDocs(requestsQuery);
      const history = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Array<{
        id: string;
        amount: number;
        pixKey: string;
        status: 'pending' | 'approved' | 'paid' | 'rejected';
        requestedAt: any;
        paidAt?: any;
      }>;
      setWithdrawHistory(history);
    } catch (error) {
      console.error('Error loading withdraw history:', error);
    }
  };

  const handleCopyCode = async () => {
    if (!company?.affiliateCode) return;
    
    try {
      await navigator.clipboard.writeText(company.affiliateCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying code:', error);
      alert('Erro ao copiar código. Tente novamente.');
    }
  };

  const handleRequestWithdraw = async () => {
    if (!company) return;
    
    const available = company.wallet?.available || 0;
    if (available < 50) {
      alert('Saldo mínimo para saque é R$ 50,00');
      return;
    }

    if (!pixKey || pixKey.trim() === '') {
      alert('Por favor, informe sua chave PIX');
      return;
    }

    setRequestingWithdraw(true);
    try {
      // Create payout request
      await addDoc(collection(db, 'payout_requests'), {
        companyId: company.id,
        amount: available,
        pixKey: pixKey.trim(),
        status: 'pending',
        requestedAt: serverTimestamp(),
      });
      
      alert('Solicitação de saque enviada com sucesso! Nossa equipe irá processar em breve.');
      setShowWithdrawModal(false);
      setPixKey('');
      await loadWithdrawHistory();
      
      // Reload company to refresh wallet data
      // Note: The wallet.available will be updated by admin when processing the payout
    } catch (error: any) {
      console.error('Error requesting withdraw:', error);
      alert(`Erro ao solicitar saque: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setRequestingWithdraw(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <Card>
          <p className="text-center text-slate-600 py-8">Carregando dados do afiliado...</p>
        </Card>
      </Layout>
    );
  }

  if (!company) {
    return (
      <Layout>
        <Card>
          <p className="text-center text-slate-600 py-8">Erro ao carregar dados da empresa</p>
        </Card>
      </Layout>
    );
  }

  const activeReferrals = company.referralStats?.activeReferrals || 0;
  const currentTier = getTierForReferrals(activeReferrals);
  const nextTier = REFERRAL_TIERS.find(tier => tier.minReferrals > activeReferrals);
  const referralsNeeded = nextTier ? nextTier.minReferrals - activeReferrals : 0;
  
  const available = company.wallet?.available || 0;
  const pending = company.wallet?.pending || 0;
  const totalEarnings = company.referralStats?.totalEarnings || 0;
  const canWithdraw = available >= 50;

  // Calculate progress to next tier (0-100%)
  const progressToNextTier = nextTier 
    ? Math.min(100, ((activeReferrals - currentTier.minReferrals) / (nextTier.minReferrals - currentTier.minReferrals)) * 100)
    : 100;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-navy">Indique e Ganhe</h1>
          <p className="text-slate-600 mt-1">Compartilhe seu código e ganhe comissões por cada indicação</p>
        </div>

        {/* Hero Section - Affiliate Code */}
        <Card className="bg-gradient-to-r from-navy to-navy-800 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-2">Seu Código de Indicação</h2>
              <div className="flex items-center gap-3">
                <code className="text-3xl font-mono font-bold bg-white/20 px-4 py-2 rounded-lg">
                  {company.affiliateCode || 'Não disponível'}
                </code>
                <Button
                  variant="outline"
                  onClick={handleCopyCode}
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5 mr-2" />
                      Copiar
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-navy-200 mt-3">
                Compartilhe este código com seus conhecidos. Eles ganham 15% de desconto e você ganha comissão!
              </p>
            </div>
            <Gift className="w-24 h-24 text-navy-200 opacity-50" />
          </div>
        </Card>

        {/* Tier Progress Bar */}
        <Card>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-navy">Seu Nível</h2>
              <span className="px-3 py-1 bg-navy text-white rounded-full font-semibold">
                {currentTier.label} ({currentTier.commissionPercent}%)
              </span>
            </div>
            {nextTier && (
              <p className="text-slate-600 text-sm">
                Faltam <strong>{referralsNeeded}</strong> indicação{referralsNeeded > 1 ? 'ões' : ''} para você alcançar o nível <strong>{nextTier.label}</strong> e ganhar <strong>{nextTier.commissionPercent}%</strong> de comissão!
              </p>
            )}
            {!nextTier && (
              <p className="text-slate-600 text-sm">
                🎉 Parabéns! Você alcançou o nível máximo ({currentTier.label}) com {currentTier.commissionPercent}% de comissão!
              </p>
            )}
          </div>
          {nextTier && (
            <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-navy to-navy-600 h-4 rounded-full transition-all duration-500 flex items-center justify-center"
                style={{ width: `${progressToNextTier}%` }}
              >
                {progressToNextTier > 15 && (
                  <span className="text-xs font-semibold text-white">
                    {activeReferrals} / {nextTier.minReferrals}
                  </span>
                )}
              </div>
            </div>
          )}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            {REFERRAL_TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`p-3 rounded-lg border-2 ${
                  tier.name === currentTier.name
                    ? 'border-navy bg-navy-50'
                    : activeReferrals >= tier.minReferrals
                    ? 'border-green-300 bg-green-50'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div className="text-xs font-semibold text-slate-600 mb-1">{tier.label}</div>
                <div className="text-lg font-bold text-navy">{tier.commissionPercent}%</div>
                <div className="text-xs text-slate-500 mt-1">
                  {tier.minReferrals}-{tier.maxReferrals || '∞'} indicações
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Wallet Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Available Balance */}
          <Card className="border-green-500 border-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Wallet className="w-6 h-6 text-green-600" />
                <h3 className="font-semibold text-slate-700">Saldo Disponível</h3>
              </div>
            </div>
            <p className="text-3xl font-bold text-green-600 mb-1">
              R$ {available.toFixed(2).replace('.', ',')}
            </p>
            <p className="text-xs text-slate-500">Pronto para saque</p>
          </Card>

          {/* Pending Balance */}
          <Card className="border-yellow-500 border-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-6 h-6 text-yellow-600" />
                <h3 className="font-semibold text-slate-700">Saldo Pendente</h3>
              </div>
            </div>
            <p className="text-3xl font-bold text-yellow-600 mb-1">
              R$ {pending.toFixed(2).replace('.', ',')}
            </p>
            <p className="text-xs text-slate-500">Libera em 30 dias</p>
          </Card>

          {/* Total Earnings */}
          <Card className="border-blue-500 border-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                <h3 className="font-semibold text-slate-700">Total Ganho</h3>
              </div>
            </div>
            <p className="text-3xl font-bold text-blue-600 mb-1">
              R$ {totalEarnings.toFixed(2).replace('.', ',')}
            </p>
            <p className="text-xs text-slate-500">Lifetime</p>
          </Card>
        </div>

        {/* Withdrawal Section */}
        <Card>
          <h2 className="text-xl font-bold text-navy mb-4">Solicitar Saque</h2>
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-700 mb-2">
                <strong>Saldo mínimo para saque:</strong> R$ 50,00
              </p>
              <p className="text-xs text-slate-500">
                O saque será processado via PIX em até 5 dias úteis após a aprovação.
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={() => setShowWithdrawModal(true)}
              disabled={!canWithdraw}
              className="w-full md:w-auto"
            >
              <DollarSign className="w-5 h-5 mr-2" />
              {canWithdraw ? 'Solicitar Saque' : `Saldo mínimo: R$ 50,00 (disponível: R$ ${available.toFixed(2)})`}
            </Button>
          </div>
        </Card>

        {/* Withdrawal History */}
        {withdrawHistory.length > 0 && (
          <Card>
            <h2 className="text-xl font-bold text-navy mb-4">Histórico de Saques</h2>
            <div className="space-y-3">
              {withdrawHistory.map((request) => {
                const statusMap = {
                  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
                  approved: { label: 'Aprovado', color: 'bg-blue-100 text-blue-800' },
                  paid: { label: 'Pago', color: 'bg-green-100 text-green-800' },
                  rejected: { label: 'Rejeitado', color: 'bg-red-100 text-red-800' },
                };
                const statusInfo = statusMap[request.status] || statusMap.pending;
                const requestedDate = request.requestedAt?.toDate 
                  ? request.requestedAt.toDate() 
                  : request.requestedAt?.seconds
                  ? new Date(request.requestedAt.seconds * 1000)
                  : new Date(request.requestedAt);

                return (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-semibold text-navy">
                          R$ {request.amount.toFixed(2).replace('.', ',')}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        PIX: {request.pixKey.substring(0, 20)}...
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Solicitado em {requestedDate.toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-navy">Solicitar Saque</h2>
              <button
                onClick={() => {
                  setShowWithdrawModal(false);
                  setPixKey('');
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>Valor disponível para saque:</strong>
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  R$ {available.toFixed(2).replace('.', ',')}
                </p>
              </div>

              <Input
                label="Chave PIX *"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder="CPF, email, telefone ou chave aleatória"
                required
              />

              <p className="text-xs text-slate-500">
                Certifique-se de que a chave PIX está correta. O pagamento será processado em até 5 dias úteis após a aprovação.
              </p>

              <div className="flex gap-4 pt-4">
                <Button
                  variant="primary"
                  onClick={handleRequestWithdraw}
                  disabled={requestingWithdraw || !pixKey.trim() || available < 50}
                  className="flex-1"
                >
                  {requestingWithdraw ? 'Enviando...' : 'Confirmar Saque'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowWithdrawModal(false);
                    setPixKey('');
                  }}
                  className="flex-1"
                  disabled={requestingWithdraw}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </Layout>
  );
}
