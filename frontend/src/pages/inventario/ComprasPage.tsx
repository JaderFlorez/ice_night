import { useEffect, useState, useCallback } from 'react';
import { useIsAdmin } from '../../context/AuthContext';
import {
  fetchCompras,
  fetchProductos,
  type CompraDTO,
} from '../../lib/api';
import { RegistrarCompraModal } from '../../components/inventario/RegistrarCompraModal';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ComprasPage() {
  const isAdmin = useIsAdmin();

  const [compras, setCompras] = useState<CompraDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [varianteMap, setVarianteMap] = useState<Record<string, string>>({});

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [dataCompras, dataProductos] = await Promise.all([
        fetchCompras(),
        fetchProductos().catch(() => [] as never[]),
      ]);
      setCompras(dataCompras as CompraDTO[]);

      // Build variante_id → "Producto — Variante" lookup
      const map: Record<string, string> = {};
      for (const p of dataProductos as Array<{ nombre: string; variantes: Array<{ id: string; nombre: string }> }>) {
        for (const v of p.variantes) {
          map[v.id] = `${p.nombre} — ${v.nombre}`;
        }
      }
      setVarianteMap(map);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar compras');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function handleCrearSuccess() {
    setModalOpen(false);
    cargar();
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function totalItems(compra: CompraDTO): number {
    return compra.items.reduce((sum, i) => sum + i.cantidad, 0);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Compras</h2>
        {isAdmin && (
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg transition-colors"
          >
            + Nueva compra
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="text-gray-400 py-12 text-center">Cargando...</div>
      ) : compras.length === 0 ? (
        /* Empty state */
        <div className="text-gray-500 text-center py-16">
          <p className="text-lg">No hay compras registradas.</p>
          {isAdmin && (
            <p className="text-sm mt-2">
              Registrá la primera compra para empezar.
            </p>
          )}
        </div>
      ) : (
        /* Table */
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-400 text-sm border-b border-gray-700">
                <th className="pb-3 font-medium">Fecha</th>
                <th className="pb-3 font-medium">Proveedor</th>
                <th className="pb-3 font-medium text-right">Items</th>
                <th className="pb-3 font-medium text-right">Costo total</th>
                <th className="pb-3 font-medium text-right">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {compras.map((compra) => {
                const isExpanded = expandedId === compra.id;
                return (
                  <tr key={compra.id} className="group">
                    <td
                      colSpan={5}
                      className="p-0"
                    >
                      <button
                        onClick={() => toggleExpand(compra.id)}
                        className="w-full text-left"
                      >
                        <div className="flex items-center py-3 px-0 border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                          <div className="flex-1 text-sm text-white">
                            {formatDate(compra.creado_en)}
                          </div>
                          <div className="flex-1 text-sm text-gray-300">
                            {compra.proveedor ?? (
                              <span className="text-gray-500">—</span>
                            )}
                          </div>
                          <div className="flex-1 text-sm text-gray-300 text-right">
                            {totalItems(compra)} ítem
                            {totalItems(compra) !== 1 ? 's' : ''}
                          </div>
                          <div className="flex-1 text-sm text-white font-medium text-right">
                            ${Number(compra.costo_total).toFixed(2)}
                          </div>
                          <div className="w-8 text-center text-gray-500 text-xs shrink-0">
                            {isExpanded ? '▲' : '▼'}
                          </div>
                        </div>
                      </button>

                      {/* Expanded items */}
                      {isExpanded && (
                        <div className="bg-gray-900 border-b border-gray-800">
                          <div className="px-4 py-3">
                            {compra.notas && (
                              <p className="text-xs text-gray-500 mb-3">
                                Notas: {compra.notas}
                              </p>
                            )}
                            <table className="w-full text-left text-sm">
                              <thead>
                                <tr className="text-gray-500 text-xs">
                                  <th className="pb-1 font-medium">Variante</th>
                                  <th className="pb-1 font-medium text-right">
                                    Cant.
                                  </th>
                                  <th className="pb-1 font-medium text-right">
                                    Costo U.
                                  </th>
                                  <th className="pb-1 font-medium text-right">
                                    Subtotal
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {compra.items.map((item) => (
                                  <tr
                                    key={item.id}
                                    className="text-gray-300"
                                  >
                                    <td className="py-1.5">
                                      {varianteMap[item.variante_id] ??
                                        item.variante_id}
                                    </td>
                                    <td className="py-1.5 text-right">
                                      {item.cantidad}
                                    </td>
                                    <td className="py-1.5 text-right">
                                      ${Number(item.costo_unitario).toFixed(2)}
                                    </td>
                                    <td className="py-1.5 text-right">
                                      ${Number(item.subtotal).toFixed(2)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Nueva compra modal */}
      {modalOpen && (
        <RegistrarCompraModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={handleCrearSuccess}
        />
      )}
    </div>
  );
}
