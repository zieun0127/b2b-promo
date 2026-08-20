import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from './authStore';

const initialState = {
  accessToken: null,
  refreshToken: null,
  user: null,
};

const user = {
  id: 'user-1',
  email: 'owner@example.com',
  role: 'USER' as const,
  created_at: '2026-01-01T00:00:00.000Z',
};

beforeEach(() => {
  useAuthStore.setState(initialState);
});

describe('authStore', () => {
  it('setAuth는 accessToken/refreshToken/user를 한번에 세팅한다', () => {
    useAuthStore.getState().setAuth(
      { access_token: 'access-1', refresh_token: 'refresh-1' },
      user,
    );

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('access-1');
    expect(state.refreshToken).toBe('refresh-1');
    expect(state.user).toEqual(user);
  });

  it('setAccessToken은 accessToken만 갱신하고 user/refreshToken은 유지한다', () => {
    useAuthStore.getState().setAuth(
      { access_token: 'access-1', refresh_token: 'refresh-1' },
      user,
    );

    useAuthStore.getState().setAccessToken('access-2');

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('access-2');
    expect(state.refreshToken).toBe('refresh-1');
    expect(state.user).toEqual(user);
  });

  it('clearAuth 호출 후 accessToken/refreshToken/user가 모두 null이 된다', () => {
    useAuthStore.getState().setAuth(
      { access_token: 'access-1', refresh_token: 'refresh-1' },
      user,
    );

    useAuthStore.getState().clearAuth();

    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.user).toBeNull();
  });
});
