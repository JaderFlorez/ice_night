import { FastifyInstance } from 'fastify';
import { healthHandler } from '../controladores/health.js';
import { registrarRutasAuth } from './auth.js';
import { registrarRutasCatalogo } from './catalogo.js';
import { registrarRutasMesas } from './mesas.js';
import { registrarRutasSesiones } from './sesiones.js';
import { registrarRutasInventario } from './inventario.js';
import { registrarRutasDashboard } from './dashboard.js';

export async function registrarRutas(app: FastifyInstance) {
  // Health check — no requiere auth
  app.get('/api/health', healthHandler);

  // Auth routes
  await registrarRutasAuth(app);

  // Catalog routes
  await registrarRutasCatalogo(app);

  // Mesa routes
  await registrarRutasMesas(app);

  // Sesion routes
  await registrarRutasSesiones(app);

  // Inventory routes
  await registrarRutasInventario(app);

  // Dashboard routes
  await registrarRutasDashboard(app);
}
