import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { autorizacionMiddleware } from '../middleware/autorizacion.js';
import { adminMiddleware } from '../middleware/admin.js';
import {
  listarComprasHandler,
  obtenerCompraHandler,
  registrarCompraHandler,
  listarMovimientosHandler,
  obtenerAlertasHandler,
} from '../controladores/inventario.js';

const auth = [authMiddleware, autorizacionMiddleware];
const admin = [authMiddleware, autorizacionMiddleware, adminMiddleware];

export async function registrarRutasInventario(app: FastifyInstance) {
  // Admin-only endpoints
  app.get(
    '/api/compras',
    { preHandler: admin },
    listarComprasHandler,
  );

  app.get(
    '/api/compras/:id',
    { preHandler: admin },
    obtenerCompraHandler,
  );

  app.post(
    '/api/compras',
    { preHandler: admin },
    registrarCompraHandler,
  );

  // Auth-only endpoints (any active user)
  app.get(
    '/api/inventario/movimientos',
    { preHandler: auth },
    listarMovimientosHandler,
  );

  app.get(
    '/api/inventario/alertas',
    { preHandler: auth },
    obtenerAlertasHandler,
  );
}
