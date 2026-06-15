import { getPool } from '../db/pool.js';
import { Compra, ItemCompra, CompraConItems } from '../../core/dominio/compra.js';
import { CompraRepositorio } from '../../core/dominio/repositorios.js';

function mapearCompra(row: Record<string, unknown>): Compra {
  return {
    id: row.id as string,
    proveedor: row.proveedor as string | undefined,
    notas: row.notas as string | undefined,
    costo_total: Number(row.costo_total),
    creado_en: row.creado_en as string,
  };
}

function mapearItemCompra(row: Record<string, unknown>): ItemCompra {
  return {
    id: row.id as string,
    compra_id: row.compra_id as string,
    variante_id: row.variante_id as string,
    cantidad: Number(row.cantidad),
    costo_unitario: Number(row.costo_unitario),
    subtotal: Number(row.subtotal),
  };
}

export class CompraRepositorioImpl implements CompraRepositorio {
  async findAll(): Promise<CompraConItems[]> {
    const pool = getPool();
    const comprasResult = await pool.query(
      'SELECT * FROM compras ORDER BY creado_en DESC',
    );
    if (comprasResult.rows.length === 0) return [];

    const itemsResult = await pool.query(
      'SELECT * FROM items_compra WHERE compra_id = ANY($1::uuid[]) ORDER BY compra_id',
      [comprasResult.rows.map((r: Record<string, unknown>) => r.id)],
    );

    const itemsPorCompra = new Map<string, ItemCompra[]>();
    for (const row of itemsResult.rows) {
      const cId = row.compra_id as string;
      if (!itemsPorCompra.has(cId)) {
        itemsPorCompra.set(cId, []);
      }
      itemsPorCompra.get(cId)!.push(mapearItemCompra(row));
    }

    return comprasResult.rows.map((row: Record<string, unknown>) => ({
      ...mapearCompra(row),
      items: itemsPorCompra.get(row.id as string) ?? [],
    }));
  }

  async findById(id: string): Promise<CompraConItems | null> {
    const pool = getPool();
    const compraResult = await pool.query(
      'SELECT * FROM compras WHERE id = $1',
      [id],
    );
    if (compraResult.rows.length === 0) return null;

    const itemsResult = await pool.query(
      'SELECT * FROM items_compra WHERE compra_id = $1 ORDER BY id',
      [id],
    );

    return {
      ...mapearCompra(compraResult.rows[0]),
      items: itemsResult.rows.map(mapearItemCompra),
    };
  }

  async save(compra: Compra): Promise<string> {
    const pool = getPool();
    await pool.query(
      `INSERT INTO compras (id, proveedor, notas, costo_total, creado_en)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        compra.id,
        compra.proveedor ?? null,
        compra.notas ?? null,
        compra.costo_total,
        compra.creado_en,
      ],
    );
    return compra.id;
  }
}
