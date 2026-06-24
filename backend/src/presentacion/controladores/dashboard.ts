import { FastifyRequest, FastifyReply } from 'fastify';
import { ObtenerDashboardHoy } from '../../core/aplicacion/dashboard/ObtenerDashboardHoy.js';
import { ObtenerTopProductos } from '../../core/aplicacion/dashboard/ObtenerTopProductos.js';
import { ObtenerHistorialVentas } from '../../core/aplicacion/dashboard/ObtenerHistorialVentas.js';

const obtenerDashboardHoy = new ObtenerDashboardHoy();
const obtenerTopProductos = new ObtenerTopProductos();
const obtenerHistorialVentas = new ObtenerHistorialVentas();

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

export async function historialVentasHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { periodo } = request.query as { periodo?: string };
  const periodoActual = periodo ?? 'day';

  const validos = ['day', 'week', 'month', 'year'];
  if (!validos.includes(periodoActual)) {
    return reply.status(400).send({
      error: `Período inválido: "${periodoActual}". Use: day, week, month, year`,
    });
  }

  const data = await obtenerHistorialVentas.ejecutar(periodoActual);
  return reply.send({ data });
}
