import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, useIsAdmin } from '../context/AuthContext';
import {
  fetchDashboardHoy,
  fetchTopProductos,
  type DashboardHoyDTO,
  type TopProductoDTO,
} from '../lib/api';
import { AlertasStock } from '../components/inventario/AlertasStock';
import { SalesHistorySection } from '../components/dashboard/SalesHistorySection';

export function DashboardPage() {
  const { perfil } = useAuth();
  const isAdmin = useIsAdmin();

  const [dashboardHoy, setDashboardHoy] = useState<DashboardHoyDTO | null>(null);
  const [topProductos, setTopProductos] = useState<TopProductoDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    try {
      setLoading(true);
      setError('');

      const [hoy, top] = await Promise.all([
        fetchDashboardHoy(),
        fetchTopProductos(),
      ]);

      setDashboardHoy(hoy);
      setTopProductos(top);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar dashboard');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="text-gray-400 py-12 text-center">Cargando dashboard...</div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-sm">
        {error}
      </div>
    );
  }

  return (
    <div>
      {/* Welcome */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-1">
          Bienvenido, {perfil?.nombre}
        </h2>
        <p className="text-gray-400 text-sm">
          {isAdmin ? 'Administrador' : 'Mesero'} — {perfil?.email}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800 rounded-xl p-6">
          <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">
            Total recaudado hoy
          </p>
          <p className="text-2xl font-bold text-green-400">
            ${Number(dashboardHoy?.ventas.total_recaudado ?? 0).toFixed(2)}
          </p>
          <p className="text-gray-500 text-xs mt-1">
            {dashboardHoy?.ventas.total_sesiones ?? 0} sesiones
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">
            Sesiones activas
          </p>
          <p className="text-2xl font-bold text-purple-400">
            {dashboardHoy?.ventas.sesiones_activas ?? 0}
          </p>
          <Link
            to="/mesas"
            className="text-purple-400 hover:text-purple-300 text-xs mt-1 inline-block"
          >
            Ver mesas →
          </Link>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">
            Alertas de stock
          </p>
          <p
            className={`text-2xl font-bold ${
              (dashboardHoy?.alertas ?? 0) > 0 ? 'text-red-400' : 'text-green-400'
            }`}
          >
            {dashboardHoy?.alertas ?? 0}
          </p>
          {(dashboardHoy?.alertas ?? 0) > 0 && (
            <Link
              to="/inventario"
              className="text-red-400 hover:text-red-300 text-xs mt-1 inline-block"
            >
              Revisar inventario →
            </Link>
          )}
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">
            Mesas activas
          </p>
          <p className="text-2xl font-bold text-white">
            {dashboardHoy?.mesas.activas ?? 0}
            <span className="text-gray-500 text-lg ml-1">
              / {dashboardHoy?.mesas.total ?? 0}
            </span>
          </p>
          <p className="text-gray-500 text-xs mt-1">
            {dashboardHoy?.mesas.total ?? 0} mesas en total
          </p>
        </div>
      </div>

      {/* Top productos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Top 5 productos hoy
          </h3>

          {topProductos.length === 0 ? (
            <div className="text-gray-500 text-center py-8 text-sm">
              No hay ventas cerradas hoy
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-gray-400 text-sm border-b border-gray-700">
                    <th className="pb-3 font-medium">Producto</th>
                    <th className="pb-3 font-medium text-right">Vendido</th>
                    <th className="pb-3 font-medium text-right">Recaudado</th>
                  </tr>
                </thead>
                <tbody>
                  {topProductos.map((p) => (
                    <tr
                      key={p.variante_id}
                      className="text-white text-sm border-b border-gray-700/50"
                    >
                      <td className="py-3">
                        <span className="font-medium">{p.producto_nombre}</span>
                        <span className="text-gray-400 ml-1">
                          — {p.variante_nombre}
                        </span>
                        <span className="text-gray-500 text-xs ml-2">
                          SKU: {p.sku}
                        </span>
                      </td>
                      <td className="py-3 text-right">{p.total_vendido}</td>
                      <td className="py-3 text-right">
                        ${Number(p.total_recaudado).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Alertas stock */}
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Alertas de stock</h3>
            <Link
              to="/inventario"
              className="text-purple-400 hover:text-purple-300 text-sm"
            >
              Ver inventario →
            </Link>
          </div>
          <AlertasStock />
        </div>
      </div>

      {/* Sales History Section */}
      <SalesHistorySection />

      {/* Quick links */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Accesos rápidos</h3>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/mesas"
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
          >
            🪑 Mesas
          </Link>
          <Link
            to="/catalogo"
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
          >
            📦 Catálogo
          </Link>
          <Link
            to="/inventario"
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
          >
            📋 Inventario
          </Link>
          <Link
            to="/inventario/compras"
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
          >
            📥 Compras
          </Link>
        </div>
      </div>
    </div>
  );
}
