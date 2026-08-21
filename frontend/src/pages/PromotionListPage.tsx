import { useState } from 'react';
import { usePromotions } from '../hooks/usePromotions';
import { useToggleBookmark } from '../hooks/useBookmarks';
import { useMyLatestResult } from '../hooks/useMyLatestResult';
import PromotionCard from '../components/PromotionCard';
import {
  ALL_MBTI_FILTER,
  filterByMbtiType,
  filterByStatus,
  pickTopByBookmarks,
  sortByRecommendedThenDate,
  type StatusFilter,
} from '../utils/promotionBadges';

const STATUS_FILTER_LABELS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'NEW', label: '신규' },
  { value: 'ENDING_SOON', label: '마감임박' },
  { value: 'ALWAYS_OPEN', label: '상시' },
];

export default function PromotionListPage() {
  const { data, isLoading, isError } = usePromotions();
  const { data: latestResult } = useMyLatestResult();
  const { toggle } = useToggleBookmark();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  if (isLoading) return <div className="promotion-list-page">불러오는 중...</div>;
  if (isError || !data) {
    return <div className="promotion-list-page auth-error">프로모션을 불러오지 못했습니다.</div>;
  }

  const ownTypeCode = latestResult?.mbti_result_type.type_code ?? ALL_MBTI_FILTER;
  const popular = pickTopByBookmarks(filterByMbtiType(data, ownTypeCode));
  const popularIds = new Set(popular.map((p) => p.id));
  const filtered = sortByRecommendedThenDate(filterByStatus(data, statusFilter));

  return (
    <div className="promotion-list-page">
      <h1 className="auth-title">이벤트/프로모션</h1>

      <div className="section-header">인기 프로모션 TOP3</div>
      <div className="promotion-top3-grid">
        {popular.map((promotion, index) => (
          <div className="promotion-rank-card" key={promotion.id}>
            <span className="promotion-rank">{index + 1}위</span>
            <PromotionCard
              promotion={promotion}
              onToggleBookmark={(p) => toggle(p.id, p.is_bookmarked)}
            />
          </div>
        ))}
      </div>

      <div className="section-header">프로모션 목록</div>
      <div className="promotion-filter-bar">
        {STATUS_FILTER_LABELS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            className={`filter-button${statusFilter === value ? ' filter-button--active' : ''}`}
            onClick={() => setStatusFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 && <p>해당 상태에 맞는 프로모션이 없습니다.</p>}
      <div className="promotion-grid">
        {filtered.map((promotion) => (
          <PromotionCard
            key={promotion.id}
            promotion={promotion}
            isPopular={popularIds.has(promotion.id)}
            onToggleBookmark={(p) => toggle(p.id, p.is_bookmarked)}
          />
        ))}
      </div>
    </div>
  );
}
