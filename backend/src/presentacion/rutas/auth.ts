import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { autorizacionMiddleware } from '../middleware/autorizacion.js';
import { adminMiddleware } from '../middleware/admin.js';
import {
  perfilHandler,
  listarPendientesHandler,
  aprobarUsuarioHandler,
} from '../controladores/auth.js';

export async function registrarRutasAuth(app: FastifyInstance) {
  // Perfil — solo auth, sin autorizacion (usuarios pendientes necesitan consultar)
  app.get('/api/auth/perfil', { preHandler: [authMiddleware] }, perfilHandler);

  // Admin endpoints — auth + autorizacion + admin
  app.get(
    '/api/admin/usuarios/pendientes',
    { preHandler: [authMiddleware, autorizacionMiddleware, adminMiddleware] },
    listarPendientesHandler,
  );

  app.patch(
    '/api/admin/usuarios/:id/estado',
    { preHandler: [authMiddleware, autorizacionMiddleware, adminMiddleware] },
    aprobarUsuarioHandler,
  );
}
