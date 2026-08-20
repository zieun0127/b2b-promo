import { apiFetch } from './client';
import type { User } from '../types/domain';

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  user: User;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function parseErrorAndThrow(res: Response): Promise<never> {
  const body = await res.json().catch(() => ({ message: '알 수 없는 오류가 발생했습니다.' }));
  throw new ApiError(body.message ?? '알 수 없는 오류가 발생했습니다.', res.status);
}

export async function signup(email: string, password: string): Promise<User> {
  const res = await apiFetch('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) return parseErrorAndThrow(res);
  return res.json();
}

export async function login(email: string, password: string): Promise<TokenPair> {
  const res = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) return parseErrorAndThrow(res);
  return res.json();
}
