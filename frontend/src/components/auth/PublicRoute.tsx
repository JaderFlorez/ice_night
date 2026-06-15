import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function PublicRoute() {
  const { perfil, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-400" />
      </div>
    );
  }

  if (perfil?.estado === 'activo') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
