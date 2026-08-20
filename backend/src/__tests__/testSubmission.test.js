const request = require('supertest');
const app = require('../app');
const pool = require('../db/pool');

const createdEmails = [];
const createdUserIds = [];

afterAll(async () => {
  if (createdUserIds.length > 0) {
    await pool.query('DELETE FROM test_submissions WHERE user_id = ANY($1)', [createdUserIds]);
  }
  if (createdEmails.length > 0) {
    await pool.query('DELETE FROM users WHERE email = ANY($1)', [createdEmails]);
  }
});

function uniqueEmail(tag) {
  const email = `test-submit-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  createdEmails.push(email);
  return email;
}

async function buildAnswers(accessToken) {
  const res = await request(app)
    .get('/api/mbti-questions')
    .set('Authorization', `Bearer ${accessToken}`);

  return res.body.map((q, i) => ({ question_id: q.id, answer: i % 2 === 0 }));
}

describe('POST /api/test-submissions', () => {
  let accessToken;
  let userId;

  beforeAll(async () => {
    const email = uniqueEmail('ok');
    const password = 'password123';
    await request(app).post('/api/auth/signup').send({ email, password });
    const loginRes = await request(app).post('/api/auth/login').send({ email, password });
    accessToken = loginRes.body.access_token;
    userId = loginRes.body.user.id;
    createdUserIds.push(userId);
  });

  it('returns 401 without an Authorization header', async () => {
    const answers = await buildAnswers(accessToken);

    const res = await request(app).post('/api/test-submissions').send({ answers });

    expect(res.status).toBe(401);
  });

  it('returns 400 and creates no row when fewer than 12 answers are submitted', async () => {
    const answers = (await buildAnswers(accessToken)).slice(0, 11);

    const res = await request(app)
      .post('/api/test-submissions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ answers });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      message: '12문항 모두 답변해야 제출할 수 있습니다.',
      status: 400,
    });

    const count = await pool.query('SELECT count(*) FROM test_submissions WHERE user_id=$1', [userId]);
    expect(Number(count.rows[0].count)).toBe(0);
  });

  it('returns 201 with the judged result and promotion offers on a full submission', async () => {
    const answers = await buildAnswers(accessToken);

    const res = await request(app)
      .post('/api/test-submissions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ answers });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('COMPLETED');
    expect(res.body.mbti_result_type.type_code).toMatch(/^[EI][SN][TF][JP]$/);
    expect(typeof res.body.mbti_result_type.description).toBe('string');
    expect(typeof res.body.mbti_result_type.business_tip).toBe('string');
    expect(Array.isArray(res.body.promotion_offers)).toBe(true);
    expect(res.body.promotion_offers.length).toBeGreaterThanOrEqual(1);

    const count = await pool.query('SELECT count(*) FROM test_submissions WHERE user_id=$1', [userId]);
    expect(Number(count.rows[0].count)).toBe(1);
  });

  it('creates a second row when the same user submits again', async () => {
    const answers = await buildAnswers(accessToken);

    const res = await request(app)
      .post('/api/test-submissions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ answers });

    expect(res.status).toBe(201);

    const count = await pool.query('SELECT count(*) FROM test_submissions WHERE user_id=$1', [userId]);
    expect(Number(count.rows[0].count)).toBe(2);
  });
});

describe('GET /api/test-submissions/me/latest', () => {
  async function signupAndLogin(tag) {
    const email = uniqueEmail(tag);
    const password = 'password123';
    await request(app).post('/api/auth/signup').send({ email, password });
    const loginRes = await request(app).post('/api/auth/login').send({ email, password });
    const accessToken = loginRes.body.access_token;
    const id = loginRes.body.user.id;
    createdUserIds.push(id);
    return { accessToken, userId: id };
  }

  it('returns 401 without an Authorization header', async () => {
    const res = await request(app).get('/api/test-submissions/me/latest');

    expect(res.status).toBe(401);
  });

  it('returns 404 with the standard message for a user with no submissions', async () => {
    const { accessToken } = await signupAndLogin('latest-none');

    const res = await request(app)
      .get('/api/test-submissions/me/latest')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      message: '완료된 테스트 참여 이력이 없습니다.',
      status: 404,
    });
  });

  it('returns the completed result after a single submission', async () => {
    const { accessToken, userId: id } = await signupAndLogin('latest-one');
    const answers = await buildAnswers(accessToken);
    await request(app)
      .post('/api/test-submissions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ answers });

    const res = await request(app)
      .get('/api/test-submissions/me/latest')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user_id).toBe(id);
    expect(res.body.status).toBe('COMPLETED');
    expect(res.body.mbti_result_type.type_code).toMatch(/^[EI][SN][TF][JP]$/);
    expect(typeof res.body.mbti_result_type.description).toBe('string');
    expect(typeof res.body.mbti_result_type.business_tip).toBe('string');
    expect(Array.isArray(res.body.promotion_offers)).toBe(true);
  });

  it('returns the most recent submission when the user submits twice', async () => {
    const { accessToken } = await signupAndLogin('latest-two');
    const answers1 = await buildAnswers(accessToken);
    await request(app)
      .post('/api/test-submissions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ answers: answers1 });

    const answers2 = await buildAnswers(accessToken);
    const secondSubmitRes = await request(app)
      .post('/api/test-submissions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ answers: answers2 });

    const res = await request(app)
      .get('/api/test-submissions/me/latest')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(secondSubmitRes.body.id);
  });

  it('does not leak another user\'s result', async () => {
    const userA = await signupAndLogin('latest-a');
    const userB = await signupAndLogin('latest-b');
    const answers = await buildAnswers(userA.accessToken);
    await request(app)
      .post('/api/test-submissions')
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .send({ answers });

    const resB = await request(app)
      .get('/api/test-submissions/me/latest')
      .set('Authorization', `Bearer ${userB.accessToken}`);

    expect(resB.status).toBe(404);

    const resA = await request(app)
      .get('/api/test-submissions/me/latest')
      .set('Authorization', `Bearer ${userA.accessToken}`);

    expect(resA.status).toBe(200);
    expect(resA.body.user_id).toBe(userA.userId);
    expect(resA.body.user_id).not.toBe(userB.userId);
  });
});
