import { getPool } from '../db/pool.js';
import { Mesa } from '../../core/dominio/mesa.js';
import { MesaRepositorio } from '../../core/dominio/repositorios.js';

function mapearMesa(row: Record<string, unknown>): Mesa {
  return {
    id: row.id as string,
    numero: row.numero as number,
    capacidad: row.capacidad as number,
    ubicacion: row.ubicacion as string | undefined,
    activa: row.activa as boolean,
    created_at: row.created_at as string,
  };
}

export class MesaRepositorioImpl implements MesaRepositorio {
  async findAll(): Promise<Mesa[]> {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM mesas ORDER BY numero',
    );
    return result.rows.map(mapearMesa);
  }

  async findById(id: string): Promise<Mesa | null> {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM mesas WHERE id = $1',
      [id],
    );
    return result.rows.length > 0 ? mapearMesa(result.rows[0]) : null;
  }

  async findByNumero(numero: number): Promise<Mesa | null> {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM mesas WHERE numero = $1',
      [numero],
    );
    return result.rows.length > 0 ? mapearMesa(result.rows[0]) : null;
  }

  async save(mesa: Mesa): Promise<void> {
    const pool = getPool();
    await pool.query(
      `INSERT INTO mesas (id, numero, capacidad, ubicacion, activa, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        mesa.id,
        mesa.numero,
        mesa.capacidad,
        mesa.ubicacion ?? null,
        mesa.activa,
        mesa.created_at,
      ],
    );
  }

  async update(id: string, data: Partial<Mesa>): Promise<void> {
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
      `UPDATE mesas SET ${fields.join(', ')} WHERE id = $${idx}`,
      params,
    );
  }

  async updateEstado(id: string, activa: boolean): Promise<void> {
    const pool = getPool();
    await pool.query(
      'UPDATE mesas SET activa = $1 WHERE id = $2',
      [activa, id],
    );
  }
}
