import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminPromotionManagePage from './AdminPromotionManagePage';
import { ApiError } from '../api/authApi';
import { usePromotions } from '../hooks/usePromotions';
import { useAdminStats } from '../hooks/useAdminStats';
import { useAdminPromotions, useApplicants } from '../hooks/useAdminPromotions';
import type { AdminStats, Applicant, PromotionOfferListItem } from '../types/domain';

vi.mock('../hooks/usePromotions');
vi.mock('../hooks/useAdminStats');
vi.mock('../hooks/useAdminPromotions');

const usePromotionsMock = vi.mocked(usePromotions);
const useAdminStatsMock = vi.mocked(useAdminStats);
const useAdminPromotionsMock = vi.mocked(useAdminPromotions);
const useApplicantsMock = vi.mocked(useApplicants);

function mockApplicants(data: Applicant[] | undefined, isLoading = false) {
  useApplicantsMock.mockReturnValue({
    data,
    isLoading,
    isError: false,
  } as unknown as ReturnType<typeof useApplicants>);
}

const promotion: PromotionOfferListItem = {
  id: 'promo-1',
  name: '평일 오후 타임세일',
  description: '설명',
  created_at: '2026-01-01T00:00:00.000Z',
  ends_at: null,
  mbti_type_codes: ['ENFP'],
  recommended: false,
  bookmark_count: 12,
  is_bookmarked: false,
  application_count: 2,
  is_applied: false,
};

function mockPromotions(overrides: Partial<ReturnType<typeof usePromotions>>) {
  usePromotionsMock.mockReturnValue({
    data: [promotion],
    isLoading: false,
    isError: false,
    ...overrides,
  } as unknown as ReturnType<typeof usePromotions>);
}

