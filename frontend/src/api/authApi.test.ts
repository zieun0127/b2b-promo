import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, login, signup } from './authApi';
import { apiFetch } from './client';

vi.mock('./client', () => ({ apiFetch: vi.fn() }));

const apiFetchMock = vi.mocked(apiFetch);

function jsonResponse(body: unknown, status: number, ok: boolean): Response {
  return {
    ok,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

const user = {
  id: 'user-1',
  email: 'owner@example.com',
  role: 'USER' as const,
  created_at: '2026-01-01T00:00:00.000Z',
};

const tokenPair = {
  access_token: 'access-1',
  refresh_token: 'refresh-1',
  user,
};

beforeEach(() => {
  apiFetchMock.mockReset();
});

describe('signup', () => {
  it('성공 시 /auth/signup으로 POST 요청을 보내고 응답 JSON을 반환한다', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(user, 201, true));

    const result = await signup('owner@example.com', 'password1!');

    expect(apiFetchMock).toHaveBeenCalledWith('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email: 'owner@example.com', password: 'password1!' }),
    });
    expect(result).toEqual(user);
  });

  it('실패 응답이면 ApiError를 throw한다', async () => {
    apiFetchMock.mockResolvedValue(
      jsonResponse({ message: '이미 가입된 이메일입니다.' }, 409, false),
    );

    await expect(signup('owner@example.com', 'password1!')).rejects.toMatchObject({
      message: '이미 가입된 이메일입니다.',
      status: 409,
    });
    await expect(signup('owner@example.com', 'password1!')).rejects.toBeInstanceOf(ApiError);
  });
});

describe('login', () => {
  it('성공 시 /auth/login으로 POST 요청을 보내고 TokenPair를 반환한다', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(tokenPair, 200, true));

    const result = await login('owner@example.com', 'password1!');

    expect(apiFetchMock).toHaveBeenCalledWith('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'owner@example.com', password: 'password1!' }),
    });
    expect(result).toEqual(tokenPair);
  });

  it('실패 응답(401)이면 ApiError를 throw한다', async () => {
    apiFetchMock.mockResolvedValue(
      jsonResponse({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' }, 401, false),
    );

    await expect(login('owner@example.com', 'wrong')).rejects.toMatchObject({
      message: '이메일 또는 비밀번호가 올바르지 않습니다.',
      status: 401,
    });
    await expect(login('owner@example.com', 'wrong')).rejects.toBeInstanceOf(ApiError);
  });
});
