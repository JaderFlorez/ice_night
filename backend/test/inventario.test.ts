import { buildApp } from '../src/app.js';

describe('Inventario — GET /api/compras', () => {
  it('returns 401 without token', async () => {
    const app = buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/api/compras',
    });
    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body)).toHaveProperty('error');
    await app.close();
  });
});

describe('Inventario — GET /api/compras/:id', () => {
  it('returns 401 without token', async () => {
    const app = buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/api/compras/00000000-0000-0000-0000-000000000001',
    });
    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body)).toHaveProperty('error');
    await app.close();
  });
});

describe('Inventario — POST /api/compras', () => {
  it('returns 401 without token', async () => {
    const app = buildApp();
    const response = await app.inject({
      method: 'POST',
      url: '/api/compras',
      payload: {
        items: [{ variante_id: '00000000-0000-0000-0000-000000000001', cantidad: 10, costo_unitario: 5 }],
      },
    });
    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body)).toHaveProperty('error');
    await app.close();
  });
});

describe('Inventario — GET /api/inventario/movimientos', () => {
  it('returns 401 without token', async () => {
    const app = buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/api/inventario/movimientos?variante_id=00000000-0000-0000-0000-000000000001',
    });
    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body)).toHaveProperty('error');
    await app.close();
  });
});

describe('Inventario — GET /api/inventario/alertas', () => {
  it('returns 401 without token', async () => {
    const app = buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/api/inventario/alertas',
    });
    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body)).toHaveProperty('error');
    await app.close();
  });
});
