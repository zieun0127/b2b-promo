import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PromotionListPage from './PromotionListPage';
import { usePromotions } from '../hooks/usePromotions';
import { useToggleBookmark } from '../hooks/useBookmarks';
import { useToggleApplication } from '../hooks/useApplications';
import { useMyLatestResult } from '../hooks/useMyLatestResult';
import type { PromotionOfferListItem, TestSubmissionResult } from '../types/domain';

vi.mock('../hooks/usePromotions');
vi.mock('../hooks/useBookmarks');
vi.mock('../hooks/useApplications');
vi.mock('../hooks/useMyLatestResult');

const usePromotionsMock = vi.mocked(usePromotions);
const useToggleBookmarkMock = vi.mocked(useToggleBookmark);
const useToggleApplicationMock = vi.mocked(useToggleApplication);
const useMyLatestResultMock = vi.mocked(useMyLatestResult);

function makePromotion(overrides: Partial<PromotionOfferListItem>): PromotionOfferListItem {
  return {
    id: 'promo-1',
    name: '프로모션',
    description: '설명',
    created_at: '2020-01-01T00:00:00.000Z',
    ends_at: null,
    mbti_type_codes: ['ENFP'],
    recommended: false,
    bookmark_count: 0,
    is_bookmarked: false,
    application_count: 0,
    is_applied: false,
    ...overrides,
  };
}

function makeResult(typeCode: string): TestSubmissionResult {
  return {
    id: 'sub-1',
    user_id: 'user-1',
    submitted_at: '2026-08-20T00:00:00.000Z',
    ei_value: 'E',
    sn_value: 'N',
    tf_value: 'F',
    jp_value: 'P',
    status: 'COMPLETED',
    mbti_result_type: { type_code: typeCode, description: '설명', business_tip: '팁' },
    promotion_offers: [],
  };
}

function mockPromotions(overrides: Partial<ReturnType<typeof usePromotions>>) {
  usePromotionsMock.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    ...overrides,
  } as unknown as ReturnType<typeof usePromotions>);
}

