const pool = require('./pool');

const LIST_COLUMNS = `
  po.id, po.name, po.description, po.created_at, po.ends_at,
  COALESCE(
    (SELECT array_agg(m.mbti_result_type_code) FROM mbti_result_type_promotion_offers m WHERE m.promotion_offer_id = po.id),
    '{}'
  ) AS mbti_type_codes,
  (SELECT COUNT(*)::int FROM bookmarks bk WHERE bk.promotion_offer_id = po.id) AS bookmark_count,
  EXISTS(SELECT 1 FROM bookmarks bk2 WHERE bk2.promotion_offer_id = po.id AND bk2.user_id = $1) AS is_bookmarked,
  (SELECT COUNT(*)::int FROM promotion_applications pa WHERE pa.promotion_offer_id = po.id) AS application_count,
  EXISTS(SELECT 1 FROM promotion_applications pa2 WHERE pa2.promotion_offer_id = po.id AND pa2.user_id = $1) AS is_applied
`;

async function findByResultTypeCode(typeCode) {
  const { rows } = await pool.query(
    `SELECT po.id, po.name, po.description
     FROM promotion_offers po
     JOIN mbti_result_type_promotion_offers m ON m.promotion_offer_id = po.id
     WHERE m.mbti_result_type_code = $1`,
    [typeCode]
  );
  return rows;
}

async function findAllRaw(userId) {
  const { rows } = await pool.query(
    `SELECT ${LIST_COLUMNS} FROM promotion_offers po ORDER BY po.created_at DESC`,
    [userId]
  );
  return rows;
}

async function findByIdRaw(id, userId) {
  const { rows } = await pool.query(
    `SELECT ${LIST_COLUMNS} FROM promotion_offers po WHERE po.id = $2`,
    [userId, id]
  );
  return rows[0] || null;
}

async function existsById(id) {
  const { rows } = await pool.query('SELECT 1 FROM promotion_offers WHERE id = $1', [id]);
  return rows.length > 0;
}

async function insert({ name, description, endsAt }) {
  const { rows } = await pool.query(
    `INSERT INTO promotion_offers (name, description, ends_at)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [name, description, endsAt || null]
  );
  return rows[0].id;
}

async function update(id, { name, description, endsAt }) {
  await pool.query(
    `UPDATE promotion_offers SET name = $1, description = $2, ends_at = $3 WHERE id = $4`,
    [name, description, endsAt || null, id]
  );
}

async function replaceMappings(promotionOfferId, mbtiTypeCodes) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM mbti_result_type_promotion_offers WHERE promotion_offer_id = $1', [
      promotionOfferId,
    ]);
    for (const typeCode of mbtiTypeCodes) {
      await client.query(
        `INSERT INTO mbti_result_type_promotion_offers (mbti_result_type_code, promotion_offer_id)
         VALUES ($1, $2)`,
        [typeCode, promotionOfferId]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function deleteById(id) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM bookmarks WHERE promotion_offer_id = $1', [id]);
    await client.query('DELETE FROM promotion_applications WHERE promotion_offer_id = $1', [id]);
    await client.query('DELETE FROM mbti_result_type_promotion_offers WHERE promotion_offer_id = $1', [id]);
    await client.query('DELETE FROM promotion_offers WHERE id = $1', [id]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  findByResultTypeCode,
  findAllRaw,
  findByIdRaw,
  existsById,
  insert,
  update,
  replaceMappings,
  deleteById,
};
