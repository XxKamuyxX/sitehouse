import { useAuth } from '../contexts/AuthContext';

export function useCompanyId() {
  const { userMetadata, loading } = useAuth();

  if (loading) {
    return { companyId: null, role: null, loading: true };
  }

  if (!userMetadata) {
    return { companyId: null, role: null, loading: false };
  }

  return {
    companyId: userMetadata.companyId,
    role: userMetadata.role,
    loading: false,
  };
}
