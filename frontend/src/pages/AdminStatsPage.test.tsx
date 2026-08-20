import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminStatsPage from './AdminStatsPage';
import { useAdminStats } from '../hooks/useAdminStats';
import type { AdminStats } from '../types/domain';

vi.mock('../hooks/useAdminStats');

const useAdminStatsMock = vi.mocked(useAdminStats);

const TYPE_CODES = [
  'ENFP', 'ENFJ', 'ENTP', 'ENTJ',
  'ESFP', 'ESFJ', 'ESTP', 'ESTJ',
  'INFP', 'INFJ', 'INTP', 'INTJ',
  'ISFP', 'ISFJ', 'ISTP', 'ISTJ',
] as const;

function makeStats(overrides?: Partial<AdminStats>): AdminStats {
  return {
    total_completed_submissions: 30,
    by_result_type: TYPE_CODES.map((type_code, idx) => ({
      type_code,
      count: idx + 1,
      ratio: (idx + 1) / 30,
    })),
    by_indicator: [
      {
        indicator: 'EI',
        traits: [
          { value: 'E', count: 15, ratio: 0.5 },
          { value: 'I', count: 15, ratio: 0.5 },
        ],
      },
      {
        indicator: 'SN',
        traits: [
          { value: 'S', count: 15, ratio: 0.5 },
          { value: 'N', count: 15, ratio: 0.5 },
        ],
      },
      {
        indicator: 'TF',
        traits: [
          { value: 'T', count: 15, ratio: 0.5 },
          { value: 'F', count: 15, ratio: 0.5 },
        ],
      },
      {
        indicator: 'JP',
        traits: [
          { value: 'J', count: 15, ratio: 0.5 },
          { value: 'P', count: 15, ratio: 0.5 },
        ],
      },
    ],
    by_promotion: [],
    ...overrides,
  };
}

const zeroStats: AdminStats = makeStats({
  total_completed_submissions: 0,
  by_result_type: TYPE_CODES.map((type_code) => ({ type_code, count: 0, ratio: 0 })),
  by_indicator: makeStats().by_indicator.map((ind) => ({
    ...ind,
    traits: ind.traits.map((t) => ({ ...t, count: 0, ratio: 0 })),
  })),
});

function mockQuery(overrides: Partial<ReturnType<typeof useAdminStats>>) {
  useAdminStatsMock.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    ...overrides,
  } as unknown as ReturnType<typeof useAdminStats>);
}

function renderPage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AdminStatsPage />
    </QueryClientProvider>,
  );
}

describe('AdminStatsPage', () => {
  it('로딩 중이면 로딩 텍스트를 표시한다', () => {
    mockQuery({ isLoading: true });

    renderPage();

    expect(screen.getByText('불러오는 중...')).toBeInTheDocument();
  });

  it('에러이면 에러 텍스트를 표시한다', () => {
    mockQuery({ isError: true });

    renderPage();

    expect(screen.getByText('통계를 불러오지 못했습니다.')).toBeInTheDocument();
  });

  it('데이터가 있으면 전체 참여자 수, 16개 유형, 8개 지표 trait을 모두 표시한다', () => {
    mockQuery({ data: makeStats() });

    renderPage();

    expect(screen.getByText('전체 참여자 수: 30명')).toBeInTheDocument();
    TYPE_CODES.forEach((code) => {
      expect(screen.getByText(code)).toBeInTheDocument();
    });
    (['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P'] as const).forEach((value) => {
      expect(screen.getAllByText(value).length).toBeGreaterThan(0);
    });
  });

  it('0건 데이터여도 크래시 없이 렌더되고 전체 참여자 수 0명과 16개 유형이 표시된다', () => {
    mockQuery({ data: zeroStats });

    renderPage();

    expect(screen.getByText('전체 참여자 수: 0명')).toBeInTheDocument();
    TYPE_CODES.forEach((code) => {
      expect(screen.getByText(code)).toBeInTheDocument();
    });
  });
});
