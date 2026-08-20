export interface StatBarItem {
  label: string;
  count: number;
  ratio: number; // 0~1
}

interface StatsChartProps {
  items: StatBarItem[];
}

export default function StatsChart({ items }: StatsChartProps) {
  return (
    <div className="stats-chart">
      {items.map((item, idx) => (
        <div className="stat-row" key={item.label}>
          <span className="stat-label">{item.label}</span>
          <div className="stat-bar">
            <div
              className={`stat-bar__fill${idx % 2 === 1 ? ' stat-bar__fill--accent' : ''}`}
              style={{ width: `${item.ratio * 100}%` }}
            />
          </div>
          <span className="stat-value">{item.count}건 ({Math.round(item.ratio * 100)}%)</span>
        </div>
      ))}
    </div>
  );
}
