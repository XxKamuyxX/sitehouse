/**
 * Marketing Layout Component
 * 
 * Public-facing layout for landing pages, marketing site, etc.
 * Simulates: src/app/(marketing)/layout.tsx (Next.js Route Group)
 * Does NOT include the dashboard sidebar.
 */

import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone } from 'lucide-react';

interface MarketingLayoutProps {
  children: ReactNode;
}

export function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Public Header / Navbar */}
      <header className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo - Left */}
            <Link to="/" className="flex items-center gap-2">
              <span className="text-xl font-bold bg-gradient-to-r from-navy to-primary bg-clip-text text-transparent">
                Gestor Vítreo
              </span>
            </Link>

            {/* Navigation Links - Center */}
            <nav className="hidden md:flex items-center gap-8 flex-1 justify-center">
              <a 
                href="#features" 
                className="text-slate-700 hover:text-navy transition-colors font-medium"
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.getElementById('features');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Funcionalidades
              </a>
              <a 
                href="#pricing" 
                className="text-slate-700 hover:text-navy transition-colors font-medium"
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.getElementById('pricing');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Planos
              </a>
              <a 
                href="#faq" 
                className="text-slate-700 hover:text-navy transition-colors font-medium"
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.getElementById('faq');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                FAQ
              </a>
            </nav>

            {/* CTA Button - Right */}
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="text-slate-700 hover:text-navy transition-colors font-medium"
              >
                Entrar
              </Link>
              <Link
                to="/signup"
                className="bg-gradient-to-r from-primary to-primary-dark text-white px-6 py-2.5 rounded-lg hover:shadow-lg transition-all font-semibold"
              >
                Testar Grátis
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Public Footer */}
      <footer className="bg-slate-100 text-slate-700 mt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-navy to-primary bg-clip-text text-transparent">
                Gestor Vítreo
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                Sistema de gestão completo para vidraceiros e prestadores de serviços. Gerencie clientes, orçamentos e ordens de serviço de forma profissional.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold text-slate-800 mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>
                  <a 
                    href="#features" 
                    className="hover:text-navy transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      const element = document.getElementById('features');
                      element?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Funcionalidades
                  </a>
                </li>
                <li>
                  <a 
                    href="#pricing" 
                    className="hover:text-navy transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      const element = document.getElementById('pricing');
                      element?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Planos
                  </a>
                </li>
                <li><Link to="/signup" className="hover:text-navy transition-colors">Teste Grátis</Link></li>
                <li>
                  <a 
                    href="#faq" 
                    className="hover:text-navy transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      const element = document.getElementById('faq');
                      element?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold text-slate-800 mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><Link to="/#about" className="hover:text-navy transition-colors">Sobre Nós</Link></li>
                <li><Link to="/#contact" className="hover:text-navy transition-colors">Contato</Link></li>
                <li><Link to="/blog" className="hover:text-navy transition-colors">Blog</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-semibold text-slate-800 mb-4">Suporte</h4>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <a href="mailto:suporte@gestorvitreo.com.br" className="hover:text-navy transition-colors">
                    suporte@gestorvitreo.com.br
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <a href="tel:+5531972224582" className="hover:text-navy transition-colors">
                    (31) 97222-4582
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-slate-300 pt-8 mt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-slate-600">
                &copy; {new Date().getFullYear()} Gestor Vítreo. Todos os direitos reservados.
              </p>
              <div className="flex gap-6 text-sm text-slate-600">
                <Link to="/privacy" className="hover:text-navy transition-colors">Privacidade</Link>
                <Link to="/terms" className="hover:text-navy transition-colors">Termos de Uso</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
