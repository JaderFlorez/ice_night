import { getPool } from '../../../infraestructura/db/pool.js';

const PREFIJOS: Record<string, string> = {
  cerveza: 'CER',
  michelada: 'MIC',
  soda: 'SOD',
  snack: 'SNA',
  otro: 'OTR',
};

export class SugerirSku {
  async ejecutar(categoria: string): Promise<string> {
    const prefijo = PREFIJOS[categoria] ?? 'GEN';
    const pool = getPool();
    const result = await pool.query(
      `SELECT sku FROM variantes WHERE sku LIKE $1 ORDER BY sku DESC LIMIT 1`,
      [`${prefijo}-%`],
    );

    if (result.rows.length === 0) {
      return `${prefijo}-001`;
    }

    const ultimoSku = result.rows[0].sku as string;
    const numero = parseInt(ultimoSku.split('-')[1], 10);
    const siguiente = numero + 1;
    return `${prefijo}-${String(siguiente).padStart(3, '0')}`;
  }
}
