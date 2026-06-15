import { getPool } from '../db/pool.js';
import { MovimientoStock } from '../../core/dominio/movimiento-stock.js';
import { MovimientoStockRepositorio } from '../../core/dominio/repositorios.js';

function mapearMovimiento(row: Record<string, unknown>): MovimientoStock {
  return {
    id: row.id as string,
    variante_id: row.variante_id as string,
    cantidad: Number(row.cantidad),
    tipo: row.tipo as MovimientoStock['tipo'],
    referencia_id: row.referencia_id as string | undefined,
    creado_en: row.creado_en as string,
  };
}

export class MovimientoStockRepositorioImpl
  implements MovimientoStockRepositorio
{
  async findByVariante(varianteId: string): Promise<MovimientoStock[]> {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM movimientos_stock WHERE variante_id = $1 ORDER BY creado_en',
      [varianteId],
    );
    return result.rows.map(mapearMovimiento);
  }

  async save(movimiento: MovimientoStock): Promise<void> {
    const pool = getPool();
    await pool.query(
      `INSERT INTO movimientos_stock (id, variante_id, cantidad, tipo, referencia_id, creado_en)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        movimiento.id,
        movimiento.variante_id,
        movimiento.cantidad,
        movimiento.tipo,
        movimiento.referencia_id ?? null,
        movimiento.creado_en,
      ],
    );
  }
}
