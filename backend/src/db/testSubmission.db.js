const pool = require('./pool');

async function create({ userId, eiValue, snValue, tfValue, jpValue, mbtiResultTypeCode }) {
  const { rows } = await pool.query(
    `INSERT INTO test_submissions
       (user_id, ei_value, sn_value, tf_value, jp_value, mbti_result_type_code, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'COMPLETED')
     RETURNING id, user_id, submitted_at, ei_value, sn_value, tf_value, jp_value, mbti_result_type_code, status`,
    [userId, eiValue, snValue, tfValue, jpValue, mbtiResultTypeCode]
  );
  return rows[0];
}

async function findLatestByUserId(userId) {
  const { rows } = await pool.query(
    `SELECT id, user_id, submitted_at, ei_value, sn_value, tf_value, jp_value, mbti_result_type_code, status
       FROM test_submissions
      WHERE user_id = $1 AND status = 'COMPLETED'
      ORDER BY submitted_at DESC
      LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

async function findAllByUserId(userId) {
  const { rows } = await pool.query(
    `SELECT id, user_id, submitted_at, ei_value, sn_value, tf_value, jp_value, mbti_result_type_code, status
       FROM test_submissions
      WHERE user_id = $1 AND status = 'COMPLETED'
      ORDER BY submitted_at DESC`,
    [userId]
  );
  return rows;
}

module.exports = { create, findLatestByUserId, findAllByUserId };
