const pool = require('./pool');

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

module.exports = { findByResultTypeCode };
