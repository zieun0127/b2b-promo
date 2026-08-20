import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import MbtiTestPage from './MbtiTestPage';
import { useMbtiQuestions, useSubmitTest } from '../hooks/useMbtiTest';
import { ApiError } from '../api/authApi';
import type { MbtiQuestion } from '../types/domain';

vi.mock('../hooks/useMbtiTest');

const useMbtiQuestionsMock = vi.mocked(useMbtiQuestions);
const useSubmitTestMock = vi.mocked(useSubmitTest);

const questions: MbtiQuestion[] = Array.from({ length: 12 }, (_, i) => ({
  id: `q${i + 1}`,
  content: `문항 내용 ${i + 1}`,
  target_indicator: 'EI',
  yes_trait_value: 'E',
}));

function mockSubmit(overrides: Partial<ReturnType<typeof useSubmitTest>> = {}) {
  useSubmitTestMock.mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
    ...overrides,
  } as unknown as ReturnType<typeof useSubmitTest>);
}

function renderPage() {
  const router = createMemoryRouter(
    [
      { path: '/', element: <MbtiTestPage /> },
      { path: '/result', element: <div>result page</div> },
    ],
    { initialEntries: ['/'] },
  );
  return render(<RouterProvider router={router} />);
}

beforeEach(() => {
  useMbtiQuestionsMock.mockReturnValue({
    data: questions,
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof useMbtiQuestions>);
  mockSubmit();
});

describe('MbtiTestPage', () => {
  it('문항 12개가 모두 렌더링되고 예/아니오 버튼을 클릭할 수 있다', async () => {
    const userEventInstance = userEvent.setup();
    renderPage();

    for (let i = 1; i <= 12; i += 1) {
      expect(screen.getByText(`Q${i}. 문항 내용 ${i}`)).toBeInTheDocument();
    }

    const yesButtons = screen.getAllByRole('button', { name: '예' });
    await userEventInstance.click(yesButtons[0]);

    expect(screen.getByText('1/12')).toBeInTheDocument();
  });

  it('초기 진행률은 0/12이고 문항 1개 응답 시 1/12로 갱신된다', async () => {
    const userEventInstance = userEvent.setup();
    renderPage();

    expect(screen.getByText('0/12')).toBeInTheDocument();

    await userEventInstance.click(screen.getAllByRole('button', { name: '아니오' })[0]);

    expect(screen.getByText('1/12')).toBeInTheDocument();
  });

  it('11개만 응답하면 제출 버튼이 비활성화이고, 12개 모두 응답하면 활성화된다', async () => {
    const userEventInstance = userEvent.setup();
    renderPage();

    const submitButton = screen.getByRole('button', { name: '제출하기' });
    const yesButtons = screen.getAllByRole('button', { name: '예' });

    for (let i = 0; i < 11; i += 1) {
      await userEventInstance.click(yesButtons[i]);
    }
    expect(submitButton).toBeDisabled();

    await userEventInstance.click(yesButtons[11]);
    expect(submitButton).not.toBeDisabled();
  });

  it('12개 모두 응답 후 제출하면 mutate가 호출되고, onSuccess 호출 시 /result로 이동한다', async () => {
    const mockResult = { id: 'sub-1' };
    const mutateMock = vi.fn(
      (_payload: unknown, opts: { onSuccess: (result: unknown) => void }) => {
        opts.onSuccess(mockResult);
      },
    );
    mockSubmit({ mutate: mutateMock } as never);

    const userEventInstance = userEvent.setup();
    renderPage();

    const yesButtons = screen.getAllByRole('button', { name: '예' });
    for (const button of yesButtons) {
      await userEventInstance.click(button);
    }

    await userEventInstance.click(screen.getByRole('button', { name: '제출하기' }));

    expect(mutateMock).toHaveBeenCalled();
    expect(await screen.findByText('result page')).toBeInTheDocument();
  });

  it('제출 실패 시 에러 메시지가 화면에 표시된다', () => {
    mockSubmit({
      isError: true,
      error: new ApiError('12문항 모두 답변해야 제출할 수 있습니다.', 400),
    } as never);

    renderPage();

    expect(
      screen.getByText('12문항 모두 답변해야 제출할 수 있습니다.'),
    ).toBeInTheDocument();
  });

  it('로딩 중이면 로딩 텍스트를 표시한다', () => {
    useMbtiQuestionsMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as unknown as ReturnType<typeof useMbtiQuestions>);

    renderPage();

    expect(screen.getByText('불러오는 중...')).toBeInTheDocument();
  });

  it('문항 조회 실패 시 에러 텍스트를 표시한다', () => {
    useMbtiQuestionsMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as unknown as ReturnType<typeof useMbtiQuestions>);

    renderPage();

    expect(screen.getByText('문항을 불러오지 못했습니다.')).toBeInTheDocument();
  });
});
