import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from './client';
import { useAuthStore } from '../store/authStore';

const user = {
  id: 'user-1',
  email: 'owner@example.com',
  role: 'USER' as const,
  created_at: '2026-01-01T00:00:00.000Z',
};

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  useAuthStore.setState({ accessToken: null, refreshToken: null, user: null });
  vi.unstubAllGlobals();
});

describe('apiFetch', () => {
  it('accessToken이 있으면 Authorization 헤더를 첨부한다', async () => {
    useAuthStore.getState().setAuth(
      { access_token: 'access-1', refresh_token: 'refresh-1' },
      user,
    );

    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }, 200));
    vi.stubGlobal('fetch', fetchMock);

    await apiFetch('/promotions');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:3000/api/promotions');
    const headers = new Headers(options.headers);
    expect(headers.get('Authorization')).toBe('Bearer access-1');
  });

  it('401 → refresh 성공 → 원 요청을 새 토큰으로 재시도해서 성공한다', async () => {
    useAuthStore.getState().setAuth(
      { access_token: 'expired-token', refresh_token: 'refresh-1' },
      user,
    );

    const fetchMock = vi
      .fn()
      // 1. 원 요청 - 401
      .mockResolvedValueOnce(jsonResponse({ message: 'unauthorized' }, 401))
      // 2. refresh 요청 - 성공
      .mockResolvedValueOnce(jsonResponse({ access_token: 'new-token' }, 200))
      // 3. 원 요청 재시도 - 성공
      .mockResolvedValueOnce(jsonResponse({ ok: true }, 200));
    vi.stubGlobal('fetch', fetchMock);

    const res = await apiFetch('/promotions');

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);

    const refreshCall = fetchMock.mock.calls[1];
    expect(refreshCall[0]).toBe('http://localhost:3000/api/auth/refresh');
    expect(JSON.parse(refreshCall[1].body)).toEqual({ refresh_token: 'refresh-1' });

    const retryCall = fetchMock.mock.calls[2];
    const retryHeaders = new Headers(retryCall[1].headers);
    expect(retryHeaders.get('Authorization')).toBe('Bearer new-token');

    expect(useAuthStore.getState().accessToken).toBe('new-token');
  });

  it('401 → refresh도 실패하면 로그아웃 상태로 정리되고 실패 응답을 그대로 반환한다', async () => {
    useAuthStore.getState().setAuth(
      { access_token: 'expired-token', refresh_token: 'invalid-refresh' },
      user,
    );

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ message: 'unauthorized' }, 401))
      .mockResolvedValueOnce(jsonResponse({ message: 'unauthorized' }, 401));
    vi.stubGlobal('fetch', fetchMock);

    const res = await apiFetch('/promotions');

    expect(res.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.user).toBeNull();
  });

  it('refreshToken이 없으면 refresh를 시도하지 않고 401을 그대로 반환한다', async () => {
    useAuthStore.setState({ accessToken: null, refreshToken: null, user: null });

    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse({ message: 'unauthorized' }, 401));
    vi.stubGlobal('fetch', fetchMock);

    const res = await apiFetch('/promotions');

    expect(res.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
