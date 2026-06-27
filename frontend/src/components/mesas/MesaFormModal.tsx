import { useState, useEffect } from 'react';
import {
  crearMesa,
  actualizarMesa,
  eliminarMesa,
  type MesaDTO,
  type CrearMesaData,
} from '../../lib/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mesa?: MesaDTO;
}

export function MesaFormModal({ isOpen, onClose, onSuccess, mesa }: Props) {
  const isEditing = !!mesa;

  const [numero, setNumero] = useState('');
  const [capacidad, setCapacidad] = useState('4');
  const [ubicacion, setUbicacion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (mesa) {
      setNumero(String(mesa.numero));
      setCapacidad(String(mesa.capacidad));
      setUbicacion(mesa.ubicacion ?? '');
    } else {
      setNumero('');
      setCapacidad('4');
      setUbicacion('');
    }
    setError('');
    setSuccess('');
  }, [mesa, isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    const num = Number(numero);
    if (!numero.trim() || isNaN(num) || num <= 0) {
      setError('El número de mesa es obligatorio y debe ser positivo');
      return;
    }

    const cap = Number(capacidad);
    if (isNaN(cap) || cap <= 0) {
      setError('La capacidad debe ser un número positivo');
      return;
    }

    try {
      setSubmitting(true);

      const data: CrearMesaData = {
        numero: num,
        capacidad: cap,
        ubicacion: ubicacion.trim() || undefined,
      };

      if (isEditing && mesa) {
        await actualizarMesa(mesa.id, data);
        setSuccess('Mesa actualizada correctamente');
      } else {
        await crearMesa(data);
        setSuccess('Mesa creada correctamente');
      }

      setTimeout(() => {
        onSuccess();
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar mesa');
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
          {isEditing ? 'Editar mesa' : 'Nueva mesa'}
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
          {/* Número */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Número de mesa *
            </label>
            <input
              type="number"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              required
              min="1"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
              placeholder="Ej: 1"
            />
          </div>

          {/* Capacidad */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Capacidad</label>
            <input
              type="number"
              value={capacidad}
              onChange={(e) => setCapacidad(e.target.value)}
              min="1"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
              placeholder="4"
            />
          </div>

          {/* Ubicación */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Ubicación
            </label>
            <input
              type="text"
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
              placeholder="Ej: Planta baja, sector VIP"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-between gap-3 pt-2">
            {isEditing ? (
              <button
                type="button"
                onClick={async () => {
                  if (!mesa) return;
                  if (!window.confirm('¿Eliminar esta mesa? Las sesiones asociadas no se eliminarán.')) return;
                  try {
                    setSubmitting(true);
                    setError('');
                    await eliminarMesa(mesa.id);
                    onSuccess();
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Error al eliminar mesa');
                  } finally {
                    setSubmitting(false);
                  }
                }}
                disabled={submitting}
                className="px-4 py-2 bg-red-700 hover:bg-red-600 disabled:bg-red-800 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
              >
                {submitting ? 'Eliminando...' : 'Eliminar mesa'}
              </button>
            ) : (
              <div />
            )}
            <div className="flex gap-3">
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
                    : 'Crear mesa'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
