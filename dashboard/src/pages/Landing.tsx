/**
 * Landing Page Component
 * 
 * Marketing/Public homepage.
 * Uses MarketingLayout (no sidebar).
 */

import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { CheckCircle2, ArrowRight, Users, FileText, ClipboardList, Calendar, BarChart, DollarSign } from 'lucide-react';

export function Landing() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-navy via-primary to-primary-dark text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Gerencie Seu Negócio com Facilidade
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Sistema completo de gestão para empresas de serviços. 
              Controle clientes, orçamentos, ordens de serviço e muito mais.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button variant="secondary" size="lg" className="flex items-center gap-2">
                  Começar Grátis - 7 Dias
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  Já tenho conta
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-sm text-blue-200">
              ✨ Sem cartão de crédito necessário • Teste por 7 dias grátis
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-navy mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-xl text-slate-600">
              Ferramentas poderosas para gerenciar seu negócio de forma eficiente
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-50 rounded-lg p-6">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-navy mb-2">Gestão de Clientes</h3>
              <p className="text-slate-600">
                Cadastre e gerencie seus clientes de forma organizada. Histórico completo de interações.
              </p>
            </div>

            <div className="bg-slate-50 rounded-lg p-6">
              <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-navy mb-2">Orçamentos Profissionais</h3>
              <p className="text-slate-600">
                Crie orçamentos detalhados com poucos cliques. Gere PDFs profissionais automaticamente.
              </p>
            </div>

            <div className="bg-slate-50 rounded-lg p-6">
              <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <ClipboardList className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-navy mb-2">Ordens de Serviço</h3>
              <p className="text-slate-600">
                Acompanhe todas as suas ordens de serviço. Sistema completo de aprovação e rastreamento.
              </p>
            </div>

            <div className="bg-slate-50 rounded-lg p-6">
              <div className="bg-yellow-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-navy mb-2">Controle Financeiro</h3>
              <p className="text-slate-600">
                Gerencie receitas, despesas e relatórios financeiros. Visão completa da saúde financeira.
              </p>
            </div>

            <div className="bg-slate-50 rounded-lg p-6">
              <div className="bg-red-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-navy mb-2">Agenda Integrada</h3>
              <p className="text-slate-600">
                Organize seus compromissos e serviços. Calendário visual e lembretes automáticos.
              </p>
            </div>

            <div className="bg-slate-50 rounded-lg p-6">
              <div className="bg-indigo-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <BarChart className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-navy mb-2">Relatórios e Análises</h3>
              <p className="text-slate-600">
                Dashboards completos com métricas importantes. Tome decisões baseadas em dados.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-navy mb-4">
              Preços Simples e Transparentes
            </h2>
            <p className="text-xl text-slate-600">
              Um plano, todas as funcionalidades
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-xl p-8 border-2 border-primary">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-navy mb-2">Plano Premium</h3>
                <div className="flex items-baseline justify-center gap-2 mb-4">
                  <span className="text-5xl font-bold text-navy">R$ 40</span>
                  <span className="text-slate-600">/mês</span>
                </div>
                <p className="text-slate-600 mb-6">
                  Ideal para empresas de todos os tamanhos
                </p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <p className="text-sm font-semibold text-green-800">
                    🎁 7 dias grátis para testar
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    Sem compromisso. Cancele quando quiser.
                  </p>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">Gestão completa de clientes</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">Orçamentos profissionais ilimitados</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">Ordens de serviço completas</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">Controle financeiro avançado</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">Agenda e calendário integrado</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">Relatórios e dashboards</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">Suporte prioritário</span>
                </li>
              </ul>

              <Link to="/signup" className="block">
                <Button variant="primary" size="lg" className="w-full flex items-center justify-center gap-2">
                  Começar Agora - 7 Dias Grátis
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>

              <p className="text-xs text-center text-slate-500 mt-4">
                Pagamento via Cartão de Crédito ou Boleto • Renovação automática mensal
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary-dark text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Pronto para transformar seu negócio?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Comece hoje e tenha 7 dias grátis para testar todas as funcionalidades
          </p>
          <Link to="/signup">
            <Button variant="secondary" size="lg" className="flex items-center gap-2 mx-auto">
              Criar Conta Grátis
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
