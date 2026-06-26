import { useState, useEffect } from 'react';
import {
  crearVariante,
  actualizarVariante,
  fetchNextSku,
  formatCOPInput,
  parseCOPInput,
  type VarianteDTO,
  type CrearVarianteData,
  type ActualizarVarianteData,
  type CategoriaProducto,
} from '../../lib/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productoId: string;
  categoria: CategoriaProducto;
  variant?: VarianteDTO | null;
}

export function VariantFormModal({
  isOpen,
  onClose,
  onSuccess,
  productoId,
  categoria,
  variant,
}: Props) {
  const isEditing = !!variant;

  const [nombre, setNombre] = useState('');
  const [sku, setSku] = useState('');
  const [precio, setPrecio] = useState('');
  const [costo, setCosto] = useState('');
  const [stock, setStock] = useState('0');
  const [stockMinimo, setStockMinimo] = useState('0');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingSku, setLoadingSku] = useState(false);

  // Reset and auto-suggest SKU when creating
  useEffect(() => {
    if (!isOpen) return;

    if (variant) {
      setNombre(variant.nombre);
      setSku(variant.sku);
      setPrecio(variant.precio != null ? formatCOPInput(variant.precio) : '');
      setCosto(variant.costo != null ? formatCOPInput(variant.costo) : '');
      setStock(String(variant.stock));
      setStockMinimo(String(variant.stock_minimo));
    } else {
      setNombre('');
      setSku('');
      setPrecio('');
      setCosto('');
      setStock('0');
      setStockMinimo('0');

      // Auto-suggest SKU
      if (categoria) {
        setLoadingSku(true);
        fetchNextSku(categoria)
          .then((res) => setSku(res.sku))
          .catch(() => {
            // Silently fail — user can type SKU manually
          })
          .finally(() => setLoadingSku(false));
      }
    }
    setError('');
    setSuccess('');
  }, [variant, isOpen, categoria]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    if (!sku.trim()) {
      setError('El SKU es obligatorio');
      return;
    }

    try {
      setSubmitting(true);

      if (isEditing && variant) {
        const data: ActualizarVarianteData = {
          nombre: nombre.trim(),
          sku: sku.trim(),
          precio: precio ? parseCOPInput(precio) : undefined,
          costo: costo ? parseCOPInput(costo) : undefined,
          stock: stock ? Number(stock) : undefined,
          stock_minimo: stockMinimo ? Number(stockMinimo) : undefined,
        };
        await actualizarVariante(variant.id, data);
        setSuccess('Variante actualizada correctamente');
      } else {
        const data: CrearVarianteData = {
          nombre: nombre.trim(),
          sku: sku.trim(),
          precio: precio ? parseCOPInput(precio) : undefined,
          costo: costo ? parseCOPInput(costo) : undefined,
          stock: stock ? Number(stock) : undefined,
          stock_minimo: stockMinimo ? Number(stockMinimo) : undefined,
        };
        await crearVariante(productoId, data);
        setSuccess('Variante creada correctamente');
      }

      setTimeout(() => {
        onSuccess();
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar variante');
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
      <div className="relative bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-4">
          {isEditing ? 'Editar variante' : 'Nueva variante'}
        </h3>

        {success && (
          <div className="bg-green-900/50 border border-green-700 text-green-200 px-4 py-3 rounded-lg mb-4 text-sm">
            {success}
          </div>
        )}

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nombre *</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
              placeholder="Ej: Lata 473ml"
            />
          </div>

          {/* SKU */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">SKU *</label>
            <div className="relative">
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                required
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
                placeholder="CER-001"
              />
              {loadingSku && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                  Sugiriendo...
                </span>
              )}
            </div>
          </div>

          {/* Precio y Costo */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Precio</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9.]*"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Costo</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9.]*"
                value={costo}
                onChange={(e) => setCosto(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Stock y Stock mínimo */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Stock</label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                min="0"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Stock mínimo</label>
              <input
                type="number"
                value={stockMinimo}
                onChange={(e) => setStockMinimo(e.target.value)}
                min="0"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
                placeholder="0"
              />
            </div>
          </div>

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
              disabled={submitting}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
            >
              {submitting
                ? 'Guardando...'
                : isEditing
                  ? 'Guardar cambios'
                  : 'Crear variante'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
