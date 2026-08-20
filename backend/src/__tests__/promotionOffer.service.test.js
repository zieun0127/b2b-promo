const { annotateAndSort, validateMbtiTypeCodes } = require('../services/promotionOffer.service');

describe('annotateAndSort', () => {
  const older = { id: 'a', mbti_type_codes: ['ENFP'], created_at: '2026-01-01T00:00:00Z' };
  const newer = { id: 'b', mbti_type_codes: ['ISTJ'], created_at: '2026-02-01T00:00:00Z' };
  const matching = { id: 'c', mbti_type_codes: ['INTJ'], created_at: '2026-01-15T00:00:00Z' };

  it('marks promotions mapped to the latest type code as recommended', () => {
    const result = annotateAndSort([older, newer, matching], 'INTJ');

    const byId = Object.fromEntries(result.map((p) => [p.id, p]));
    expect(byId.a.recommended).toBe(false);
    expect(byId.b.recommended).toBe(false);
    expect(byId.c.recommended).toBe(true);
  });

  it('sorts recommended promotions first, then by created_at descending', () => {
    const result = annotateAndSort([older, newer, matching], 'INTJ');

    expect(result.map((p) => p.id)).toEqual(['c', 'b', 'a']);
  });

  it('marks every promotion as not recommended when the user has no completed result', () => {
    const result = annotateAndSort([older, newer, matching], null);

    expect(result.every((p) => p.recommended === false)).toBe(true);
    expect(result.map((p) => p.id)).toEqual(['b', 'c', 'a']);
  });
});

describe('validateMbtiTypeCodes', () => {
  it('throws a 400 AppError when the list is missing', () => {
    expect(() => validateMbtiTypeCodes(undefined)).toThrow('대상 MBTI 유형을 1개 이상 선택해야 합니다.');
  });

  it('throws a 400 AppError when the list is empty', () => {
    try {
      validateMbtiTypeCodes([]);
      throw new Error('expected to throw');
    } catch (err) {
      expect(err.status).toBe(400);
    }
  });

  it('does not throw when at least one type code is given', () => {
    expect(() => validateMbtiTypeCodes(['ENFP'])).not.toThrow();
  });
});
