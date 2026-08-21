import type { TestSubmissionResult } from '../types/domain';

export interface ResultSummaryProps {
  result: TestSubmissionResult;
  hidePromotions?: boolean;
  onRetakeTest?: () => void;
}

export default function ResultSummary({ result, hidePromotions, onRetakeTest }: ResultSummaryProps) {
  return (
    <div className="result-summary">
      <div className="result-summary__header">
        <span className="mbti-badge">{result.mbti_result_type.type_code}</span>
        {onRetakeTest && (
          <button type="button" onClick={onRetakeTest}>
            MBTI 테스트 다시 하기
          </button>
        )}
      </div>
      <div className="section-header">유형 설명</div>
      <div className="card">{result.mbti_result_type.description}</div>
      <div className="section-header">장사 TIP</div>
      <div className="card">{result.mbti_result_type.business_tip}</div>
      {!hidePromotions && (
        <>
          <div className="section-header">추천 프로모션</div>
          {result.promotion_offers.map((o) => (
            <div className="card" key={o.id}>
              <p className="promotion-name">{o.name}</p>
              <p className="promotion-description">{o.description}</p>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
