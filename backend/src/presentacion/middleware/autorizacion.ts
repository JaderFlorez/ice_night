import { FastifyRequest, FastifyReply } from 'fastify';
import { getPool } from '../../infraestructura/db/pool.js';

export async function autorizacionMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (!request.usuario) {
    return reply.status(401).send({ error: 'No autenticado' });
  }

  const pool = getPool();
  const result = await pool.query(
    'SELECT estado FROM usuarios WHERE id = $1',
    [request.usuario.id],
  );

  if (result.rows.length === 0) {
    return reply.status(403).send({ error: 'Usuario no encontrado' });
  }

  if (result.rows[0].estado !== 'activo') {
    return reply.status(403).send({
      error: 'Usuario no activo',
      estado: result.rows[0].estado,
    });
  }
}
