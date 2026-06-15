import { getPool } from '../../../infraestructura/db/pool.js';

export interface DashboardHoy {
  ventas: {
    total_sesiones: number;
    sesiones_activas: number;
    total_recaudado: number;
  };
  mesas: {
    total: number;
    activas: number;
  };
  alertas: number;
}

export class ObtenerDashboardHoy {
  async ejecutar(): Promise<DashboardHoy> {
    const pool = getPool();

    const [ventasResult, mesasResult, alertasResult] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(*)::int AS total_sesiones,
           COUNT(*) FILTER (WHERE estado = 'abierta')::int AS sesiones_activas,
           COALESCE(SUM(total), 0)::numeric AS total_recaudado
         FROM sesiones
         WHERE DATE(abierta_en) = CURRENT_DATE`,
      ),
      pool.query(
        `SELECT
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE activa = true)::int AS activas
         FROM mesas`,
      ),
      pool.query(
        `SELECT COUNT(*)::int AS total
         FROM variantes
         WHERE stock <= stock_minimo AND activa = true`,
      ),
    ]);

    return {
      ventas: {
        total_sesiones: ventasResult.rows[0].total_sesiones,
        sesiones_activas: ventasResult.rows[0].sesiones_activas,
        total_recaudado: Number(ventasResult.rows[0].total_recaudado),
      },
      mesas: {
        total: mesasResult.rows[0].total,
        activas: mesasResult.rows[0].activas,
      },
      alertas: Number(alertasResult.rows[0].total),
    };
  }
}
