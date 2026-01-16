import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { FileText, Users, ClipboardList, Plus, DollarSign, TrendingUp, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getDocs, query, orderBy, limit } from 'firebase/firestore';
import { queryWithCompanyId } from '../lib/queries';
import { useAuth } from '../contexts/AuthContext';
import { maturePendingCommissions } from '../utils/referralCommission';
import { TutorialGuide } from '../components/TutorialGuide';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { roundCurrency } from '../lib/utils';
import { useSecurityGate } from '../hooks/useSecurityGate';
import { PaywallModal } from '../components/PaywallModal';

interface ActivityItem {
  id: string;
  type: 'quote' | 'workOrder';
  title: string;
  updatedAt: any;
  status?: string;
}

export function Dashboard() {
  const { userMetadata } = useAuth();
  const companyId = userMetadata?.companyId;
  const navigate = useNavigate();
  const { verifyGate, PhoneVerificationModalComponent } = useSecurityGate();
  const [showPaywall, setShowPaywall] = useState(false);
  const [stats, setStats] = useState({
    openQuotes: 0,
    monthlyRevenue: 0,
    activeWorkOrders: 0,
    averageTicket: 0,
    conversionRate: 0,
  });
  const [chartData, setChartData] = useState<Array<{ date: string; revenue: number }>>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    if (companyId) {
      loadDashboardStats();
      loadChartData();
      loadRecentActivity();
    }
  }, [companyId]);

  // Mature pending commissions on dashboard load (runs once per session)
  useEffect(() => {
    let hasRun = false;
    const runMaturation = async () => {
      if (hasRun) return;
      hasRun = true;
      try {
        // Only run for admin users (those who can have referrals)
        if (userMetadata?.role === 'admin') {
          await maturePendingCommissions();
        }
      } catch (error) {
        console.error('Error maturing commissions (non-blocking):', error);
        // Don't block dashboard load if maturation fails
      }
    };
    
    // Small delay to not block initial render
    const timer = setTimeout(runMaturation, 2000);
    return () => clearTimeout(timer);
  }, [userMetadata?.role]);

  const loadDashboardStats = async () => {
    if (!companyId) return;
    
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      // Load quotes
      const quotesQuery = queryWithCompanyId('quotes', companyId);
      const quotesSnapshot = await getDocs(quotesQuery);
      const quotes = quotesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Array<{ id: string; status?: string; total?: number }>;

      const openQuotes = quotes.filter((q) => q.status === 'draft' || q.status === 'sent').length;
      const approvedQuotes = quotes.filter((q) => q.status === 'approved').length;
      const totalQuotes = quotes.length;
      const conversionRate = totalQuotes > 0 ? (approvedQuotes / totalQuotes) * 100 : 0;

      // Load completed work orders for current month
      const workOrdersQuery = queryWithCompanyId('workOrders', companyId);
      const workOrdersSnapshot = await getDocs(workOrdersQuery);
      const workOrders = workOrdersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Array<{ 
        id: string; 
        status?: string; 
        quoteId?: string; 
        total?: number; 
        completedDate?: any; 
        createdAt?: any 
      }>;

      const activeWorkOrders = workOrders.filter(
        (wo) => wo.status === 'scheduled' || wo.status === 'in-progress'
      ).length;

      // Get completed OS from current month
      const completedThisMonth = workOrders.filter((wo) => {
        if (wo.status !== 'completed') return false;
        const completedDate = wo.completedDate ? new Date(wo.completedDate) : wo.createdAt?.toDate();
        if (!completedDate) return false;
        return completedDate >= startOfMonth && completedDate <= endOfMonth;
      });

      // Calculate monthly revenue from completed OS
      let monthlyRevenue = 0;
      for (const os of completedThisMonth) {
        if (os.quoteId) {
          const quote = quotes.find((q) => q.id === os.quoteId);
          if (quote && quote.total) {
            monthlyRevenue = roundCurrency(monthlyRevenue + (quote.total || 0));
          }
        } else if (os.total) {
          monthlyRevenue = roundCurrency(monthlyRevenue + os.total);
        }
      }

      const averageTicket = completedThisMonth.length > 0 ? roundCurrency(monthlyRevenue / completedThisMonth.length) : 0;

      setStats({
        openQuotes,
        monthlyRevenue,
        activeWorkOrders,
        averageTicket,
        conversionRate,
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  };

  const loadChartData = async () => {
    if (!companyId) return;

    try {
      // Generate last 30 days of data
      const data: Array<{ date: string; revenue: number }> = [];
      const now = new Date();
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
        
        // Mock revenue data (in real app, aggregate from work orders/quotes)
        // For now, generate random data between 0 and 2000
        const revenue = Math.random() * 2000;
        data.push({ date: dateStr, revenue: roundCurrency(revenue) });
      }
      
      setChartData(data);
    } catch (error) {
      console.error('Error loading chart data:', error);
    }
  };

  const loadRecentActivity = async () => {
    if (!companyId) return;

    try {
      const activities: ActivityItem[] = [];

      // Load recent quotes
      const quotesQuery = query(
        queryWithCompanyId('quotes', companyId),
        orderBy('updatedAt', 'desc'),
        limit(3)
      );
      const quotesSnapshot = await getDocs(quotesQuery);
      quotesSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        activities.push({
          id: doc.id,
          type: 'quote',
          title: `Orçamento ${data.clientName || 'Sem nome'}`,
          updatedAt: data.updatedAt,
          status: data.status,
        });
      });

      // Load recent work orders
      const workOrdersQuery = query(
        queryWithCompanyId('workOrders', companyId),
        orderBy('updatedAt', 'desc'),
        limit(3)
      );
      const workOrdersSnapshot = await getDocs(workOrdersQuery);
      workOrdersSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        activities.push({
          id: doc.id,
          type: 'workOrder',
          title: `OS ${data.clientName || 'Sem nome'}`,
          updatedAt: data.updatedAt,
          status: data.status,
        });
      });

      // Sort by updatedAt and take top 3
      activities.sort((a, b) => {
        const aTime = a.updatedAt?.toDate?.() || a.updatedAt || new Date(0);
        const bTime = b.updatedAt?.toDate?.() || b.updatedAt || new Date(0);
        return bTime.getTime() - aTime.getTime();
      });

      setRecentActivity(activities.slice(0, 3));
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'Há muito tempo';
    
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `Há ${diffMins}min`;
    if (diffHours < 24) return `Há ${diffHours}h`;
    if (diffDays < 7) return `Há ${diffDays}d`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const handleStatCardDoubleClick = (route: string) => {
    navigate(route);
  };

  const handleActivityClick = (item: ActivityItem) => {
    if (item.type === 'quote') {
      navigate(`/admin/quotes/${item.id}`);
    } else {
      navigate(`/admin/work-orders/${item.id}`);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-navy">Dashboard</h1>
            <p className="text-slate-600 mt-1">Visão geral do seu negócio</p>
          </div>
        </div>

        {/* Stats Grid with Double-Click Navigation */}
        <div id="kpi-summary" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div
            className="select-none cursor-pointer"
            onDoubleClick={() => handleStatCardDoubleClick('/admin/quotes?status=pending')}
            title="Toque 2x para ver orçamentos abertos"
          >
            <Card className="active:scale-95 transition-transform">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Orçamentos Abertos</p>
                  <p className="text-3xl font-bold text-navy">{stats.openQuotes}</p>
                  <p className="text-xs text-slate-400 mt-1">Toque 2x para ver</p>
                </div>
                <div className="bg-blue-100 rounded-full p-3">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </Card>
          </div>

          <div
            className="select-none cursor-pointer"
            onDoubleClick={() => handleStatCardDoubleClick('/admin/finance')}
            title="Toque 2x para ver detalhes financeiros"
          >
            <Card className="active:scale-95 transition-transform">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Total Faturado (Mês)</p>
                  <p className="text-3xl font-bold text-navy">{formatCurrency(stats.monthlyRevenue)}</p>
                  <p className="text-xs text-slate-400 mt-1">Toque 2x para ver</p>
                </div>
                <div className="bg-gold-100 rounded-full p-3">
                  <DollarSign className="w-8 h-8 text-gold-600" />
                </div>
              </div>
            </Card>
          </div>

          <div
            className="select-none cursor-pointer"
            onDoubleClick={() => handleStatCardDoubleClick('/admin/finance')}
            title="Toque 2x para ver detalhes financeiros"
          >
            <Card className="active:scale-95 transition-transform">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Ticket Médio</p>
                  <p className="text-3xl font-bold text-navy">{formatCurrency(stats.averageTicket)}</p>
                  <p className="text-xs text-slate-400 mt-1">Toque 2x para ver</p>
                </div>
                <div className="bg-purple-100 rounded-full p-3">
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Taxa de Conversão</p>
                <p className="text-3xl font-bold text-navy">{stats.conversionRate.toFixed(1)}%</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </Card>

          <div
            className="select-none cursor-pointer"
            onDoubleClick={() => handleStatCardDoubleClick('/admin/work-orders?status=in-progress')}
            title="Toque 2x para ver OS em andamento"
          >
            <Card className="active:scale-95 transition-transform">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">OS em Andamento</p>
                  <p className="text-3xl font-bold text-navy">{stats.activeWorkOrders}</p>
                  <p className="text-xs text-slate-400 mt-1">Toque 2x para ver</p>
                </div>
                <div className="bg-orange-100 rounded-full p-3">
                  <ClipboardList className="w-8 h-8 text-orange-600" />
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Financial Overview Card */}
        <Card className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <p className="text-sm text-gray-500 mb-2">Faturamento (Últimos 30 dias)</p>
          <p className="text-4xl font-bold text-navy mb-4">{formatCurrency(stats.monthlyRevenue)}</p>
          <div className="h-[120px] -mx-4 -mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.4}/>
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis hide />
                <YAxis hide />
                <CartesianGrid vertical={false} horizontal={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(value: number | undefined) => value !== undefined ? formatCurrency(value) : ''}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenueGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Quick Actions - 2x2 Grid */}
        <Card>
          <h2 className="text-xl font-bold text-navy mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-2 gap-3">
            <div
              onClick={() => verifyGate(() => navigate('/admin/quotes/new'), 'criar orçamentos')}
              className="p-3 border-2 border-dashed border-slate-300 rounded-lg hover:border-navy hover:bg-navy-50 transition-colors cursor-pointer text-center"
            >
              <Plus className="w-6 h-6 text-navy mx-auto mb-1" />
              <p className="text-sm font-medium text-navy">Novo Orçamento</p>
            </div>
            <Link to="/admin/clients/new">
              <div className="p-3 border-2 border-dashed border-slate-300 rounded-lg hover:border-navy hover:bg-navy-50 transition-colors cursor-pointer text-center">
                <Users className="w-6 h-6 text-navy mx-auto mb-1" />
                <p className="text-sm font-medium text-navy">Novo Cliente</p>
              </div>
            </Link>
            <Link to="/admin/quotes">
              <div className="p-3 border-2 border-dashed border-slate-300 rounded-lg hover:border-navy hover:bg-navy-50 transition-colors cursor-pointer text-center">
                <FileText className="w-6 h-6 text-navy mx-auto mb-1" />
                <p className="text-sm font-medium text-navy">Ver Orçamentos</p>
              </div>
            </Link>
            <Link to="/admin/work-orders">
              <div className="p-3 border-2 border-dashed border-slate-300 rounded-lg hover:border-navy hover:bg-navy-50 transition-colors cursor-pointer text-center">
                <ClipboardList className="w-6 h-6 text-navy mx-auto mb-1" />
                <p className="text-sm font-medium text-navy">Ver OS</p>
              </div>
            </Link>
          </div>
        </Card>

        {/* Recent Activity Feed */}
        {recentActivity.length > 0 && (
          <Card>
            <h2 className="text-xl font-bold text-navy mb-4">Últimas Atualizações</h2>
            <div className="space-y-3">
              {recentActivity.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleActivityClick(item)}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {item.type === 'quote' ? (
                      <FileText className="w-5 h-5 text-blue-600" />
                    ) : (
                      <ClipboardList className="w-5 h-5 text-orange-600" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{item.title}</p>
                      <p className="text-xs text-slate-500">
                        {item.type === 'quote' ? 'Orçamento' : 'Ordem de Serviço'} • {formatTimeAgo(item.updatedAt)}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Tutorial Guide */}
      <TutorialGuide
        tutorialKey="dashboardSeen"
        steps={[
          {
            target: 'body',
            content: 'Bem-vindo ao Gestor Vítreo! Vamos fazer um tour rápido?',
            placement: 'center',
            disableBeacon: true,
          },
          {
            target: '#sidebar-menu',
            content: 'Aqui você acessa todas as ferramentas: Orçamentos, OS e Clientes.',
            placement: 'right',
          },
          {
            target: '#kpi-summary',
            content: 'Acompanhe aqui o resumo financeiro do mês. Toque 2x nos cards para ver detalhes.',
            placement: 'top',
          },
          {
            target: '#settings-link',
            content: 'Configure seus dados e serviços personalizados aqui.',
            placement: 'left',
          },
        ]}
      />

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
      />
      
      {/* Phone Verification Modal */}
      <PhoneVerificationModalComponent requiredFor="criar orçamentos" />
    </Layout>
  );
}
