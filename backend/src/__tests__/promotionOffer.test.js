const request = require('supertest');
const app = require('../app');
const pool = require('../db/pool');

const createdEmails = [];
const createdUserIds = [];
const createdPromotionIds = [];

afterAll(async () => {
  if (createdPromotionIds.length > 0) {
    await pool.query('DELETE FROM bookmarks WHERE promotion_offer_id = ANY($1)', [createdPromotionIds]);
    await pool.query('DELETE FROM mbti_result_type_promotion_offers WHERE promotion_offer_id = ANY($1)', [
      createdPromotionIds,
    ]);
    await pool.query('DELETE FROM promotion_offers WHERE id = ANY($1)', [createdPromotionIds]);
  }
  if (createdUserIds.length > 0) {
    await pool.query('DELETE FROM test_submissions WHERE user_id = ANY($1)', [createdUserIds]);
  }
  if (createdEmails.length > 0) {
    await pool.query('DELETE FROM users WHERE email = ANY($1)', [createdEmails]);
  }
});

function uniqueEmail(tag) {
  const email = `test-promo-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  createdEmails.push(email);
  return email;
}

async function signupAndLogin(tag) {
  const email = uniqueEmail(tag);
  const password = 'password123';
  await request(app).post('/api/auth/signup').send({ email, password });
  const loginRes = await request(app).post('/api/auth/login').send({ email, password });
  createdUserIds.push(loginRes.body.user.id);
  return loginRes.body.access_token;
}

async function loginAsAdmin() {
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: process.env.ADMIN_SEED_EMAIL, password: process.env.ADMIN_SEED_PASSWORD });
  return loginRes.body.access_token;
}

async function submitCompletedTest(accessToken) {
  const questionsRes = await request(app)
    .get('/api/mbti-questions')
    .set('Authorization', `Bearer ${accessToken}`);
  const answers = questionsRes.body.map((q, i) => ({ question_id: q.id, answer: i % 2 === 0 }));

  const res = await request(app)
    .post('/api/test-submissions')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ answers });
  return res.body.mbti_result_type.type_code;
}

describe('GET /api/promotion-offers', () => {
  it('returns 401 without an Authorization header', async () => {
    const res = await request(app).get('/api/promotion-offers');
    expect(res.status).toBe(401);
  });

  it('returns the full PromotionOfferListItem shape and marks everything not recommended for a user with no history', async () => {
    const accessToken = await signupAndLogin('list-none');

    const res = await request(app)
      .get('/api/promotion-offers')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    const item = res.body[0];
    expect(item).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      description: expect.any(String),
      created_at: expect.any(String),
      recommended: false,
      bookmark_count: expect.any(Number),
      is_bookmarked: false,
    });
    expect(Array.isArray(item.mbti_type_codes)).toBe(true);
    expect(res.body.every((p) => p.recommended === false)).toBe(true);
  });

  it('sorts a promotion mapped to the user latest completed type as recommended, listed first', async () => {
    const accessToken = await signupAndLogin('list-recommend');
    const typeCode = await submitCompletedTest(accessToken);
    const adminToken = await loginAsAdmin();

    const createRes = await request(app)
      .post('/api/promotion-offers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: '테스트 추천 프로모션', description: '설명', mbti_type_codes: [typeCode] });
    createdPromotionIds.push(createRes.body.id);

    const res = await request(app)
      .get('/api/promotion-offers')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    const created = res.body.find((p) => p.id === createRes.body.id);
    expect(created.recommended).toBe(true);
    expect(res.body[0].recommended).toBe(true);
  });
});

describe('POST /api/promotion-offers', () => {
  it('returns 403 for role=USER', async () => {
    const accessToken = await signupAndLogin('create-forbidden');

    const res = await request(app)
      .post('/api/promotion-offers')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'n', description: 'd', mbti_type_codes: ['ENFP'] });

    expect(res.status).toBe(403);
  });

  it('returns 400 when mbti_type_codes is missing or empty', async () => {
    const adminToken = await loginAsAdmin();

    const res = await request(app)
      .post('/api/promotion-offers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'n', description: 'd', mbti_type_codes: [] });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('대상 MBTI 유형을 1개 이상 선택해야 합니다.');
  });

  it('creates a promotion visible immediately in the list', async () => {
    const adminToken = await loginAsAdmin();

    const createRes = await request(app)
      .post('/api/promotion-offers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: '즉시반영 프로모션', description: '설명', mbti_type_codes: ['ENFP'] });
    expect(createRes.status).toBe(201);
    createdPromotionIds.push(createRes.body.id);

    const listRes = await request(app)
      .get('/api/promotion-offers')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(listRes.body.some((p) => p.id === createRes.body.id)).toBe(true);
  });
});

describe('PUT /api/promotion-offers/:id', () => {
  it('returns 403 for role=USER', async () => {
    const adminToken = await loginAsAdmin();
    const accessToken = await signupAndLogin('update-forbidden');
    const createRes = await request(app)
      .post('/api/promotion-offers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: '수정대상', description: '설명', mbti_type_codes: ['ENFP'] });
    createdPromotionIds.push(createRes.body.id);

    const res = await request(app)
      .put(`/api/promotion-offers/${createRes.body.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: '변경', description: '변경', mbti_type_codes: ['ENFP'] });

    expect(res.status).toBe(403);
  });

  it('returns 400 when mbti_type_codes is empty', async () => {
    const adminToken = await loginAsAdmin();
    const createRes = await request(app)
      .post('/api/promotion-offers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: '수정대상2', description: '설명', mbti_type_codes: ['ENFP'] });
    createdPromotionIds.push(createRes.body.id);

    const res = await request(app)
      .put(`/api/promotion-offers/${createRes.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: '변경', description: '변경', mbti_type_codes: [] });

    expect(res.status).toBe(400);
  });

  it('returns 404 for a non-existent promotion', async () => {
    const adminToken = await loginAsAdmin();

    const res = await request(app)
      .put('/api/promotion-offers/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: '변경', description: '변경', mbti_type_codes: ['ENFP'] });

    expect(res.status).toBe(404);
  });

  it('updates fields and reflects them immediately in the list', async () => {
    const adminToken = await loginAsAdmin();
    const createRes = await request(app)
      .post('/api/promotion-offers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: '원래이름', description: '원래설명', mbti_type_codes: ['ENFP'] });
    createdPromotionIds.push(createRes.body.id);

    const updateRes = await request(app)
      .put(`/api/promotion-offers/${createRes.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: '바뀐이름', description: '바뀐설명', mbti_type_codes: ['ISTJ'] });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.name).toBe('바뀐이름');
    expect(updateRes.body.mbti_type_codes).toEqual(['ISTJ']);

    const listRes = await request(app)
      .get('/api/promotion-offers')
      .set('Authorization', `Bearer ${adminToken}`);
    const updated = listRes.body.find((p) => p.id === createRes.body.id);
    expect(updated.name).toBe('바뀐이름');
  });
});

