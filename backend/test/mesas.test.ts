import { buildApp } from '../src/app.js';

describe('Mesas — GET /api/mesas', () => {
  it('returns 401 without token', async () => {
    const app = buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/api/mesas',
    });
    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body)).toHaveProperty('error');
    await app.close();
  });
});

describe('Mesas — POST /api/mesas', () => {
  it('returns 401 without token', async () => {
    const app = buildApp();
    const response = await app.inject({
      method: 'POST',
      url: '/api/mesas',
      payload: {
        numero: 1,
        capacidad: 4,
      },
    });
    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body)).toHaveProperty('error');
    await app.close();
  });
});

describe('Mesas — PATCH /api/mesas/:id', () => {
  it('returns 401 without token', async () => {
    const app = buildApp();
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/mesas/123',
      payload: { numero: 2 },
    });
    expect(response.statusCode).toBe(401);
    await app.close();
  });
});

describe('Mesas — DELETE /api/mesas/:id', () => {
  it('returns 401 without token', async () => {
    const app = buildApp();
    const response = await app.inject({
      method: 'DELETE',
      url: '/api/mesas/123',
    });
    expect(response.statusCode).toBe(401);
    await app.close();
  });
});
