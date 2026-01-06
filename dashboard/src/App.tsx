import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BrandingProvider } from './contexts/BrandingContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Clients } from './pages/Clients';
import { ClientNew } from './pages/ClientNew';
import { Quotes } from './pages/Quotes';
import { QuoteNew } from './pages/QuoteNew';
import { WorkOrders } from './pages/WorkOrders';
import { Finance } from './pages/Finance';
import { Settings } from './pages/Settings';
import { PublicQuote } from './pages/PublicQuote';
import { PublicWorkOrder } from './pages/PublicWorkOrder';
import { PublicWorkOrderApprove } from './pages/PublicWorkOrderApprove';
import { PublicReceipt } from './pages/PublicReceipt';
import { WorkOrderDetails } from './pages/WorkOrderDetails';
import { Feedback } from './pages/Feedback';
import { TeamManagement } from './pages/TeamManagement';
import { TechDashboard } from './pages/TechDashboard';
import { AdminCalendar } from './pages/AdminCalendar';
import { CompanySettings } from './pages/CompanySettings';
import { MasterDashboard } from './pages/MasterDashboard';
import { SignUp } from './pages/SignUp';
import { Expired } from './pages/Expired';
import { RootRedirect } from './components/RootRedirect';

// Helper function to check if subscription is expired
function isSubscriptionExpired(userMetadata: any): boolean {
  // Master users bypass all checks
  if (userMetadata?.role === 'master') {
    return false;
  }

  // If subscription is active, not expired
  if (userMetadata?.subscriptionStatus === 'active') {
    return false;
  }

  // If user is inactive, consider expired
  if (userMetadata?.isActive === false) {
    return true;
  }

  // Check trial end date
  if (userMetadata?.trialEndsAt) {
    const trialEndDate = userMetadata.trialEndsAt.toDate 
      ? userMetadata.trialEndsAt.toDate() 
      : new Date(userMetadata.trialEndsAt);
    const now = new Date();
    
    // If trial ended and status is not active, it's expired
    if (now > trialEndDate && userMetadata?.subscriptionStatus !== 'active') {
      return true;
    }
  }

  return false;
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, userMetadata, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Master users should only access /master
  if (userMetadata?.role === 'master') {
    return <Navigate to="/master" replace />;
  }

  // Check subscription status
  if (userMetadata && isSubscriptionExpired(userMetadata)) {
    return <Navigate to="/subscription-expired" replace />;
  }

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, userMetadata, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Master users should only access /master
  if (userMetadata?.role === 'master') {
    return <Navigate to="/master" replace />;
  }

  if (!userMetadata || userMetadata.role !== 'admin') {
    return <Navigate to="/tech/dashboard" />;
  }

  // Check subscription status
  if (isSubscriptionExpired(userMetadata)) {
    return <Navigate to="/subscription-expired" replace />;
  }

  return <>{children}</>;
}

function TechRoute({ children }: { children: React.ReactNode }) {
  const { user, userMetadata, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!userMetadata || userMetadata.role !== 'tech') {
    return <Navigate to="/admin/dashboard" />;
  }

  // Check subscription status (tech users depend on company subscription)
  if (isSubscriptionExpired(userMetadata)) {
    return <Navigate to="/subscription-expired" replace />;
  }

  return <>{children}</>;
}

function MasterRoute({ children }: { children: React.ReactNode }) {
  const { user, userMetadata, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!userMetadata || userMetadata.role !== 'master') {
    return <Navigate to="/admin/dashboard" />;
  }

  return <>{children}</>;
}

// Special route for expired subscription page - allows expired users to access it
function ExpiredRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Allow access even if expired - this is the page they're redirected to
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route 
        path="/subscription-expired" 
        element={
          <ExpiredRoute>
            <Expired />
          </ExpiredRoute>
        } 
      />
      <Route path="/p/quote/:quoteId" element={<PublicQuote />} />
      <Route path="/p/:quoteId" element={<PublicQuote />} />
      <Route path="/p/os/:osId" element={<PublicWorkOrder />} />
      <Route path="/p/os/:osId/approve" element={<PublicWorkOrderApprove />} />
      <Route path="/p/receipt/:receiptId" element={<PublicReceipt />} />
      <Route path="/feedback/:osId" element={<Feedback />} />
      {/* Rotas Admin */}
      <Route
        path="/admin/dashboard"
        element={
          <AdminRoute>
            <Dashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/calendar"
        element={
          <AdminRoute>
            <AdminCalendar />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/team"
        element={
          <AdminRoute>
            <TeamManagement />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/clients"
        element={
          <AdminRoute>
            <Clients />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/clients/new"
        element={
          <AdminRoute>
            <ClientNew />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/quotes"
        element={
          <AdminRoute>
            <Quotes />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/quotes/new"
        element={
          <AdminRoute>
            <QuoteNew />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/quotes/:id"
        element={
          <AdminRoute>
            <QuoteNew />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/work-orders"
        element={
          <AdminRoute>
            <WorkOrders />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/work-orders/:id"
        element={
          <AdminRoute>
            <WorkOrderDetails />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/finance"
        element={
          <AdminRoute>
            <Finance />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <AdminRoute>
            <Settings />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/company"
        element={
          <AdminRoute>
            <CompanySettings />
          </AdminRoute>
        }
      />
      
      {/* Rotas Legacy (redirecionam para admin) */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Navigate to="/admin/dashboard" replace />
          </PrivateRoute>
        }
      />
      <Route
        path="/clients"
        element={
          <PrivateRoute>
            <Navigate to="/admin/clients" replace />
          </PrivateRoute>
        }
      />
      <Route
        path="/clients/new"
        element={
          <PrivateRoute>
            <Navigate to="/admin/clients/new" replace />
          </PrivateRoute>
        }
      />
      <Route
        path="/quotes"
        element={
          <PrivateRoute>
            <Navigate to="/admin/quotes" replace />
          </PrivateRoute>
        }
      />
      <Route
        path="/quotes/new"
        element={
          <PrivateRoute>
            <Navigate to="/admin/quotes/new" replace />
          </PrivateRoute>
        }
      />
      <Route
        path="/quotes/:id"
        element={
          <AdminRoute>
            <QuoteNew />
          </AdminRoute>
        }
      />
      <Route
        path="/work-orders"
        element={
          <AdminRoute>
            <WorkOrders />
          </AdminRoute>
        }
      />
      <Route
        path="/work-orders/:id"
        element={
          <AdminRoute>
            <WorkOrderDetails />
          </AdminRoute>
        }
      />
      <Route
        path="/calendar"
        element={
          <PrivateRoute>
            <Navigate to="/admin/calendar" replace />
          </PrivateRoute>
        }
      />
      <Route
        path="/finance"
        element={
          <PrivateRoute>
            <Navigate to="/admin/finance" replace />
          </PrivateRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <PrivateRoute>
            <Navigate to="/admin/settings" replace />
          </PrivateRoute>
        }
      />
      
      {/* Rotas Tech */}
      <Route
        path="/tech/dashboard"
        element={
          <TechRoute>
            <TechDashboard />
          </TechRoute>
        }
      />
      <Route
        path="/tech/work-orders/:id"
        element={
          <TechRoute>
            <WorkOrderDetails />
          </TechRoute>
        }
      />
      
      {/* Rotas Master */}
      <Route
        path="/master"
        element={
          <MasterRoute>
            <MasterDashboard />
          </MasterRoute>
        }
      />
      
      {/* Redirect root based on role */}
      <Route path="/" element={<RootRedirect />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrandingProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </BrandingProvider>
    </AuthProvider>
  );
}

export default App;


