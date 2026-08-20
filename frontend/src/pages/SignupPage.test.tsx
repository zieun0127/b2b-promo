import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SignupPage from './SignupPage';
import { ApiError, signup } from '../api/authApi';

vi.mock('../api/authApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/authApi')>();
  return { ...actual, signup: vi.fn() };
});

const signupMock = vi.mocked(signup);

function renderSignupPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const router = createMemoryRouter(
    [
      { path: '/signup', element: <SignupPage /> },
      { path: '/login', element: <div>login page</div> },
    ],
    { initialEntries: ['/signup'] },
  );

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  signupMock.mockReset();
});

async function fillForm(
  userEventInstance: ReturnType<typeof userEvent.setup>,
  { email, password, passwordConfirm }: { email: string; password: string; passwordConfirm: string },
) {
  await userEventInstance.type(screen.getByLabelText('이메일'), email);
  await userEventInstance.type(screen.getByLabelText('비밀번호'), password);
  await userEventInstance.type(screen.getByLabelText(/비밀번호 확인/), passwordConfirm);
  await userEventInstance.click(screen.getByRole('button', { name: '가입하기' }));
}

describe('SignupPage', () => {
  it('비밀번호와 비밀번호 확인이 다르면 signup을 호출하지 않고 에러 메시지를 표시한다', async () => {
    const userEventInstance = userEvent.setup();
    renderSignupPage();

    await fillForm(userEventInstance, {
      email: 'owner@example.com',
      password: 'password1!',
      passwordConfirm: 'password2!',
    });

    expect(signupMock).not.toHaveBeenCalled();
    expect(
      await screen.findByText(/비밀번호가 일치하지 않습니다/),
    ).toBeInTheDocument();
  });

  it('정상 입력 + signup 성공 시 /login으로 이동한다', async () => {
    signupMock.mockResolvedValue({
      id: 'user-1',
      email: 'owner@example.com',
      role: 'USER',
      created_at: '2026-01-01T00:00:00.000Z',
    });
    const userEventInstance = userEvent.setup();
    renderSignupPage();

    await fillForm(userEventInstance, {
      email: 'owner@example.com',
      password: 'password1!',
      passwordConfirm: 'password1!',
    });

    expect(signupMock).toHaveBeenCalledWith('owner@example.com', 'password1!');
    expect(await screen.findByText('login page')).toBeInTheDocument();
  });

  it('signup 실패 시 에러 메시지를 화면에 표시한다', async () => {
    signupMock.mockRejectedValue(new ApiError('이미 가입된 이메일입니다.', 409));
    const userEventInstance = userEvent.setup();
    renderSignupPage();

    await fillForm(userEventInstance, {
      email: 'owner@example.com',
      password: 'password1!',
      passwordConfirm: 'password1!',
    });

    expect(await screen.findByText('이미 가입된 이메일입니다.')).toBeInTheDocument();
  });

  it('로그인 링크를 클릭하면 /login으로 이동한다', async () => {
    const userEventInstance = userEvent.setup();
    renderSignupPage();

    await userEventInstance.click(screen.getByRole('link', { name: /로그인/ }));

    expect(await screen.findByText('login page')).toBeInTheDocument();
  });
});
