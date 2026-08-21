import type { PromotionOfferListItem } from '../types/domain';

export const NEW_WITHIN_DAYS = 7;
export const ENDING_SOON_WITHIN_DAYS = 7;
export const POPULAR_TOP_N = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

export function isNew(createdAt: string, now: Date = new Date()): boolean {
  const ageMs = now.getTime() - new Date(createdAt).getTime();
  return ageMs >= 0 && ageMs <= NEW_WITHIN_DAYS * DAY_MS;
}

export function isEndingSoon(endsAt: string | null, now: Date = new Date()): boolean {
  if (!endsAt) return false;
  const remainingMs = new Date(endsAt).getTime() - now.getTime();
  return remainingMs >= 0 && remainingMs <= ENDING_SOON_WITHIN_DAYS * DAY_MS;
}

export function daysUntil(endsAt: string, now: Date = new Date()): number {
  const remainingMs = new Date(endsAt).getTime() - now.getTime();
  return Math.max(0, Math.ceil(remainingMs / DAY_MS));
}

export function sortByRecommendedThenDate(
  promotions: PromotionOfferListItem[]
): PromotionOfferListItem[] {
  return [...promotions].sort((a, b) => {
    if (a.recommended !== b.recommended) return a.recommended ? -1 : 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export function pickTopByApplications(
  promotions: PromotionOfferListItem[],
  n: number = POPULAR_TOP_N
): PromotionOfferListItem[] {
  return [...promotions].sort((a, b) => b.application_count - a.application_count).slice(0, n);
}

export const ALL_MBTI_FILTER = 'ALL';

export function filterByMbtiType(
  promotions: PromotionOfferListItem[],
  filter: string
): PromotionOfferListItem[] {
  if (filter === ALL_MBTI_FILTER) return promotions;
  return promotions.filter((p) => p.mbti_type_codes.includes(filter));
}

export const STATUS_FILTERS = ['ALL', 'NEW', 'ENDING_SOON', 'MY_TYPE'] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];

export function filterByStatus(
  promotions: PromotionOfferListItem[],
  status: StatusFilter,
  now: Date = new Date(),
  ownTypeCode: string = ALL_MBTI_FILTER
): PromotionOfferListItem[] {
  switch (status) {
    case 'NEW':
      return promotions.filter((p) => isNew(p.created_at, now));
    case 'ENDING_SOON':
      return promotions.filter((p) => isEndingSoon(p.ends_at, now));
    case 'MY_TYPE':
      return filterByMbtiType(promotions, ownTypeCode);
    case 'ALL':
    default:
      return promotions;
  }
}
