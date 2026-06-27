import { useCallback, useEffect, useState } from 'react';
import { fetchAlertas, type AlertaStockDTO } from '../../lib/api';

export function AlertasStock() {
  const [alertas, setAlertas] = useState<AlertaStockDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cargarAlertas = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchAlertas();
      setAlertas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar alertas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarAlertas();

    // Re-fetch when user returns to the tab (e.g. after updating stock elsewhere)
    const onVisible = () => {
      if (document.visibilityState === 'visible') cargarAlertas();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [cargarAlertas]);

  if (loading) {
    return (
      <div className="text-gray-400 py-4 text-center text-sm">
        Cargando alertas...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-sm">
        {error}
      </div>
    );
  }

  if (alertas.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8 text-sm">
        No hay alertas de stock
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alertas.map((a) => (
        <div
          key={a.variante_id}
          className="bg-red-900/15 border border-red-800/40 rounded-lg p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-white font-medium text-sm truncate">
                {a.producto_nombre} — {a.variante_nombre}
              </p>
              <p className="text-gray-400 text-xs mt-0.5">SKU: {a.sku}</p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-red-400 font-bold text-lg">{a.stock}</span>
              <span className="text-gray-500 text-xs"> / {a.stock_minimo}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
