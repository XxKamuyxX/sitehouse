import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { DollarSign, TrendingUp, CreditCard, Receipt, Target, Plus, Users, BarChart3 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getDocs, addDoc, Timestamp, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ExpenseModal } from '../components/ExpenseModal';
import { LineChart, Line, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { queryWithCompanyId } from '../lib/queries';
import { useAuth } from '../contexts/AuthContext';

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

  useEffect(() => {
    if (companyId) {
      loadFinanceData();
    }
  }, [period, companyId]);

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
          faturamento += quote.total || 0;
          if (quote.paid) {
            recebido += quote.total || 0;
          } else {
            valoresAReceber += quote.total || 0;
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
        const now = new Date();
        const startOfPeriod = period === 'month' 
          ? new Date(now.getFullYear(), now.getMonth(), 1)
          : new Date(now.getFullYear(), 0, 1);
        const endOfPeriod = period === 'month'
          ? new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
          : new Date(now.getFullYear(), 11, 31, 23, 59, 59);

        const expensesQuery = queryWithCompanyId('expenses', companyId);
        const expensesSnapshot = await getDocs(expensesQuery);
        expensesSnapshot.docs.forEach((doc) => {
          const expense = doc.data();
          const amount = expense.amount || 0;
          const paymentDate = expense.paymentDate?.toDate ? expense.paymentDate.toDate() : null;
          
          // Filter by period if paymentDate exists
          if (paymentDate && (paymentDate < startOfPeriod || paymentDate > endOfPeriod)) {
            return;
          }

          if (expense.paid) {
            contasPagas += amount;
          } else {
            contasAPagar += amount;
          }

          // Categorizar despesas
          switch (expense.category) {
            case 'marketing':
              investimentoMarketing += amount;
              break;
            case 'mao-de-obra':
            case 'mão de obra':
              maoDeObra += amount;
              break;
            case 'alimentacao':
            case 'alimentação':
              alimentacao += amount;
              break;
            case 'estacionamento':
              estacionamento += amount;
              break;
            case 'ferramentas':
              ferramentas += amount;
              break;
            default:
              outrasDespesas += amount;
          }
        });
      } catch (error) {
        console.error('Error loading expenses:', error);
      }

      // Calcular margens
      const custos = contasPagas; // Custo total
      const margemBruta = faturamento > 0 ? ((faturamento - custos) / faturamento) * 100 : 0;
      const lucroLiquido = faturamento - custos - investimentoMarketing;
      const margemLiquida = faturamento > 0 ? (lucroLiquido / faturamento) * 100 : 0;

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
      const taxaConversao = quantidadeOrcamentos > 0 ? (orcamentosAprovados / quantidadeOrcamentos) * 100 : 0;

      // Ticket médio (faturamento / quantidade de OS concluídas)
      const ticketMedio = completedOrders.length > 0 ? faturamento / completedOrders.length : 0;

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
            monthRevenue += quote.total || 0;
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

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Faturamento */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Faturamento</p>
                <p className="text-3xl font-bold text-navy">{formatCurrency(stats.faturamento)}</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </Card>

          {/* Contas a Pagar */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Contas a Pagar</p>
                <p className="text-3xl font-bold text-red-600">{formatCurrency(stats.contasAPagar)}</p>
              </div>
              <div className="bg-red-100 rounded-full p-3">
                <CreditCard className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </Card>

          {/* Contas Pagas */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Contas Pagas</p>
                <p className="text-3xl font-bold text-slate-700">{formatCurrency(stats.contasPagas)}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <Receipt className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </Card>

          {/* Valores a Receber */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Valores a Receber</p>
                <p className="text-3xl font-bold text-amber-600">{formatCurrency(stats.valoresAReceber)}</p>
              </div>
              <div className="bg-amber-100 rounded-full p-3">
                <TrendingUp className="w-8 h-8 text-amber-600" />
              </div>
            </div>
          </Card>

          {/* Recebido */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Recebido</p>
                <p className="text-3xl font-bold text-green-600">{formatCurrency(stats.recebido)}</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </Card>

          {/* Lucro Líquido */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Lucro Líquido</p>
                <p className={`text-3xl font-bold ${stats.lucroLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(stats.lucroLiquido)}
                </p>
              </div>
              <div className={`rounded-full p-3 ${stats.lucroLiquido >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                <TrendingUp className={`w-8 h-8 ${stats.lucroLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
          </Card>

          {/* Margem Líquida */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Margem Líquida</p>
                <p className="text-3xl font-bold text-navy">{formatPercent(stats.margemLiquida)}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <Target className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </Card>

          {/* Margem Bruta */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Margem Bruta</p>
                <p className="text-3xl font-bold text-navy">{formatPercent(stats.margemBruta)}</p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </Card>

          {/* Investimento Marketing */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Investimento Marketing</p>
                <p className="text-3xl font-bold text-gold">{formatCurrency(stats.investimentoMarketing)}</p>
              </div>
              <div className="bg-gold-100 rounded-full p-3">
                <Target className="w-8 h-8 text-gold-600" />
              </div>
            </div>
          </Card>

          {/* Ticket Médio */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Ticket Médio</p>
                <p className="text-3xl font-bold text-navy">{formatCurrency(stats.ticketMedio)}</p>
              </div>
              <div className="bg-indigo-100 rounded-full p-3">
                <BarChart3 className="w-8 h-8 text-indigo-600" />
              </div>
            </div>
          </Card>

          {/* Quantidade de Clientes */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total de Clientes</p>
                <p className="text-3xl font-bold text-navy">{stats.quantidadeClientes}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </Card>

          {/* Taxa de Conversão */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Taxa de Conversão</p>
                <p className="text-3xl font-bold text-green-600">{formatPercent(stats.taxaConversao)}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {stats.quantidadeOrcamentos} orçamentos, {stats.quantidadeOS} OS
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <Target className="w-8 h-8 text-green-600" />
              </div>
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
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip formatter={(value: number | undefined) => value !== undefined ? formatCurrency(value) : ''} />
                <Legend />
                <Line type="monotone" dataKey="valor" stroke="#0F172A" strokeWidth={2} name="Faturamento" />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Origem dos Clientes */}
          <Card>
            <h2 className="text-xl font-bold text-navy mb-4">Origem dos Clientes</h2>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={Object.entries(stats.origemClientes).map(([name, value]) => ({ name, value }))}
                  cx="50%"
                  cy="50%"
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
                <Legend />
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
                <XAxis dataKey="name" />
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
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number | undefined) => value !== undefined ? formatCurrency(value) : ''} />
                <Legend />
                <Bar dataKey="valor" fill="#10B981" name="Valor" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Info Card */}
        <Card>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> Para registrar despesas, crie uma collection "expenses" no Firestore com os campos: 
              amount (number), paid (boolean), category (string: 'marketing', 'mao-de-obra', 'alimentacao', 'estacionamento', 'ferramentas', ou outro), 
              date (Timestamp), description (string).
            </p>
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

