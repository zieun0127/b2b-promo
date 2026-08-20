const adminStatsDb = require('../db/adminStats.db');

const INDICATOR_ORDER = { EI: ['E', 'I'], SN: ['S', 'N'], TF: ['T', 'F'], JP: ['J', 'P'] };

function computeStats({ totalCompleted, resultTypeCounts, indicatorCounts, promotionStats = [] }) {
  const ratio = (count, total) => (total === 0 ? 0 : count / total);

  const by_result_type = resultTypeCounts.map(({ type_code, count }) => ({
    type_code,
    count,
    ratio: ratio(count, totalCompleted),
  }));

  const by_indicator = Object.keys(INDICATOR_ORDER).map((indicator) => ({
    indicator,
    traits: INDICATOR_ORDER[indicator].map((value) => ({
      value,
      count: indicatorCounts[indicator][value],
      ratio: ratio(indicatorCounts[indicator][value], totalCompleted),
    })),
  }));

  const by_promotion = promotionStats.map(({ id, name, recommended_match_count, bookmark_count }) => ({
    id,
    name,
    recommended_match_count,
    bookmark_count,
  }));

  return { total_completed_submissions: totalCompleted, by_result_type, by_indicator, by_promotion };
}

async function getStats() {
  const raw = await adminStatsDb.getTotalAndIndicatorCounts();
  const resultTypeCounts = await adminStatsDb.getResultTypeCounts();
  const promotionStats = await adminStatsDb.getPromotionStats();
  return computeStats({
    totalCompleted: raw.total,
    resultTypeCounts,
    indicatorCounts: {
      EI: { E: raw.ei_e, I: raw.ei_i },
      SN: { S: raw.sn_s, N: raw.sn_n },
      TF: { T: raw.tf_t, F: raw.tf_f },
      JP: { J: raw.jp_j, P: raw.jp_p },
    },
    promotionStats,
  });
}

module.exports = { computeStats, getStats };
