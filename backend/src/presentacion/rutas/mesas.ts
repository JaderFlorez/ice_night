import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { autorizacionMiddleware } from '../middleware/autorizacion.js';
import { adminMiddleware } from '../middleware/admin.js';
import {
  listarMesasHandler,
  crearMesaHandler,
  actualizarMesaHandler,
  eliminarMesaHandler,
} from '../controladores/mesas.js';

const auth = [authMiddleware, autorizacionMiddleware];
const admin = [authMiddleware, autorizacionMiddleware, adminMiddleware];

export async function registrarRutasMesas(app: FastifyInstance) {
  app.get('/api/mesas', { preHandler: auth }, listarMesasHandler);

  app.post('/api/mesas', { preHandler: admin }, crearMesaHandler);

  app.patch('/api/mesas/:id', { preHandler: admin }, actualizarMesaHandler);

  app.delete('/api/mesas/:id', { preHandler: admin }, eliminarMesaHandler);
}
