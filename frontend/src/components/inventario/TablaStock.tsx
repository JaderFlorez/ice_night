import { useEffect, useState, useRef } from 'react';
import { fetchProductos, formatCOP, type ProductoDTO } from '../../lib/api';

interface VarianteRow {
  productoId: string;
  productoNombre: string;
  categoria: string;
  categoriaLabel: string;
  varianteId: string;
  varianteNombre: string;
  stock: number;
  stockMinimo: number;
  precio: number | null;
  costo: number | null;
}

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

function computeRows(
  productos: ProductoDTO[],
  busqueda: string,
  categoria: string,
): VarianteRow[] {
  const q = busqueda.toLowerCase().trim();

  const all = productos
    .filter((p) => p.activo)
    .flatMap((p) =>
      p.variantes
        .filter((v) => v.activa)
        .map(
          (v): VarianteRow => ({
            productoId: p.id,
            productoNombre: p.nombre,
            categoria: p.categoria,
            categoriaLabel: CATEGORIA_LABELS[p.categoria] || p.categoria,
            varianteId: v.id,
            varianteNombre: v.nombre,
            stock: v.stock,
            stockMinimo: v.stock_minimo,
            precio: v.precio,
            costo: v.costo,
          }),
        ),
    );

  return all.filter((row) => {
    if (q && !row.productoNombre.toLowerCase().includes(q)) return false;
    if (categoria && row.categoria !== categoria) return false;
    return true;
  });
}

export function TablaStock() {
  const [productos, setProductos] = useState<ProductoDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('');
  const [rows, setRows] = useState<VarianteRow[]>([]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function cargar() {
    try {
      setLoading(true);
      setError('');
      const data = await fetchProductos();
      setProductos(data);
      setRows(computeRows(data, busqueda, categoria));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al cargar stock',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce filter changes (client-side), matching CatalogPage pattern
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setRows(computeRows(productos, busqueda, categoria));
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [busqueda, categoria, productos]);

  // ─── Loading ───
  if (loading) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Stock de productos
        </h3>
        <div className="text-gray-400 py-8 text-center text-sm">
          Cargando stock...
        </div>
      </div>
    );
  }

  // ─── Error ───
  if (error) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Stock de productos
        </h3>
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-3 py-2 rounded-lg text-xs">
          {error}
        </div>
      </div>
    );
  }

  // ─── Filters ───
  return (
    <div className="bg-gray-800 rounded-xl p-6 mb-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        Stock de productos
      </h3>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por producto..."
          className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
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

      {/* Empty states */}
      {rows.length === 0 && productos.length === 0 && (
        <p className="text-gray-500 text-center py-8 text-sm">
          No hay productos con stock
        </p>
      )}

      {rows.length === 0 && productos.length > 0 && (
        <p className="text-gray-500 text-center py-8 text-sm">
          No se encontraron productos con los filtros seleccionados
        </p>
      )}

      {/* Table */}
      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-gray-400 text-xs border-b border-gray-700">
                <th className="pb-2 pr-4 font-medium">Producto</th>
                <th className="pb-2 pr-4 font-medium">Variante</th>
                <th className="pb-2 pr-4 font-medium text-right">Stock</th>
                <th className="pb-2 pr-4 font-medium text-right">
                  Stock Mín
                </th>
                <th className="pb-2 pr-4 font-medium text-right">Precio</th>
                <th className="pb-2 pr-4 font-medium text-right">Costo</th>
                <th className="pb-2 font-medium">Categoría</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.varianteId}
                  className="text-gray-300 border-b border-gray-800"
                >
                  <td className="py-2 pr-4 text-white font-medium">
                    {row.productoNombre}
                  </td>
                  <td className="py-2 pr-4">{row.varianteNombre}</td>
                  <td
                    className={`py-2 pr-4 text-right font-medium ${
                      row.stock <= row.stockMinimo
                        ? 'text-red-400'
                        : 'text-gray-300'
                    }`}
                  >
                    {row.stock}
                  </td>
                  <td className="py-2 pr-4 text-right text-gray-500">
                    {row.stockMinimo}
                  </td>
                  <td className="py-2 pr-4 text-right">
                    {row.precio != null
                      ? formatCOP(row.precio)
                      : '—'}
                  </td>
                  <td className="py-2 pr-4 text-right">
                    {row.costo != null
                      ? formatCOP(row.costo)
                      : '—'}
                  </td>
                  <td className="py-2">
                    <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
                      {row.categoriaLabel}
                    </span>
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
