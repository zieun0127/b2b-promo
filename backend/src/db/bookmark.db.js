const pool = require('./pool');

async function upsert(userId, promotionOfferId) {
  const { rows } = await pool.query(
    `INSERT INTO bookmarks (user_id, promotion_offer_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, promotion_offer_id) DO NOTHING
     RETURNING promotion_offer_id, created_at`,
    [userId, promotionOfferId]
  );
  if (rows[0]) return rows[0];

  const { rows: existingRows } = await pool.query(
    `SELECT promotion_offer_id, created_at FROM bookmarks WHERE user_id = $1 AND promotion_offer_id = $2`,
    [userId, promotionOfferId]
  );
  return existingRows[0];
}

async function remove(userId, promotionOfferId) {
  await pool.query('DELETE FROM bookmarks WHERE user_id = $1 AND promotion_offer_id = $2', [
    userId,
    promotionOfferId,
  ]);
}

module.exports = { upsert, remove };
