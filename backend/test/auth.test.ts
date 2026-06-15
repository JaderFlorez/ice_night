import { buildApp } from '../src/app.js';

describe('Auth — GET /api/auth/perfil', () => {
  it('returns 401 without token', async () => {
    const app = buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/api/auth/perfil',
    });
    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body)).toHaveProperty('error');
    await app.close();
  });
});

describe('Auth — GET /api/admin/usuarios/pendientes', () => {
  it('returns 401 without token', async () => {
    const app = buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/api/admin/usuarios/pendientes',
    });
    expect(response.statusCode).toBe(401);
    await app.close();
  });
});

describe('Auth — PATCH /api/admin/usuarios/:id/estado', () => {
  it('returns 401 without token', async () => {
    const app = buildApp();
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/admin/usuarios/123/estado',
      payload: { estado: 'activo' },
    });
    expect(response.statusCode).toBe(401);
    await app.close();
  });
});
