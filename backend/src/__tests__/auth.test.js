const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const pool = require('../db/pool');

const createdEmails = [];

afterAll(async () => {
  if (createdEmails.length > 0) {
    await pool.query('DELETE FROM users WHERE email = ANY($1)', [createdEmails]);
  }
});

function uniqueEmail(tag) {
  const email = `test-signup-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  createdEmails.push(email);
  return email;
}

describe('POST /api/auth/signup', () => {
  it('returns 201 with the created user and no password fields', async () => {
    const email = uniqueEmail('ok');
    const res = await request(app).post('/api/auth/signup').send({ email, password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ email, role: 'USER' });
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('created_at');
    expect(res.body).not.toHaveProperty('password');
    expect(res.body).not.toHaveProperty('password_hash');
  });

  it('returns 409 when the email is already registered', async () => {
    const email = uniqueEmail('dup');
    await request(app).post('/api/auth/signup').send({ email, password: 'password123' });

    const res = await request(app).post('/api/auth/signup').send({ email, password: 'password123' });

    expect(res.status).toBe(409);
  });

  it('returns 400 when email is missing', async () => {
    const res = await request(app).post('/api/auth/signup').send({ password: 'password123' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when email format is invalid', async () => {
    const res = await request(app).post('/api/auth/signup').send({ email: 'not-an-email', password: 'password123' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  const email = uniqueEmail('login');
  const password = 'password123';

  beforeAll(async () => {
    await request(app).post('/api/auth/signup').send({ email, password });
  });

  it('returns 200 with tokens and user info on success', async () => {
    const res = await request(app).post('/api/auth/login').send({ email, password });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('access_token');
    expect(res.body).toHaveProperty('refresh_token');
    expect(res.body.user).toMatchObject({ email });
  });

  it('returns 401 when password is wrong', async () => {
    const res = await request(app).post('/api/auth/login').send({ email, password: 'wrong-password' });

    expect(res.status).toBe(401);
  });

  it('returns 401 when email does not exist', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'no-such-user@example.com', password: 'password123' });

    expect(res.status).toBe(401);
  });

  it('returns 200 with role ADMIN for the seeded admin account', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: process.env.ADMIN_SEED_EMAIL, password: process.env.ADMIN_SEED_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('ADMIN');
  });
});

describe('POST /api/auth/refresh', () => {
  const email = uniqueEmail('refresh');
  const password = 'password123';
  let refreshToken;

  beforeAll(async () => {
    await request(app).post('/api/auth/signup').send({ email, password });
    const loginRes = await request(app).post('/api/auth/login').send({ email, password });
    refreshToken = loginRes.body.refresh_token;
  });

  it('returns 200 with a new access_token', async () => {
    const res = await request(app).post('/api/auth/refresh').send({ refresh_token: refreshToken });

    expect(res.status).toBe(200);
    expect(typeof res.body.access_token).toBe('string');
  });

  it('returns 401 for a forged token', async () => {
    const res = await request(app).post('/api/auth/refresh').send({ refresh_token: 'not-a-valid-token' });

    expect(res.status).toBe(401);
  });

  it('returns 401 for an expired token', async () => {
    const expired = jwt.sign({ sub: 'x' }, process.env.JWT_REFRESH_SECRET, { expiresIn: -10 });
    const res = await request(app).post('/api/auth/refresh').send({ refresh_token: expired });

    expect(res.status).toBe(401);
  });
});
