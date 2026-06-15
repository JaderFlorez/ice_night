import { FastifyRequest, FastifyReply } from 'fastify';
import { ObtenerDashboardHoy } from '../../core/aplicacion/dashboard/ObtenerDashboardHoy.js';
import { ObtenerTopProductos } from '../../core/aplicacion/dashboard/ObtenerTopProductos.js';

const obtenerDashboardHoy = new ObtenerDashboardHoy();
const obtenerTopProductos = new ObtenerTopProductos();

export async function dashboardHoyHandler(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  const data = await obtenerDashboardHoy.ejecutar();
  return reply.send({ data });
}

export async function topProductosHandler(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  const data = await obtenerTopProductos.ejecutar();
  return reply.send({ data });
}
