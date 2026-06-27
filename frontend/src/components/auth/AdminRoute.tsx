import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { ReactNode } from 'react';

export function AdminRoute({ children }: { children: ReactNode }) {
  const { perfil } = useAuth();

  if (perfil?.rol !== 'admin') {
    return <Navigate to="/mesas" replace />;
  }

  return <>{children}</>;
}
