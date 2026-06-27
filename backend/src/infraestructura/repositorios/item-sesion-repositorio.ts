import { getPool } from '../db/pool.js';
import { ItemSesion } from '../../core/dominio/sesion.js';
import { ItemSesionRepositorio } from '../../core/dominio/repositorios.js';

function mapearItem(row: Record<string, unknown>): ItemSesion {
  return {
    id: row.id as string,
    sesion_id: row.sesion_id as string,
    variante_id: row.variante_id as string,
    variante_nombre: (row.variante_nombre as string) ?? row.variante_id as string,
    cantidad: row.cantidad as number,
    precio_unitario: Number(row.precio_unitario),
    subtotal: Number(row.subtotal),
    creado_en: row.creado_en as string,
  };
}

export class ItemSesionRepositorioImpl implements ItemSesionRepositorio {
  async findById(id: string): Promise<ItemSesion | null> {
    const pool = getPool();
    const result = await pool.query(
      `SELECT i.*, CONCAT(p.nombre, ' — ', v.nombre) AS variante_nombre
       FROM items_sesion i
       JOIN variantes v ON v.id = i.variante_id
       JOIN productos p ON p.id = v.producto_id
       WHERE i.id = $1`,
      [id],
    );
    return result.rows.length > 0 ? mapearItem(result.rows[0]) : null;
  }

  async findBySesion(sesionId: string): Promise<ItemSesion[]> {
    const pool = getPool();
    const result = await pool.query(
      `SELECT i.*, CONCAT(p.nombre, ' — ', v.nombre) AS variante_nombre
       FROM items_sesion i
       JOIN variantes v ON v.id = i.variante_id
       JOIN productos p ON p.id = v.producto_id
       WHERE i.sesion_id = $1 ORDER BY i.creado_en`,
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
