import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  fetchMesas,
  fetchSesionesActivas,
  fetchSesion,
  obtenerCuenta,
  agregarConsumo,
  fetchProductos,
  formatCOP,
  type MesaDTO,
  type SesionDTO,
  type CuentaDTO,
  type ItemSesionDTO,
  type ProductoDTO,
  type VarianteDTO,
} from '../../lib/api';
import { CerrarSesionModal } from '../../components/sesiones/CerrarSesionModal';

function elapsedSince(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 0) return '00:00:00';
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1_000);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function SesionPage() {
  const { id } = useParams<{ id: string }>(); // mesa_id
  const navigate = useNavigate();

  const [mesa, setMesa] = useState<MesaDTO | null>(null);
  const [sesion, setSesion] = useState<SesionDTO | null>(null);
  const [cuenta, setCuenta] = useState<CuentaDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState('00:00:00');
  const [cerrada, setCerrada] = useState(false);
  const [cerrarModalOpen, setCerrarModalOpen] = useState(false);

  // Add item form
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProductoDTO[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedVariante, setSelectedVariante] = useState<VarianteDTO | null>(null);
  const [cantidad, setCantidad] = useState('1');
  const [adding, setAdding] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close search results on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function cargarDatos() {
    if (!id) return;
    try {
      setLoading(true);
      setError('');

      const mesas = await fetchMesas();
      const encontrada = mesas.find((m) => m.id === id);
      if (!encontrada) {
        setError('Mesa no encontrada');
        return;
      }
      setMesa(encontrada);

      const activas = await fetchSesionesActivas();
      const activa = activas.find((s) => s.mesa_id === id);

      if (activa) {
        setSesion(activa);
        const cuentaData = await obtenerCuenta(activa.id);
        setCuenta(cuentaData);
      } else {
        // Maybe session was already closed — check by calling fetchSesion
        // We don't have a "find closed by mesa" endpoint, so show empty
        setSesion(null);
        setCuenta(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Timer effect
  useEffect(() => {
    if (!sesion || sesion.estado !== 'abierta') return;

    setTimer(elapsedSince(sesion.abierta_en));
    const interval = setInterval(() => {
      setTimer(elapsedSince(sesion.abierta_en));
    }, 1000);
    return () => clearInterval(interval);
  }, [sesion]);

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

  async function handleAgregar() {
    if (!sesion || !selectedVariante) return;

    const cant = Number(cantidad);
    if (isNaN(cant) || cant < 1) {
      setError('La cantidad debe ser mayor a 0');
      return;
    }

    try {
      setAdding(true);
      setError('');
      await agregarConsumo(sesion.id, {
        variante_id: selectedVariante.id,
        cantidad: cant,
      });
      // Refresh cuenta
      const nuevaCuenta = await obtenerCuenta(sesion.id);
      setCuenta(nuevaCuenta);
      // Reset form
      setSelectedVariante(null);
      setCantidad('1');
      setSearchQuery('');
      setSearchResults([]);
      setShowResults(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al agregar consumo');
    } finally {
      setAdding(false);
    }
  }

  function handleCerrarSuccess() {
    setCerrarModalOpen(false);
    setCerrada(true);
    // Refresh to get the closed session data
    if (sesion) {
      fetchSesion(sesion.id).then((s) => setSesion(s));
    }
  }

  function handleSelectVariante(v: VarianteDTO) {
    setSelectedVariante(v);
    setShowResults(false);
  }

  function getProductoForVariante(varianteId: string): string {
    for (const p of searchResults) {
      const v = p.variantes.find((v) => v.id === varianteId);
      if (v) return `${p.nombre} — ${v.nombre}`;
    }
    return '';
  }

  // Loading
  if (loading) {
    return <div className="text-gray-400 py-12 text-center">Cargando...</div>;
  }

  // Error (no mesa found)
  if (error && !mesa) {
    return (
      <div>
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
        <Link
          to="/mesas"
          className="text-purple-400 hover:text-purple-300 text-sm"
        >
          ← Volver a mesas
        </Link>
      </div>
    );
  }

  if (!mesa) return null;

  // ─── Closed state ───
  if (cerrada || (!sesion && cuenta)) {
    const total = cuenta?.total ?? 0;
    const cerrarTime = sesion?.cerrada_en
      ? elapsedSince(sesion.cerrada_en)
      : '—';

    return (
      <div>
        <Link
          to="/mesas"
          className="text-purple-400 hover:text-purple-300 text-sm mb-4 inline-block"
        >
          ← Volver a mesas
        </Link>

        <div className="max-w-lg mx-auto mt-8 text-center">
          <div className="bg-gray-800 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-white mb-2">
              Mesa #{mesa.numero}
            </h2>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-700 rounded-full text-sm text-gray-400 mb-6">
              Cuenta cerrada
            </div>

            <div className="bg-gray-900 rounded-lg p-6 mb-6">
              <p className="text-sm text-gray-400 mb-1">Total</p>
              <p className="text-3xl font-bold text-white">
                {formatCOP(total)}
              </p>
            </div>

            <div className="text-sm text-gray-500 space-y-1">
              {sesion?.metodo_pago && (
                <p>Método de pago: {sesion.metodo_pago}</p>
              )}
              {sesion?.cerrada_en && (
                <p>
                  Cerrada:{' '}
                  {new Date(sesion.cerrada_en).toLocaleString('es-AR')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── No active session ───
  if (!sesion) {
    return (
      <div>
        <Link
          to="/mesas"
          className="text-purple-400 hover:text-purple-300 text-sm mb-4 inline-block"
        >
          ← Volver a mesas
        </Link>
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg mb-4">
            Esta mesa no tiene una sesión activa.
          </p>
          <Link
            to={`/mesas/${mesa.id}/abrir`}
            className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg transition-colors inline-block"
          >
            Abrir sesión
          </Link>
        </div>
      </div>
    );
  }

  const isAbierta = sesion.estado === 'abierta';
  const items = cuenta?.items ?? [];
  const total = cuenta?.total ?? 0;

  return (
    <div>
      <Link
        to="/mesas"
        className="text-purple-400 hover:text-purple-300 text-sm mb-4 inline-block"
      >
        ← Volver a mesas
      </Link>

      {/* Error banner */}
      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {/* ─── Header section ─── */}
      <div className="bg-gray-800 rounded-xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Mesa #{mesa.numero}
            </h2>
            {mesa.ubicacion && (
              <p className="text-gray-400 text-sm mt-1">{mesa.ubicacion}</p>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Timer */}
            {isAbierta && (
              <div className="text-center">
                <p className="text-xs text-gray-500">Tiempo</p>
                <p className="text-xl font-mono font-bold text-purple-400">
                  {timer}
                </p>
              </div>
            )}

            {/* Estado badge */}
            <span
              className={`shrink-0 text-sm px-3 py-1.5 rounded-full font-medium ${
                isAbierta
                  ? 'bg-green-900/60 text-green-300'
                  : 'bg-gray-700 text-gray-400'
              }`}
            >
              {isAbierta ? 'Abierta' : 'Cerrada'}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Items section ─── */}
      <div className="bg-gray-800 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Consumos</h3>

        {items.length === 0 ? (
          <div className="text-gray-500 text-center py-8 text-sm">
            No hay consumos todavía
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-400 text-sm border-b border-gray-700">
                  <th className="pb-3 font-medium">Producto</th>
                  <th className="pb-3 font-medium text-right">Cant.</th>
                  <th className="pb-3 font-medium text-right">Precio U.</th>
                  <th className="pb-3 font-medium text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="text-white text-sm border-b border-gray-700/50"
                  >
                    <td className="py-3">{item.variante_id}</td>
                    <td className="py-3 text-right">{item.cantidad}</td>
                    <td className="py-3 text-right">
                      {formatCOP(item.precio_unitario)}
                    </td>
                    <td className="py-3 text-right">
                      {formatCOP(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Add item form ─── */}
      {isAbierta && (
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Agregar consumo
          </h3>

          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
            {/* Product search */}
            <div className="flex-1 w-full relative" ref={searchRef}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar producto..."
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
              />

              {/* Selected variant pill */}
              {selectedVariante && (
                <div className="mt-2 inline-flex items-center gap-2 bg-purple-900/40 text-purple-300 text-xs px-2.5 py-1 rounded-full">
                  <span>
                    {getProductoForVariante(selectedVariante.id) ||
                      selectedVariante.nombre}
                  </span>
                  <button
                    onClick={() => setSelectedVariante(null)}
                    className="text-purple-400 hover:text-purple-300"
                  >
                    ×
                  </button>
                </div>
              )}

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
                        {p.variantes.map((v) => (
                          <button
                            key={v.id}
                            onClick={() => handleSelectVariante(v)}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-800 transition-colors ${
                              selectedVariante?.id === v.id
                                ? 'bg-purple-900/30 text-purple-300'
                                : 'text-white'
                            }`}
                          >
                            <span className="font-medium">{p.nombre}</span>
                            <span className="text-gray-400 ml-1">
                              — {v.nombre}
                            </span>
                            {v.precio != null && (
                              <span className="text-gray-500 ml-auto">
                                {formatCOP(v.precio)}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Quantity */}
            <div className="w-full sm:w-24">
              <input
                type="number"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                min="1"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                placeholder="Cant."
              />
            </div>

            {/* Add button */}
            <button
              onClick={handleAgregar}
              disabled={adding || !selectedVariante}
              className="w-full sm:w-auto px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors whitespace-nowrap"
            >
              {adding ? 'Agregando...' : 'Agregar'}
            </button>
          </div>
        </div>
      )}

      {/* ─── Total section + Cerrar ─── */}
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-gray-400">Total</p>
            <p className="text-3xl font-bold text-white">
              {formatCOP(total)}
            </p>
          </div>

          {isAbierta && (
            <button
              onClick={() => setCerrarModalOpen(true)}
              className="px-6 py-3 bg-red-700 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
            >
              Cerrar cuenta
            </button>
          )}
        </div>
      </div>

      {/* ─── Cerrar sesion modal ─── */}
      {cerrarModalOpen && sesion && (
        <CerrarSesionModal
          isOpen={cerrarModalOpen}
          onClose={() => setCerrarModalOpen(false)}
          onSuccess={handleCerrarSuccess}
          sesionId={sesion.id}
          total={total}
        />
      )}
    </div>
  );
}
