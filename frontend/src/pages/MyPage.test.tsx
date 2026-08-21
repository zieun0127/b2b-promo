import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import MyPage from './MyPage';
import { useMyLatestResult } from '../hooks/useMyLatestResult';
import { useMyHistory } from '../hooks/useMyHistory';
import { useBookmarks, useToggleBookmark } from '../hooks/useBookmarks';
import { useToggleApplication } from '../hooks/useApplications';
import { usePromotions } from '../hooks/usePromotions';
import type { PromotionOfferListItem, TestSubmissionResult } from '../types/domain';

vi.mock('../hooks/useMyLatestResult');
vi.mock('../hooks/useMyHistory');
vi.mock('../hooks/useBookmarks');
vi.mock('../hooks/useApplications');
vi.mock('../hooks/usePromotions');

const useMyLatestResultMock = vi.mocked(useMyLatestResult);
const useMyHistoryMock = vi.mocked(useMyHistory);
const useBookmarksMock = vi.mocked(useBookmarks);
const usePromotionsMock = vi.mocked(usePromotions);
const toggle = vi.fn();
vi.mocked(useToggleBookmark).mockReturnValue({ toggle, isLoading: false });
const toggleApplication = vi.fn();
vi.mocked(useToggleApplication).mockReturnValue({ toggle: toggleApplication, isLoading: false });

const result: TestSubmissionResult = {
  id: 'sub-1',
  user_id: 'user-1',
  submitted_at: '2026-08-20T12:00:00.000Z',
  ei_value: 'E',
  sn_value: 'N',
  tf_value: 'F',
  jp_value: 'P',
  status: 'COMPLETED',
  mbti_result_type: { type_code: 'ENFP', description: '설명', business_tip: '팁' },
  promotion_offers: [{ id: 'promo-1', name: '프로모션1', description: '설명1' }],
};

function renderPage() {
  const router = createMemoryRouter(
    [
      { path: '/mypage', element: <MyPage /> },
      { path: '/', element: <div>test page</div> },
    ],
    { initialEntries: ['/mypage'] },
  );
  return render(<RouterProvider router={router} />);
}

function mockQuery(overrides: Partial<ReturnType<typeof useMyLatestResult>>) {
  useMyLatestResultMock.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    ...overrides,
  } as unknown as ReturnType<typeof useMyLatestResult>);
}

function mockHistory(overrides: Partial<ReturnType<typeof useMyHistory>>) {
  useMyHistoryMock.mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
    ...overrides,
  } as unknown as ReturnType<typeof useMyHistory>);
}

function mockBookmarks(overrides: Partial<ReturnType<typeof useBookmarks>>) {
  useBookmarksMock.mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
    ...overrides,
  } as unknown as ReturnType<typeof useBookmarks>);
}

function mockPromotions(overrides: Partial<ReturnType<typeof usePromotions>>) {
  usePromotionsMock.mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
    ...overrides,
  } as unknown as ReturnType<typeof usePromotions>);
}

beforeEach(() => {
  mockHistory({});
  mockBookmarks({});
  mockPromotions({});
});

