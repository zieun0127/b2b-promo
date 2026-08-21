import type { PromotionOfferListItem } from '../types/domain';
import { daysUntil, isEndingSoon, isNew } from '../utils/promotionBadges';

export interface PromotionCardProps {
  promotion: PromotionOfferListItem;
  onToggleBookmark?: (promotion: PromotionOfferListItem) => void;
  isPopular?: boolean;
  rank?: number;
}

export default function PromotionCard({
  promotion,
  onToggleBookmark,
  isPopular,
  rank,
}: PromotionCardProps) {
  const showNewBadge = isNew(promotion.created_at);
  const showEndingSoonBadge = isEndingSoon(promotion.ends_at);

  return (
    <div className="card promotion-card">
      <div className="promotion-card__badges">
        {rank != null && <span className="badge badge--rank">{rank}위</span>}
        {promotion.recommended && <span className="badge badge--accent">추천</span>}
        {isPopular && <span className="badge badge--success">인기</span>}
        {showNewBadge && <span className="badge badge--success">신규</span>}
        {showEndingSoonBadge && (
          <span className="badge badge--accent">마감임박(D-{daysUntil(promotion.ends_at as string)})</span>
        )}
        {promotion.mbti_type_codes.map((code) => (
          <span className="badge badge--type" key={code}>
            {code}
          </span>
        ))}
      </div>
      <p className="promotion-name">{promotion.name}</p>
      <p className="promotion-description">{promotion.description}</p>
      <div className="promotion-card__footer">
        <span className="promotion-card__bookmark-count">♥ {promotion.bookmark_count}</span>
        {onToggleBookmark && (
          <button
            type="button"
            className="bookmark-button"
            aria-label={promotion.is_bookmarked ? '북마크 해제' : '북마크 등록'}
            onClick={() => onToggleBookmark(promotion)}
          >
            {promotion.is_bookmarked ? '♥' : '♡'}
          </button>
        )}
      </div>
    </div>
  );
}
