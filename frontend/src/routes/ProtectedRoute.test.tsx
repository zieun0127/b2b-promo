import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { useAuthStore } from '../store/authStore';

const user = {
  id: 'user-1',
  email: 'owner@example.com',
  role: 'USER' as const,
  created_at: '2026-01-01T00:00:00.000Z',
};

function renderWithRouter(requiredRole?: 'USER' | 'ADMIN') {
  const router = createMemoryRouter(
    [
      {
        element: <ProtectedRoute requiredRole={requiredRole} />,
        children: [{ path: '/', element: <div>protected content</div> }],
      },
      { path: '/login', element: <div>login page</div> },
    ],
    { initialEntries: ['/'] },
  );

  return render(<RouterProvider router={router} />);
}

beforeEach(() => {
  useAuthStore.setState({ accessToken: null, refreshToken: null, user: null });
});

describe('ProtectedRoute', () => {
  it('비로그인 상태면 /login으로 리다이렉트한다', () => {
    renderWithRouter();

    expect(screen.getByText('login page')).toBeInTheDocument();
    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
  });

  it('requiredRole과 user.role이 다르면 /로 리다이렉트한다', () => {
    useAuthStore.getState().setAuth(
      { access_token: 'access-1', refresh_token: 'refresh-1' },
      user,
    );

    const router = createMemoryRouter(
      [
        {
          element: <ProtectedRoute requiredRole="ADMIN" />,
          children: [{ path: '/admin', element: <div>admin content</div> }],
        },
        { path: '/', element: <div>home page</div> },
      ],
      { initialEntries: ['/admin'] },
    );
    render(<RouterProvider router={router} />);

    expect(screen.getByText('home page')).toBeInTheDocument();
    expect(screen.queryByText('admin content')).not.toBeInTheDocument();
  });

  it('로그인 + role 조건을 만족하면 자식 라우트를 렌더링한다', () => {
    useAuthStore.getState().setAuth(
      { access_token: 'access-1', refresh_token: 'refresh-1' },
      user,
    );

    renderWithRouter();

    expect(screen.getByText('protected content')).toBeInTheDocument();
  });

  it('requiredRole이 없으면 role 무관하게 자식 라우트를 렌더링한다', () => {
    useAuthStore.getState().setAuth(
      { access_token: 'access-1', refresh_token: 'refresh-1' },
      { ...user, role: 'ADMIN' },
    );

    renderWithRouter();

    expect(screen.getByText('protected content')).toBeInTheDocument();
  });
});
