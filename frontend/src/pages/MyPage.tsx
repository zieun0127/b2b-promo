import { Link, useNavigate } from 'react-router-dom';
import ResultSummary from '../components/ResultSummary';
import PromotionCard from '../components/PromotionCard';
import { useMyLatestResult } from '../hooks/useMyLatestResult';
import { useMyHistory } from '../hooks/useMyHistory';
import { useBookmarks, useToggleBookmark } from '../hooks/useBookmarks';
import { useToggleApplication } from '../hooks/useApplications';

export default function MyPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useMyLatestResult();
  const { data: history, isLoading: isHistoryLoading, isError: isHistoryError } = useMyHistory();
  const { data: bookmarks, isLoading: isBookmarksLoading, isError: isBookmarksError } = useBookmarks();
  const { toggle } = useToggleBookmark();
  const { toggle: toggleApplication } = useToggleApplication();

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
          <ResultSummary result={data} />
          <button type="button" onClick={() => navigate('/')}>
            MBTI 테스트 다시 하기
          </button>
        </>
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
    </div>
  );
}
