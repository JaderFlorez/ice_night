import { useAuth, useIsAdmin } from '../context/AuthContext';

export function DashboardPage() {
  const { perfil } = useAuth();
  const isAdmin = useIsAdmin();

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">
        Bienvenido, {perfil?.nombre}
      </h2>
      <p className="text-gray-400 mb-8">
        {isAdmin ? 'Administrador' : 'Mesero'} — {perfil?.email}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-gray-400 text-sm mb-1">Rol</h3>
          <p className="text-white text-lg font-medium capitalize">{perfil?.rol}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-gray-400 text-sm mb-1">Estado</h3>
          <p className="text-green-400 text-lg font-medium capitalize">{perfil?.estado}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-gray-400 text-sm mb-1">Email</h3>
          <p className="text-white text-lg font-medium truncate">{perfil?.email}</p>
        </div>
      </div>
    </div>
  );
}
