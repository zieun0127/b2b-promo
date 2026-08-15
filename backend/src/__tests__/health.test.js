const request = require('supertest');
const app = require('../app');
const pool = require('../db/pool');

afterAll(async () => {
  await pool.end();
});

describe('GET /api/health', () => {
  it('returns 200 with status ok when DB is reachable', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('returns 500 when the DB query fails', async () => {
    jest.spyOn(pool, 'query').mockRejectedValueOnce(new Error('db down'));

    const res = await request(app).get('/api/health');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: 'db down', status: 500 });
  });
});

describe('GET /api/not-exist-path', () => {
  it('returns 404 for unregistered routes', async () => {
    const res = await request(app).get('/api/not-exist-path');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: 'Not Found', status: 404 });
  });
});
