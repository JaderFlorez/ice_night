import { getPool } from '../../../infraestructura/db/pool.js';

export interface DesgloseVentaDTO {
  fecha: string;
  sesiones: number;
  total: number;
  costo: number;
  utilidad: number;
}

export interface HistorialVentasDTO {
  periodo: string;
  total_sesiones: number;
  total_recaudado: number;
  productos_vendidos: number;
  total_costos: number;
  utilidad: number;
  desglose: DesgloseVentaDTO[];
}

export class ObtenerHistorialVentas {
  async ejecutar(periodo: string): Promise<HistorialVentasDTO> {
    const pool = getPool();

    const configs: Record<string, { unit: string; start: string }> = {
      day: { unit: 'hour', start: 'CURRENT_DATE' },
      week: { unit: 'day', start: "CURRENT_DATE - INTERVAL '7 days'" },
      month: { unit: 'day', start: "DATE_TRUNC('month', CURRENT_DATE)" },
      year: { unit: 'month', start: "DATE_TRUNC('year', CURRENT_DATE)" },
    };

    const config = configs[periodo];

    const result = await pool.query(
      `SELECT
         DATE_TRUNC($1::text, s.abierta_en) AS fecha,
         COUNT(DISTINCT s.id)::int AS sesiones,
         COALESCE(SUM(s.total), 0)::numeric AS total,
         COUNT(isel.id)::int AS items,
         COALESCE(SUM(isel.cantidad * v.costo), 0)::numeric AS costo
       FROM sesiones s
       LEFT JOIN items_sesion isel ON isel.sesion_id = s.id
       LEFT JOIN variantes v ON v.id = isel.variante_id
       WHERE s.estado = 'cerrada'
         AND s.abierta_en >= ${config.start}
       GROUP BY DATE_TRUNC($1::text, s.abierta_en)
       ORDER BY fecha`,
      [config.unit],
    );

    const desglose: DesgloseVentaDTO[] = result.rows.map(
      (row: Record<string, unknown>) => {
        const total = Number(row.total);
        const costo = Number(row.costo);
        return {
          fecha: String(row.fecha),
          sesiones: Number(row.sesiones),
          total,
          costo,
          utilidad: total - costo,
        };
      },
    );

    const total_sesiones = desglose.reduce((acc, d) => acc + d.sesiones, 0);
    const total_recaudado = desglose.reduce((acc, d) => acc + d.total, 0);
    const total_costos = desglose.reduce((acc, d) => acc + d.costo, 0);
    const productos_vendidos = result.rows.reduce(
      (acc: number, row: Record<string, unknown>) => acc + Number(row.items),
      0,
    );

    return {
      periodo,
      total_sesiones,
      total_recaudado,
      productos_vendidos,
      total_costos,
      utilidad: total_recaudado - total_costos,
      desglose,
    };
  }
}
