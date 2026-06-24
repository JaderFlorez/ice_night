import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertasStock } from '../../components/inventario/AlertasStock';
import { TablaStock } from '../../components/inventario/TablaStock';
import {
  fetchMovimientos,
  type MovimientoStockDTO,
} from '../../lib/api';

export function InventoryPage() {
  const [variantId, setVariantId] = useState('');
  const [movimientos, setMovimientos] = useState<MovimientoStockDTO[]>([]);
  const [movLoading, setMovLoading] = useState(false);
  const [movError, setMovError] = useState('');

  async function handleSearchMovimientos() {
    if (!variantId.trim()) return;

    try {
      setMovLoading(true);
      setMovError('');
      const data = await fetchMovimientos(variantId.trim());
      setMovimientos(data);
    } catch (err) {
      setMovError(
        err instanceof Error ? err.message : 'Error al buscar movimientos',
      );
      setMovimientos([]);
    } finally {
      setMovLoading(false);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Inventario</h2>

      <TablaStock />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Alertas */}
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              Alertas de stock
            </h3>
            <span className="text-xs bg-red-900/60 text-red-300 px-2 py-0.5 rounded-full">
              Stock bajo
            </span>
          </div>
          <AlertasStock />
        </div>

        {/* Right column: Movimientos */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Movimientos de stock
          </h3>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={variantId}
              onChange={(e) => setVariantId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearchMovimientos();
              }}
              placeholder="ID de variante..."
              className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
            />
            <button
              onClick={handleSearchMovimientos}
              disabled={movLoading || !variantId.trim()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors whitespace-nowrap"
            >
              {movLoading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>

          {/* Error */}
          {movError && (
            <div className="bg-red-900/50 border border-red-700 text-red-200 px-3 py-2 rounded-lg mb-3 text-xs">
              {movError}
            </div>
          )}

          {/* Results */}
          {movimientos.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-gray-400 text-xs border-b border-gray-700">
                    <th className="pb-2 font-medium">Tipo</th>
                    <th className="pb-2 font-medium text-right">Cantidad</th>
                    <th className="pb-2 font-medium text-right">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.map((m) => (
                    <tr
                      key={m.id}
                      className="text-gray-300 border-b border-gray-800"
                    >
                      <td className="py-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            m.tipo === 'compra'
                              ? 'bg-green-900/60 text-green-300'
                              : m.tipo === 'venta'
                                ? 'bg-amber-900/60 text-amber-300'
                                : 'bg-blue-900/60 text-blue-300'
                          }`}
                        >
                          {m.tipo}
                        </span>
                      </td>
                      <td className="py-2 text-right font-medium">
                        <span
                          className={
                            m.cantidad > 0
                              ? 'text-green-400'
                              : 'text-red-400'
                          }
                        >
                          {m.cantidad > 0 ? '+' : ''}
                          {m.cantidad}
                        </span>
                      </td>
                      <td className="py-2 text-right text-gray-500 text-xs">
                        {new Date(m.creado_en).toLocaleString('es-AR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!movLoading && variantId.trim() && movimientos.length === 0 && !movError && (
            <p className="text-gray-500 text-sm text-center py-4">
              No se encontraron movimientos para esta variante.
            </p>
          )}

          {!variantId.trim() && movimientos.length === 0 && (
            <p className="text-gray-500 text-xs">
              Ingresá un ID de variante para consultar sus movimientos de stock.
            </p>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="mt-6">
        <Link
          to="/inventario/compras"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-sm rounded-lg transition-colors border border-gray-700"
        >
          Ir a Compras →
        </Link>
      </div>
    </div>
  );
}
