import { ReactNode, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useBranding } from '../contexts/BrandingContext';
import { Button } from './ui/Button';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  ClipboardList, 
  LogOut,
  Menu,
  X,
  DollarSign,
  Settings as SettingsIcon,
  Calendar as CalendarIcon,
  UserCog,
  Building2,
  Crown
} from 'lucide-react';
import { useState } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { signOut, userMetadata } = useAuth();
  const { branding } = useBranding();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Update document title dynamically
  useEffect(() => {
    document.title = `${branding.name} | Sistema`;
  }, [branding.name]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isAdmin = userMetadata?.role === 'admin';
  const isMaster = userMetadata?.role === 'master';
  
  // Master users only see Gestão SaaS, regular users see standard nav
  const navItems = isMaster 
    ? [] // Master users see no standard nav items
    : [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/clients', icon: Users, label: 'Clientes' },
        { path: '/quotes', icon: FileText, label: 'Orçamentos' },
        { path: '/work-orders', icon: ClipboardList, label: 'Ordens de Serviço' },
        { path: '/calendar', icon: CalendarIcon, label: 'Agenda' },
        { path: '/finance', icon: DollarSign, label: 'Financeiro' },
        ...(isAdmin ? [
          { path: '/admin/team', icon: UserCog, label: 'Equipe' },
          { path: '/admin/company', icon: Building2, label: 'Dados da Empresa' },
        ] : []),
        { path: '/settings', icon: SettingsIcon, label: 'Configurações' },
      ];

  const masterNavItem = isMaster ? { path: '/master', icon: Crown, label: '👑 Gestão SaaS' } : null;

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={isMaster ? "/master" : "/dashboard"} className="flex items-center gap-3">
              {branding.logoUrl ? (
                <img src={branding.logoUrl} alt={branding.name} className="h-8 w-auto" />
              ) : (
                <span className="text-xl font-bold text-navy">{branding.name}</span>
              )}
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {!isMaster && navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? 'bg-navy text-white'
                        : 'text-slate-700 hover:bg-navy-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              {masterNavItem && (
                <Link
                  to={masterNavItem.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive(masterNavItem.path)
                      ? 'bg-gold text-white'
                      : 'text-gold-700 hover:bg-gold-50'
                  }`}
                >
                  <Crown className="w-5 h-5" />
                  <span>{masterNavItem.label}</span>
                </Link>
              )}
            </nav>

            {/* User & Mobile Menu */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="hidden md:flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </Button>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden text-slate-700"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white">
            <nav className="container mx-auto px-4 py-4 space-y-2">
              {!isMaster && navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? 'bg-navy text-white'
                        : 'text-slate-700 hover:bg-navy-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              {masterNavItem && (
                <Link
                  to={masterNavItem.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(masterNavItem.path)
                      ? 'bg-gold text-white'
                      : 'text-gold-700 hover:bg-gold-50'
                  }`}
                >
                  <Crown className="w-5 h-5" />
                  <span>{masterNavItem.label}</span>
                </Link>
              )}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Sair</span>
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}


