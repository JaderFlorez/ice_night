import { getPool } from '../db/pool.js';
import { Producto, ProductoConVariantes, Categoria } from '../../core/dominio/producto.js';
import { Variante } from '../../core/dominio/variante.js';
import { ProductoRepositorio } from '../../core/dominio/repositorios.js';

function mapearProducto(row: Record<string, unknown>): Producto {
  return {
    id: row.id as string,
    nombre: row.nombre as string,
    descripcion: row.descripcion as string | undefined,
    categoria: row.categoria as Categoria,
    tiene_variantes: row.tiene_variantes as boolean,
    activo: row.activo as boolean,
    created_at: row.created_at as string,
  };
}

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

export class ProductoRepositorioImpl implements ProductoRepositorio {
  async findAll(q?: string, categoria?: string): Promise<ProductoConVariantes[]> {
    const pool = getPool();
    const params: unknown[] = [];
    let where = 'WHERE p.activo = true';
    let idx = 1;

    if (q) {
      where += ` AND p.nombre ILIKE $${idx++}`;
      params.push(`%${q}%`);
    }
    if (categoria) {
      where += ` AND p.categoria = $${idx++}`;
      params.push(categoria);
    }

    const query = `
      SELECT p.*, v.id AS v_id, v.producto_id, v.nombre AS v_nombre, v.sku,
             v.precio, v.costo, v.stock, v.stock_minimo, v.activa, v.created_at AS v_created_at
      FROM productos p
      LEFT JOIN variantes v ON v.producto_id = p.id AND v.activa = true
      ${where}
      ORDER BY p.nombre
    `;

    const result = await pool.query(query, params);

    const mapa = new Map<string, ProductoConVariantes>();

    for (const row of result.rows) {
      const pId = row.id as string;
      if (!mapa.has(pId)) {
        mapa.set(pId, {
          ...mapearProducto(row),
          variantes: [],
        });
      }
      if (row.v_id) {
        mapa.get(pId)!.variantes.push(mapearVariante({
          id: row.v_id,
          producto_id: row.producto_id,
          nombre: row.v_nombre,
          sku: row.sku,
          precio: row.precio,
          costo: row.costo,
          stock: row.stock,
          stock_minimo: row.stock_minimo,
          activa: row.activa,
          created_at: row.v_created_at,
        }));
      }
    }

    return Array.from(mapa.values());
  }

  async findById(id: string): Promise<ProductoConVariantes | null> {
    const pool = getPool();
    const query = `
      SELECT p.*, v.id AS v_id, v.producto_id, v.nombre AS v_nombre, v.sku,
             v.precio, v.costo, v.stock, v.stock_minimo, v.activa, v.created_at AS v_created_at
      FROM productos p
      LEFT JOIN variantes v ON v.producto_id = p.id AND v.activa = true
      WHERE p.id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) return null;

    const producto = mapearProducto(result.rows[0]);
    const variantes: Variante[] = [];

    for (const row of result.rows) {
      if (row.v_id) {
        variantes.push(mapearVariante({
          id: row.v_id,
          producto_id: row.producto_id,
          nombre: row.v_nombre,
          sku: row.sku,
          precio: row.precio,
          costo: row.costo,
          stock: row.stock,
          stock_minimo: row.stock_minimo,
          activa: row.activa,
          created_at: row.v_created_at,
        }));
      }
    }

    return { ...producto, variantes };
  }

  async save(producto: Producto): Promise<void> {
    const pool = getPool();
    await pool.query(
      `INSERT INTO productos (id, nombre, descripcion, categoria, tiene_variantes, activo, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        producto.id,
        producto.nombre,
        producto.descripcion ?? null,
        producto.categoria,
        producto.tiene_variantes,
        producto.activo,
        producto.created_at,
      ],
    );
  }

  async update(id: string, data: Partial<Producto>): Promise<void> {
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
      `UPDATE productos SET ${fields.join(', ')} WHERE id = $${idx}`,
      params,
    );
  }

  async delete(id: string): Promise<void> {
    const pool = getPool();
    await pool.query(
      'UPDATE productos SET activo = false WHERE id = $1',
      [id],
    );
  }
}
