const pool = require('./pool');

async function getTotalAndIndicatorCounts() {
  const { rows } = await pool.query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE ei_value = 'E')::int AS ei_e,
      COUNT(*) FILTER (WHERE ei_value = 'I')::int AS ei_i,
      COUNT(*) FILTER (WHERE sn_value = 'S')::int AS sn_s,
      COUNT(*) FILTER (WHERE sn_value = 'N')::int AS sn_n,
      COUNT(*) FILTER (WHERE tf_value = 'T')::int AS tf_t,
      COUNT(*) FILTER (WHERE tf_value = 'F')::int AS tf_f,
      COUNT(*) FILTER (WHERE jp_value = 'J')::int AS jp_j,
      COUNT(*) FILTER (WHERE jp_value = 'P')::int AS jp_p
    FROM test_submissions
    WHERE status = 'COMPLETED'
  `);
  return rows[0];
}

async function getResultTypeCounts() {
  const { rows } = await pool.query(`
    SELECT t.type_code AS type_code, COUNT(s.id)::int AS count
    FROM mbti_result_types t
    LEFT JOIN test_submissions s
      ON s.mbti_result_type_code = t.type_code AND s.status = 'COMPLETED'
    GROUP BY t.type_code
    ORDER BY t.type_code
  `);
  return rows;
}

module.exports = { getTotalAndIndicatorCounts, getResultTypeCounts };
