import { useAdminStats } from '../hooks/useAdminStats';
import StatsChart from '../components/StatsChart';

export default function AdminStatsPage() {
  const { data, isLoading, isError } = useAdminStats();

  if (isLoading) return <p>불러오는 중...</p>;
  if (isError || !data) return <p className="auth-error">통계를 불러오지 못했습니다.</p>;

  return (
    <div className="admin-stats-page">
      <div className="section-header">관리자 통계</div>
      <p>전체 참여자 수: {data.total_completed_submissions}명</p>
      <div className="section-header">MBTI 유형별 비율</div>
      <StatsChart
        items={data.by_result_type.map((r) => ({ label: r.type_code, count: r.count, ratio: r.ratio }))}
      />
      <div className="section-header">지표별 비율</div>
      <div className="stats-grid">
        {data.by_indicator.map((ind) => (
          <StatsChart
            key={ind.indicator}
            items={ind.traits.map((t) => ({ label: t.value, count: t.count, ratio: t.ratio }))}
          />
        ))}
      </div>
    </div>
  );
}
