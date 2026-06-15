import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function ProtectedRoute() {
  const { session, perfil, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-400" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (perfil?.estado === 'pendiente') {
    return <Navigate to="/pending-approval" replace />;
  }

  if (perfil?.estado === 'rechazado') {
    return <Navigate to="/login" state={{ error: 'Cuenta rechazada por el administrador' }} replace />;
  }

  return <Outlet />;
}
