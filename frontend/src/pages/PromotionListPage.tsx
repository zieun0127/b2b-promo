import { useState } from 'react';
import { usePromotions } from '../hooks/usePromotions';
import { useToggleBookmark } from '../hooks/useBookmarks';
import { useMyLatestResult } from '../hooks/useMyLatestResult';
import PromotionCard from '../components/PromotionCard';
import { MBTI_TYPE_CODES } from '../constants/mbtiTypes';
import {
  ALL_MBTI_FILTER,
  filterByMbtiType,
  pickTopByBookmarks,
  sortByRecommendedThenDate,
} from '../utils/promotionBadges';

export default function PromotionListPage() {
  const { data, isLoading, isError } = usePromotions();
  const { data: latestResult } = useMyLatestResult();
  const { toggle } = useToggleBookmark();
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  if (isLoading) return <div className="promotion-list-page">불러오는 중...</div>;
  if (isError || !data) {
    return <div className="promotion-list-page auth-error">프로모션을 불러오지 못했습니다.</div>;
  }

  const ownTypeCode = latestResult?.mbti_result_type.type_code ?? ALL_MBTI_FILTER;
  const activeFilter = selectedFilter ?? ownTypeCode;
  const popular = pickTopByBookmarks(filterByMbtiType(data, ownTypeCode));
  const filtered = sortByRecommendedThenDate(filterByMbtiType(data, activeFilter));

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
        <button
          type="button"
          className={`filter-button${activeFilter === ALL_MBTI_FILTER ? ' filter-button--active' : ''}`}
          onClick={() => setSelectedFilter(ALL_MBTI_FILTER)}
        >
          전체
        </button>
        {MBTI_TYPE_CODES.map((code) => (
          <button
            key={code}
            type="button"
            className={`filter-button${activeFilter === code ? ' filter-button--active' : ''}`}
            onClick={() => setSelectedFilter(code)}
          >
            {code}
          </button>
        ))}
      </div>

      {filtered.length === 0 && <p>해당 유형에 매핑된 프로모션이 없습니다.</p>}
      <div className="promotion-grid">
        {filtered.map((promotion) => (
          <PromotionCard
            key={promotion.id}
            promotion={promotion}
            onToggleBookmark={(p) => toggle(p.id, p.is_bookmarked)}
          />
        ))}
      </div>
    </div>
  );
}
