import cors from '@fastify/cors';
import Fastify from 'fastify';
import { registrarRutas } from './presentacion/rutas/index.js';

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  app.register(cors, {
    origin: true,
  });

  registrarRutas(app);

  return app;
}