function mockLatestResult(data: TestSubmissionResult | null) {
  useMyLatestResultMock.mockReturnValue({
    data,
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof useMyLatestResult>);
}

const toggle = vi.fn();
useToggleBookmarkMock.mockReturnValue({ toggle, isLoading: false });

const toggleApplication = vi.fn();
useToggleApplicationMock.mockReturnValue({ toggle: toggleApplication, isLoading: false });

function getListGrid(): HTMLElement {
  return document.querySelector('.promotion-grid') as HTMLElement;
}

describe('PromotionListPage', () => {
  it('로딩 중이면 로딩 텍스트를 표시한다', () => {
    mockPromotions({ isLoading: true });
    mockLatestResult(null);

    render(<PromotionListPage />);

    expect(screen.getByText('불러오는 중...')).toBeInTheDocument();
  });

  it('에러이면 에러 텍스트를 표시한다', () => {
    mockPromotions({ isError: true });
    mockLatestResult(null);

    render(<PromotionListPage />);

    expect(screen.getByText('프로모션을 불러오지 못했습니다.')).toBeInTheDocument();
  });

  it('MBTI 검사 이력이 없는 사용자도(전부 recommended:false) 에러 없이 전체 목록을 표시한다', () => {
    mockLatestResult(null);
    mockPromotions({
      data: [
        makePromotion({ id: 'a', name: '프로모션A' }),
        makePromotion({ id: 'b', name: '프로모션B' }),
      ],
    });

    render(<PromotionListPage />);

    const grid = getListGrid();
    expect(within(grid).getByText('프로모션A')).toBeInTheDocument();
    expect(within(grid).getByText('프로모션B')).toBeInTheDocument();
    expect(screen.queryByText('추천')).not.toBeInTheDocument();
  });

  it('상태 필터 기본값은 "전체"이다', () => {
    mockLatestResult(null);
    mockPromotions({ data: [makePromotion({ id: 'a' })] });

    render(<PromotionListPage />);

    expect(screen.getByRole('button', { name: '전체' })).toHaveClass('filter-button--active');
  });

  it('"전체"/"신규"/"마감임박"/"내 MBTI" 상태 필터 버튼이 렌더링된다', () => {
    mockLatestResult(null);
    mockPromotions({ data: [] });

    render(<PromotionListPage />);

    ['전체', '신규', '마감임박', '내 MBTI'].forEach((label) => {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    });
  });

  it('"내 MBTI" 필터를 클릭하면 본인 유형에 매핑된 프로모션만 표시된다', async () => {
    mockLatestResult(makeResult('ISTJ'));
    mockPromotions({
      data: [
        makePromotion({ id: 'a', name: 'ISTJ용', mbti_type_codes: ['ISTJ'] }),
        makePromotion({ id: 'b', name: 'ENFP용', mbti_type_codes: ['ENFP'] }),
      ],
    });
    const user = userEvent.setup();
    render(<PromotionListPage />);

    await user.click(screen.getByRole('button', { name: '내 MBTI' }));

    const grid = getListGrid();
    expect(within(grid).getByText('ISTJ용')).toBeInTheDocument();
    expect(within(grid).queryByText('ENFP용')).not.toBeInTheDocument();
  });

  it('"신규" 필터를 클릭하면 최근 등록된 프로모션만 표시된다', async () => {
    const recent = new Date();
    recent.setDate(recent.getDate() - 1);
    mockLatestResult(null);
    mockPromotions({
      data: [
        makePromotion({ id: 'a', name: '신규프로모션', created_at: recent.toISOString() }),
        makePromotion({ id: 'b', name: '오래된프로모션', created_at: '2020-01-01T00:00:00.000Z' }),
      ],
    });
    const user = userEvent.setup();
    render(<PromotionListPage />);

    await user.click(screen.getByRole('button', { name: '신규' }));

    const grid = getListGrid();
    expect(within(grid).getByText('신규프로모션')).toBeInTheDocument();
    expect(within(grid).queryByText('오래된프로모션')).not.toBeInTheDocument();
  });

  it('"전체" 버튼을 클릭하면 상태 무관하게 모두 표시된다', async () => {
    mockLatestResult(null);
    mockPromotions({
      data: [
        makePromotion({ id: 'a', name: '최근프로모션' }),
        makePromotion({ id: 'b', name: '오래된프로모션', created_at: '2020-01-01T00:00:00.000Z' }),
      ],
    });
    const user = userEvent.setup();
    render(<PromotionListPage />);

    await user.click(screen.getByRole('button', { name: '신규' }));
    await user.click(screen.getByRole('button', { name: '전체' }));

    const grid = getListGrid();
    expect(within(grid).getByText('최근프로모션')).toBeInTheDocument();
    expect(within(grid).getByText('오래된프로모션')).toBeInTheDocument();
  });

  it('필터 결과가 0건이면 안내 문구를 표시한다', async () => {
    mockLatestResult(null);
    mockPromotions({
      data: [makePromotion({ id: 'a', created_at: '2020-01-01T00:00:00.000Z' })],
    });
    const user = userEvent.setup();
    render(<PromotionListPage />);

    await user.click(screen.getByRole('button', { name: '신규' }));

    expect(screen.getByText('해당 상태에 맞는 프로모션이 없습니다.')).toBeInTheDocument();
  });

  it('필터를 바꿔도 인기 프로모션 TOP3는 영향을 받지 않는다', async () => {
    mockLatestResult(null);
    mockPromotions({
      data: [
        makePromotion({ id: 'a', name: 'A', application_count: 10 }),
        makePromotion({ id: 'b', name: 'B', application_count: 5 }),
      ],
    });
    const user = userEvent.setup();
    render(<PromotionListPage />);

    const top3Before = screen.getByText('인기 프로모션 TOP3').nextElementSibling as HTMLElement;
    expect(within(top3Before).getByText('A')).toBeInTheDocument();
    expect(within(top3Before).getByText('B')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '신규' }));

    const top3After = screen.getByText('인기 프로모션 TOP3').nextElementSibling as HTMLElement;
    expect(within(top3After).getByText('A')).toBeInTheDocument();
    expect(within(top3After).getByText('B')).toBeInTheDocument();
  });

  it('완료된 결과가 있어도 인기 프로모션 TOP3는 본인 유형에 한정되지 않고 전체 유형에서 집계된다', () => {
    mockLatestResult(makeResult('ISTJ'));
    mockPromotions({
      data: [
        makePromotion({ id: 'a', name: 'ISTJ용', mbti_type_codes: ['ISTJ'], application_count: 1 }),
        makePromotion({ id: 'b', name: 'ENFP용', mbti_type_codes: ['ENFP'], application_count: 100 }),
      ],
    });
    render(<PromotionListPage />);

    const top3 = screen.getByText('인기 프로모션 TOP3').nextElementSibling as HTMLElement;
    expect(within(top3).getByText('ISTJ용')).toBeInTheDocument();
    expect(within(top3).getByText('ENFP용')).toBeInTheDocument();
  });

  it('인기 프로모션 TOP3 각 카드에 순위 뱃지(1위/2위/3위)가 표시된다', () => {
    mockLatestResult(null);
    mockPromotions({
      data: [
        makePromotion({ id: 'a', name: 'A', application_count: 30 }),
        makePromotion({ id: 'b', name: 'B', application_count: 20 }),
        makePromotion({ id: 'c', name: 'C', application_count: 10 }),
      ],
    });

    render(<PromotionListPage />);

    const top3 = screen.getByText('인기 프로모션 TOP3').nextElementSibling as HTMLElement;
    expect(within(top3).getByText('1위')).toBeInTheDocument();
    expect(within(top3).getByText('2위')).toBeInTheDocument();
    expect(within(top3).getByText('3위')).toBeInTheDocument();
  });

  it('인기 프로모션 TOP3에 포함된 항목은 전체 목록에서도 인기 뱃지가 표시된다', () => {
    mockLatestResult(null);
    mockPromotions({
      data: [
        makePromotion({ id: 'a', name: '인기프로모션A', application_count: 100 }),
        makePromotion({ id: 'b', name: '인기프로모션B', application_count: 90 }),
        makePromotion({ id: 'c', name: '인기프로모션C', application_count: 80 }),
        makePromotion({ id: 'd', name: '비인기프로모션', application_count: 0 }),
      ],
    });

    render(<PromotionListPage />);

    const grid = getListGrid();
    const popularCard = within(grid).getByText('인기프로모션A').closest('.card') as HTMLElement;
    const otherCard = within(grid).getByText('비인기프로모션').closest('.card') as HTMLElement;
    expect(within(popularCard).getByText('인기')).toBeInTheDocument();
    expect(within(otherCard).queryByText('인기')).not.toBeInTheDocument();
  });

  it('추천 프로모션이 목록 상단에 정렬되어 표시된다', () => {
    mockLatestResult(null);
    mockPromotions({
      data: [
        makePromotion({ id: 'a', name: '일반', created_at: '2026-02-01T00:00:00.000Z' }),
        makePromotion({
          id: 'b',
          name: '추천대상',
          recommended: true,
          created_at: '2026-01-01T00:00:00.000Z',
        }),
      ],
    });

    render(<PromotionListPage />);

    const names = within(getListGrid())
      .getAllByText(/일반|추천대상/)
      .map((el) => el.textContent);
    expect(names.indexOf('추천대상')).toBeLessThan(names.indexOf('일반'));
  });

  it('신청 수 상위 3개가 인기 프로모션 TOP3에 노출된다', () => {
    mockLatestResult(null);
    mockPromotions({
      data: [
        makePromotion({ id: 'a', name: 'A', application_count: 1 }),
        makePromotion({ id: 'b', name: 'B', application_count: 30 }),
        makePromotion({ id: 'c', name: 'C', application_count: 20 }),
        makePromotion({ id: 'd', name: 'D', application_count: 10 }),
      ],
    });

    render(<PromotionListPage />);

    expect(screen.getAllByText('B')).toHaveLength(2);
    expect(screen.getAllByText('C')).toHaveLength(2);
    expect(screen.getAllByText('D')).toHaveLength(2);
    expect(screen.getAllByText('A')).toHaveLength(1);
  });

  it('북마크 버튼 클릭 시 toggle이 프로모션 id/상태와 함께 호출된다', async () => {
    mockLatestResult(null);
    mockPromotions({ data: [makePromotion({ id: 'promo-9', is_bookmarked: false })] });
    const user = userEvent.setup();

    render(<PromotionListPage />);

    const button = within(getListGrid()).getByRole('button', { name: '북마크 등록' });
    await user.click(button);

    expect(toggle).toHaveBeenCalledWith('promo-9', false);
  });

  it('신청 버튼 클릭 시 toggleApplication이 프로모션 id/상태와 함께 호출된다', async () => {
    mockLatestResult(null);
    mockPromotions({ data: [makePromotion({ id: 'promo-9', is_applied: false })] });
    const user = userEvent.setup();

    render(<PromotionListPage />);

    const button = within(getListGrid()).getByRole('button', { name: '신청하기' });
    await user.click(button);

    expect(toggleApplication).toHaveBeenCalledWith('promo-9', false);
  });
});
