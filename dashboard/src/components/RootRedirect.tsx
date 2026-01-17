import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function RootRedirect() {
  const { user, userMetadata, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    // If not authenticated, redirect to landing page (/)
    // Landing page will show login/signup options
    if (!user) {
      navigate('/', { replace: true });
      return;
    }

    // CRITICAL: Check phone verification first - redirect to /activate if not verified
    if (userMetadata && !userMetadata.mobileVerified) {
      navigate('/activate', { replace: true });
      return;
    }

    // CRITICAL: Check if company is set up - redirect to /setup-company if not
    if (userMetadata && userMetadata.mobileVerified && (!userMetadata.companyId || userMetadata.companyId === '')) {
      navigate('/setup-company', { replace: true });
      return;
    }

    if (userMetadata?.role === 'master') {
      navigate('/master', { replace: true });
      return;
    }

    if (userMetadata?.role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
      return;
    }

    if (userMetadata?.role === 'technician') {
      navigate('/tech/dashboard', { replace: true });
      return;
    }

    // Fallback para usuários legados sem role
    navigate('/admin/dashboard', { replace: true });
  }, [user, userMetadata, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy mx-auto"></div>
        <p className="mt-4 text-slate-600">Carregando...</p>
      </div>
    </div>
  );
}
