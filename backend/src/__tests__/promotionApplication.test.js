const request = require('supertest');
const app = require('../app');
const pool = require('../db/pool');

const createdEmails = [];
const createdUserIds = [];
const createdPromotionIds = [];

afterAll(async () => {
  if (createdPromotionIds.length > 0) {
    await pool.query('DELETE FROM promotion_applications WHERE promotion_offer_id = ANY($1)', [
      createdPromotionIds,
    ]);
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
  const email = `test-application-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  createdEmails.push(email);
  return email;
}

async function signupAndLogin(tag) {
  const email = uniqueEmail(tag);
  const password = 'password123';
  const signupRes = await request(app).post('/api/auth/signup').send({ email, password });
  const loginRes = await request(app).post('/api/auth/login').send({ email, password });
  createdUserIds.push(signupRes.body.id || loginRes.body.user.id);
  return { accessToken: loginRes.body.access_token, userId: loginRes.body.user.id, email };
}

async function loginAsAdmin() {
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: process.env.ADMIN_SEED_EMAIL, password: process.env.ADMIN_SEED_PASSWORD });
  return loginRes.body.access_token;
}

async function createPromotion(adminToken, name) {
  const res = await request(app)
    .post('/api/promotion-offers')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name, description: '설명', mbti_type_codes: ['ENFP'] });
  createdPromotionIds.push(res.body.id);
  return res.body.id;
}

describe('POST /api/applications', () => {
  it('returns 401 without an Authorization header', async () => {
    const res = await request(app)
      .post('/api/applications')
      .send({ promotion_offer_id: '00000000-0000-0000-0000-000000000000' });
    expect(res.status).toBe(401);
  });

  it('returns 404 for a non-existent promotion', async () => {
    const { accessToken } = await signupAndLogin('add-missing');

    const res = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ promotion_offer_id: '00000000-0000-0000-0000-000000000000' });

    expect(res.status).toBe(404);
  });

  it('returns 201 and does not duplicate when the same promotion is applied to twice', async () => {
    const adminToken = await loginAsAdmin();
    const promotionId = await createPromotion(adminToken, '신청대상1');
    const { accessToken, userId } = await signupAndLogin('add-twice');

    const first = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ promotion_offer_id: promotionId });
    const second = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ promotion_offer_id: promotionId });

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(first.body).toMatchObject({ promotion_offer_id: promotionId });

    const count = await pool.query(
      'SELECT count(*) FROM promotion_applications WHERE user_id = $1 AND promotion_offer_id = $2',
      [userId, promotionId]
    );
    expect(Number(count.rows[0].count)).toBe(1);
  });
});

describe('DELETE /api/applications/:promotionOfferId', () => {
  it('removes an existing application idempotently', async () => {
    const adminToken = await loginAsAdmin();
    const promotionId = await createPromotion(adminToken, '신청대상2');
    const { accessToken, userId } = await signupAndLogin('remove-existing');

    await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ promotion_offer_id: promotionId });

    const first = await request(app)
      .delete(`/api/applications/${promotionId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    const second = await request(app)
      .delete(`/api/applications/${promotionId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(first.status).toBe(204);
    expect(second.status).toBe(204);

    const count = await pool.query(
      'SELECT count(*) FROM promotion_applications WHERE user_id = $1 AND promotion_offer_id = $2',
      [userId, promotionId]
    );
    expect(Number(count.rows[0].count)).toBe(0);
  });
});

describe('application state reflected in GET /api/promotion-offers', () => {
  it('updates application_count and is_applied after add and remove', async () => {
    const adminToken = await loginAsAdmin();
    const promotionId = await createPromotion(adminToken, '신청대상3');
    const { accessToken } = await signupAndLogin('reflect');

    const before = await request(app)
      .get('/api/promotion-offers')
      .set('Authorization', `Bearer ${accessToken}`);
    const beforeItem = before.body.find((p) => p.id === promotionId);
    expect(beforeItem.application_count).toBe(0);
    expect(beforeItem.is_applied).toBe(false);

    await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ promotion_offer_id: promotionId });

    const afterAdd = await request(app)
      .get('/api/promotion-offers')
      .set('Authorization', `Bearer ${accessToken}`);
    const afterAddItem = afterAdd.body.find((p) => p.id === promotionId);
    expect(afterAddItem.application_count).toBe(1);
    expect(afterAddItem.is_applied).toBe(true);

    await request(app)
      .delete(`/api/applications/${promotionId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    const afterRemove = await request(app)
      .get('/api/promotion-offers')
      .set('Authorization', `Bearer ${accessToken}`);
    const afterRemoveItem = afterRemove.body.find((p) => p.id === promotionId);
    expect(afterRemoveItem.application_count).toBe(0);
    expect(afterRemoveItem.is_applied).toBe(false);
  });
});

describe('GET /api/promotion-offers/:id/applicants', () => {
  it('returns 401 without an Authorization header', async () => {
    const adminToken = await loginAsAdmin();
    const promotionId = await createPromotion(adminToken, '신청대상4');

    const res = await request(app).get(`/api/promotion-offers/${promotionId}/applicants`);

    expect(res.status).toBe(401);
  });

  it('returns 403 for a non-admin user', async () => {
    const adminToken = await loginAsAdmin();
    const promotionId = await createPromotion(adminToken, '신청대상5');
    const { accessToken } = await signupAndLogin('applicants-forbidden');

    const res = await request(app)
      .get(`/api/promotion-offers/${promotionId}/applicants`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(403);
  });

  it('returns 404 for a non-existent promotion', async () => {
    const adminToken = await loginAsAdmin();

    const res = await request(app)
      .get('/api/promotion-offers/00000000-0000-0000-0000-000000000000/applicants')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  it('returns applicant emails for an admin, ordered by most recent first', async () => {
    const adminToken = await loginAsAdmin();
    const promotionId = await createPromotion(adminToken, '신청대상6');
    const userA = await signupAndLogin('applicants-a');
    const userB = await signupAndLogin('applicants-b');

    await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .send({ promotion_offer_id: promotionId });
    await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${userB.accessToken}`)
      .send({ promotion_offer_id: promotionId });

    const res = await request(app)
      .get(`/api/promotion-offers/${promotionId}/applicants`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.map((a) => a.email).sort()).toEqual([userA.email, userB.email].sort());
    expect(res.body[0]).toHaveProperty('applied_at');
  });
});
