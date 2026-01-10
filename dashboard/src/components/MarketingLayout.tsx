/**
 * Marketing Layout Component
 * 
 * Public-facing layout for landing pages, marketing site, etc.
 * Does NOT include the dashboard sidebar.
 */

import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface MarketingLayoutProps {
  children: ReactNode;
}

export function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Public Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <span className="text-xl font-bold text-navy">Gestor</span>
            </Link>

            {/* Public Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/#features" className="text-slate-700 hover:text-navy transition-colors">
                Recursos
              </Link>
              <Link to="/#pricing" className="text-slate-700 hover:text-navy transition-colors">
                Preços
              </Link>
              <Link to="/#about" className="text-slate-700 hover:text-navy transition-colors">
                Sobre
              </Link>
            </nav>

            {/* CTA Buttons */}
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="text-slate-700 hover:text-navy transition-colors"
              >
                Entrar
              </Link>
              <Link
                to="/signup"
                className="bg-gradient-to-r from-primary to-primary-dark text-white px-4 py-2 rounded-lg hover:shadow-lg transition-shadow"
              >
                Começar Grátis
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {children}
      </main>

      {/* Public Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 mt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-navy mb-4">Gestor</h3>
              <p className="text-sm text-slate-600">
                Sistema de gestão completo para empresas de serviços.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-700 mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><Link to="/#features" className="hover:text-navy">Recursos</Link></li>
                <li><Link to="/#pricing" className="hover:text-navy">Preços</Link></li>
                <li><Link to="/signup" className="hover:text-navy">Teste Grátis</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-700 mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><Link to="/#about" className="hover:text-navy">Sobre</Link></li>
                <li><Link to="/#contact" className="hover:text-navy">Contato</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-700 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><Link to="/privacy" className="hover:text-navy">Privacidade</Link></li>
                <li><Link to="/terms" className="hover:text-navy">Termos</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-200 mt-8 pt-8 text-center text-sm text-slate-500">
            <p>&copy; {new Date().getFullYear()} Gestor. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
