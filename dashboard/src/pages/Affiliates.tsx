import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Copy, CheckCircle2, TrendingUp, Wallet, DollarSign, Gift, Users, Network, MessageCircle, User, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCompany } from '../hooks/useCompany';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, query, where, getDocs, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PayoutSettingsForm } from '../components/PayoutSettingsForm';
import { ReferralLedgerEntry } from '../utils/referralCommission';

interface NetworkStats {
  tier1Count: number;
  tier2Count: number;
  tier3Count: number;
  totalNetwork: number;
}

interface DirectReferral {
  uid: string;
  name: string;
  email: string;
  joinDate: any;
  companyId: string | null;
  level: 1 | 2 | 3;
  monthlyCommission?: number;
}

export function Affiliates() {
  const { company, loading } = useCompany();
  const { userMetadata, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'pitch' | 'network'>('pitch');
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
  const [commissionHistory, setCommissionHistory] = useState<ReferralLedgerEntry[]>([]);
  const [loadingCommissions, setLoadingCommissions] = useState(false);
  const [networkData, setNetworkData] = useState<{ stats: NetworkStats; directReferrals: DirectReferral[] } | null>(null);
  const [loadingNetwork, setLoadingNetwork] = useState(false);
  const [networkFilter, setNetworkFilter] = useState<'all' | '1' | '2' | '3'>('all');

  useEffect(() => {
    if (company?.id) {
      loadWithdrawHistory();
      loadCommissionHistory();
    }
  }, [company?.id]);

  useEffect(() => {
    if (user && activeTab === 'network') {
      loadNetworkData();
    }
  }, [user, activeTab]);

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

  const loadCommissionHistory = async () => {
    if (!company?.id) return;
    
    setLoadingCommissions(true);
    try {
      // Query without orderBy first to avoid index requirement
      // We'll sort in memory instead
      const commissionsQuery = query(
        collection(db, 'referral_ledger'),
        where('referrerId', '==', company.id),
        limit(100)
      );
      const snapshot = await getDocs(commissionsQuery);
      const commissions = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ReferralLedgerEntry[];
      
      // Sort by createdAt descending in memory
      commissions.sort((a, b) => {
        const dateA = a.createdAt?.toDate 
          ? a.createdAt.toDate().getTime()
          : a.createdAt?.seconds
          ? a.createdAt.seconds * 1000
          : 0;
        const dateB = b.createdAt?.toDate 
          ? b.createdAt.toDate().getTime()
          : b.createdAt?.seconds
          ? b.createdAt.seconds * 1000
          : 0;
        return dateB - dateA;
      });
      
      setCommissionHistory(commissions.slice(0, 50)); // Limit to 50 most recent
    } catch (error) {
      console.error('Error loading commission history:', error);
    } finally {
      setLoadingCommissions(false);
    }
  };

  const loadNetworkData = async () => {
    if (!user) return;

    setLoadingNetwork(true);
    try {
      const token = await user.getIdToken();

      const response = await fetch(`${window.location.origin}/api/affiliate/network`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${response.status}`);
      }

      const data = await response.json();
      setNetworkData(data);
    } catch (err: any) {
      console.error('Error loading network data:', err);
    } finally {
      setLoadingNetwork(false);
    }
  };


  const handleRequestWithdraw = async () => {
    if (!company) return;
    
    const available = company.wallet?.available || 0;
    if (available < 50) {
      alert('Saldo mínimo para saque é R$ 50,00');
      return;
    }

    // Check if user has payout info
    if (!userMetadata?.payoutInfo?.pixKey) {
      alert('Por favor, configure seus dados bancários antes de solicitar um saque.');
      setShowPayoutSettingsModal(true);
      return;
    }

    setRequestingWithdraw(true);
    try {
      // Create payout request with payout info copied from user metadata
      const payoutRequestData: any = {
        companyId: company.id,
        amount: available,
        pixKey: userMetadata.payoutInfo.pixKey,
        status: 'pending',
        requestedAt: serverTimestamp(),
      };

      // Copy payout info to the request document
      if (userMetadata.payoutInfo) {
        payoutRequestData.payoutInfo = {
          pixKey: userMetadata.payoutInfo.pixKey,
          pixKeyType: userMetadata.payoutInfo.pixKeyType || '',
          bankName: userMetadata.payoutInfo.bankName || '',
          agency: userMetadata.payoutInfo.agency || '',
          accountNumber: userMetadata.payoutInfo.accountNumber || '',
          accountType: userMetadata.payoutInfo.accountType || '',
          holderName: userMetadata.payoutInfo.holderName || '',
          holderCpf: userMetadata.payoutInfo.holderCpf || '',
        };
      }

      await addDoc(collection(db, 'payout_requests'), payoutRequestData);
      
      alert('Solicitação de saque enviada com sucesso! Nossa equipe irá processar em breve.');
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

  const available = company.wallet?.available || 0;
  const totalEarnings = company.referralStats?.totalEarnings || 0;
  const canWithdraw = available >= 50;

  // Calculate earnings by level
  const earningsByLevel = {
    level1: commissionHistory.filter(c => String(c.tier) === '1').reduce((sum, c) => sum + c.amount, 0),
    level2: commissionHistory.filter(c => String(c.tier) === '2').reduce((sum, c) => sum + c.amount, 0),
    level3: commissionHistory.filter(c => String(c.tier) === '3').reduce((sum, c) => sum + c.amount, 0),
  };

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return 'Data não disponível';
    try {
      const date = timestamp.toDate 
        ? timestamp.toDate() 
        : timestamp.seconds
        ? new Date(timestamp.seconds * 1000)
        : new Date(timestamp);
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return 'Data inválida';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleCopyLink = async () => {
    if (!company?.affiliateCode) return;
    const referralLink = `${window.location.origin}/signup?ref=${company.affiliateCode}`;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying link:', error);
      alert('Erro ao copiar link. Tente novamente.');
    }
  };

  const handleWhatsAppShare = () => {
    if (!company?.affiliateCode) return;
    const referralLink = `${window.location.origin}/signup?ref=${company.affiliateCode}`;
    const message = `Olá! Conheça o Gestor Vítreo, o sistema completo para gestão de vidraçarias e serralherias. Use meu código de indicação e ganhe 15% de desconto: ${referralLink}`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?text=${encodedMessage}`, '_blank');
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-navy">Indique e Ganhe</h1>
          <p className="text-slate-600 mt-1">Compartilhe seu código e ganhe comissões recorrentes em 3 níveis</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-4">
            <button
              onClick={() => setActiveTab('pitch')}
              className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'pitch'
                  ? 'border-navy text-navy'
                  : 'border-transparent text-slate-600 hover:text-navy'
              }`}
            >
              Painel de Indicação
            </button>
            <button
              onClick={() => setActiveTab('network')}
              className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'network'
                  ? 'border-navy text-navy'
                  : 'border-transparent text-slate-600 hover:text-navy'
              }`}
            >
              Minha Rede & Ganhos
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'pitch' ? (
          <>

            {/* Tab 1: Painel de Indicação */}
            {/* Header Section - Your Link */}
            <Card>
              <h2 className="text-2xl font-bold text-navy mb-4">Indique e Lucre Recorrente</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Seu Link de Indicação</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={company.affiliateCode ? `${window.location.origin}/signup?ref=${company.affiliateCode}` : 'Não disponível'}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      onClick={handleCopyLink}
                      className="flex items-center gap-2"
                    >
                      {copied ? (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-5 h-5" />
                          Copiar Código
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <Button
                  variant="primary"
                  onClick={handleWhatsAppShare}
                  className="w-full md:w-auto bg-green-600 hover:bg-green-700 flex items-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Enviar no WhatsApp
                </Button>
              </div>
            </Card>

            {/* Rules Section - 3-Level Cards */}
            <Card>
              <h3 className="text-xl font-bold text-navy mb-6">Como você ganha</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Level 1 Card */}
                <Card className="border-2 border-blue-200 bg-blue-50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-900">Diretos</h4>
                      <p className="text-2xl font-bold text-blue-700">15%</p>
                    </div>
                  </div>
                  <p className="text-sm text-blue-800">Sobre seus amigos diretos</p>
                </Card>

                {/* Level 2 Card */}
                <Card className="border-2 border-purple-200 bg-purple-50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-purple-900">Indiretos</h4>
                      <p className="text-2xl font-bold text-purple-700">8%</p>
                    </div>
                  </div>
                  <p className="text-sm text-purple-800">Amigos dos seus amigos</p>
                </Card>

                {/* Level 3 Card */}
                <Card className="border-2 border-green-200 bg-green-50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center">
                      <Network className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-green-900">Rede</h4>
                      <p className="text-2xl font-bold text-green-700">2%</p>
                    </div>
                  </div>
                  <p className="text-sm text-green-800">A 3ª camada de indicação</p>
                </Card>
              </div>
              <div className="mt-6 p-4 bg-navy-50 rounded-lg border border-navy-200">
                <p className="text-sm text-navy-800 text-center">
                  💰 <strong>Construa sua aposentadoria com o sistema.</strong> Ganhe comissões recorrentes mensais enquanto sua rede cresce!
                </p>
              </div>
            </Card>
          </>
        ) : (
          <>
            {/* Tab 2: Minha Rede & Ganhos */}
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-green-500 border-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                    <h3 className="font-semibold text-slate-700">Total Ganho</h3>
                  </div>
                </div>
                <p className="text-3xl font-bold text-green-600 mb-1">
                  {formatCurrency(totalEarnings)}
                </p>
                <p className="text-xs text-slate-500">
                  L1: {formatCurrency(earningsByLevel.level1)} • L2: {formatCurrency(earningsByLevel.level2)} • L3: {formatCurrency(earningsByLevel.level3)}
                </p>
              </Card>

              <Card className="border-blue-500 border-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-6 h-6 text-blue-600" />
                    <h3 className="font-semibold text-slate-700">Rede Ativa</h3>
                  </div>
                </div>
                <p className="text-3xl font-bold text-blue-600 mb-1">
                  {networkData?.stats.totalNetwork || 0}
                </p>
                <p className="text-xs text-slate-500">Usuários com assinatura ativa</p>
              </Card>

              <Card className="border-purple-500 border-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-6 h-6 text-purple-600" />
                    <h3 className="font-semibold text-slate-700">Saldo Disponível</h3>
                  </div>
                </div>
                <p className="text-3xl font-bold text-purple-600 mb-1">
                  {formatCurrency(available)}
                </p>
                <div className="mt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      if (!userMetadata?.payoutInfo?.pixKey) {
                        setShowPayoutSettingsModal(true);
                      } else {
                        handleRequestWithdraw();
                      }
                    }}
                    disabled={!canWithdraw || requestingWithdraw}
                    className="w-full"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Solicitar Saque
                  </Button>
                </div>
              </Card>
            </div>

            {/* Network List with Filters */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-navy">Minha Rede</h2>
                {/* Filters */}
                <div className="flex gap-2">
                  {(['all', '1', '2', '3'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setNetworkFilter(filter)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        networkFilter === filter
                          ? 'bg-navy text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {filter === 'all' ? 'Todos' : `Nível ${filter}`}
                    </button>
                  ))}
                </div>
              </div>

              {loadingNetwork ? (
                <p className="text-center text-slate-600 py-4">Carregando rede...</p>
              ) : !networkData || networkData.directReferrals.length === 0 ? (
                <div className="text-center py-12">
                  <Network className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 mb-2 font-medium">Você ainda não tem indicações</p>
                  <p className="text-sm text-slate-500">
                    Compartilhe seu link de indicação para começar a construir sua rede!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {networkData.directReferrals
                    .filter((ref) => networkFilter === 'all' || String(ref.level) === networkFilter)
                    .map((referral) => {
                      const levelConfig = {
                        1: { label: 'Nível 1 - 15%', color: 'bg-blue-100 text-blue-800', icon: User },
                        2: { label: 'Nível 2 - 8%', color: 'bg-purple-100 text-purple-800', icon: Users },
                        3: { label: 'Nível 3 - 2%', color: 'bg-green-100 text-green-800', icon: Network },
                      }[referral.level] || { label: 'Nível Desconhecido', color: 'bg-gray-100 text-gray-800', icon: User };
                      
                      return (
                        <div
                          key={referral.uid}
                          className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-600 font-semibold text-sm">
                                {referral.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-slate-900">{referral.name}</p>
                              <p className="text-xs text-slate-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Desde {formatDate(referral.joinDate)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${levelConfig.color}`}>
                              {levelConfig.label}
                            </span>
                            {referral.monthlyCommission && (
                              <span className="font-semibold text-navy">
                                {formatCurrency(referral.monthlyCommission)}/mês
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </Card>

            {/* Commission History */}
            <Card>
          <h2 className="text-xl font-bold text-navy mb-4">Histórico de Comissões</h2>
          {loadingCommissions ? (
            <p className="text-center text-slate-600 py-4">Carregando comissões...</p>
          ) : commissionHistory.length === 0 ? (
            <p className="text-center text-slate-600 py-4">Nenhuma comissão registrada ainda.</p>
          ) : (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Minhas Vendas (Tier 1) */}
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-green-800">Minhas Vendas (Nível 1)</h3>
                  </div>
                  <p className="text-2xl font-bold text-green-700">
                    R$ {commissionHistory
                      .filter(c => String(c.tier) === '1')
                      .reduce((sum, c) => sum + c.amount, 0)
                      .toFixed(2)
                      .replace('.', ',')}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {commissionHistory.filter(c => String(c.tier) === '1').length} comissão{commissionHistory.filter(c => String(c.tier) === '1').length !== 1 ? 'ões' : ''} • 15% por venda
                  </p>
                </div>

                {/* Vendas da Rede (Tier 2 & 3) */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Network className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-800">Vendas da Rede (Níveis 2 & 3)</h3>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">
                    R$ {commissionHistory
                      .filter(c => String(c.tier) === '2' || String(c.tier) === '3')
                      .reduce((sum, c) => sum + c.amount, 0)
                      .toFixed(2)
                      .replace('.', ',')}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {commissionHistory.filter(c => String(c.tier) === '2' || String(c.tier) === '3').length} comissão{commissionHistory.filter(c => String(c.tier) === '2' || String(c.tier) === '3').length !== 1 ? 'ões' : ''} • 8% (N2) + 2% (N3)
                  </p>
                </div>
              </div>

              {/* Commission List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {commissionHistory.map((commission) => {
                  const tierStr = String(commission.tier);
                  const isTier1 = tierStr === '1';
                  const isTier2 = tierStr === '2';
                  const isTier3 = tierStr === '3';
                  
                  const tierConfig = isTier1 
                    ? { label: 'Nível 1', color: 'bg-green-100 text-green-800', icon: Users }
                    : isTier2
                    ? { label: 'Nível 2', color: 'bg-blue-100 text-blue-800', icon: Network }
                    : isTier3
                    ? { label: 'Nível 3', color: 'bg-purple-100 text-purple-800', icon: Network }
                    : { label: commission.tierLabel || commission.tier, color: 'bg-slate-100 text-slate-800', icon: Gift };
                  
                  const statusMap = {
                    pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
                    released: { label: 'Disponível', color: 'bg-green-100 text-green-800' },
                    paid: { label: 'Pago', color: 'bg-blue-100 text-blue-800' },
                  };
                  const statusInfo = statusMap[commission.status] || statusMap.pending;
                  
                  const createdDate = commission.createdAt?.toDate 
                    ? commission.createdAt.toDate() 
                    : commission.createdAt?.seconds
                    ? new Date(commission.createdAt.seconds * 1000)
                    : new Date(commission.createdAt);

                  return (
                    <div
                      key={commission.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${tierConfig.color}`}>
                            {tierConfig.label}
                          </span>
                          {commission.tierLabel && (
                            <span className="text-xs text-slate-600">{commission.tierLabel}</span>
                          )}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-navy">
                            R$ {commission.amount.toFixed(2).replace('.', ',')}
                          </span>
                          <span className="text-xs text-slate-500">
                            de R$ {commission.paymentAmount.toFixed(2).replace('.', ',')} ({commission.commissionPercent.toFixed(1)}%)
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {createdDate.toLocaleDateString('pt-BR')} às {createdDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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
                              {formatCurrency(request.amount)}
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
          </>
        )}
      </div>

      {/* Payout Settings Modal */}
      {showPayoutSettingsModal && (
        <PayoutSettingsForm
          onClose={() => setShowPayoutSettingsModal(false)}
          onSave={() => {
            setShowPayoutSettingsModal(false);
          }}
        />
      )}
    </Layout>
  );
}
