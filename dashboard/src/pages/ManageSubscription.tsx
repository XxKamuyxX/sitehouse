/**
 * Manage Subscription Page
 * 
 * Displays subscription details and allows users to:
 * - View subscription information (date, amount, payment method)
 * - Cancel subscription (cancel at period end)
 * - Download invoices
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  CreditCard,
  Calendar,
  DollarSign,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Download,
} from 'lucide-react';
import { useCompany } from '../hooks/useCompany';

interface SubscriptionData {
  id: string;
  status: string;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  canceledAt: number | null;
  trialStart: number | null;
  trialEnd: number | null;
  amount: number;
  currency: string;
  interval: string;
  paymentMethod: {
    type: string;
    card: {
      brand: string;
      last4: string;
      expMonth: number;
      expYear: number;
    } | null;
  } | null;
  latestInvoice: {
    amountPaid: number;
    amountDue: number;
    currency: string;
    status: string;
    hostedInvoiceUrl: string;
    invoicePdf: string;
    created: number;
  } | null;
  created: number;
}

export function ManageSubscription() {
  const navigate = useNavigate();
  const { company } = useCompany();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [canceling, setCanceling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    if (company?.id) {
      loadSubscription();
    }
  }, [company]);

  const loadSubscription = async () => {
    if (!company?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${window.location.origin}/api/stripe/get-subscription?companyId=${company.id}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao carregar assinatura');
      }

      const data = await response.json();
      setSubscription(data.subscription);
    } catch (err: any) {
      console.error('Error loading subscription:', err);
      setError(err.message || 'Erro ao carregar assinatura');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!company?.id) return;

    setCanceling(true);

    try {
      const response = await fetch(`${window.location.origin}/api/stripe/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId: company.id,
          cancelImmediately: false, // Cancel at period end
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao cancelar assinatura');
      }

      const data = await response.json();
      alert(data.message || 'Assinatura cancelada com sucesso!');
      
      // Reload subscription data
      await loadSubscription();
      setShowCancelConfirm(false);
    } catch (err: any) {
      console.error('Error canceling subscription:', err);
      alert(err.message || 'Erro ao cancelar assinatura');
    } finally {
      setCanceling(false);
    }
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatAmount = (amount: number, currency: string): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { label: string; className: string; icon: any } } = {
      active: {
        label: 'Ativa',
        className: 'bg-green-100 text-green-800',
        icon: CheckCircle2,
      },
      trialing: {
        label: 'Período de Teste',
        className: 'bg-blue-100 text-blue-800',
        icon: CheckCircle2,
      },
      canceled: {
        label: 'Cancelada',
        className: 'bg-red-100 text-red-800',
        icon: XCircle,
      },
      incomplete: {
        label: 'Incompleta',
        className: 'bg-yellow-100 text-yellow-800',
        icon: AlertTriangle,
      },
      past_due: {
        label: 'Pagamento Atrasado',
        className: 'bg-orange-100 text-orange-800',
        icon: AlertTriangle,
      },
    };

    const statusInfo = statusMap[status] || {
      label: status,
      className: 'bg-slate-100 text-slate-800',
      icon: AlertTriangle,
    };

    const Icon = statusInfo.icon;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${statusInfo.className}`}
      >
        <Icon className="w-4 h-4" />
        {statusInfo.label}
      </span>
    );
  };

  const getCardBrandIcon = (brand: string) => {
    const brandMap: { [key: string]: string } = {
      visa: '💳',
      mastercard: '💳',
      amex: '💳',
      discover: '💳',
      diners: '💳',
      jcb: '💳',
      unionpay: '💳',
    };
    return brandMap[brand.toLowerCase()] || '💳';
  };

  if (loading) {
    return (
      <Layout>
        <Card>
          <p className="text-center text-slate-600 py-8">Carregando assinatura...</p>
        </Card>
      </Layout>
    );
  }

  if (error || !subscription) {
    return (
      <Layout>
        <Card>
          <div className="text-center py-8">
            <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error || 'Nenhuma assinatura encontrada'}</p>
            <Button onClick={() => navigate('/admin/settings')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Configurações
            </Button>
          </div>
        </Card>
      </Layout>
    );
  }

  const daysRemaining = Math.ceil(
    (subscription.currentPeriodEnd * 1000 - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-navy">Gerenciar Assinatura</h1>
            <p className="text-slate-600 mt-1">Visualize e gerencie sua assinatura</p>
          </div>
          <Button onClick={() => navigate('/admin/settings')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>

        {/* Status Card */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-navy">Status da Assinatura</h2>
            {getStatusBadge(subscription.status)}
          </div>

          {subscription.cancelAtPeriodEnd && (
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-orange-900 mb-1">
                    Assinatura será cancelada
                  </h3>
                  <p className="text-sm text-orange-700">
                    Sua assinatura permanecerá ativa até{' '}
                    <strong>{formatDate(subscription.currentPeriodEnd)}</strong> e não será
                    renovada automaticamente.
                  </p>
                </div>
              </div>
            </div>
          )}

          {subscription.trialEnd && subscription.trialEnd * 1000 > Date.now() && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">Período de Teste Ativo</h3>
                  <p className="text-sm text-blue-700">
                    Seu período de teste termina em{' '}
                    <strong>{formatDate(subscription.trialEnd)}</strong>. Após esta data, você
                    será cobrado automaticamente.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Período Atual */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Período Atual</p>
                <p className="font-semibold text-slate-900">
                  {formatDate(subscription.currentPeriodStart)}
                </p>
                <p className="text-xs text-slate-500">até {formatDate(subscription.currentPeriodEnd)}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {daysRemaining} dias restantes
                </p>
              </div>
            </div>

            {/* Valor */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Valor</p>
                <p className="font-semibold text-slate-900">
                  {formatAmount(subscription.amount, subscription.currency)}
                </p>
                <p className="text-xs text-slate-500">por {subscription.interval === 'month' ? 'mês' : 'ano'}</p>
              </div>
            </div>

            {/* Forma de Pagamento */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CreditCard className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Forma de Pagamento</p>
                {subscription.paymentMethod?.card ? (
                  <>
                    <p className="font-semibold text-slate-900">
                      {getCardBrandIcon(subscription.paymentMethod.card.brand)}{' '}
                      {subscription.paymentMethod.card.brand.toUpperCase()} ••••{' '}
                      {subscription.paymentMethod.card.last4}
                    </p>
                    <p className="text-xs text-slate-500">
                      Validade: {subscription.paymentMethod.card.expMonth}/
                      {subscription.paymentMethod.card.expYear}
                    </p>
                  </>
                ) : (
                  <p className="font-semibold text-slate-900">
                    {subscription.paymentMethod?.type || 'Não disponível'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Latest Invoice */}
        {subscription.latestInvoice && (
          <Card>
            <h2 className="text-xl font-bold text-navy mb-4">Última Fatura</h2>
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <FileText className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">
                    {formatAmount(
                      subscription.latestInvoice.amountPaid,
                      subscription.latestInvoice.currency
                    )}
                  </p>
                  <p className="text-sm text-slate-600">
                    {formatDate(subscription.latestInvoice.created)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Status:{' '}
                    {subscription.latestInvoice.status === 'paid' ? 'Paga' : subscription.latestInvoice.status}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {subscription.latestInvoice.hostedInvoiceUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(subscription.latestInvoice!.hostedInvoiceUrl, '_blank')
                    }
                  >
                    Ver Fatura
                  </Button>
                )}
                {subscription.latestInvoice.invoicePdf && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(subscription.latestInvoice!.invoicePdf, '_blank')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Baixar PDF
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Cancel Subscription */}
        {!subscription.cancelAtPeriodEnd && subscription.status === 'active' && (
          <Card>
            <h2 className="text-xl font-bold text-navy mb-4">Cancelar Assinatura</h2>
            <p className="text-slate-600 mb-4">
              Se você cancelar sua assinatura, ela permanecerá ativa até{' '}
              <strong>{formatDate(subscription.currentPeriodEnd)}</strong> (final do período atual). Após
              essa data, você perderá acesso aos recursos premium.
            </p>
            {!showCancelConfirm ? (
              <Button
                variant="outline"
                onClick={() => setShowCancelConfirm(true)}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                Cancelar Assinatura
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 font-semibold mb-2">Tem certeza?</p>
                  <p className="text-sm text-red-700 mb-4">
                    Esta ação não pode ser desfeita. Você perderá acesso aos recursos premium após{' '}
                    {formatDate(subscription.currentPeriodEnd)}.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handleCancelSubscription}
                      disabled={canceling}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      {canceling ? 'Cancelando...' : 'Sim, Cancelar Assinatura'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowCancelConfirm(false)}
                      disabled={canceling}
                    >
                      Não, Manter Assinatura
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Subscription Info */}
        <Card>
          <h2 className="text-xl font-bold text-navy mb-4">Informações da Assinatura</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">ID da Assinatura:</span>
              <span className="font-mono text-slate-900">{subscription.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Data de Criação:</span>
              <span className="text-slate-900">{formatDate(subscription.created)}</span>
            </div>
            {subscription.canceledAt && (
              <div className="flex justify-between">
                <span className="text-slate-600">Data de Cancelamento:</span>
                <span className="text-slate-900">{formatDate(subscription.canceledAt)}</span>
              </div>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
