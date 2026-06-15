import { getPool } from '../db/pool.js';
import { ItemSesion } from '../../core/dominio/sesion.js';
import { ItemSesionRepositorio } from '../../core/dominio/repositorios.js';

function mapearItem(row: Record<string, unknown>): ItemSesion {
  return {
    id: row.id as string,
    sesion_id: row.sesion_id as string,
    variante_id: row.variante_id as string,
    cantidad: row.cantidad as number,
    precio_unitario: Number(row.precio_unitario),
    subtotal: Number(row.subtotal),
    creado_en: row.creado_en as string,
  };
}

export class ItemSesionRepositorioImpl implements ItemSesionRepositorio {
  async findBySesion(sesionId: string): Promise<ItemSesion[]> {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM items_sesion WHERE sesion_id = $1 ORDER BY creado_en',
      [sesionId],
    );
    return result.rows.map(mapearItem);
  }

  async save(item: ItemSesion): Promise<void> {
    const pool = getPool();
    await pool.query(
      `INSERT INTO items_sesion (id, sesion_id, variante_id, cantidad, precio_unitario, subtotal, creado_en)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        item.id,
        item.sesion_id,
        item.variante_id,
        item.cantidad,
        item.precio_unitario,
        item.subtotal,
        item.creado_en,
      ],
    );
  }

  async delete(id: string): Promise<void> {
    const pool = getPool();
    await pool.query('DELETE FROM items_sesion WHERE id = $1', [id]);
  }
}
