import { FastifyRequest, FastifyReply } from 'fastify';
import { verificarToken } from '../../infraestructura/servicios/supabase-jwt.js';

declare module 'fastify' {
  interface FastifyRequest {
    usuario?: { id: string; email: string };
  }
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const header = request.headers.authorization;
    if (!header) {
      return reply.status(401).send({ error: 'Token requerido' });
    }

    const token = header.replace('Bearer ', '');
    const datos = await verificarToken(token);
    if (!datos) {
      return reply
        .status(401)
        .send({ error: 'Token inválido o expirado' });
    }

    request.usuario = datos;
  } catch (error) {
    request.log.error(error, 'Error en authMiddleware');
    return reply.status(500).send({
      error: 'Error al verificar autenticación',
    });
  }
}
