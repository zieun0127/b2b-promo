import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import ResultPage from './ResultPage';
import { useMyLatestResult } from '../hooks/useMyLatestResult';
import type { TestSubmissionResult } from '../types/domain';

vi.mock('../hooks/useMyLatestResult');

const useMyLatestResultMock = vi.mocked(useMyLatestResult);

const stateResult: TestSubmissionResult = {
  id: 'sub-state',
  user_id: 'user-1',
  submitted_at: '2026-01-01T00:00:00.000Z',
  ei_value: 'E',
  sn_value: 'N',
  tf_value: 'F',
  jp_value: 'P',
  status: 'COMPLETED',
  mbti_result_type: { type_code: 'ENFP', description: 'state 설명', business_tip: 'state 팁' },
  promotion_offers: [{ id: 'promo-state', name: 'state 프로모션', description: '설명' }],
};

const queryResult: TestSubmissionResult = {
  ...stateResult,
  id: 'sub-query',
  mbti_result_type: { type_code: 'ISTJ', description: 'query 설명', business_tip: 'query 팁' },
  promotion_offers: [{ id: 'promo-query', name: 'query 프로모션', description: '설명' }],
};

function renderPage(locationState?: unknown) {
  const router = createMemoryRouter(
    [
      { path: '/result', element: <ResultPage /> },
      { path: '/mypage', element: <div>mypage page</div> },
    ],
    { initialEntries: [{ pathname: '/result', state: locationState }] },
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

beforeEach(() => {
  mockQuery({});
});

describe('ResultPage', () => {
  it('타이틀 "테스트 결과"가 항상 보인다', () => {
    renderPage(stateResult);

    expect(screen.getByText('테스트 결과')).toBeInTheDocument();
  });

  it('location.state에 결과가 있으면 훅 반환값과 무관하게 state 기준으로 렌더한다', () => {
    mockQuery({ data: queryResult });

    renderPage(stateResult);

    expect(screen.getByText('ENFP')).toBeInTheDocument();
    expect(screen.getByText('state 프로모션')).toBeInTheDocument();
    expect(screen.queryByText('ISTJ')).not.toBeInTheDocument();
  });

  it('state가 없고 훅이 데이터를 반환하면 그 데이터로 렌더한다', () => {
    mockQuery({ data: queryResult });

    renderPage(undefined);

    expect(screen.getByText('ISTJ')).toBeInTheDocument();
    expect(screen.getByText('query 프로모션')).toBeInTheDocument();
  });

  it('state가 없고 훅 data가 null이면 안내 문구를 보여주고 에러 텍스트는 없다', () => {
    mockQuery({ data: null });

    renderPage(undefined);

    expect(screen.getByText(/표시할 결과가 없습니다/)).toBeInTheDocument();
    expect(screen.queryByText('결과를 불러오지 못했습니다.')).not.toBeInTheDocument();
  });

  it('결과가 있을 때 "마이페이지로 이동" 버튼 클릭 시 /mypage로 이동한다', async () => {
    const userEventInstance = userEvent.setup();
    renderPage(stateResult);

    await userEventInstance.click(screen.getByRole('button', { name: '마이페이지로 이동' }));

    expect(await screen.findByText('mypage page')).toBeInTheDocument();
  });
});
