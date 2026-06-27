import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsAdmin } from '../../context/AuthContext';
import {
  fetchProductos,
  type ProductoDTO,
  type CategoriaProducto,
} from '../../lib/api';
import { ProductFormModal } from '../../components/catalogo/ProductFormModal';

const CATEGORIAS: { value: string; label: string }[] = [
  { value: '', label: 'Todas las categorías' },
  { value: 'cerveza', label: 'Cerveza' },
  { value: 'vino', label: 'Vino' },
  { value: 'licor', label: 'Licor' },
  { value: 'whisky', label: 'Whisky' },
  { value: 'vodka', label: 'Vodka' },
  { value: 'ron', label: 'Ron' },
  { value: 'granizado', label: 'Granizado' },
  { value: 'energizante', label: 'Energizante' },
  { value: 'gaseosa', label: 'Gaseosa' },
  { value: 'agua', label: 'Agua' },
  { value: 'snack', label: 'Snack' },
  { value: 'otro', label: 'Otro' },
];

const CATEGORIA_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIAS.filter((c) => c.value).map((c) => [c.value, c.label]),
);

export function CatalogPage() {
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();

  const [productos, setProductos] = useState<ProductoDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // Debounce ref for search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cargar = useCallback(async (q?: string, cat?: string) => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchProductos(q || undefined, cat || undefined);
      setProductos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    cargar();
  }, [cargar]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      cargar(busqueda, categoria);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [busqueda, categoria, cargar]);

  function handleCrearSuccess() {
    setModalOpen(false);
    cargar(busqueda, categoria);
  }

  const activos = productos.filter((p) => p.activo);
  const inactivos = productos.filter((p) => !p.activo);
  const ordenados = [...activos, ...inactivos];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Catálogo</h2>
        {isAdmin && (
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg transition-colors"
          >
            + Nuevo producto
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre..."
          className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
        />
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
        >
          {CATEGORIAS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
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
      ) : ordenados.length === 0 ? (
        /* Empty state */
        <div className="text-gray-500 text-center py-16">
          <p className="text-lg">No hay productos.</p>
          <p className="text-sm mt-2">Creá el primer producto para empezar.</p>
        </div>
      ) : (
        /* Product grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ordenados.map((p) => (
            <button
              key={p.id}
              onClick={() => navigate(`/catalogo/${p.id}`)}
              className="bg-gray-800 rounded-xl p-5 text-left hover:bg-gray-750 transition-colors border border-gray-700/50 hover:border-gray-600 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-white font-semibold truncate flex-1 mr-2">
                  {p.nombre}
                </h3>
                {!p.activo && (
                  <span className="shrink-0 text-xs bg-red-900/60 text-red-300 px-2 py-0.5 rounded-full">
                    Inactivo
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
                  {CATEGORIA_LABELS[p.categoria] || p.categoria}
                </span>
                <span className="text-xs text-gray-500">
                  {p.variantes?.length ?? 0} variante{(p.variantes?.length ?? 0) !== 1 ? 's' : ''}
                </span>
              </div>

              {p.descripcion && (
                <p className="text-sm text-gray-400 line-clamp-2">{p.descripcion}</p>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Create modal */}
      {modalOpen && (
        <ProductFormModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={handleCrearSuccess}
        />
      )}
    </div>
  );
}
