import { getPool } from '../../../infraestructura/db/pool.js';

export interface AlertaStock {
  variante_id: string;
  variante_nombre: string;
  sku: string;
  producto_nombre: string;
  stock: number;
  stock_minimo: number;
}

export class ObtenerAlertasStock {
  async ejecutar(): Promise<AlertaStock[]> {
    const pool = getPool();
    const result = await pool.query(
      `SELECT v.id AS variante_id, v.nombre AS variante_nombre, v.sku,
              p.nombre AS producto_nombre, v.stock, v.stock_minimo
       FROM variantes v
       JOIN productos p ON p.id = v.producto_id
       WHERE v.stock <= v.stock_minimo AND v.activa = true
       ORDER BY v.stock::numeric / NULLIF(v.stock_minimo::numeric, 0) ASC`,
    );

    return result.rows.map((row: Record<string, unknown>) => ({
      variante_id: row.variante_id as string,
      variante_nombre: row.variante_nombre as string,
      sku: row.sku as string,
      producto_nombre: row.producto_nombre as string,
      stock: Number(row.stock),
      stock_minimo: Number(row.stock_minimo),
    }));
  }
}
