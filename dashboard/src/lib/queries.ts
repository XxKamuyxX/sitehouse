import { collection, query, where, QueryConstraint } from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from '../contexts/AuthContext';

/**
 * Helper function to create a query with companyId filter
 * Usage: const q = queryWithCompanyId('clients', companyId);
 * 
 * CRITICAL: This function REQUIRES companyId to match Firestore security rules.
 * All queries that need companyId filtering MUST use this function.
 * 
 * @throws Error if companyId is null, undefined, or empty string
 */
export function queryWithCompanyId(collectionName: string, companyId: string | null | undefined, ...additionalConstraints: QueryConstraint[]) {
  // CRITICAL: Validate companyId before creating query
  // Firestore security rules require companyId filter, so queries without it will fail
  if (!companyId || companyId.trim() === '') {
    throw new Error(
      `CRITICAL: Cannot create query for collection '${collectionName}' without companyId. ` +
      `This will violate Firestore security rules. ` +
      `Please ensure user is authenticated and has a companyId assigned.`
    );
  }
  
  const baseQuery = collection(db, collectionName);
  // CRITICAL: Always include companyId filter to match security rules
  const constraints = [where('companyId', '==', companyId), ...additionalConstraints];
  return query(baseQuery, ...constraints);
}

/**
 * Hook to get companyId from auth context
 * Throws error if companyId is not available
 */
export function useCompanyId(): string {
  const { userMetadata } = useAuth();
  
  if (!userMetadata || !userMetadata.companyId) {
    throw new Error('Usuário deve ter um companyId. Por favor, entre em contato com o administrador.');
  }
  
  return userMetadata.companyId;
}
