import { useState, useEffect, useRef } from 'react';
import {
  fetchProductos,
  registrarCompra,
  formatCOP,
  parseCOPInput,
  type ProductoDTO,
  type VarianteDTO,
} from '../../lib/api';

interface ItemForm {
  varianteId: string;
  productoNombre: string;
  varianteNombre: string;
  cantidad: number;
  costoUnitario: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RegistrarCompraModal({ isOpen, onClose, onSuccess }: Props) {
  const [proveedor, setProveedor] = useState('');
  const [notas, setNotas] = useState('');
  const [items, setItems] = useState<ItemForm[]>([]);

  // Variant search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProductoDTO[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close search on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Reset form on open
  useEffect(() => {
    if (isOpen) {
      setProveedor('');
      setNotas('');
      setItems([]);
      setSearchQuery('');
      setSearchResults([]);
      setShowResults(false);
      setError('');
    }
  }, [isOpen]);

  // Debounced product search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        setSearching(true);
        const results = await fetchProductos(searchQuery);
        setSearchResults(results);
        setShowResults(results.length > 0);
      } catch {
        // Silently fail search
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  function addItem(variante: VarianteDTO, producto: ProductoDTO) {
    setItems((prev) => [
      ...prev,
      {
        varianteId: variante.id,
        productoNombre: producto.nombre,
        varianteNombre: variante.nombre,
        cantidad: 1,
        costoUnitario: variante.costo ?? 0,
      },
    ]);
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateCantidad(index: number, value: number) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, cantidad: Math.max(1, value || 1) } : item,
      ),
    );
  }

  function updateCostoUnitario(index: number, value: number) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, costoUnitario: Math.max(0, value || 0) } : item,
      ),
    );
  }

  const total = items.reduce(
    (sum, item) => sum + item.cantidad * item.costoUnitario,
    0,
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (items.length === 0) {
      setError('Agregá al menos un item a la compra');
      return;
    }

    try {
      setSubmitting(true);
      await registrarCompra({
        proveedor: proveedor.trim() || undefined,
        notas: notas.trim() || undefined,
        items: items.map((i) => ({
          variante_id: i.varianteId,
          cantidad: i.cantidad,
          costo_unitario: i.costoUnitario,
        })),
      });
      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al registrar compra',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-white mb-4">Nueva compra</h3>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Proveedor */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Proveedor
            </label>
            <input
              type="text"
              value={proveedor}
              onChange={(e) => setProveedor(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
              placeholder="Nombre del proveedor (opcional)"
            />
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Notas</label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm resize-none"
              placeholder="Notas opcionales..."
            />
          </div>

          {/* Items section */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Items</label>

            {/* Search variant */}
            <div className="relative" ref={searchRef}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar producto para agregar..."
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
              />

              {/* Search dropdown */}
              {showResults && (
                <div className="absolute z-10 left-0 right-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                  {searching && (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      Buscando...
                    </div>
                  )}
                  {!searching &&
                    searchResults.map((p) => (
                      <div key={p.id}>
                        {p.variantes
                          .filter((v) => v.activa)
                          .map((v) => (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => addItem(v, p)}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-800 transition-colors text-white"
                            >
                              <span className="font-medium">{p.nombre}</span>
                              <span className="text-gray-400 ml-1">
                                — {v.nombre}
                              </span>
                              {v.costo != null && (
                                <span className="text-gray-500 ml-2">
                                  {formatCOP(v.costo)}
                                </span>
                              )}
                            </button>
                          ))}
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Items table */}
            {items.length > 0 && (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-700">
                      <th className="pb-2 font-medium">Producto</th>
                      <th className="pb-2 font-medium text-right w-20">
                        Cant.
                      </th>
                      <th className="pb-2 font-medium text-right w-28">
                        Costo U.
                      </th>
                      <th className="pb-2 font-medium text-right w-24">
                        Subtotal
                      </th>
                      <th className="pb-2 w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr
                        key={i}
                        className="text-white border-b border-gray-800"
                      >
                        <td className="py-2 pr-2">
                          <span className="text-xs text-gray-400">
                            {item.productoNombre}
                          </span>
                          <br />
                          <span className="text-sm">{item.varianteNombre}</span>
                        </td>
                        <td className="py-2">
                          <input
                            type="number"
                            value={item.cantidad}
                            onChange={(e) =>
                              updateCantidad(i, Number(e.target.value))
                            }
                            min="1"
                            className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-right text-sm focus:outline-none focus:border-purple-500"
                          />
                        </td>
                        <td className="py-2">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9.]*"
                            value={item.costoUnitario || ''}
                            onChange={(e) =>
                              updateCostoUnitario(i, parseCOPInput(e.target.value))
                            }
                            className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-right text-sm focus:outline-none focus:border-purple-500"
                          />
                        </td>
                        <td className="py-2 text-right text-sm">
                          {formatCOP(item.cantidad * item.costoUnitario)}
                        </td>
                        <td className="py-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(i)}
                            className="text-red-500 hover:text-red-400 text-lg leading-none"
                            title="Quitar item"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {items.length === 0 && (
              <p className="text-gray-500 text-xs mt-2">
                Buscá un producto y seleccioná una variante para agregarla a la
                compra.
              </p>
            )}
          </div>

          {/* Total */}
          {items.length > 0 && (
            <div className="flex justify-end items-center gap-2 pt-2 border-t border-gray-700">
              <span className="text-gray-400 text-sm">Total:</span>
              <span className="text-white text-xl font-bold">
                {formatCOP(total)}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || items.length === 0}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
            >
              {submitting ? 'Registrando...' : 'Registrar compra'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