describe('DELETE /api/promotion-offers/:id', () => {
  it('returns 403 for role=USER', async () => {
    const adminToken = await loginAsAdmin();
    const accessToken = await signupAndLogin('delete-forbidden');
    const createRes = await request(app)
      .post('/api/promotion-offers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: '삭제대상', description: '설명', mbti_type_codes: ['ENFP'] });
    createdPromotionIds.push(createRes.body.id);

    const res = await request(app)
      .delete(`/api/promotion-offers/${createRes.body.id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(403);
  });

  it('returns 404 for a non-existent promotion', async () => {
    const adminToken = await loginAsAdmin();

    const res = await request(app)
      .delete('/api/promotion-offers/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  it('removes the promotion, its mapping and bookmarks, without touching test_submissions', async () => {
    const adminToken = await loginAsAdmin();
    const accessToken = await signupAndLogin('delete-cascade');
    const userIdRes = await request(app)
      .post('/api/auth/login')
      .send({ email: createdEmails[createdEmails.length - 1], password: 'password123' });
    const userId = userIdRes.body.user.id;

    const createRes = await request(app)
      .post('/api/promotion-offers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: '연관삭제대상', description: '설명', mbti_type_codes: ['ENFP'] });
    const promotionId = createRes.body.id;

    await pool.query('INSERT INTO bookmarks (user_id, promotion_offer_id) VALUES ($1, $2)', [
      userId,
      promotionId,
    ]);

    const submissionCountBefore = await pool.query(
      'SELECT count(*) FROM test_submissions WHERE user_id = $1',
      [userId]
    );

    const deleteRes = await request(app)
      .delete(`/api/promotion-offers/${promotionId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(deleteRes.status).toBe(204);

    const promotionRow = await pool.query('SELECT 1 FROM promotion_offers WHERE id = $1', [promotionId]);
    const mappingRow = await pool.query(
      'SELECT 1 FROM mbti_result_type_promotion_offers WHERE promotion_offer_id = $1',
      [promotionId]
    );
    const bookmarkRow = await pool.query('SELECT 1 FROM bookmarks WHERE promotion_offer_id = $1', [
      promotionId,
    ]);
    expect(promotionRow.rows).toHaveLength(0);
    expect(mappingRow.rows).toHaveLength(0);
    expect(bookmarkRow.rows).toHaveLength(0);

    const submissionCountAfter = await pool.query(
      'SELECT count(*) FROM test_submissions WHERE user_id = $1',
      [userId]
    );
    expect(submissionCountAfter.rows[0].count).toBe(submissionCountBefore.rows[0].count);
  });
});
