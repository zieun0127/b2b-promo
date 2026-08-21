import { describe, expect, it } from 'vitest';
import {
  ALL_MBTI_FILTER,
  daysUntil,
  filterByMbtiType,
  filterByStatus,
  isEndingSoon,
  isNew,
  pickTopByApplications,
  sortByRecommendedThenDate,
} from './promotionBadges';
import type { PromotionOfferListItem } from '../types/domain';

const NOW = new Date('2026-08-20T00:00:00.000Z');

function makePromotion(overrides: Partial<PromotionOfferListItem>): PromotionOfferListItem {
  return {
    id: 'promo-1',
    name: '프로모션',
    description: '설명',
    created_at: '2026-01-01T00:00:00.000Z',
    ends_at: null,
    mbti_type_codes: [],
    recommended: false,
    bookmark_count: 0,
    is_bookmarked: false,
    application_count: 0,
    is_applied: false,
    ...overrides,
  };
}

describe('isNew', () => {
  it('7일 이내 등록이면 true를 반환한다', () => {
    expect(isNew('2026-08-14T00:00:00.000Z', NOW)).toBe(true);
  });

  it('7일보다 이전에 등록됐으면 false를 반환한다', () => {
    expect(isNew('2026-08-01T00:00:00.000Z', NOW)).toBe(false);
  });

  it('미래 시점(등록 예정)이면 false를 반환한다', () => {
    expect(isNew('2026-08-21T00:00:00.000Z', NOW)).toBe(false);
  });
});

describe('isEndingSoon', () => {
  it('ends_at이 null이면 false를 반환한다(상시 프로모션)', () => {
    expect(isEndingSoon(null, NOW)).toBe(false);
  });

  it('7일 이내 마감이면 true를 반환한다', () => {
    expect(isEndingSoon('2026-08-25T00:00:00.000Z', NOW)).toBe(true);
  });

  it('7일보다 이후에 마감이면 false를 반환한다', () => {
    expect(isEndingSoon('2026-09-01T00:00:00.000Z', NOW)).toBe(false);
  });

  it('이미 마감된(과거) 시점이면 false를 반환한다', () => {
    expect(isEndingSoon('2026-08-19T00:00:00.000Z', NOW)).toBe(false);
  });
});

describe('daysUntil', () => {
  it('남은 일수를 올림해서 반환한다', () => {
    expect(daysUntil('2026-08-22T12:00:00.000Z', NOW)).toBe(3);
  });

  it('이미 지난 날짜면 0을 반환한다(음수 방지)', () => {
    expect(daysUntil('2026-08-10T00:00:00.000Z', NOW)).toBe(0);
  });
});

describe('sortByRecommendedThenDate', () => {
  it('추천을 먼저, 그 안에서는 등록일 내림차순으로 정렬한다', () => {
    const older = makePromotion({ id: 'a', created_at: '2026-01-01T00:00:00.000Z' });
    const newer = makePromotion({ id: 'b', created_at: '2026-02-01T00:00:00.000Z' });
    const recommended = makePromotion({
      id: 'c',
      created_at: '2026-01-15T00:00:00.000Z',
      recommended: true,
    });

    const result = sortByRecommendedThenDate([older, newer, recommended]);

    expect(result.map((p) => p.id)).toEqual(['c', 'b', 'a']);
  });

  it('원본 배열을 변경하지 않는다', () => {
    const list = [makePromotion({ id: 'a' }), makePromotion({ id: 'b' })];
    const original = [...list];

    sortByRecommendedThenDate(list);

    expect(list).toEqual(original);
  });
});

describe('pickTopByApplications', () => {
  it('신청 수 내림차순으로 상위 N개만 반환한다', () => {
    const list = [
      makePromotion({ id: 'a', application_count: 1 }),
      makePromotion({ id: 'b', application_count: 20 }),
      makePromotion({ id: 'c', application_count: 5 }),
      makePromotion({ id: 'd', application_count: 12 }),
    ];

    const result = pickTopByApplications(list, 3);

    expect(result.map((p) => p.id)).toEqual(['b', 'd', 'c']);
  });

  it('기본값은 3개까지만 반환한다', () => {
    const list = Array.from({ length: 5 }, (_, i) =>
      makePromotion({ id: `p${i}`, application_count: i })
    );

    expect(pickTopByApplications(list)).toHaveLength(3);
  });
});

describe('filterByMbtiType', () => {
  const enfp = makePromotion({ id: 'a', mbti_type_codes: ['ENFP'] });
  const istj = makePromotion({ id: 'b', mbti_type_codes: ['ISTJ'] });
  const both = makePromotion({ id: 'c', mbti_type_codes: ['ENFP', 'ISTJ'] });

  it('ALL_MBTI_FILTER("전체")이면 전부 반환한다', () => {
    expect(filterByMbtiType([enfp, istj, both], ALL_MBTI_FILTER)).toEqual([enfp, istj, both]);
  });

  it('특정 유형으로 필터링하면 해당 유형에 매핑된 프로모션만 반환한다', () => {
    const result = filterByMbtiType([enfp, istj, both], 'ENFP');

    expect(result.map((p) => p.id)).toEqual(['a', 'c']);
  });

  it('매핑된 프로모션이 없는 유형이면 빈 배열을 반환한다', () => {
    expect(filterByMbtiType([enfp, istj], 'INTJ')).toEqual([]);
  });
});

describe('filterByStatus', () => {
  const newOne = makePromotion({ id: 'a', created_at: '2026-08-15T00:00:00.000Z', ends_at: null });
  const endingSoon = makePromotion({
    id: 'b',
    created_at: '2026-01-01T00:00:00.000Z',
    ends_at: '2026-08-22T00:00:00.000Z',
  });
  const ended = makePromotion({
    id: 'd',
    created_at: '2026-01-01T00:00:00.000Z',
    ends_at: '2026-08-01T00:00:00.000Z',
  });
  const all = [newOne, endingSoon, ended];

  it('"ALL"이면 전부 반환한다', () => {
    expect(filterByStatus(all, 'ALL', NOW)).toEqual(all);
  });

  it('"NEW"면 최근 등록된 것만 반환한다', () => {
    expect(filterByStatus(all, 'NEW', NOW).map((p) => p.id)).toEqual(['a']);
  });

  it('"ENDING_SOON"이면 마감임박인 것만 반환한다', () => {
    expect(filterByStatus(all, 'ENDING_SOON', NOW).map((p) => p.id)).toEqual(['b']);
  });

  it('"MY_TYPE"이면 본인 유형에 매핑된 프로모션만 반환한다', () => {
    const enfp = makePromotion({ id: 'e', mbti_type_codes: ['ENFP'] });
    const istj = makePromotion({ id: 'f', mbti_type_codes: ['ISTJ'] });

    expect(filterByStatus([enfp, istj], 'MY_TYPE', NOW, 'ENFP').map((p) => p.id)).toEqual(['e']);
  });

  it('"MY_TYPE"인데 본인 유형(ownTypeCode)이 없으면 전체를 반환한다', () => {
    expect(filterByStatus(all, 'MY_TYPE', NOW)).toEqual(all);
  });
});
