import { getPool } from '../../../infraestructura/db/pool.js';

export interface TopProducto {
  variante_id: string;
  sku: string;
  producto_nombre: string;
  variante_nombre: string;
  total_vendido: number;
  total_recaudado: number;
}

export class ObtenerTopProductos {
  async ejecutar(): Promise<TopProducto[]> {
    const pool = getPool();

    const result = await pool.query(
      `SELECT
         v.id AS variante_id,
         v.sku,
         p.nombre AS producto_nombre,
         v.nombre AS variante_nombre,
         SUM(isel.cantidad)::int AS total_vendido,
         SUM(isel.subtotal)::numeric AS total_recaudado
       FROM items_sesion isel
       JOIN variantes v ON v.id = isel.variante_id
       JOIN productos p ON p.id = v.producto_id
       JOIN sesiones s ON s.id = isel.sesion_id
       WHERE DATE(isel.creado_en) = CURRENT_DATE AND s.estado = 'cerrada'
       GROUP BY v.id, v.sku, p.nombre, v.nombre
       ORDER BY total_vendido DESC
       LIMIT 5`,
    );

    return result.rows.map((row: Record<string, unknown>) => ({
      variante_id: row.variante_id as string,
      sku: row.sku as string,
      producto_nombre: row.producto_nombre as string,
      variante_nombre: row.variante_nombre as string,
      total_vendido: Number(row.total_vendido),
      total_recaudado: Number(row.total_recaudado),
    }));
  }
}
