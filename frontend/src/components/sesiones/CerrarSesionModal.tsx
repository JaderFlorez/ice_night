import { useState } from 'react';
import {
  cerrarSesion,
  formatCOP,
  type MetodoPago,
} from '../../lib/api';

const METODOS_PAGO: { value: MetodoPago | ''; label: string }[] = [
  { value: '', label: 'Seleccionar...' },
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'transferencia', label: 'Transferencia' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sesionId: string;
  total: number;
}

export function CerrarSesionModal({
  isOpen,
  onClose,
  onSuccess,
  sesionId,
  total,
}: Props) {
  const [metodoPago, setMetodoPago] = useState<MetodoPago | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleConfirmar() {
    try {
      setSubmitting(true);
      setError('');
      await cerrarSesion(sesionId, metodoPago || undefined);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cerrar sesión');
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
      <div className="relative bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-2">
          Cerrar cuenta
        </h3>

        {/* Total */}
        <div className="bg-gray-800 rounded-lg px-4 py-3 mb-4">
          <p className="text-sm text-gray-400 mb-1">Total a cobrar</p>
          <p className="text-2xl font-bold text-white">
            {formatCOP(total)}
          </p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Método de pago */}
        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-1">
            Método de pago
          </label>
          <select
            value={metodoPago}
            onChange={(e) => setMetodoPago(e.target.value as MetodoPago | '')}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
          >
            {METODOS_PAGO.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={submitting}
            className="px-4 py-2 bg-red-700 hover:bg-red-600 disabled:bg-red-800 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
          >
            {submitting ? 'Cerrando...' : 'Confirmar cierre'}
          </button>
        </div>
      </div>
    </div>
  );
}
