import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { DollarSign, TrendingUp, CreditCard, Receipt, Target, Plus, BarChart3, ArrowUp, ArrowDown, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getDocs, addDoc, Timestamp, collection, orderBy, limit, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ExpenseModal } from '../components/ExpenseModal';
import { LineChart, Line, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { queryWithCompanyId } from '../lib/queries';
import { useAuth } from '../contexts/AuthContext';
import { roundCurrency } from '../lib/utils';

interface FinanceStats {
  faturamento: number;
  contasAPagar: number;
  contasPagas: number;
  valoresAReceber: number;
  recebido: number;
  lucroLiquido: number;
  margemLiquida: number;
  margemBruta: number;
  investimentoMarketing: number;
  maoDeObra: number;
  alimentacao: number;
  estacionamento: number;
  ferramentas: number;
  outrasDespesas: number;
  ticketMedio: number;
  quantidadeClientes: number;
  taxaConversao: number;
  quantidadeOrcamentos: number;
  quantidadeOS: number;
  origemClientes: { [key: string]: number };
  faturamentoPorMes: { mes: string; valor: number }[];
}

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  title: string;
  amount: number;
  date: Date;
  description?: string;
}

export function Finance() {
  const { userMetadata } = useAuth();
  const companyId = userMetadata?.companyId;
  const [stats, setStats] = useState<FinanceStats>({
    faturamento: 0,
    contasAPagar: 0,
    contasPagas: 0,
    valoresAReceber: 0,
    recebido: 0,
    lucroLiquido: 0,
    margemLiquida: 0,
    margemBruta: 0,
    investimentoMarketing: 0,
    maoDeObra: 0,
    alimentacao: 0,
    estacionamento: 0,
    ferramentas: 0,
    outrasDespesas: 0,
    ticketMedio: 0,
    quantidadeClientes: 0,
    taxaConversao: 0,
    quantidadeOrcamentos: 0,
    quantidadeOS: 0,
    origemClientes: {},
    faturamentoPorMes: [],
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'month' | 'year'>('month');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (companyId) {
      loadFinanceData();
      loadRecentTransactions();
    }
  }, [period, companyId]);

  const loadRecentTransactions = async () => {
    if (!companyId) return;

    try {
      const transactionsList: Transaction[] = [];

      // Load recent expenses
      const expensesQuery = query(
        queryWithCompanyId('expenses', companyId),
        orderBy('paymentDate', 'desc'),
        limit(10)
      );
      const expensesSnapshot = await getDocs(expensesQuery);
      expensesSnapshot.docs.forEach((doc) => {
        const expense = doc.data();
        const paymentDate = expense.paymentDate?.toDate ? expense.paymentDate.toDate() : new Date();
        transactionsList.push({
          id: doc.id,
          type: 'expense',
          title: expense.description || 'Despesa',
          amount: expense.amount || 0,
          date: paymentDate,
          description: expense.category,
        });
      });

      // Load recent income from paid quotes (completed work orders)
      const workOrdersQuery = queryWithCompanyId('workOrders', companyId);
      const workOrdersSnapshot = await getDocs(workOrdersQuery);
      const quotesQuery = queryWithCompanyId('quotes', companyId);
      const quotesSnapshot = await getDocs(quotesQuery);
      const quotesMap = new Map();
      quotesSnapshot.docs.forEach((doc) => {
        quotesMap.set(doc.id, { id: doc.id, ...doc.data() });
      });

      workOrdersSnapshot.docs.forEach((doc) => {
        const wo = doc.data();
        if (wo.status === 'completed' && wo.completedDate) {
          const quote = quotesMap.get(wo.quoteId);
          if (quote && quote.paid && quote.total) {
            const completedDate = wo.completedDate?.toDate ? wo.completedDate.toDate() : new Date();
            transactionsList.push({
              id: `income-${doc.id}`,
              type: 'income',
              title: `Pagamento OS #${doc.id.substring(0, 8)}`,
              amount: quote.total,
              date: completedDate,
              description: quote.clientName || 'Cliente',
            });
          }
        }
      });

      // Sort by date (most recent first) and take top 10
      transactionsList.sort((a, b) => b.date.getTime() - a.date.getTime());
      setTransactions(transactionsList.slice(0, 10));
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const loadFinanceData = async () => {
    if (!companyId) return;
    
    try {
      // Carregar receitas baseadas em OS concluídas (com completedDate)
      const now = new Date();
      const startOfPeriod = period === 'month' 
        ? new Date(now.getFullYear(), now.getMonth(), 1)
        : new Date(now.getFullYear(), 0, 1);
      const endOfPeriod = period === 'month'
        ? new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
        : new Date(now.getFullYear(), 11, 31, 23, 59, 59);

      const workOrdersQuery = queryWithCompanyId('workOrders', companyId);
      const workOrdersSnapshot = await getDocs(workOrdersQuery);
      const completedOrders = workOrdersSnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((wo: any) => {
          if (wo.status !== 'completed') return false;
          const completedDate = wo.completedDate?.toDate ? wo.completedDate.toDate() : null;
          if (!completedDate) return false;
          return completedDate >= startOfPeriod && completedDate <= endOfPeriod;
        });

      // Get quote totals for completed orders
      const quotesQuery = queryWithCompanyId('quotes', companyId);
      const quotesSnapshot = await getDocs(quotesQuery);
      const quotesMap = new Map();
      quotesSnapshot.docs.forEach((doc) => {
        quotesMap.set(doc.id, doc.data());
      });

      let faturamento = 0;
      let recebido = 0;
      let valoresAReceber = 0;

      completedOrders.forEach((order: any) => {
        const quote = quotesMap.get(order.quoteId);
        if (quote && quote.total) {
          const total = roundCurrency(quote.total || 0);
          faturamento = roundCurrency(faturamento + total);
          if (quote.paid) {
            recebido = roundCurrency(recebido + total);
          } else {
            valoresAReceber = roundCurrency(valoresAReceber + total);
          }
        }
      });

      // Carregar despesas (collection 'expenses')
      let contasAPagar = 0;
      let contasPagas = 0;
      let investimentoMarketing = 0;
      let maoDeObra = 0;
      let alimentacao = 0;
      let estacionamento = 0;
      let ferramentas = 0;
      let outrasDespesas = 0;

      try {
        const expensesQuery = queryWithCompanyId('expenses', companyId);
        const expensesSnapshot = await getDocs(expensesQuery);
        expensesSnapshot.docs.forEach((doc) => {
          const expense = doc.data();
          const amount = roundCurrency(expense.amount || 0);
          const paymentDate = expense.paymentDate?.toDate ? expense.paymentDate.toDate() : null;
          
          // Filter by period if paymentDate exists
          if (paymentDate && (paymentDate < startOfPeriod || paymentDate > endOfPeriod)) {
            return;
          }

          if (expense.paid) {
            contasPagas = roundCurrency(contasPagas + amount);
          } else {
            contasAPagar = roundCurrency(contasAPagar + amount);
          }

          // Categorizar despesas
          switch (expense.category) {
            case 'marketing':
              investimentoMarketing = roundCurrency(investimentoMarketing + amount);
              break;
            case 'mao-de-obra':
            case 'mão de obra':
              maoDeObra = roundCurrency(maoDeObra + amount);
              break;
            case 'alimentacao':
            case 'alimentação':
              alimentacao = roundCurrency(alimentacao + amount);
              break;
            case 'estacionamento':
              estacionamento = roundCurrency(estacionamento + amount);
              break;
            case 'ferramentas':
              ferramentas = roundCurrency(ferramentas + amount);
              break;
            default:
              outrasDespesas = roundCurrency(outrasDespesas + amount);
          }
        });
      } catch (error) {
        console.error('Error loading expenses:', error);
      }

      // Calcular margens
      const custos = contasPagas; // Custo total
      const margemBruta = faturamento > 0 ? roundCurrency(((faturamento - custos) / faturamento) * 100) : 0;
      const lucroLiquido = roundCurrency(faturamento - custos - investimentoMarketing);
      const margemLiquida = faturamento > 0 ? roundCurrency((lucroLiquido / faturamento) * 100) : 0;

      // Calcular KPIs adicionais
      const clientsQuery = queryWithCompanyId('clients', companyId);
      const clientsSnapshot = await getDocs(clientsQuery);
      const allClients = clientsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const quantidadeClientes = allClients.length;
      
      // Origem dos clientes
      const origemClientes: { [key: string]: number } = {};
      allClients.forEach((client: any) => {
        const origem = client.origin || 'Não informado';
        origemClientes[origem] = (origemClientes[origem] || 0) + 1;
      });

      // Quantidade de orçamentos e OS
      const allQuotes = quotesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const quantidadeOrcamentos = allQuotes.length;
      const quantidadeOS = workOrdersSnapshot.docs.length;
      
      // Taxa de conversão (OS aprovadas / Orçamentos totais)
      const orcamentosAprovados = allQuotes.filter((q: any) => q.status === 'approved').length;
      const taxaConversao = quantidadeOrcamentos > 0 ? roundCurrency((orcamentosAprovados / quantidadeOrcamentos) * 100) : 0;

      // Ticket médio (faturamento / quantidade de OS concluídas)
      const ticketMedio = completedOrders.length > 0 ? roundCurrency(faturamento / completedOrders.length) : 0;

      // Faturamento por mês (últimos 6 meses)
      const faturamentoPorMes: { mes: string; valor: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
        
        const monthOrders = workOrdersSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((wo: any) => {
            if (wo.status !== 'completed') return false;
            const completedDate = wo.completedDate?.toDate ? wo.completedDate.toDate() : null;
            if (!completedDate) return false;
            return completedDate >= monthStart && completedDate <= monthEnd;
          });

        let monthRevenue = 0;
        monthOrders.forEach((order: any) => {
          const quote = quotesMap.get(order.quoteId);
          if (quote && quote.total) {
            monthRevenue = roundCurrency(monthRevenue + quote.total);
          }
        });

        faturamentoPorMes.push({
          mes: date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
          valor: monthRevenue,
        });
      }

      setStats({
        faturamento,
        contasAPagar,
        contasPagas,
        valoresAReceber,
        recebido,
        lucroLiquido,
        margemLiquida,
        margemBruta,
        investimentoMarketing,
        maoDeObra,
        alimentacao,
        estacionamento,
        ferramentas,
        outrasDespesas,
        ticketMedio,
        quantidadeClientes,
        taxaConversao,
        quantidadeOrcamentos,
        quantidadeOS,
        origemClientes,
        faturamentoPorMes,
      });
    } catch (error) {
      console.error('Error loading finance data:', error);
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

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return diffMinutes <= 1 ? 'Agora' : `Há ${diffMinutes}min`;
      }
      return `Há ${diffHours}h`;
    } else if (diffDays === 1) {
      return 'Ontem';
    } else if (diffDays < 7) {
      return `Há ${diffDays}d`;
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  const handleSaveExpense = async (expense: {
    description: string;
    amount: number;
    category: string;
    paymentDate: Date;
    paid: boolean;
  }) => {
    if (!companyId) return;
    
    try {
      await addDoc(collection(db, 'expenses'), {
        description: expense.description,
        amount: expense.amount,
        category: expense.category,
        paymentDate: Timestamp.fromDate(expense.paymentDate),
        paid: expense.paid,
        companyId,
        createdAt: Timestamp.now(),
      });
      setShowExpenseModal(false);
      loadFinanceData();
      loadRecentTransactions();
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Erro ao salvar despesa');
    }
  };

  if (loading) {
    return (
      <Layout>
        <Card>
          <p className="text-center text-slate-600 py-8">Carregando dados financeiros...</p>
        </Card>
      </Layout>
    );
  }

  // Calculate total expenses for display
  const totalDespesas = roundCurrency(stats.contasPagas + stats.contasAPagar);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-navy">Financeiro</h1>
            <p className="text-slate-600 mt-1">Gestão financeira completa</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="primary"
              onClick={() => setShowExpenseModal(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nova Despesa
            </Button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                period === 'month'
                  ? 'bg-navy text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Mês
            </button>
            <button
              onClick={() => setPeriod('year')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                period === 'year'
                  ? 'bg-navy text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Ano
            </button>
          </div>
        </div>

        {/* Main Stats Grid - 2 Columns Compact */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Row 1: Faturamento (Green) */}
          <Card className="p-4">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600 mb-1">{formatCurrency(stats.faturamento)}</p>
              <p className="text-xs text-slate-600">Faturamento</p>
            </div>
          </Card>

          {/* Row 1: Lucro Líquido (Blue) */}
          <Card className="p-4">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className={`w-5 h-5 ${stats.lucroLiquido >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
              </div>
              <p className={`text-2xl font-bold mb-1 ${stats.lucroLiquido >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {formatCurrency(stats.lucroLiquido)}
              </p>
              <p className="text-xs text-slate-600">Lucro Líquido</p>
            </div>
          </Card>

          {/* Row 2: Contas a Pagar (Red) */}
          <Card className="p-4">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-2">
                <CreditCard className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-600 mb-1">{formatCurrency(stats.contasAPagar)}</p>
              <p className="text-xs text-slate-600">Contas a Pagar</p>
            </div>
          </Card>

          {/* Row 2: Despesas (Red) */}
          <Card className="p-4">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-2">
                <Receipt className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-600 mb-1">{formatCurrency(totalDespesas)}</p>
              <p className="text-xs text-slate-600">Despesas</p>
            </div>
          </Card>

          {/* Row 3: Ticket Médio */}
          <Card className="p-4">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-2">
                <BarChart3 className="w-5 h-5 text-navy" />
              </div>
              <p className="text-2xl font-bold text-navy mb-1">{formatCurrency(stats.ticketMedio)}</p>
              <p className="text-xs text-slate-600">Ticket Médio</p>
            </div>
          </Card>

          {/* Row 3: Margem de Lucro */}
          <Card className="p-4">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-5 h-5 text-navy" />
              </div>
              <p className="text-2xl font-bold text-navy mb-1">{formatPercent(stats.margemLiquida)}</p>
              <p className="text-xs text-slate-600">Margem de Lucro</p>
            </div>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Faturamento por Mês */}
          <Card>
            <h2 className="text-xl font-bold text-navy mb-4">Faturamento (Últimos 6 Meses)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.faturamentoPorMes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="mes" 
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval={0}
                />
                <YAxis />
                <Tooltip formatter={(value: number | undefined) => value !== undefined ? formatCurrency(value) : ''} />
                <Legend />
                <Line type="monotone" dataKey="valor" stroke="#0F172A" strokeWidth={2} name="Faturamento" />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Origem dos Clientes - Fixed Pie Chart */}
          <Card>
            <h2 className="text-xl font-bold text-navy mb-4">Origem dos Clientes</h2>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={Object.entries(stats.origemClientes).map(([name, value]) => ({ name, value }))}
                  cx="50%"
                  cy="40%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.entries(stats.origemClientes).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={['#0F172A', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index % 6]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend 
                  verticalAlign="bottom"
                  height={36}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </Card>

          {/* Despesas por Categoria */}
          <Card>
            <h2 className="text-xl font-bold text-navy mb-4">Despesas por Categoria</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { name: 'Marketing', valor: stats.investimentoMarketing },
                { name: 'Mão de Obra', valor: stats.maoDeObra },
                { name: 'Alimentação', valor: stats.alimentacao },
                { name: 'Estacionamento', valor: stats.estacionamento },
                { name: 'Ferramentas', valor: stats.ferramentas },
                { name: 'Outras', valor: stats.outrasDespesas },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis />
                <Tooltip formatter={(value: number | undefined) => value !== undefined ? formatCurrency(value) : ''} />
                <Legend />
                <Bar dataKey="valor" fill="#0F172A" name="Valor" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Resumo Financeiro */}
          <Card>
            <h2 className="text-xl font-bold text-navy mb-4">Resumo Financeiro</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { name: 'Faturamento', valor: stats.faturamento },
                { name: 'Recebido', valor: stats.recebido },
                { name: 'A Receber', valor: stats.valoresAReceber },
                { name: 'Despesas', valor: stats.contasPagas },
                { name: 'Lucro', valor: stats.lucroLiquido },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis />
                <Tooltip formatter={(value: number | undefined) => value !== undefined ? formatCurrency(value) : ''} />
                <Legend />
                <Bar dataKey="valor" fill="#10B981" name="Valor" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-navy">Histórico de Movimentações</h2>
          </div>
          
          {transactions.length === 0 ? (
            <p className="text-center text-slate-500 py-8">Nenhuma movimentação recente</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center gap-4 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {transaction.type === 'income' ? (
                      <ArrowUp className="w-5 h-5 text-green-600" />
                    ) : (
                      <ArrowDown className="w-5 h-5 text-red-600" />
                    )}
                  </div>

                  {/* Title & Date */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{transaction.title}</p>
                    <p className="text-xs text-slate-500">{formatDate(transaction.date)}</p>
                  </div>

                  {/* Value */}
                  <div className="flex-shrink-0">
                    <p className={`font-bold text-lg ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-slate-200">
            <Button
              variant="outline"
              onClick={() => {
                // TODO: Navigate to full transaction history page or expand list
                alert('Funcionalidade em desenvolvimento');
              }}
              className="w-full flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Ver Extrato Completo
            </Button>
          </div>
        </Card>
      </div>

      {showExpenseModal && (
        <ExpenseModal
          onSave={handleSaveExpense}
          onCancel={() => setShowExpenseModal(false)}
        />
      )}
    </Layout>
  );
}
