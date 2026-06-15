import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  fetchMesas,
  abrirSesion,
  type MesaDTO,
} from '../../lib/api';

export function AbrirSesionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [mesa, setMesa] = useState<MesaDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const mesas = await fetchMesas();
        const encontrada = mesas.find((m) => m.id === id);
        if (!encontrada) {
          setError('Mesa no encontrada');
          return;
        }
        setMesa(encontrada);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar mesa');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function handleAbrir() {
    if (!id) return;
    try {
      setSubmitting(true);
      setError('');
      const sesion = await abrirSesion(id);
      navigate(`/mesas/${id}/sesion`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al abrir sesión');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="text-gray-400 py-12 text-center">Cargando...</div>;
  }

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

  return (
    <div>
      <Link
        to="/mesas"
        className="text-purple-400 hover:text-purple-300 text-sm mb-4 inline-block"
      >
        ← Volver a mesas
      </Link>

      <div className="max-w-lg mx-auto mt-8">
        <div className="bg-gray-800 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">
            Mesa #{mesa.numero}
          </h2>

          <div className="space-y-2 text-sm text-gray-400 mb-8">
            {mesa.ubicacion && <p>Ubicación: {mesa.ubicacion}</p>}
            <p>
              Capacidad: {mesa.capacidad} persona
              {mesa.capacidad !== 1 ? 's' : ''}
            </p>
          </div>

          <p className="text-gray-300 mb-8">
            ¿Abrir sesión en esta mesa?
          </p>

          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="flex flex-col items-center gap-3">
            <button
              onClick={handleAbrir}
              disabled={submitting}
              className="w-full max-w-xs px-6 py-3 bg-green-600 hover:bg-green-500 disabled:bg-green-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {submitting ? 'Abriendo...' : 'Abrir cuenta'}
            </button>
            <Link
              to="/mesas"
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              Volver
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
