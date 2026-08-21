import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PromotionCard from './PromotionCard';
import type { PromotionOfferListItem } from '../types/domain';

function makePromotion(overrides: Partial<PromotionOfferListItem>): PromotionOfferListItem {
  return {
    id: 'promo-1',
    name: '프로모션',
    description: '설명',
    created_at: '2020-01-01T00:00:00.000Z',
    ends_at: null,
    mbti_type_codes: ['ENFP'],
    recommended: false,
    bookmark_count: 12,
    is_bookmarked: false,
    application_count: 0,
    is_applied: false,
    ...overrides,
  };
}

describe('PromotionCard', () => {
  it('recommended가 true면 추천 뱃지를 표시한다', () => {
    render(<PromotionCard promotion={makePromotion({ recommended: true })} />);

    expect(screen.getByText('추천')).toBeInTheDocument();
  });

  it('recommended가 false면 추천 뱃지를 표시하지 않는다', () => {
    render(<PromotionCard promotion={makePromotion({ recommended: false })} />);

    expect(screen.queryByText('추천')).not.toBeInTheDocument();
  });

  it('최근 등록(7일 이내)이면 신규 뱃지를 표시한다', () => {
    const created = new Date();
    created.setDate(created.getDate() - 1);
    render(<PromotionCard promotion={makePromotion({ created_at: created.toISOString() })} />);

    expect(screen.getByText('신규')).toBeInTheDocument();
  });

  it('마감일이 7일 이내면 마감임박(D-n) 뱃지를 표시한다', () => {
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + 3);
    render(<PromotionCard promotion={makePromotion({ ends_at: endsAt.toISOString() })} />);

    expect(screen.getByText(/마감임박\(D-\d+\)/)).toBeInTheDocument();
  });

  it('ends_at이 null(상시)이면 마감임박 뱃지를 표시하지 않는다', () => {
    render(<PromotionCard promotion={makePromotion({ ends_at: null })} />);

    expect(screen.queryByText(/마감임박/)).not.toBeInTheDocument();
  });

  it('북마크 수를 표시한다', () => {
    render(<PromotionCard promotion={makePromotion({ bookmark_count: 20 })} />);

    expect(screen.getByText('♥ 20')).toBeInTheDocument();
  });

  it('is_bookmarked가 true면 채워진 하트를, false면 빈 하트를 버튼에 표시한다', () => {
    const { rerender } = render(
      <PromotionCard promotion={makePromotion({ is_bookmarked: true })} onToggleBookmark={vi.fn()} />
    );
    expect(screen.getByRole('button', { name: '북마크 해제' })).toHaveTextContent('♥');

    rerender(
      <PromotionCard promotion={makePromotion({ is_bookmarked: false })} onToggleBookmark={vi.fn()} />
    );
    expect(screen.getByRole('button', { name: '북마크 등록' })).toHaveTextContent('♡');
  });

  it('북마크 버튼 클릭 시 onToggleBookmark가 해당 프로모션과 함께 호출된다', async () => {
    const onToggleBookmark = vi.fn();
    const promotion = makePromotion({ id: 'promo-9' });
    const user = userEvent.setup();
    render(<PromotionCard promotion={promotion} onToggleBookmark={onToggleBookmark} />);

    await user.click(screen.getByRole('button', { name: '북마크 등록' }));

    expect(onToggleBookmark).toHaveBeenCalledWith(promotion);
  });

  it('onToggleBookmark가 없으면 북마크 버튼을 렌더링하지 않는다', () => {
    render(<PromotionCard promotion={makePromotion({})} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('매핑된 MBTI 유형마다 뱃지를 표시한다', () => {
    render(<PromotionCard promotion={makePromotion({ mbti_type_codes: ['ENFP', 'ISTJ'] })} />);

    expect(screen.getByText('ENFP')).toBeInTheDocument();
    expect(screen.getByText('ISTJ')).toBeInTheDocument();
  });

  it('매핑된 MBTI 유형이 없으면 유형 뱃지를 표시하지 않는다', () => {
    render(<PromotionCard promotion={makePromotion({ mbti_type_codes: [] })} />);

    expect(screen.queryByText(/^[EI][SN][TF][JP]$/)).not.toBeInTheDocument();
  });

  it('rank가 주어지면 순위 뱃지를 표시한다', () => {
    render(<PromotionCard promotion={makePromotion({})} rank={1} />);

    expect(screen.getByText('1위')).toBeInTheDocument();
  });

  it('rank가 없으면 순위 뱃지를 표시하지 않는다', () => {
    render(<PromotionCard promotion={makePromotion({})} />);

    expect(screen.queryByText(/^\d+위$/)).not.toBeInTheDocument();
  });

  it('isPopular가 true이면 인기 뱃지를 표시한다', () => {
    render(<PromotionCard promotion={makePromotion({})} isPopular />);

    expect(screen.getByText('인기')).toBeInTheDocument();
  });

  it('isPopular가 없으면 인기 뱃지를 표시하지 않는다', () => {
    render(<PromotionCard promotion={makePromotion({})} />);

    expect(screen.queryByText('인기')).not.toBeInTheDocument();
  });

  it('is_applied가 true이면 "신청완료", false면 "신청하기" 버튼을 표시한다', () => {
    const { rerender } = render(
      <PromotionCard promotion={makePromotion({ is_applied: true })} onToggleApplication={vi.fn()} />
    );
    expect(screen.getByRole('button', { name: '신청완료' })).toBeInTheDocument();

    rerender(
      <PromotionCard promotion={makePromotion({ is_applied: false })} onToggleApplication={vi.fn()} />
    );
    expect(screen.getByRole('button', { name: '신청하기' })).toBeInTheDocument();
  });

  it('신청 버튼 클릭 시 onToggleApplication이 해당 프로모션과 함께 호출된다', async () => {
    const onToggleApplication = vi.fn();
    const promotion = makePromotion({ id: 'promo-9' });
    const user = userEvent.setup();
    render(<PromotionCard promotion={promotion} onToggleApplication={onToggleApplication} />);

    await user.click(screen.getByRole('button', { name: '신청하기' }));

    expect(onToggleApplication).toHaveBeenCalledWith(promotion);
  });

  it('onToggleApplication이 없으면 신청 버튼을 렌더링하지 않는다', () => {
    render(<PromotionCard promotion={makePromotion({})} />);

    expect(screen.queryByRole('button', { name: /신청/ })).not.toBeInTheDocument();
  });
});
