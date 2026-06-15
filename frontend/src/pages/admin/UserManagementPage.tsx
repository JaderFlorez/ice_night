import { useEffect, useState } from 'react';
import { fetchPendientes, aprobarUsuario, type UsuarioDTO } from '../../lib/api';

export function UserManagementPage() {
  const [usuarios, setUsuarios] = useState<UsuarioDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  async function cargarPendientes() {
    try {
      setLoading(true);
      const data = await fetchPendientes();
      setUsuarios(data.usuarios);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { cargarPendientes(); }, []);

  async function handleAprobar(id: string, nombre: string) {
    try {
      await aprobarUsuario(id, 'activo');
      setMensaje(`${nombre} fue aprobado correctamente`);
      setUsuarios((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aprobar');
    }
  }

  async function handleRechazar(id: string, nombre: string) {
    try {
      await aprobarUsuario(id, 'rechazado');
      setMensaje(`${nombre} fue rechazado`);
      setUsuarios((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al rechazar');
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Usuarios pendientes</h2>

      {mensaje && (
        <div className="bg-green-900/50 border border-green-700 text-green-200 px-4 py-3 rounded-lg mb-4 text-sm">
          {mensaje}
        </div>
      )}

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-gray-400">Cargando...</div>
      ) : usuarios.length === 0 ? (
        <div className="text-gray-500 text-center py-12">
          <p className="text-lg">No hay usuarios pendientes</p>
          <p className="text-sm mt-2">Los nuevos registros aparecerán aquí</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-400 text-sm border-b border-gray-800">
                <th className="pb-3 font-medium">Nombre</th>
                <th className="pb-3 font-medium">Email</th>
                <th className="pb-3 font-medium">Registro</th>
                <th className="pb-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-b border-gray-800/50 text-white">
                  <td className="py-3">{u.nombre}</td>
                  <td className="py-3 text-gray-400">{u.email}</td>
                  <td className="py-3 text-gray-400 text-sm">
                    {new Date(u.created_at).toLocaleDateString('es-AR')}
                  </td>
                  <td className="py-3 space-x-2">
                    <button
                      onClick={() => handleAprobar(u.id, u.nombre)}
                      className="px-3 py-1.5 bg-green-700 hover:bg-green-600 text-white text-sm rounded-lg transition-colors"
                    >
                      Aprobar
                    </button>
                    <button
                      onClick={() => handleRechazar(u.id, u.nombre)}
                      className="px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white text-sm rounded-lg transition-colors"
                    >
                      Rechazar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
