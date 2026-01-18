/**
 * Dashboard Layout Component (Alias for Layout)
 * 
 * This is a wrapper around the existing Layout component.
 * Used to clearly separate dashboard routes from marketing routes.
 * 
 * This file exists to prepare for a potential Next.js migration,
 * where Route Groups would be used: (dashboard)/layout.tsx
 */

import { Layout } from './Layout';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return <Layout>{children}</Layout>;
}
