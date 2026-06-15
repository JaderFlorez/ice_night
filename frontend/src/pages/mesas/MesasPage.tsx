import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useIsAdmin } from '../../context/AuthContext';
import {
  fetchMesas,
  fetchSesionesActivas,
  type MesaDTO,
  type SesionDTO,
} from '../../lib/api';
import { MesaFormModal } from '../../components/mesas/MesaFormModal';

export function MesasPage() {
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();
  const [searchParams, setSearchParams] = useSearchParams();

  const [mesas, setMesas] = useState<MesaDTO[]>([]);
  const [sesionesActivas, setSesionesActivas] = useState<SesionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMesa, setEditingMesa] = useState<MesaDTO | undefined>(undefined);

  // Auto-open modal if ?nueva is present
  useEffect(() => {
    if (searchParams.get('nueva') === '1') {
      setModalOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [dataMesas, dataSesiones] = await Promise.all([
        fetchMesas(),
        fetchSesionesActivas(),
      ]);
      setMesas(dataMesas);
      setSesionesActivas(dataSesiones);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar mesas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function handleCrearSuccess() {
    setModalOpen(false);
    setEditingMesa(undefined);
    cargar();
  }

  function isMesaOcupada(mesaId: string): boolean {
    return sesionesActivas.some((s) => s.mesa_id === mesaId);
  }

  function handleCardClick(mesa: MesaDTO) {
    if (isMesaOcupada(mesa.id)) {
      const sesion = sesionesActivas.find((s) => s.mesa_id === mesa.id);
      if (sesion) {
        navigate(`/mesas/${mesa.id}/sesion`);
      }
    } else {
      navigate(`/mesas/${mesa.id}/abrir`);
    }
  }

  const filtradas = mesas.filter((m) =>
    String(m.numero).includes(busqueda),
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Mesas</h2>
        {isAdmin && (
          <button
            onClick={() => {
              setEditingMesa(undefined);
              setModalOpen(true);
            }}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg transition-colors"
          >
            + Nueva mesa
          </button>
        )}
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por número..."
          className="w-full max-w-xs px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
        />
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
      ) : filtradas.length === 0 ? (
        /* Empty state */
        <div className="text-gray-500 text-center py-16">
          <p className="text-lg">No hay mesas registradas.</p>
          {isAdmin && (
            <p className="text-sm mt-2">Creá la primera mesa para empezar.</p>
          )}
        </div>
      ) : (
        /* Mesa grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtradas.map((m) => {
            const ocupada = isMesaOcupada(m.id);
            return (
              <button
                key={m.id}
                onClick={() => handleCardClick(m)}
                className={`bg-gray-800 rounded-xl p-5 text-left transition-colors border cursor-pointer ${
                  ocupada
                    ? 'border-amber-700/50 hover:border-amber-600'
                    : 'border-green-700/50 hover:border-green-600'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-3xl font-bold text-white">
                    #{m.numero}
                  </h3>
                  <span
                    className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${
                      ocupada
                        ? 'bg-amber-900/60 text-amber-300'
                        : 'bg-green-900/60 text-green-300'
                    }`}
                  >
                    {ocupada ? 'Ocupada' : 'Libre'}
                  </span>
                </div>

                <div className="space-y-1.5 text-sm">
                  {m.ubicacion && (
                    <p className="text-gray-400">{m.ubicacion}</p>
                  )}
                  <p className="text-gray-500">
                    Capacidad: {m.capacidad} persona{m.capacidad !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Admin actions */}
                {isAdmin && (
                  <div className="mt-4 pt-3 border-t border-gray-700">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingMesa(m);
                        setModalOpen(true);
                      }}
                      className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      Editar
                    </button>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Create/Edit modal */}
      {modalOpen && (
        <MesaFormModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditingMesa(undefined);
          }}
          onSuccess={handleCrearSuccess}
          mesa={editingMesa}
        />
      )}
    </div>
  );
}
