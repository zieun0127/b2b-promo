import { Link, useNavigate } from 'react-router-dom';
import ResultSummary from '../components/ResultSummary';
import PromotionCard from '../components/PromotionCard';
import { useMyLatestResult } from '../hooks/useMyLatestResult';
import { useMyHistory } from '../hooks/useMyHistory';
import { useBookmarks, useToggleBookmark } from '../hooks/useBookmarks';
import { useToggleApplication } from '../hooks/useApplications';
import { usePromotions } from '../hooks/usePromotions';

export default function MyPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useMyLatestResult();
  const { data: history, isLoading: isHistoryLoading, isError: isHistoryError } = useMyHistory();
  const { data: bookmarks, isLoading: isBookmarksLoading, isError: isBookmarksError } = useBookmarks();
  const { data: promotions } = usePromotions();
  const { toggle } = useToggleBookmark();
  const { toggle: toggleApplication } = useToggleApplication();
  const recommendedPromotions = promotions?.filter((p) => p.recommended) ?? [];
  const appliedPromotions = promotions?.filter((p) => p.is_applied) ?? [];

  return (
    <div className="mypage">
      <h1>마이페이지</h1>
      {isLoading && <p>불러오는 중...</p>}
      {isError && <p className="auth-error">결과를 불러오지 못했습니다.</p>}
      {!isLoading && !isError && data === null && (
        <p>
          아직 참여한 테스트가 없습니다. <Link to="/">테스트 하러 가기</Link>
        </p>
      )}
      {!isLoading && !isError && data && (
        <>
          <p className="submitted-at">최근 참여일시: {new Date(data.submitted_at).toLocaleString()}</p>
          <ResultSummary result={data} hidePromotions onRetakeTest={() => navigate('/')} />
        </>
      )}

      <div className="section-header">추천 프로모션</div>
      {recommendedPromotions.length === 0 && <p>추천 프로모션이 없습니다.</p>}
      {recommendedPromotions.length > 0 && (
        <div className="promotion-grid">
          {recommendedPromotions.map((promotion) => (
            <PromotionCard
              key={promotion.id}
              promotion={promotion}
              onToggleBookmark={(p) => toggle(p.id, p.is_bookmarked)}
              onToggleApplication={(p) => toggleApplication(p.id, p.is_applied)}
            />
          ))}
        </div>
      )}

      <div className="section-header">참여 이력</div>
      {isHistoryLoading && <p>불러오는 중...</p>}
      {isHistoryError && <p className="auth-error">참여 이력을 불러오지 못했습니다.</p>}
      {!isHistoryLoading && !isHistoryError && history && history.length === 0 && (
        <p>참여 이력이 없습니다.</p>
      )}
      {!isHistoryLoading && !isHistoryError && history && history.length > 0 && (
        <ul className="history-list">
          {history.map((submission) => (
            <li key={submission.id}>
              {new Date(submission.submitted_at).toLocaleDateString()} {submission.mbti_result_type.type_code}
            </li>
          ))}
        </ul>
      )}

      <div className="section-header">북마크한 프로모션</div>
      {isBookmarksLoading && <p>불러오는 중...</p>}
      {isBookmarksError && <p className="auth-error">북마크를 불러오지 못했습니다.</p>}
      {!isBookmarksLoading && !isBookmarksError && bookmarks && bookmarks.length === 0 && (
        <p>북마크한 프로모션이 없습니다.</p>
      )}
      {!isBookmarksLoading && !isBookmarksError && bookmarks && bookmarks.length > 0 && (
        <div className="promotion-grid">
          {bookmarks.map((promotion) => (
            <PromotionCard
              key={promotion.id}
              promotion={promotion}
              onToggleBookmark={(p) => toggle(p.id, p.is_bookmarked)}
              onToggleApplication={(p) => toggleApplication(p.id, p.is_applied)}
            />
          ))}
        </div>
      )}

      <div className="section-header">신청한 프로모션</div>
      {appliedPromotions.length === 0 && <p>신청한 프로모션이 없습니다.</p>}
      {appliedPromotions.length > 0 && (
        <div className="promotion-grid">
          {appliedPromotions.map((promotion) => (
            <PromotionCard
              key={promotion.id}
              promotion={promotion}
              onToggleBookmark={(p) => toggle(p.id, p.is_bookmarked)}
              onToggleApplication={(p) => toggleApplication(p.id, p.is_applied)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
