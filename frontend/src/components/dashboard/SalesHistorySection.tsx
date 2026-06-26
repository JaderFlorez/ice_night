import { useEffect, useState } from 'react';
import { fetchHistorialVentas, formatCOP, type HistorialVentasDTO } from '../../lib/api';

type Periodo = 'day' | 'week' | 'month' | 'year';

const PERIODOS: { key: Periodo; label: string }[] = [
  { key: 'day', label: 'Día' },
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mes' },
  { key: 'year', label: 'Año' },
];

export function SalesHistorySection() {
  const [periodo, setPeriodo] = useState<Periodo>('day');
  const [data, setData] = useState<HistorialVentasDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarHistorial();
  }, [periodo]);

  async function cargarHistorial() {
    try {
      setLoading(true);
      setError('');
      const result = await fetchHistorialVentas(periodo);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar historial');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 mb-8">
      {/* Header + filter buttons */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Historial de ventas</h3>
        <div className="flex gap-1">
          {PERIODOS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriodo(p.key)}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                periodo === p.key
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="text-gray-400 py-8 text-center text-sm">
          Cargando historial...
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Data loaded */}
      {!loading && !error && data && (
        <>
          {/* KPI Summary Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-700/50 rounded-lg p-4">
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">
                Total sesiones
              </p>
              <p className="text-2xl font-bold text-white">
                {data.total_sesiones}
              </p>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">
                Total recaudado
              </p>
              <p className="text-2xl font-bold text-green-400">
                {formatCOP(data.total_recaudado)}
              </p>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">
                Productos vendidos
              </p>
              <p className="text-2xl font-bold text-purple-400">
                {data.productos_vendidos}
              </p>
            </div>
          </div>

          {/* Detail table */}
          {data.desglose.length === 0 ? (
            <div className="text-gray-500 text-center py-8 text-sm">
              No hay ventas en este período
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-gray-400 text-sm border-b border-gray-700">
                    <th className="pb-3 font-medium">Fecha</th>
                    <th className="pb-3 font-medium text-right">Sesiones</th>
                    <th className="pb-3 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.desglose.map((d, idx) => (
                    <tr
                      key={idx}
                      className="text-white text-sm border-b border-gray-700/50"
                    >
                      <td className="py-3">{d.fecha}</td>
                      <td className="py-3 text-right">{d.sesiones}</td>
                      <td className="py-3 text-right">
                        {formatCOP(d.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
