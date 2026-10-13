import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useMe } from '@/hooks/useAuth';
import { FullPageSpinner } from '@/components/ui/Spinner';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = useMe();

  if (isLoading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
