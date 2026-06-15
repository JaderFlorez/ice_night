import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { autorizacionMiddleware } from '../middleware/autorizacion.js';
import {
  abrirSesionHandler,
  cerrarSesionHandler,
  obtenerSesionHandler,
  listarSesionesActivasHandler,
  agregarConsumoHandler,
  obtenerCuentaHandler,
} from '../controladores/sesiones.js';

const auth = [authMiddleware, autorizacionMiddleware];

export async function registrarRutasSesiones(app: FastifyInstance) {
  // POST /api/mesas/:id/abrir — must be registered before /api/sesiones/:id
  app.post(
    '/api/mesas/:id/abrir',
    { preHandler: auth },
    abrirSesionHandler,
  );

  app.get(
    '/api/sesiones/activas',
    { preHandler: auth },
    listarSesionesActivasHandler,
  );

  app.get(
    '/api/sesiones/:id',
    { preHandler: auth },
    obtenerSesionHandler,
  );

  app.post(
    '/api/sesiones/:id/items',
    { preHandler: auth },
    agregarConsumoHandler,
  );

  app.get(
    '/api/sesiones/:id/cuenta',
    { preHandler: auth },
    obtenerCuentaHandler,
  );

  app.post(
    '/api/sesiones/:id/cerrar',
    { preHandler: auth },
    cerrarSesionHandler,
  );
}
