import { useState, useEffect } from 'react';
import {
  crearProducto,
  actualizarProducto,
  parseCOPInput,
  type ProductoDTO,
  type CrearProductoData,
  type ActualizarProductoData,
  type CategoriaProducto,
} from '../../lib/api';

const CATEGORIAS: { value: CategoriaProducto; label: string }[] = [
  { value: 'cerveza', label: 'Cerveza' },
  { value: 'vino', label: 'Vino' },
  { value: 'licor', label: 'Licor' },
  { value: 'whisky', label: 'Whisky' },
  { value: 'vodka', label: 'Vodka' },
  { value: 'ron', label: 'Ron' },
  { value: 'gin', label: 'Gin' },
  { value: 'energizante', label: 'Energizante' },
  { value: 'gaseosa', label: 'Gaseosa' },
  { value: 'agua', label: 'Agua' },
  { value: 'snack', label: 'Snack' },
  { value: 'otro', label: 'Otro' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product?: ProductoDTO;
}

export function ProductFormModal({ isOpen, onClose, onSuccess, product }: Props) {
  const isEditing = !!product;

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState<CategoriaProducto>('otro');
  const [tieneVariantes, setTieneVariantes] = useState(false);
  const [precio, setPrecio] = useState('');
  const [stock, setStock] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Populate form when editing
  useEffect(() => {
    if (product) {
      setNombre(product.nombre);
      setDescripcion(product.descripcion ?? '');
      setCategoria(product.categoria);
      setTieneVariantes(product.tiene_variantes);
      setPrecio('');
      setStock('');
    } else {
      setNombre('');
      setDescripcion('');
      setCategoria('otro');
      setTieneVariantes(false);
      setPrecio('');
      setStock('');
    }
    setError('');
    setSuccess('');
  }, [product, isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    try {
      setSubmitting(true);

      if (isEditing && product) {
        const data: ActualizarProductoData = {
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || undefined,
          categoria,
          tiene_variantes: tieneVariantes,
        };
        await actualizarProducto(product.id, data);
        setSuccess('Producto actualizado correctamente');
      } else {
        const data: CrearProductoData = {
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || undefined,
          categoria,
          tiene_variantes: tieneVariantes,
        };
        if (!tieneVariantes) {
          data.precio = precio ? parseCOPInput(precio) : undefined;
          data.stock = stock ? Number(stock) : undefined;
        }
        await crearProducto(data);
        setSuccess('Producto creado correctamente');
      }

      setTimeout(() => {
        onSuccess();
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar producto');
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
          {isEditing ? 'Editar producto' : 'Nuevo producto'}
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
              placeholder="Ej: Corona Extra"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Descripción</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm resize-none"
              placeholder="Descripción opcional..."
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Categoría</label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as CategoriaProducto)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
            >
              {CATEGORIAS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tiene variantes */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-400">Tiene variantes</label>
            <button
              type="button"
              onClick={() => setTieneVariantes(!tieneVariantes)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                tieneVariantes ? 'bg-purple-600' : 'bg-gray-700'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  tieneVariantes ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>

          {/* Precio y stock (solo si no tiene variantes) */}
          {!tieneVariantes && (
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
              disabled={submitting}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
            >
              {submitting
                ? 'Guardando...'
                : isEditing
                  ? 'Guardar cambios'
                  : 'Crear producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
