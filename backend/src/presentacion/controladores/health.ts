import { FastifyRequest, FastifyReply } from 'fastify';

export async function healthHandler(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  return reply.send({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}
