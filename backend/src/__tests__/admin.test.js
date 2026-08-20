const request = require('supertest');
const app = require('../app');
const pool = require('../db/pool');

const createdEmails = [];

afterAll(async () => {
  if (createdEmails.length > 0) {
    await pool.query('DELETE FROM users WHERE email = ANY($1)', [createdEmails]);
  }
});

function uniqueEmail(tag) {
  const email = `test-admin-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  createdEmails.push(email);
  return email;
}

describe('GET /api/admin/stats', () => {
  it('returns 401 without an Authorization header', async () => {
    const res = await request(app).get('/api/admin/stats');

    expect(res.status).toBe(401);
  });

  it('returns 403 for a regular user', async () => {
    const email = uniqueEmail('user');
    const password = 'password123';
    await request(app).post('/api/auth/signup').send({ email, password });
    const loginRes = await request(app).post('/api/auth/login').send({ email, password });

    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${loginRes.body.access_token}`);

    expect(res.status).toBe(403);
  });

  it('returns 200 with the expected shape for an admin user', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: process.env.ADMIN_SEED_EMAIL, password: process.env.ADMIN_SEED_PASSWORD });

    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${loginRes.body.access_token}`);

    expect(res.status).toBe(200);
    expect(typeof res.body.total_completed_submissions).toBe('number');
    expect(res.body.by_result_type).toHaveLength(16);
    expect(res.body.by_indicator).toHaveLength(4);
    res.body.by_indicator.forEach((indicator) => {
      expect(indicator.traits).toHaveLength(2);
    });
    expect(Array.isArray(res.body.by_promotion)).toBe(true);
    res.body.by_promotion.forEach((promotion) => {
      expect(promotion).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        recommended_match_count: expect.any(Number),
        bookmark_count: expect.any(Number),
      });
    });
  });
});
