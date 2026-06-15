import { getPool } from '../db/pool.js';
import { Usuario, Rol, EstadoUsuario } from '../../core/dominio/usuario.js';
import { UsuarioRepositorio } from '../../core/dominio/repositorios.js';

function mapearUsuario(row: Record<string, unknown>): Usuario {
  return {
    id: row.id as string,
    email: row.email as string,
    nombre: row.nombre as string,
    rol: row.rol as Rol,
    estado: row.estado as EstadoUsuario,
    created_at: row.created_at as string,
  };
}

export class UsuarioRepositorioImpl implements UsuarioRepositorio {
  async findByEmail(email: string): Promise<Usuario | null> {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email],
    );
    return result.rows.length > 0 ? mapearUsuario(result.rows[0]) : null;
  }

  async findById(id: string): Promise<Usuario | null> {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE id = $1',
      [id],
    );
    return result.rows.length > 0 ? mapearUsuario(result.rows[0]) : null;
  }

  async save(usuario: Usuario): Promise<void> {
    const pool = getPool();
    await pool.query(
      'INSERT INTO usuarios (id, email, nombre, rol, estado) VALUES ($1, $2, $3, $4, $5)',
      [usuario.id, usuario.email, usuario.nombre, usuario.rol, usuario.estado],
    );
  }

  async updateEstado(id: string, estado: EstadoUsuario): Promise<void> {
    const pool = getPool();
    await pool.query(
      'UPDATE usuarios SET estado = $1 WHERE id = $2',
      [estado, id],
    );
  }

  async listPendientes(): Promise<Usuario[]> {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE estado = $1 ORDER BY created_at DESC',
      ['pendiente'],
    );
    return result.rows.map(mapearUsuario);
  }
}
