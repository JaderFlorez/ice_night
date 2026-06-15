import Fastify from 'fastify';
import { registrarRutas } from './presentacion/rutas/index.js';

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  registrarRutas(app);

  return app;
}
