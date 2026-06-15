import { buildApp } from '../src/app.js';

describe('Catalog — GET /api/productos', () => {
  it('returns 401 without token', async () => {
    const app = buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/api/productos',
    });
    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body)).toHaveProperty('error');
    await app.close();
  });
});

describe('Catalog — GET /api/productos/next-sku', () => {
  it('returns 401 without token', async () => {
    const app = buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/api/productos/next-sku?categoria=cerveza',
    });
    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body)).toHaveProperty('error');
    await app.close();
  });
});

describe('Catalog — POST /api/productos', () => {
  it('returns 401 without token', async () => {
    const app = buildApp();
    const response = await app.inject({
      method: 'POST',
      url: '/api/productos',
      payload: {
        nombre: 'Test',
        categoria: 'cerveza',
      },
    });
    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body)).toHaveProperty('error');
    await app.close();
  });
});
