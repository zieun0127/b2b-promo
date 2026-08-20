import { Link, useLocation, useNavigate } from 'react-router-dom';
import ResultSummary from '../components/ResultSummary';
import { useMyLatestResult } from '../hooks/useMyLatestResult';
import type { TestSubmissionResult } from '../types/domain';

export default function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const stateResult = location.state as TestSubmissionResult | null;
  const query = useMyLatestResult();
  const result = stateResult ?? query.data;

  return (
    <div className="result-page">
      <h1>테스트 결과</h1>
      {!stateResult && query.isLoading && <p>불러오는 중...</p>}
      {!stateResult && query.isError && <p className="auth-error">결과를 불러오지 못했습니다.</p>}
      {!stateResult && !query.isLoading && !query.isError && !result && (
        <p>
          표시할 결과가 없습니다. <Link to="/">테스트 하러 가기</Link>
        </p>
      )}
      {result && (
        <>
          <ResultSummary result={result} />
          <button type="button" onClick={() => navigate('/mypage')}>
            마이페이지로 이동
          </button>
        </>
      )}
    </div>
  );
}
