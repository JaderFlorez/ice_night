import { Link } from 'react-router-dom';
import { AlertasStock } from '../../components/inventario/AlertasStock';
import { TablaStock } from '../../components/inventario/TablaStock';

export function InventoryPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Inventario</h2>

      <TablaStock />

      {/* Alertas */}
      <div className="bg-gray-800 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            Alertas de stock
          </h3>
          <span className="text-xs bg-red-900/60 text-red-300 px-2 py-0.5 rounded-full">
            Stock bajo
          </span>
        </div>
        <AlertasStock />
      </div>

      {/* Quick links */}
      <div className="mt-6">
        <Link
          to="/inventario/compras"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-sm rounded-lg transition-colors border border-gray-700"
        >
          Ir a Compras →
        </Link>
      </div>
    </div>
  );
}
