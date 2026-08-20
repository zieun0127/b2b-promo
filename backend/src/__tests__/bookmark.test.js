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
  const email = `test-bookmark-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  createdEmails.push(email);
  return email;
}

async function signupAndLogin(tag) {
  const email = uniqueEmail(tag);
  const password = 'password123';
  const signupRes = await request(app).post('/api/auth/signup').send({ email, password });
  const loginRes = await request(app).post('/api/auth/login').send({ email, password });
  createdUserIds.push(signupRes.body.id || loginRes.body.user.id);
  return { accessToken: loginRes.body.access_token, userId: loginRes.body.user.id };
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

describe('POST /api/bookmarks', () => {
  it('returns 401 without an Authorization header', async () => {
    const res = await request(app).post('/api/bookmarks').send({ promotion_offer_id: '00000000-0000-0000-0000-000000000000' });
    expect(res.status).toBe(401);
  });

  it('returns 404 for a non-existent promotion', async () => {
    const { accessToken } = await signupAndLogin('add-missing');

    const res = await request(app)
      .post('/api/bookmarks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ promotion_offer_id: '00000000-0000-0000-0000-000000000000' });

    expect(res.status).toBe(404);
  });

  it('returns 201 and does not duplicate when the same promotion is bookmarked twice', async () => {
    const adminToken = await loginAsAdmin();
    const promotionId = await createPromotion(adminToken, '북마크대상1');
    const { accessToken, userId } = await signupAndLogin('add-twice');

    const first = await request(app)
      .post('/api/bookmarks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ promotion_offer_id: promotionId });
    const second = await request(app)
      .post('/api/bookmarks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ promotion_offer_id: promotionId });

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(first.body).toMatchObject({ promotion_offer_id: promotionId });
    expect(second.body).toMatchObject({ promotion_offer_id: promotionId });

    const count = await pool.query(
      'SELECT count(*) FROM bookmarks WHERE user_id = $1 AND promotion_offer_id = $2',
      [userId, promotionId]
    );
    expect(Number(count.rows[0].count)).toBe(1);
  });
});

describe('DELETE /api/bookmarks/:promotionOfferId', () => {
  it('returns 204 even when the promotion was never bookmarked', async () => {
    const adminToken = await loginAsAdmin();
    const promotionId = await createPromotion(adminToken, '북마크대상2');
    const { accessToken } = await signupAndLogin('remove-none');

    const res = await request(app)
      .delete(`/api/bookmarks/${promotionId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(204);
  });

  it('removes an existing bookmark idempotently', async () => {
    const adminToken = await loginAsAdmin();
    const promotionId = await createPromotion(adminToken, '북마크대상3');
    const { accessToken, userId } = await signupAndLogin('remove-existing');

    await request(app)
      .post('/api/bookmarks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ promotion_offer_id: promotionId });

    const first = await request(app)
      .delete(`/api/bookmarks/${promotionId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    const second = await request(app)
      .delete(`/api/bookmarks/${promotionId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(first.status).toBe(204);
    expect(second.status).toBe(204);

    const count = await pool.query(
      'SELECT count(*) FROM bookmarks WHERE user_id = $1 AND promotion_offer_id = $2',
      [userId, promotionId]
    );
    expect(Number(count.rows[0].count)).toBe(0);
  });
});

describe('GET /api/bookmarks', () => {
  it('returns 401 without an Authorization header', async () => {
    const res = await request(app).get('/api/bookmarks');
    expect(res.status).toBe(401);
  });

  it('returns an empty array when the user has no bookmarks', async () => {
    const { accessToken } = await signupAndLogin('list-empty');

    const res = await request(app).get('/api/bookmarks').set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns only the requesting user own bookmarks (cross-user isolation)', async () => {
    const adminToken = await loginAsAdmin();
    const promotionId = await createPromotion(adminToken, '북마크대상4');
    const userA = await signupAndLogin('list-a');
    const userB = await signupAndLogin('list-b');

    await request(app)
      .post('/api/bookmarks')
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .send({ promotion_offer_id: promotionId });

    const resA = await request(app)
      .get('/api/bookmarks')
      .set('Authorization', `Bearer ${userA.accessToken}`);
    const resB = await request(app)
      .get('/api/bookmarks')
      .set('Authorization', `Bearer ${userB.accessToken}`);

    expect(resA.body.some((p) => p.id === promotionId)).toBe(true);
    expect(resB.body.some((p) => p.id === promotionId)).toBe(false);
  });
});

describe('bookmark state reflected in GET /api/promotion-offers', () => {
  it('updates bookmark_count and is_bookmarked after add and remove', async () => {
    const adminToken = await loginAsAdmin();
    const promotionId = await createPromotion(adminToken, '북마크대상5');
    const { accessToken } = await signupAndLogin('reflect');

    const before = await request(app)
      .get('/api/promotion-offers')
      .set('Authorization', `Bearer ${accessToken}`);
    const beforeItem = before.body.find((p) => p.id === promotionId);
    expect(beforeItem.bookmark_count).toBe(0);
    expect(beforeItem.is_bookmarked).toBe(false);

    await request(app)
      .post('/api/bookmarks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ promotion_offer_id: promotionId });

    const afterAdd = await request(app)
      .get('/api/promotion-offers')
      .set('Authorization', `Bearer ${accessToken}`);
    const afterAddItem = afterAdd.body.find((p) => p.id === promotionId);
    expect(afterAddItem.bookmark_count).toBe(1);
    expect(afterAddItem.is_bookmarked).toBe(true);

    await request(app)
      .delete(`/api/bookmarks/${promotionId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    const afterRemove = await request(app)
      .get('/api/promotion-offers')
      .set('Authorization', `Bearer ${accessToken}`);
    const afterRemoveItem = afterRemove.body.find((p) => p.id === promotionId);
    expect(afterRemoveItem.bookmark_count).toBe(0);
    expect(afterRemoveItem.is_bookmarked).toBe(false);
  });
});
