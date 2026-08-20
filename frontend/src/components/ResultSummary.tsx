import type { TestSubmissionResult } from '../types/domain';

export interface ResultSummaryProps {
  result: TestSubmissionResult;
}

export default function ResultSummary({ result }: ResultSummaryProps) {
  return (
    <div className="result-summary">
      <span className="mbti-badge">{result.mbti_result_type.type_code}</span>
      <div className="section-header">유형 설명</div>
      <div className="card">{result.mbti_result_type.description}</div>
      <div className="section-header">장사 TIP</div>
      <div className="card">{result.mbti_result_type.business_tip}</div>
      <div className="section-header">추천 프로모션</div>
      {result.promotion_offers.map((o) => (
        <div className="card" key={o.id}>
          <p className="promotion-name">{o.name}</p>
          <p className="promotion-description">{o.description}</p>
        </div>
      ))}
    </div>
  );
}
