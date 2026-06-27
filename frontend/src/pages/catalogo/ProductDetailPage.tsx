import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useIsAdmin } from '../../context/AuthContext';
import {
  fetchProducto,
  eliminarProducto,
  eliminarVariante,
  formatCOP,
  type ProductoDTO,
} from '../../lib/api';
import { ProductFormModal } from '../../components/catalogo/ProductFormModal';
import { VariantFormModal } from '../../components/catalogo/VariantFormModal';

const CATEGORIA_LABELS: Record<string, string> = {
  cerveza: 'Cerveza',
  vino: 'Vino',
  licor: 'Licor',
  whisky: 'Whisky',
  vodka: 'Vodka',
  ron: 'Ron',
  granizado: 'Granizado',
  energizante: 'Energizante',
  gaseosa: 'Gaseosa',
  agua: 'Agua',
  snack: 'Snack',
  otro: 'Otro',
};

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();

  const [producto, setProducto] = useState<ProductoDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [editProductOpen, setEditProductOpen] = useState(false);
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<null | string>(null);

  // Confirm dialogs
  const [confirmDeleteProduct, setConfirmDeleteProduct] = useState(false);
  const [confirmDeleteVariant, setConfirmDeleteVariant] = useState<string | null>(null);

  async function cargarProducto() {
    if (!id) return;
    try {
      setLoading(true);
      setError('');
      const data = await fetchProducto(id);
      setProducto(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar producto');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarProducto();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleEliminarProducto() {
    if (!id) return;
    try {
      await eliminarProducto(id);
      navigate('/catalogo');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar producto');
      setConfirmDeleteProduct(false);
    }
  }

  async function handleEliminarVariante(variantId: string) {
    try {
      await eliminarVariante(variantId);
      setConfirmDeleteVariant(null);
      cargarProducto();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar variante');
      setConfirmDeleteVariant(null);
    }
  }

  function handleEditProductSuccess() {
    setEditProductOpen(false);
    cargarProducto();
  }

  function handleVariantSuccess() {
    setVariantModalOpen(false);
    setEditingVariant(null);
    cargarProducto();
  }

  if (loading) {
    return <div className="text-gray-400 py-12">Cargando...</div>;
  }

  if (error && !producto) {
    return (
      <div>
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
        <Link
          to="/catalogo"
          className="text-purple-400 hover:text-purple-300 text-sm"
        >
          ← Volver al catálogo
        </Link>
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="text-gray-400 py-12 text-center">
        Producto no encontrado.
        <br />
        <Link
          to="/catalogo"
          className="text-purple-400 hover:text-purple-300 text-sm mt-2 inline-block"
        >
          ← Volver al catálogo
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Back link */}
      <Link
        to="/catalogo"
        className="text-purple-400 hover:text-purple-300 text-sm mb-4 inline-block"
      >
        ← Volver al catálogo
      </Link>

      {/* Error banner */}
      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Product header */}
      <div className="bg-gray-800 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">{producto.nombre}</h2>
            {producto.descripcion && (
              <p className="text-gray-400 mt-1">{producto.descripcion}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!producto.activo && (
              <span className="text-xs bg-red-900/60 text-red-300 px-2 py-1 rounded-full">
                Inactivo
              </span>
            )}
            {producto.tiene_variantes && (
              <span className="text-xs bg-blue-900/60 text-blue-300 px-2 py-1 rounded-full">
                Con variantes
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full">
            {CATEGORIA_LABELS[producto.categoria] || producto.categoria}
          </span>
          <span className="text-gray-500">
            {producto.variantes?.length ?? 0} variante{(producto.variantes?.length ?? 0) !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Admin actions */}
        {isAdmin && (
          <div className="flex gap-3 mt-4 pt-4 border-t border-gray-700">
            <button
              onClick={() => setEditProductOpen(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg transition-colors"
            >
              Editar
            </button>
            {!confirmDeleteProduct ? (
              <button
                onClick={() => setConfirmDeleteProduct(true)}
                className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm rounded-lg transition-colors"
              >
                Eliminar
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-red-300">¿Eliminar?</span>
                <button
                  onClick={handleEliminarProducto}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs rounded-lg transition-colors"
                >
                  Confirmar
                </button>
                <button
                  onClick={() => setConfirmDeleteProduct(false)}
                  className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Variants section */}
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Variantes</h3>
          {isAdmin && (
            <button
              onClick={() => setVariantModalOpen(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg transition-colors"
            >
              + Agregar variante
            </button>
          )}
        </div>

        {producto.variantes.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            <p className="text-sm">Este producto no tiene variantes.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-400 text-sm border-b border-gray-700">
                  <th className="pb-3 font-medium">Nombre</th>
                  <th className="pb-3 font-medium">SKU</th>
                  <th className="pb-3 font-medium text-right">Precio</th>
                  {isAdmin && (
                    <th className="pb-3 font-medium text-right">Costo</th>
                  )}
                  <th className="pb-3 font-medium text-right">Stock</th>
                  <th className="pb-3 font-medium text-right">Stock mín.</th>
                  <th className="pb-3 font-medium">Estado</th>
                  {isAdmin && <th className="pb-3 font-medium">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {producto.variantes.map((v) => (
                  <tr
                    key={v.id}
                    className={`border-b border-gray-700/50 text-sm ${
                      v.activa ? 'text-white' : 'text-gray-500'
                    }`}
                  >
                    <td className="py-3">{v.nombre}</td>
                    <td className="py-3 text-gray-400 font-mono">{v.sku}</td>
                    <td className="py-3 text-right">
                      {v.precio != null ? formatCOP(v.precio) : '—'}
                    </td>
                    {isAdmin && (
                      <td className="py-3 text-right">
                        {v.costo != null ? formatCOP(v.costo) : '—'}
                      </td>
                    )}
                    <td className="py-3 text-right">
                      <span
                        className={
                          v.stock <= v.stock_minimo && v.activa
                            ? 'text-red-400'
                            : ''
                        }
                      >
                        {v.stock}
                      </span>
                    </td>
                    <td className="py-3 text-right">{v.stock_minimo}</td>
                    <td className="py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          v.activa
                            ? 'bg-green-900/60 text-green-300'
                            : 'bg-red-900/60 text-red-300'
                        }`}
                      >
                        {v.activa ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingVariant(v.id);
                              setVariantModalOpen(true);
                            }}
                            className="text-purple-400 hover:text-purple-300 text-xs"
                          >
                            Editar
                          </button>
                          {confirmDeleteVariant === v.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleEliminarVariante(v.id)}
                                className="text-red-400 hover:text-red-300 text-xs"
                              >
                                Confirmar
                              </button>
                              <button
                                onClick={() => setConfirmDeleteVariant(null)}
                                className="text-gray-500 hover:text-gray-400 text-xs"
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteVariant(v.id)}
                              className="text-red-400 hover:text-red-300 text-xs"
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit product modal */}
      {editProductOpen && (
        <ProductFormModal
          isOpen={editProductOpen}
          onClose={() => setEditProductOpen(false)}
          onSuccess={handleEditProductSuccess}
          product={producto}
        />
      )}

      {/* Variant create/edit modal */}
      {variantModalOpen && (
        <VariantFormModal
          isOpen={variantModalOpen}
          onClose={() => {
            setVariantModalOpen(false);
            setEditingVariant(null);
          }}
          onSuccess={handleVariantSuccess}
          productoId={producto.id}
          categoria={producto.categoria}
          variant={
            editingVariant
              ? producto.variantes.find((v) => v.id === editingVariant) ?? null
              : null
          }
        />
      )}
    </div>
  );
}
