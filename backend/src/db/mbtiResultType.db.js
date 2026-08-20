const pool = require('./pool');

async function findByCode(typeCode) {
  const { rows } = await pool.query(
    'SELECT type_code, description, business_tip FROM mbti_result_types WHERE type_code = $1',
    [typeCode]
  );
  return rows[0] || null;
}

module.exports = { findByCode };
