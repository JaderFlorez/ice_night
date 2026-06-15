import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { autorizacionMiddleware } from '../middleware/autorizacion.js';
import { adminMiddleware } from '../middleware/admin.js';
import {
  listarProductosHandler,
  obtenerProductoHandler,
  crearProductoHandler,
  actualizarProductoHandler,
  eliminarProductoHandler,
  listarVariantesHandler,
  crearVarianteHandler,
  actualizarVarianteHandler,
  eliminarVarianteHandler,
  sugerirSkuHandler,
} from '../controladores/catalogo.js';

const auth = [authMiddleware, autorizacionMiddleware];
const admin = [authMiddleware, autorizacionMiddleware, adminMiddleware];

export async function registrarRutasCatalogo(app: FastifyInstance) {
  // ─── Productos ───

  // next-sku MUST be registered before :id to avoid matching it
  app.get(
    '/api/productos/next-sku',
    { preHandler: auth },
    sugerirSkuHandler,
  );

  app.get(
    '/api/productos',
    { preHandler: auth },
    listarProductosHandler,
  );

  app.get(
    '/api/productos/:id',
    { preHandler: auth },
    obtenerProductoHandler,
  );

  app.post(
    '/api/productos',
    { preHandler: admin },
    crearProductoHandler,
  );

  app.patch(
    '/api/productos/:id',
    { preHandler: admin },
    actualizarProductoHandler,
  );

  app.delete(
    '/api/productos/:id',
    { preHandler: admin },
    eliminarProductoHandler,
  );

  // ─── Variantes ───

  app.get(
    '/api/productos/:productoId/variantes',
    { preHandler: auth },
    listarVariantesHandler,
  );

  app.post(
    '/api/productos/:productoId/variantes',
    { preHandler: admin },
    crearVarianteHandler,
  );

  app.patch(
    '/api/variantes/:id',
    { preHandler: admin },
    actualizarVarianteHandler,
  );

  app.delete(
    '/api/variantes/:id',
    { preHandler: admin },
    eliminarVarianteHandler,
  );
}
