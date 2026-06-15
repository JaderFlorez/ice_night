import { buildApp } from '../src/app.js';

describe('Sesiones — POST /api/mesas/:id/abrir', () => {
  it('returns 401 without token', async () => {
    const app = buildApp();
    const response = await app.inject({
      method: 'POST',
      url: '/api/mesas/123/abrir',
    });
    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body)).toHaveProperty('error');
    await app.close();
  });
});

describe('Sesiones — GET /api/sesiones/activas', () => {
  it('returns 401 without token', async () => {
    const app = buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/api/sesiones/activas',
    });
    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body)).toHaveProperty('error');
    await app.close();
  });
});

describe('Sesiones — GET /api/sesiones/:id', () => {
  it('returns 401 without token', async () => {
    const app = buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/api/sesiones/123',
    });
    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body)).toHaveProperty('error');
    await app.close();
  });
});

describe('Sesiones — POST /api/sesiones/:id/items', () => {
  it('returns 401 without token', async () => {
    const app = buildApp();
    const response = await app.inject({
      method: 'POST',
      url: '/api/sesiones/123/items',
      payload: { variante_id: '00000000-0000-0000-0000-000000000001', cantidad: 1 },
    });
    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body)).toHaveProperty('error');
    await app.close();
  });
});

describe('Sesiones — GET /api/sesiones/:id/cuenta', () => {
  it('returns 401 without token', async () => {
    const app = buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/api/sesiones/123/cuenta',
    });
    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body)).toHaveProperty('error');
    await app.close();
  });
});

describe('Sesiones — POST /api/sesiones/:id/cerrar', () => {
  it('returns 401 without token', async () => {
    const app = buildApp();
    const response = await app.inject({
      method: 'POST',
      url: '/api/sesiones/123/cerrar',
    });
    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body)).toHaveProperty('error');
    await app.close();
  });
});
