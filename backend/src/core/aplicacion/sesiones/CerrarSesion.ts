import { Pool } from 'pg';
import crypto from 'node:crypto';
import {
  SesionRepositorio,
  ItemSesionRepositorio,
  MovimientoStockRepositorio,
} from '../../dominio/repositorios.js';
import {
  SesionNoEncontrada,
  SesionYaCerrada,
  StockInsuficiente,
} from '../../dominio/errores.js';

export class CerrarSesion {
  constructor(
    private readonly pool: Pool,
    private readonly sesionRepo: SesionRepositorio,
    private readonly itemRepo: ItemSesionRepositorio,
    private readonly movimientoRepo: MovimientoStockRepositorio,
  ) {}

  async ejecutar(id: string, metodoPago?: string): Promise<void> {
    const sesion = await this.sesionRepo.findById(id);
    if (!sesion) {
      throw new SesionNoEncontrada();
    }
    if (sesion.estado === 'cerrada') {
      throw new SesionYaCerrada();
    }

    const items = await this.itemRepo.findBySesion(id);

    // No items → simple close via repo
    if (items.length === 0) {
      await this.sesionRepo.cerrar(id, 0, metodoPago);
      return;
    }

    // With items → transactional close
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Collect variante IDs
      const varianteIds = items.map((i) => i.variante_id);

      // FOR UPDATE lock — prevent race conditions on stock
      const lockResult = await client.query(
        'SELECT id, stock, sku FROM variantes WHERE id = ANY($1::uuid[]) FOR UPDATE',
        [varianteIds],
      );

      const stockMap = new Map<string, { stock: number; sku: string }>();
      for (const row of lockResult.rows) {
        stockMap.set(row.id as string, {
          stock: Number(row.stock),
          sku: row.sku as string,
        });
      }

      // Verify stock sufficiency
      for (const item of items) {
        const variante = stockMap.get(item.variante_id);
        if (!variante || variante.stock < item.cantidad) {
          throw new StockInsuficiente(
            variante?.sku ?? 'desconocido',
            variante?.stock ?? 0,
            item.cantidad,
          );
        }
      }

      // Deduct stock for each item
      for (const item of items) {
        await client.query(
          'UPDATE variantes SET stock = stock - $1 WHERE id = $2',
          [item.cantidad, item.variante_id],
        );
      }

      // Register stock movements
      const now = new Date().toISOString();
      for (const item of items) {
        await client.query(
          `INSERT INTO movimientos_stock (id, variante_id, cantidad, tipo, referencia_id, creado_en)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            crypto.randomUUID(),
            item.variante_id,
            -item.cantidad,
            'venta',
            id,
            now,
          ],
        );
      }

      // Calculate total from item subtotals
      const total = items.reduce((acc, i) => acc + Number(i.subtotal), 0);

      // Close the session
      await client.query(
        `UPDATE sesiones SET estado = 'cerrada', cerrada_en = $1, total = $2, metodo_pago = $3 WHERE id = $4`,
        [now, total, metodoPago ?? null, id],
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
