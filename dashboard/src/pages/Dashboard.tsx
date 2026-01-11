import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { FileText, Users, ClipboardList, Plus, DollarSign, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getDocs } from 'firebase/firestore';
import { queryWithCompanyId } from '../lib/queries';
import { useAuth } from '../contexts/AuthContext';
import { maturePendingCommissions } from '../utils/referralCommission';
import { TutorialGuide } from '../components/TutorialGuide';

export function Dashboard() {
  const { userMetadata } = useAuth();
  const companyId = userMetadata?.companyId;
  const [stats, setStats] = useState({
    openQuotes: 0,
    monthlyRevenue: 0,
    activeWorkOrders: 0,
    averageTicket: 0,
    conversionRate: 0,
  });

  useEffect(() => {
    if (companyId) {
      loadDashboardStats();
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
      // Try to get total from quoteId if available
      let monthlyRevenue = 0;
      for (const os of completedThisMonth) {
        if (os.quoteId) {
          const quote = quotes.find((q) => q.id === os.quoteId);
          if (quote && quote.total) {
            monthlyRevenue += quote.total || 0;
          }
        } else if (os.total) {
          monthlyRevenue += os.total;
        }
      }

      const averageTicket = completedThisMonth.length > 0 ? monthlyRevenue / completedThisMonth.length : 0;

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
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
          <Link to="/quotes/new">
            <Button variant="primary" size="lg" className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Novo Orçamento
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div id="kpi-summary" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Orçamentos Abertos</p>
                <p className="text-3xl font-bold text-navy">{stats.openQuotes}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Faturado (Mês)</p>
                <p className="text-3xl font-bold text-navy">{formatCurrency(stats.monthlyRevenue)}</p>
              </div>
              <div className="bg-gold-100 rounded-full p-3">
                <DollarSign className="w-8 h-8 text-gold-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Ticket Médio</p>
                <p className="text-3xl font-bold text-navy">{formatCurrency(stats.averageTicket)}</p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </Card>

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

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">OS em Andamento</p>
                <p className="text-3xl font-bold text-navy">{stats.activeWorkOrders}</p>
              </div>
              <div className="bg-orange-100 rounded-full p-3">
                <ClipboardList className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <h2 className="text-xl font-bold text-navy mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/quotes/new">
              <div className="p-4 border-2 border-dashed border-slate-300 rounded-lg hover:border-navy hover:bg-navy-50 transition-colors cursor-pointer text-center">
                <Plus className="w-8 h-8 text-navy mx-auto mb-2" />
                <p className="font-medium text-navy">Novo Orçamento</p>
              </div>
            </Link>
            <Link to="/clients/new">
              <div className="p-4 border-2 border-dashed border-slate-300 rounded-lg hover:border-navy hover:bg-navy-50 transition-colors cursor-pointer text-center">
                <Users className="w-8 h-8 text-navy mx-auto mb-2" />
                <p className="font-medium text-navy">Novo Cliente</p>
              </div>
            </Link>
            <Link to="/quotes">
              <div className="p-4 border-2 border-dashed border-slate-300 rounded-lg hover:border-navy hover:bg-navy-50 transition-colors cursor-pointer text-center">
                <FileText className="w-8 h-8 text-navy mx-auto mb-2" />
                <p className="font-medium text-navy">Ver Orçamentos</p>
              </div>
            </Link>
            <Link to="/work-orders">
              <div className="p-4 border-2 border-dashed border-slate-300 rounded-lg hover:border-navy hover:bg-navy-50 transition-colors cursor-pointer text-center">
                <ClipboardList className="w-8 h-8 text-navy mx-auto mb-2" />
                <p className="font-medium text-navy">Ver OS</p>
              </div>
            </Link>
          </div>
        </Card>
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
            content: 'Acompanhe aqui o resumo financeiro do mês.',
            placement: 'top',
          },
          {
            target: '#settings-link',
            content: 'Configure seus dados e serviços personalizados aqui.',
            placement: 'left',
          },
        ]}
      />
    </Layout>
  );
}
