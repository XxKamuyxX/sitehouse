import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Users, TrendingUp, UserCheck, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

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
}

interface NetworkData {
  stats: NetworkStats;
  directReferrals: DirectReferral[];
}

export function AffiliateNetwork() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [networkData, setNetworkData] = useState<NetworkData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadNetworkData();
    }
  }, [user]);

  const loadNetworkData = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

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
      setError(err.message || 'Erro ao carregar dados da rede');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return 'Data não disponível';
    
    try {
      const date = timestamp.toDate 
        ? timestamp.toDate() 
        : timestamp.seconds
        ? new Date(timestamp.seconds * 1000)
        : new Date(timestamp);
      
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return 'Data inválida';
    }
  };

  if (loading) {
    return (
      <Layout>
        <Card>
          <p className="text-center text-slate-600 py-8">Carregando dados da rede...</p>
        </Card>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Card>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadNetworkData}
              className="px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy-800"
            >
              Tentar Novamente
            </button>
          </div>
        </Card>
      </Layout>
    );
  }

  if (!networkData) {
    return (
      <Layout>
        <Card>
          <p className="text-center text-slate-600 py-8">Nenhum dado disponível</p>
        </Card>
      </Layout>
    );
  }

  const { stats, directReferrals } = networkData;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-navy">Minha Rede de Indicações</h1>
          <p className="text-slate-600 mt-1">Visualize suas indicações diretas e ganhe 25% de comissão recorrente</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Commission Card */}
          <Card className="border-blue-500 border-2 bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-6 h-6 text-blue-600" />
                <h3 className="font-semibold text-slate-700">Sua Comissão</h3>
              </div>
            </div>
            <p className="text-4xl font-bold text-blue-700 mb-1">
              25%
            </p>
            <p className="text-xs text-blue-600">Comissão recorrente por cada indicação direta</p>
          </Card>

          {/* Direct Referrals Count */}
          <Card className="border-green-500 border-2 bg-gradient-to-br from-green-50 to-green-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-green-600" />
                <h3 className="font-semibold text-slate-700">Indicações Diretas</h3>
              </div>
            </div>
            <p className="text-4xl font-bold text-green-700 mb-1">
              {stats.tier1Count}
            </p>
            <p className="text-xs text-green-600">Total de indicações diretas</p>
          </Card>
        </div>

        {/* Direct Referrals List */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-6 h-6 text-navy" />
            <h2 className="text-xl font-bold text-navy">Meus Indicados Diretos</h2>
          </div>

          {directReferrals.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 mb-2">Você ainda não tem indicações diretas</p>
              <p className="text-sm text-slate-500">
                Compartilhe seu código de afiliado para começar a construir sua rede!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Nome</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Data de Entrada</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {directReferrals.map((referral) => (
                    <tr
                      key={referral.uid}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-sm">
                              {referral.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-slate-800">{referral.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{referral.email}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(referral.joinDate)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Ativo
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

      </div>
    </Layout>
  );
}
// Atualizando build