const { computeStats } = require('../services/adminStats.service');

const TYPE_CODES = [
  'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
  'ISTP', 'ISFP', 'INFP', 'INTP',
  'ESTP', 'ESFP', 'ENFP', 'ENTP',
  'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ',
];

describe('computeStats', () => {
  it('returns all zero ratios (no division by zero) when there are no completed submissions', () => {
    const result = computeStats({
      totalCompleted: 0,
      resultTypeCounts: TYPE_CODES.map((type_code) => ({ type_code, count: 0 })),
      indicatorCounts: {
        EI: { E: 0, I: 0 },
        SN: { S: 0, N: 0 },
        TF: { T: 0, F: 0 },
        JP: { J: 0, P: 0 },
      },
    });

    expect(result.total_completed_submissions).toBe(0);
    expect(result.by_result_type).toHaveLength(16);
    expect(result.by_result_type.every((t) => t.ratio === 0)).toBe(true);
    expect(result.by_indicator).toHaveLength(4);
    result.by_indicator.forEach((indicator) => {
      expect(indicator.traits).toHaveLength(2);
      indicator.traits.forEach((trait) => expect(trait.ratio).toBe(0));
    });

    const allRatios = [
      ...result.by_result_type.map((t) => t.ratio),
      ...result.by_indicator.flatMap((i) => i.traits.map((t) => t.ratio)),
    ];
    expect(allRatios.every((r) => Number.isFinite(r))).toBe(true);

    expect(result.by_promotion).toEqual([]);
  });

  it('defaults by_promotion to an empty array when there are no promotions', () => {
    const result = computeStats({
      totalCompleted: 0,
      resultTypeCounts: TYPE_CODES.map((type_code) => ({ type_code, count: 0 })),
      indicatorCounts: {
        EI: { E: 0, I: 0 },
        SN: { S: 0, N: 0 },
        TF: { T: 0, F: 0 },
        JP: { J: 0, P: 0 },
      },
    });

    expect(result.by_promotion).toEqual([]);
  });

  it('passes through per-promotion recommended match and bookmark counts', () => {
    const result = computeStats({
      totalCompleted: 5,
      resultTypeCounts: TYPE_CODES.map((type_code) => ({ type_code, count: 0 })),
      indicatorCounts: {
        EI: { E: 0, I: 0 },
        SN: { S: 0, N: 0 },
        TF: { T: 0, F: 0 },
        JP: { J: 0, P: 0 },
      },
      promotionStats: [
        { id: 'promo-1', name: '프로모션 A', recommended_match_count: 3, bookmark_count: 7 },
        { id: 'promo-2', name: '프로모션 B', recommended_match_count: 0, bookmark_count: 0 },
      ],
    });

    expect(result.by_promotion).toEqual([
      { id: 'promo-1', name: '프로모션 A', recommended_match_count: 3, bookmark_count: 7 },
      { id: 'promo-2', name: '프로모션 B', recommended_match_count: 0, bookmark_count: 0 },
    ]);
  });

  it('produces ratios that sum to 1 for an arbitrary distribution', () => {
    const resultTypeCounts = TYPE_CODES.map((type_code) => ({ type_code, count: 0 }));
    resultTypeCounts.find((t) => t.type_code === 'ENTJ').count = 10;
    resultTypeCounts.find((t) => t.type_code === 'ISFP').count = 8;
    const remainingTypes = resultTypeCounts.filter((t) => t.type_code !== 'ENTJ' && t.type_code !== 'ISFP');
    let remaining = 12;
    remainingTypes.forEach((t, i) => {
      if (i === remainingTypes.length - 1) {
        t.count = remaining;
      } else {
        t.count = 1;
        remaining -= 1;
      }
    });

    const result = computeStats({
      totalCompleted: 30,
      resultTypeCounts,
      indicatorCounts: {
        EI: { E: 18, I: 12 },
        SN: { S: 15, N: 15 },
        TF: { T: 20, F: 10 },
        JP: { J: 9, P: 21 },
      },
    });

    const resultTypeRatioSum = result.by_result_type.reduce((sum, t) => sum + t.ratio, 0);
    expect(Math.abs(resultTypeRatioSum - 1)).toBeLessThan(0.0001);

    expect(result.by_indicator).toHaveLength(4);
    result.by_indicator.forEach((indicator) => {
      expect(indicator.traits).toHaveLength(2);
      const traitRatioSum = indicator.traits.reduce((sum, t) => sum + t.ratio, 0);
      expect(Math.abs(traitRatioSum - 1)).toBeLessThan(0.0001);
    });
  });
});
