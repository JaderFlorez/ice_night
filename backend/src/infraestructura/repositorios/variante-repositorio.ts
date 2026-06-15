import { getPool } from '../db/pool.js';
import { Variante } from '../../core/dominio/variante.js';
import { VarianteRepositorio } from '../../core/dominio/repositorios.js';

function mapearVariante(row: Record<string, unknown>): Variante {
  return {
    id: row.id as string,
    producto_id: row.producto_id as string,
    nombre: row.nombre as string,
    sku: row.sku as string,
    precio: Number(row.precio),
    costo: Number(row.costo),
    stock: Number(row.stock),
    stock_minimo: Number(row.stock_minimo),
    activa: row.activa as boolean,
    created_at: row.created_at as string,
  };
}

export class VarianteRepositorioImpl implements VarianteRepositorio {
  async findByProducto(productoId: string): Promise<Variante[]> {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM variantes WHERE producto_id = $1 AND activa = true ORDER BY nombre',
      [productoId],
    );
    return result.rows.map(mapearVariante);
  }

  async findById(id: string): Promise<Variante | null> {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM variantes WHERE id = $1',
      [id],
    );
    return result.rows.length > 0 ? mapearVariante(result.rows[0]) : null;
  }

  async save(variante: Variante): Promise<void> {
    const pool = getPool();
    await pool.query(
      `INSERT INTO variantes (id, producto_id, nombre, sku, precio, costo, stock, stock_minimo, activa, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        variante.id,
        variante.producto_id,
        variante.nombre,
        variante.sku,
        variante.precio,
        variante.costo,
        variante.stock,
        variante.stock_minimo,
        variante.activa,
        variante.created_at,
      ],
    );
  }

  async update(id: string, data: Partial<Variante>): Promise<void> {
    const pool = getPool();
    const fields: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(data)) {
      if (key === 'id' || key === 'created_at') continue;
      fields.push(`${key} = $${idx++}`);
      params.push(value ?? null);
    }

    if (fields.length === 0) return;

    params.push(id);
    await pool.query(
      `UPDATE variantes SET ${fields.join(', ')} WHERE id = $${idx}`,
      params,
    );
  }

  async updateStock(id: string, cantidad: number): Promise<void> {
    const pool = getPool();
    await pool.query(
      'UPDATE variantes SET stock = $1 WHERE id = $2',
      [cantidad, id],
    );
  }

  async delete(id: string): Promise<void> {
    const pool = getPool();
    await pool.query(
      'UPDATE variantes SET activa = false WHERE id = $1',
      [id],
    );
  }
}
