import { getPool } from '../db/pool.js';
import { Sesion } from '../../core/dominio/sesion.js';
import { SesionRepositorio } from '../../core/dominio/repositorios.js';

function mapearSesion(row: Record<string, unknown>): Sesion {
  return {
    id: row.id as string,
    mesa_id: row.mesa_id as string,
    mesero_id: row.mesero_id as string,
    estado: row.estado as Sesion['estado'],
    abierta_en: row.abierta_en as string,
    cerrada_en: row.cerrada_en as string | undefined,
    metodo_pago: row.metodo_pago as Sesion['metodo_pago'],
    total: row.total != null ? Number(row.total) : undefined,
  };
}

export class SesionRepositorioImpl implements SesionRepositorio {
  async findById(id: string): Promise<Sesion | null> {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM sesiones WHERE id = $1',
      [id],
    );
    return result.rows.length > 0 ? mapearSesion(result.rows[0]) : null;
  }

  async findByMesaAbierta(mesaId: string): Promise<Sesion | null> {
    const pool = getPool();
    const result = await pool.query(
      "SELECT * FROM sesiones WHERE mesa_id = $1 AND estado = 'abierta'",
      [mesaId],
    );
    return result.rows.length > 0 ? mapearSesion(result.rows[0]) : null;
  }

  async findActivas(): Promise<Sesion[]> {
    const pool = getPool();
    const result = await pool.query(
      "SELECT * FROM sesiones WHERE estado = 'abierta' ORDER BY abierta_en",
    );
    return result.rows.map(mapearSesion);
  }

  async save(sesion: Sesion): Promise<void> {
    const pool = getPool();
    await pool.query(
      `INSERT INTO sesiones (id, mesa_id, mesero_id, estado, abierta_en, cerrada_en, metodo_pago, total)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        sesion.id,
        sesion.mesa_id,
        sesion.mesero_id,
        sesion.estado,
        sesion.abierta_en,
        sesion.cerrada_en ?? null,
        sesion.metodo_pago ?? null,
        sesion.total ?? null,
      ],
    );
  }

  async update(sesion: Sesion): Promise<void> {
    const pool = getPool();
    await pool.query(
      `UPDATE sesiones SET mesa_id = $1, mesero_id = $2, estado = $3,
       abierta_en = $4, cerrada_en = $5, metodo_pago = $6, total = $7
       WHERE id = $8`,
      [
        sesion.mesa_id,
        sesion.mesero_id,
        sesion.estado,
        sesion.abierta_en,
        sesion.cerrada_en ?? null,
        sesion.metodo_pago ?? null,
        sesion.total ?? null,
        sesion.id,
      ],
    );
  }

  async cerrar(id: string, total: number, metodoPago?: string): Promise<void> {
    const pool = getPool();
    const now = new Date().toISOString();
    await pool.query(
      `UPDATE sesiones SET estado = 'cerrada', cerrada_en = $1, total = $2,
       metodo_pago = $3 WHERE id = $4`,
      [now, total, metodoPago ?? null, id],
    );
  }
}
