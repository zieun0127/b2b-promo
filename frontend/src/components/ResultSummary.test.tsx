import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResultSummary from './ResultSummary';
import type { TestSubmissionResult } from '../types/domain';

const result: TestSubmissionResult = {
  id: 'sub-1',
  user_id: 'user-1',
  submitted_at: '2026-01-01T00:00:00.000Z',
  ei_value: 'E',
  sn_value: 'N',
  tf_value: 'F',
  jp_value: 'P',
  status: 'COMPLETED',
  mbti_result_type: {
    type_code: 'ENFP',
    description: '유형 설명 텍스트',
    business_tip: '장사 TIP 텍스트',
  },
  promotion_offers: [
    { id: 'promo-1', name: '프로모션 A', description: '설명 A' },
    { id: 'promo-2', name: '프로모션 B', description: '설명 B' },
  ],
};

describe('ResultSummary', () => {
  it('유형 코드를 표시한다', () => {
    render(<ResultSummary result={result} />);

    expect(screen.getByText('ENFP')).toBeInTheDocument();
  });

  it('유형 설명과 장사 TIP을 표시한다', () => {
    render(<ResultSummary result={result} />);

    expect(screen.getByText('유형 설명 텍스트')).toBeInTheDocument();
    expect(screen.getByText('장사 TIP 텍스트')).toBeInTheDocument();
  });

  it('추천 프로모션 2개의 이름을 모두 표시한다', () => {
    render(<ResultSummary result={result} />);

    expect(screen.getByText('프로모션 A')).toBeInTheDocument();
    expect(screen.getByText('프로모션 B')).toBeInTheDocument();
  });

  it('hidePromotions가 true이면 추천 프로모션 섹션을 표시하지 않는다', () => {
    render(<ResultSummary result={result} hidePromotions />);

    expect(screen.queryByText('추천 프로모션')).not.toBeInTheDocument();
    expect(screen.queryByText('프로모션 A')).not.toBeInTheDocument();
  });

  it('onRetakeTest가 주어지면 재응시 버튼을 표시하고 클릭 시 호출된다', async () => {
    const onRetakeTest = vi.fn();
    render(<ResultSummary result={result} onRetakeTest={onRetakeTest} />);

    await userEvent.setup().click(screen.getByRole('button', { name: 'MBTI 테스트 다시 하기' }));

    expect(onRetakeTest).toHaveBeenCalled();
  });
});
