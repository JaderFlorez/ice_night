import { buildApp } from '../src/app.js';

describe('GET /api/health', () => {
  const app = buildApp();

  afterAll(async () => {
    await app.close();
  });

  it('returns 200 with status ok and timestamp', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/health',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body) as Record<string, unknown>;
    expect(body).toHaveProperty('status', 'ok');
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('uptime');
    expect(typeof body.timestamp).toBe('string');
  });
});
