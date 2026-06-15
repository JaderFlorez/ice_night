import { FastifyInstance } from 'fastify';
import { healthHandler } from '../controladores/health.js';
import { registrarRutasAuth } from './auth.js';

export async function registrarRutas(app: FastifyInstance) {
  // Health check — no requiere auth
  app.get('/api/health', healthHandler);

  // Auth routes
  await registrarRutasAuth(app);
}
