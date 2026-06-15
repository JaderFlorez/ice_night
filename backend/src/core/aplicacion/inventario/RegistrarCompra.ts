import { Pool } from 'pg';
import crypto from 'node:crypto';
import {
  VarianteRepositorio,
  MovimientoStockRepositorio,
} from '../../dominio/repositorios.js';
import { CompraConItems } from '../../dominio/compra.js';
import { RegistrarCompraDTO } from '../../../tipos/dto.js';

export class RegistrarCompra {
  constructor(
    private readonly pool: Pool,
    private readonly varianteRepo: VarianteRepositorio,
    private readonly movimientoRepo: MovimientoStockRepositorio,
  ) {}

  async ejecutar(dto: RegistrarCompraDTO): Promise<CompraConItems> {
    const ahora = new Date().toISOString();
    const compraId = crypto.randomUUID();

    const items = dto.items.map((item) => {
      const subtotal = item.cantidad * item.costo_unitario;
      return {
        id: crypto.randomUUID(),
        compra_id: compraId,
        variante_id: item.variante_id,
        cantidad: item.cantidad,
        costo_unitario: item.costo_unitario,
        subtotal,
      };
    });

    const costoTotal = items.reduce((acc, i) => acc + i.subtotal, 0);

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // INSERT compra
      await client.query(
        `INSERT INTO compras (id, proveedor, notas, costo_total, creado_en)
         VALUES ($1, $2, $3, $4, $5)`,
        [compraId, dto.proveedor ?? null, dto.notas ?? null, costoTotal, ahora],
      );

      // INSERT items_compra, update stock, register movement
      for (const item of items) {
        await client.query(
          `INSERT INTO items_compra (id, compra_id, variante_id, cantidad, costo_unitario, subtotal)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [item.id, item.compra_id, item.variante_id, item.cantidad, item.costo_unitario, item.subtotal],
        );

        // Update stock directly (VarianteRepositorio.updateStock uses getPool — won't participate in TX)
        await client.query(
          'UPDATE variantes SET stock = stock + $1 WHERE id = $2',
          [item.cantidad, item.variante_id],
        );

        // Register movement directly
        await client.query(
          `INSERT INTO movimientos_stock (id, variante_id, cantidad, tipo, referencia_id, creado_en)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [crypto.randomUUID(), item.variante_id, item.cantidad, 'compra', compraId, ahora],
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return {
      id: compraId,
      proveedor: dto.proveedor,
      notas: dto.notas,
      costo_total: costoTotal,
      creado_en: ahora,
      items,
    };
  }
}