describe('MyPage', () => {
  it('로딩 중이면 로딩 텍스트를 표시한다', () => {
    mockQuery({ isLoading: true });

    renderPage();

    expect(screen.getByText('불러오는 중...')).toBeInTheDocument();
  });

  it('에러이면 에러 텍스트를 표시한다', () => {
    mockQuery({ isError: true });

    renderPage();

    expect(screen.getByText('결과를 불러오지 못했습니다.')).toBeInTheDocument();
  });

  it('data가 null(참여 이력 없음)이면 에러와 다른 빈 상태 안내 문구를 표시한다', () => {
    mockQuery({ data: null });

    renderPage();

    expect(screen.getByText(/아직 참여한 테스트가 없습니다/)).toBeInTheDocument();
    expect(screen.queryByText('결과를 불러오지 못했습니다.')).not.toBeInTheDocument();
  });

  it('data가 있으면 참여일시와 ResultSummary 내용을 함께 표시한다', () => {
    mockQuery({ data: result });

    renderPage();

    expect(screen.getByText(/최근 참여일시/)).toBeInTheDocument();
    expect(screen.getByText('ENFP')).toBeInTheDocument();
  });

  it('"MBTI 테스트 다시 하기" 버튼 클릭 시 /로 이동한다', async () => {
    mockQuery({ data: result });
    const userEventInstance = userEvent.setup();

    renderPage();

    await userEventInstance.click(screen.getByRole('button', { name: 'MBTI 테스트 다시 하기' }));

    expect(await screen.findByText('test page')).toBeInTheDocument();
  });

  it('참여 이력이 0건이면 빈 상태 안내를 표시한다(에러 아님)', () => {
    mockQuery({ data: null });
    mockHistory({ data: [] });

    renderPage();

    expect(screen.getByText('참여 이력이 없습니다.')).toBeInTheDocument();
  });

  it('참여 이력이 있으면 최신순으로 표시된다', () => {
    mockQuery({ data: null });
    mockHistory({
      data: [
        { ...result, id: 'sub-2', submitted_at: '2026-08-15T00:00:00.000Z', mbti_result_type: { ...result.mbti_result_type, type_code: 'ISTJ' } },
        { ...result, id: 'sub-1', submitted_at: '2026-07-01T00:00:00.000Z' },
      ],
    });

    renderPage();

    const items = screen.getAllByRole('listitem').map((el) => el.textContent);
    expect(items[0]).toContain('ISTJ');
    expect(items[1]).toContain('ENFP');
  });

  it('참여 이력 조회가 에러이면 에러 안내를 표시한다', () => {
    mockQuery({ data: null });
    mockHistory({ isError: true, data: undefined });

    renderPage();

    expect(screen.getByText('참여 이력을 불러오지 못했습니다.')).toBeInTheDocument();
  });

  it('북마크가 0건이면 빈 상태 안내를 표시한다(에러 아님)', () => {
    mockQuery({ data: null });
    mockBookmarks({ data: [] });

    renderPage();

    expect(screen.getByText('북마크한 프로모션이 없습니다.')).toBeInTheDocument();
  });

  it('북마크한 프로모션이 있으면 마감임박 뱃지와 함께 카드로 표시된다', () => {
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + 2);
    const bookmarked: PromotionOfferListItem = {
      id: 'promo-9',
      name: '마감임박 프로모션',
      description: '설명',
      created_at: '2020-01-01T00:00:00.000Z',
      ends_at: endsAt.toISOString(),
      mbti_type_codes: ['ENFP'],
      recommended: false,
      bookmark_count: 3,
      is_bookmarked: true,
      application_count: 0,
      is_applied: false,
    };
    mockQuery({ data: null });
    mockBookmarks({ data: [bookmarked] });

    renderPage();

    expect(screen.getByText('마감임박 프로모션')).toBeInTheDocument();
    expect(screen.getByText(/마감임박\(D-\d+\)/)).toBeInTheDocument();
  });

  it('북마크 조회가 에러이면 에러 안내를 표시한다', () => {
    mockQuery({ data: null });
    mockBookmarks({ isError: true, data: undefined });

    renderPage();

    expect(screen.getByText('북마크를 불러오지 못했습니다.')).toBeInTheDocument();
  });

  it('추천 프로모션이 없으면 빈 상태 안내를 표시한다', () => {
    mockQuery({ data: null });
    mockPromotions({ data: [] });

    renderPage();

    expect(screen.getByText('추천 프로모션이 없습니다.')).toBeInTheDocument();
  });

  it('추천 프로모션이 있으면 카드와 신청 버튼을 표시한다', async () => {
    const recommended: PromotionOfferListItem = {
      id: 'promo-10',
      name: '추천 대상 프로모션',
      description: '설명',
      created_at: '2020-01-01T00:00:00.000Z',
      ends_at: null,
      mbti_type_codes: ['ENFP'],
      recommended: true,
      bookmark_count: 0,
      is_bookmarked: false,
      application_count: 0,
      is_applied: false,
    };
    mockQuery({ data: null });
    mockPromotions({ data: [recommended] });
    const userEventInstance = userEvent.setup();

    renderPage();

    expect(screen.getByText('추천 대상 프로모션')).toBeInTheDocument();
    await userEventInstance.click(screen.getByRole('button', { name: '신청하기' }));
    expect(toggleApplication).toHaveBeenCalledWith('promo-10', false);
  });

  it('신청한 프로모션이 없으면 빈 상태 안내를 표시한다', () => {
    mockQuery({ data: null });
    mockPromotions({ data: [] });

    renderPage();

    expect(screen.getByText('신청한 프로모션이 없습니다.')).toBeInTheDocument();
  });

  it('신청한 프로모션이 있으면 카드로 표시된다', () => {
    const applied: PromotionOfferListItem = {
      id: 'promo-11',
      name: '신청완료 프로모션',
      description: '설명',
      created_at: '2020-01-01T00:00:00.000Z',
      ends_at: null,
      mbti_type_codes: ['ENFP'],
      recommended: false,
      bookmark_count: 0,
      is_bookmarked: false,
      application_count: 1,
      is_applied: true,
    };
    mockQuery({ data: null });
    mockPromotions({ data: [applied] });

    renderPage();

    expect(screen.getByText('신청완료 프로모션')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '신청완료' })).toBeInTheDocument();
  });
});
