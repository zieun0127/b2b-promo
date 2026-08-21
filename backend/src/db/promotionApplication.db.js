const pool = require('./pool');

async function upsert(userId, promotionOfferId) {
  const { rows } = await pool.query(
    `INSERT INTO promotion_applications (user_id, promotion_offer_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, promotion_offer_id) DO NOTHING
     RETURNING promotion_offer_id, applied_at`,
    [userId, promotionOfferId]
  );
  if (rows[0]) return rows[0];

  const { rows: existingRows } = await pool.query(
    `SELECT promotion_offer_id, applied_at FROM promotion_applications WHERE user_id = $1 AND promotion_offer_id = $2`,
    [userId, promotionOfferId]
  );
  return existingRows[0];
}

async function remove(userId, promotionOfferId) {
  await pool.query(
    'DELETE FROM promotion_applications WHERE user_id = $1 AND promotion_offer_id = $2',
    [userId, promotionOfferId]
  );
}

async function listApplicants(promotionOfferId) {
  const { rows } = await pool.query(
    `SELECT u.email, pa.applied_at
     FROM promotion_applications pa
     JOIN users u ON u.id = pa.user_id
     WHERE pa.promotion_offer_id = $1
     ORDER BY pa.applied_at DESC`,
    [promotionOfferId]
  );
  return rows;
}

module.exports = { upsert, remove, listApplicants };
