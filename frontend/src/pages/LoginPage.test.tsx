import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoginPage from './LoginPage';
import { ApiError, login } from '../api/authApi';
import { getMyLatestResult } from '../api/testSubmissionApi';
import { useAuthStore } from '../store/authStore';

vi.mock('../api/authApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/authApi')>();
  return { ...actual, login: vi.fn() };
});
vi.mock('../api/testSubmissionApi', () => ({ getMyLatestResult: vi.fn() }));

const loginMock = vi.mocked(login);
const getMyLatestResultMock = vi.mocked(getMyLatestResult);

const user = {
  id: 'user-1',
  email: 'owner@example.com',
  role: 'USER' as const,
  created_at: '2026-01-01T00:00:00.000Z',
};

function renderLoginPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const router = createMemoryRouter(
    [
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <div>signup page</div> },
      { path: '/', element: <div>home page</div> },
      { path: '/promotions', element: <div>promotions page</div> },
    ],
    { initialEntries: ['/login'] },
  );

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  loginMock.mockReset();
  getMyLatestResultMock.mockReset();
  getMyLatestResultMock.mockResolvedValue(null);
  useAuthStore.setState({ accessToken: null, refreshToken: null, user: null });
});

describe('LoginPage', () => {
  it('이메일/비밀번호 입력 후 제출하면 login이 올바른 인자로 호출된다', async () => {
    loginMock.mockResolvedValue({
      access_token: 'access-1',
      refresh_token: 'refresh-1',
      user,
    });
    const userEventInstance = userEvent.setup();
    renderLoginPage();

    await userEventInstance.type(screen.getByLabelText('이메일'), 'owner@example.com');
    await userEventInstance.type(screen.getByLabelText('비밀번호'), 'password1!');
    await userEventInstance.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith('owner@example.com', 'password1!');
    });
  });

  it('로그인 성공 시 authStore가 갱신되고 홈으로 이동한다', async () => {
    loginMock.mockResolvedValue({
      access_token: 'access-1',
      refresh_token: 'refresh-1',
      user,
    });
    const userEventInstance = userEvent.setup();
    renderLoginPage();

    await userEventInstance.type(screen.getByLabelText('이메일'), 'owner@example.com');
    await userEventInstance.type(screen.getByLabelText('비밀번호'), 'password1!');
    await userEventInstance.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => {
      expect(screen.getByText('home page')).toBeInTheDocument();
    });
    expect(useAuthStore.getState().accessToken).toBe('access-1');
    expect(useAuthStore.getState().refreshToken).toBe('refresh-1');
    expect(useAuthStore.getState().user).toEqual(user);
  });

  it('완료된 MBTI 결과가 있으면 로그인 후 /promotions로 이동한다', async () => {
    loginMock.mockResolvedValue({
      access_token: 'access-1',
      refresh_token: 'refresh-1',
      user,
    });
    getMyLatestResultMock.mockResolvedValue({
      id: 'sub-1',
      user_id: 'user-1',
      submitted_at: '2026-08-20T00:00:00.000Z',
      ei_value: 'E',
      sn_value: 'N',
      tf_value: 'F',
      jp_value: 'P',
      status: 'COMPLETED',
      mbti_result_type: { type_code: 'ENFP', description: '설명', business_tip: '팁' },
      promotion_offers: [],
    });
    const userEventInstance = userEvent.setup();
    renderLoginPage();

    await userEventInstance.type(screen.getByLabelText('이메일'), 'owner@example.com');
    await userEventInstance.type(screen.getByLabelText('비밀번호'), 'password1!');
    await userEventInstance.click(screen.getByRole('button', { name: '로그인' }));

    expect(await screen.findByText('promotions page')).toBeInTheDocument();
  });

  it('완료된 MBTI 결과 조회가 실패해도 로그인 자체는 성공하고 홈으로 이동한다', async () => {
    loginMock.mockResolvedValue({
      access_token: 'access-1',
      refresh_token: 'refresh-1',
      user,
    });
    getMyLatestResultMock.mockRejectedValue(new Error('network error'));
    const userEventInstance = userEvent.setup();
    renderLoginPage();

    await userEventInstance.type(screen.getByLabelText('이메일'), 'owner@example.com');
    await userEventInstance.type(screen.getByLabelText('비밀번호'), 'password1!');
    await userEventInstance.click(screen.getByRole('button', { name: '로그인' }));

    expect(await screen.findByText('home page')).toBeInTheDocument();
    expect(useAuthStore.getState().accessToken).toBe('access-1');
  });

  it('로그인 실패 시 에러 메시지를 화면에 표시한다', async () => {
    loginMock.mockRejectedValue(
      new ApiError('이메일 또는 비밀번호가 올바르지 않습니다.', 401),
    );
    const userEventInstance = userEvent.setup();
    renderLoginPage();

    await userEventInstance.type(screen.getByLabelText('이메일'), 'owner@example.com');
    await userEventInstance.type(screen.getByLabelText('비밀번호'), 'wrong-password');
    await userEventInstance.click(screen.getByRole('button', { name: '로그인' }));

    expect(
      await screen.findByText('이메일 또는 비밀번호가 올바르지 않습니다.'),
    ).toBeInTheDocument();
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it('회원가입 링크를 클릭하면 /signup으로 이동한다', async () => {
    const userEventInstance = userEvent.setup();
    renderLoginPage();

    await userEventInstance.click(screen.getByRole('link', { name: /회원가입/ }));

    expect(await screen.findByText('signup page')).toBeInTheDocument();
  });
});
