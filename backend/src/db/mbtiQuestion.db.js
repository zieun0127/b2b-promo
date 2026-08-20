const pool = require('./pool');

async function findAll() {
  const { rows } = await pool.query(
    'SELECT id, content, target_indicator, yes_trait_value FROM mbti_questions ORDER BY id'
  );
  return rows;
}

module.exports = { findAll };
