import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { autorizacionMiddleware } from '../middleware/autorizacion.js';
import { adminMiddleware } from '../middleware/admin.js';
import {
  dashboardHoyHandler,
  topProductosHandler,
} from '../controladores/dashboard.js';

const admin = [authMiddleware, autorizacionMiddleware, adminMiddleware];

export async function registrarRutasDashboard(app: FastifyInstance) {
  app.get(
    '/api/dashboard/hoy',
    { preHandler: admin },
    dashboardHoyHandler,
  );

  app.get(
    '/api/dashboard/top-productos',
    { preHandler: admin },
    topProductosHandler,
  );
}
