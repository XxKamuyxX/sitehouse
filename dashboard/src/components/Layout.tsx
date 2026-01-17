import { ReactNode, useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useBranding } from '../contexts/BrandingContext';
import { useCompany } from '../hooks/useCompany';
import { Button } from './ui/Button';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
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
  Crown,
  BookOpen,
  Gift,
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { signOut, user, userMetadata, loading: authLoading } = useAuth();
  const { branding } = useBranding();
  const { company, loading: companyLoading } = useCompany();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Safety check: Redirect if user has no companyId (but allow setup-company page)
  useEffect(() => {
    // Skip if auth is still loading
    if (authLoading) return;
    
    // Skip if user is not logged in (will be handled by AuthGuard)
    if (!user) return;
    
    // Skip if phone not verified (will be handled by AuthGuard)
    if (!userMetadata?.mobileVerified) return;
    
    // Skip if on setup-company page (allow access)
    if (location.pathname === '/setup-company') return;
    
    // Skip if master user (doesn't need company)
    if (userMetadata?.role === 'master') return;
    
    // If user has verified phone but no companyId, redirect to setup
    if (!userMetadata?.companyId || userMetadata.companyId === '') {
      navigate('/setup-company', { replace: true });
    }
  }, [user, userMetadata, authLoading, location.pathname, navigate]);

  // Update document title dynamically
  useEffect(() => {
    document.title = `${branding.name} | Sistema`;
  }, [branding.name]);

  // Onboarding check: Redirect if profession or company name is missing
  useEffect(() => {
    // Skip check for master users
    if (userMetadata?.role === 'master') {
      return;
    }

    // Skip check while loading
    if (companyLoading || !company) {
      return;
    }

    // Skip check if already on company settings page
    if (location.pathname === '/admin/company' || location.pathname === '/settings') {
      return;
    }

    // Check if onboarding is incomplete (profession or company name missing)
    const isOnboardingIncomplete = (!company.profession && !company.segment) || !company.name || company.name.trim() === '';
    
    if (isOnboardingIncomplete && userMetadata?.role === 'admin') {
      // Redirect admin users to company settings
      navigate('/admin/company', { replace: true });
    } else if (isOnboardingIncomplete) {
      // Redirect other users to settings
      navigate('/settings', { replace: true });
    }
  }, [company, companyLoading, userMetadata, location.pathname, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const userRole = userMetadata?.role;
  const isOwner = userRole === 'owner';
  const isAdmin = userRole === 'admin' || isOwner;
  const isMaster = userRole === 'master';
  const isTechnician = userRole === 'technician';
  const isSales = userRole === 'sales';
  const [pendingPayoutsCount, setPendingPayoutsCount] = useState(0);
  
  // Monitor pending payout requests for master users
  useEffect(() => {
    if (!isMaster) return;

    const unsubscribe = onSnapshot(
      query(collection(db, 'payout_requests'), where('status', '==', 'pending')),
      (snapshot: any) => {
        setPendingPayoutsCount(snapshot.size);
      },
      (error: any) => {
        console.error('Error monitoring payout requests:', error);
      }
    );

    return () => unsubscribe();
  }, [isMaster]);
  
  // Safety check: Show loading if no companyId (but skip for master users and setup-company page)
  if (!isMaster && location.pathname !== '/setup-company') {
    if (authLoading || companyLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy mx-auto"></div>
            <p className="mt-4 text-slate-600">Carregando...</p>
          </div>
        </div>
      );
    }
    
    // If user has verified phone but no companyId, show loading while redirect happens
    if (user && userMetadata?.mobileVerified && (!userMetadata?.companyId || userMetadata.companyId === '')) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy mx-auto"></div>
            <p className="mt-4 text-slate-600">Redirecionando...</p>
          </div>
        </div>
      );
    }
    
    // If no company data when it should exist, show loading
    if (userMetadata?.companyId && !company && !companyLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy mx-auto"></div>
            <p className="mt-4 text-slate-600">Carregando dados da empresa...</p>
          </div>
        </div>
      );
    }
  }
  
  // Master users navigation items
  const masterNavItems = isMaster
    ? [
        { path: '/master', icon: Crown, label: '👑 Gestão SaaS' },
        { path: '/master/templates', icon: BookOpen, label: '📚 Biblioteca de Projetos' },
        { path: '/master/payouts', icon: DollarSign, label: '💰 Saques', badge: pendingPayoutsCount },
      ]
    : [];

  // Role-based navigation items
  const navItems = isMaster 
    ? [] // Master users see no standard nav items
    : [
        // Technician: Only OS, Calendar, and Settings
        ...(isTechnician ? [
          { path: '/work-orders', icon: ClipboardList, label: 'Ordens de Serviço' },
          { path: '/calendar', icon: CalendarIcon, label: 'Agenda' },
          { path: '/settings', icon: SettingsIcon, label: 'Configurações' },
        ] : []),
        // Sales: Quotes and Clients only
        ...(isSales ? [
          { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
          { path: '/clients', icon: Users, label: 'Clientes' },
          { path: '/quotes', icon: FileText, label: 'Orçamentos' },
          { path: '/settings', icon: SettingsIcon, label: 'Configurações' },
        ] : []),
        // Owner/Admin: Full access
        ...((isOwner || isAdmin) ? [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/clients', icon: Users, label: 'Clientes' },
    { path: '/quotes', icon: FileText, label: 'Orçamentos' },
    { path: '/work-orders', icon: ClipboardList, label: 'Ordens de Serviço' },
    { path: '/calendar', icon: CalendarIcon, label: 'Agenda' },
    { path: '/finance', icon: DollarSign, label: 'Financeiro' },
      { path: '/admin/team', icon: UserCog, label: 'Equipe' },
      { path: '/admin/company', icon: Building2, label: 'Dados da Empresa' },
          { path: '/admin/affiliates', icon: Gift, label: 'Indique e Ganhe' },
          { path: '/settings', icon: SettingsIcon, label: 'Configurações' },
    ] : []),
  ];

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
                <span className="text-xl font-bold text-secondary">{branding.name}</span>
              )}
            </Link>

            {/* Desktop Navigation */}
            <nav id="sidebar-menu" className="hidden md:flex items-center gap-1">
              {!isMaster && navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    id={item.path === '/settings' ? 'settings-link' : undefined}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-md shadow-primary/20'
                        : 'text-slate-700 hover:bg-glass-blue'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              {isMaster && masterNavItems.map((item) => {
                const Icon = item.icon;
                const badgeCount = (item as any).badge || 0;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors relative ${
                      isActive(item.path)
                        ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-md shadow-primary/20'
                        : 'text-slate-700 hover:bg-glass-blue'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                    {badgeCount > 0 && (
                      <span className="absolute top-1 right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {badgeCount > 9 ? '9+' : badgeCount}
                      </span>
                    )}
                  </Link>
                );
              })}
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
                    id={item.path === '/settings' ? 'settings-link' : undefined}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-md shadow-primary/20'
                        : 'text-slate-700 hover:bg-glass-blue'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              {isMaster && masterNavItems.map((item) => {
                const Icon = item.icon;
                const badgeCount = (item as any).badge || 0;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative ${
                      isActive(item.path)
                        ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-md shadow-primary/20'
                        : 'text-slate-700 hover:bg-glass-blue'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                    {badgeCount > 0 && (
                      <span className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {badgeCount > 9 ? '9+' : badgeCount}
                      </span>
                    )}
                  </Link>
                );
              })}
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