function mockStats(overrides?: Partial<AdminStats>) {
  useAdminStatsMock.mockReturnValue({
    data: {
      total_completed_submissions: 0,
      by_result_type: [],
      by_indicator: [],
      by_promotion: [{ id: 'promo-1', name: promotion.name, recommended_match_count: 7, bookmark_count: 12 }],
      ...overrides,
    },
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof useAdminStats>);
}

const createMutate = vi.fn();
const updateMutate = vi.fn();
const removeMutate = vi.fn();

beforeEach(() => {
  createMutate.mockReset();
  updateMutate.mockReset();
  removeMutate.mockReset();
  useAdminPromotionsMock.mockReturnValue({
    create: { mutate: createMutate } as unknown as ReturnType<typeof useAdminPromotions>['create'],
    update: { mutate: updateMutate } as unknown as ReturnType<typeof useAdminPromotions>['update'],
    remove: { mutate: removeMutate } as unknown as ReturnType<typeof useAdminPromotions>['remove'],
  });
  mockPromotions({});
  mockStats();
  mockApplicants(undefined);
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});

describe('AdminPromotionManagePage', () => {
  it('로딩 중이면 로딩 텍스트를 표시한다', () => {
    mockPromotions({ isLoading: true });

    render(<AdminPromotionManagePage />);

    expect(screen.getByText('불러오는 중...')).toBeInTheDocument();
  });

  it('에러이면 에러 텍스트를 표시한다', () => {
    mockPromotions({ isError: true, data: undefined });

    render(<AdminPromotionManagePage />);

    expect(screen.getByText('프로모션을 불러오지 못했습니다.')).toBeInTheDocument();
  });

  it('목록에 프로모션 행별로 추천 매칭 수·북마크 수가 표시된다', () => {
    render(<AdminPromotionManagePage />);

    const row = screen.getByText('평일 오후 타임세일').closest('tr') as HTMLElement;
    expect(within(row).getByText('7')).toBeInTheDocument();
    expect(within(row).getByText('12')).toBeInTheDocument();
  });

  it('행에 신청 수가 표시된다', () => {
    render(<AdminPromotionManagePage />);

    const row = screen.getByText('평일 오후 타임세일').closest('tr') as HTMLElement;
    expect(within(row).getByText('2명')).toBeInTheDocument();
  });

  it('신청 수를 펼치면 신청자 목록이 표시된다', async () => {
    mockApplicants([
      { email: 'owner-a@example.com', applied_at: '2026-08-21T00:00:00.000Z' },
      { email: 'owner-b@example.com', applied_at: '2026-08-20T00:00:00.000Z' },
    ]);
    const user = userEvent.setup();
    render(<AdminPromotionManagePage />);

    await user.click(screen.getByText('2명'));

    expect(await screen.findByText(/owner-a@example.com/)).toBeInTheDocument();
    expect(screen.getByText(/owner-b@example.com/)).toBeInTheDocument();
  });

  it('신청자가 없으면 안내 문구를 표시한다', async () => {
    mockApplicants([]);
    const user = userEvent.setup();
    render(<AdminPromotionManagePage />);

    await user.click(screen.getByText('2명'));

    expect(await screen.findByText('신청자가 없습니다.')).toBeInTheDocument();
  });

  it('대상 MBTI 유형을 선택하지 않고 저장하면 오류를 표시하고 저장 요청을 보내지 않는다', async () => {
    const user = userEvent.setup();
    render(<AdminPromotionManagePage />);

    await user.click(screen.getByRole('button', { name: '+ 신규 등록' }));
    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(screen.getByText('대상 MBTI 유형을 1개 이상 선택해야 합니다.')).toBeInTheDocument();
    expect(createMutate).not.toHaveBeenCalled();
  });

  it('신규 등록 폼에 이름 입력 후 유형을 선택하고 저장하면 create가 호출된다', async () => {
    const user = userEvent.setup();
    render(<AdminPromotionManagePage />);

    await user.click(screen.getByRole('button', { name: '+ 신규 등록' }));
    await user.type(screen.getByLabelText('프로모션 이름'), '신규 프로모션');
    await user.click(screen.getByRole('checkbox', { name: 'ENFP' }));
    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(createMutate).toHaveBeenCalledWith(
      expect.objectContaining({ name: '신규 프로모션', mbti_type_codes: ['ENFP'] }),
      expect.anything()
    );
  });

  it('수정 버튼 클릭 시 기존 값이 채워진 폼이 열리고, 설명/마감일 수정 후 저장하면 update가 대상 id와 함께 호출된다', async () => {
    const user = userEvent.setup();
    render(<AdminPromotionManagePage />);

    await user.click(screen.getByRole('button', { name: '수정' }));

    expect(screen.getByLabelText('프로모션 이름')).toHaveValue('평일 오후 타임세일');
    expect(screen.getByRole('checkbox', { name: 'ENFP' })).toBeChecked();

    await user.type(screen.getByLabelText('설명'), ' 추가설명');
    await user.type(screen.getByLabelText('마감일(선택)'), '2026-09-01');
    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(updateMutate).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'promo-1' }),
      expect.anything()
    );
  });

  it('선택된 유형을 다시 클릭하면 선택이 해제되고, 그 결과 0개면 저장이 차단된다', async () => {
    const user = userEvent.setup();
    render(<AdminPromotionManagePage />);

    await user.click(screen.getByRole('button', { name: '수정' }));
    await user.click(screen.getByRole('checkbox', { name: 'ENFP' }));
    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(screen.getByText('대상 MBTI 유형을 1개 이상 선택해야 합니다.')).toBeInTheDocument();
    expect(updateMutate).not.toHaveBeenCalled();
  });

  it('저장 요청이 ApiError로 실패하면 서버 오류 메시지를 표시한다', async () => {
    const user = userEvent.setup();
    render(<AdminPromotionManagePage />);

    await user.click(screen.getByRole('button', { name: '+ 신규 등록' }));
    await user.click(screen.getByRole('checkbox', { name: 'ENFP' }));
    await user.click(screen.getByRole('button', { name: '저장' }));

    const onError = createMutate.mock.calls[0][1].onError as (err: unknown) => void;
    onError(new ApiError('이미 등록된 이름입니다.', 400));

    expect(await screen.findByText('이미 등록된 이름입니다.')).toBeInTheDocument();
  });

  it('취소 버튼 클릭 시 폼이 닫힌다', async () => {
    const user = userEvent.setup();
    render(<AdminPromotionManagePage />);

    await user.click(screen.getByRole('button', { name: '+ 신규 등록' }));
    expect(screen.getByLabelText('프로모션 이름')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '취소' }));

    expect(screen.queryByLabelText('프로모션 이름')).not.toBeInTheDocument();
  });

  it('삭제 버튼 클릭 시 확인 후 remove가 호출된다', async () => {
    const user = userEvent.setup();
    render(<AdminPromotionManagePage />);

    await user.click(screen.getByRole('button', { name: '삭제' }));

    expect(window.confirm).toHaveBeenCalled();
    expect(removeMutate).toHaveBeenCalledWith('promo-1');
  });
});
