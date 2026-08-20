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
  const email = `test-mbtiq-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  createdEmails.push(email);
  return email;
}

describe('GET /api/mbti-questions', () => {
  it('returns 401 without an Authorization header', async () => {
    const res = await request(app).get('/api/mbti-questions');

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('status');
  });

  it('returns 401 for a forged token', async () => {
    const res = await request(app)
      .get('/api/mbti-questions')
      .set('Authorization', 'Bearer invalid.token.value');

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('status');
  });

  describe('with a valid access token', () => {
    let accessToken;

    beforeAll(async () => {
      const email = uniqueEmail('ok');
      const password = 'password123';
      await request(app).post('/api/auth/signup').send({ email, password });
      const loginRes = await request(app).post('/api/auth/login').send({ email, password });
      accessToken = loginRes.body.access_token;
    });

    it('returns 200 with exactly 12 questions', async () => {
      const res = await request(app)
        .get('/api/mbti-questions')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(12);
    });

    it('returns questions with the expected fields and value domains', async () => {
      const res = await request(app)
        .get('/api/mbti-questions')
        .set('Authorization', `Bearer ${accessToken}`);

      const validIndicators = ['EI', 'SN', 'TF', 'JP'];
      const validTraits = ['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P'];

      res.body.forEach((question) => {
        expect(typeof question.id).toBe('string');
        expect(typeof question.content).toBe('string');
        expect(validIndicators).toContain(question.target_indicator);
        expect(validTraits).toContain(question.yes_trait_value);
      });
    });

    it('returns questions in a stable order across repeated calls', async () => {
      const res1 = await request(app)
        .get('/api/mbti-questions')
        .set('Authorization', `Bearer ${accessToken}`);
      const res2 = await request(app)
        .get('/api/mbti-questions')
        .set('Authorization', `Bearer ${accessToken}`);

      const ids1 = res1.body.map((q) => q.id);
      const ids2 = res2.body.map((q) => q.id);

      expect(ids1).toEqual(ids2);
    });
  });
});
