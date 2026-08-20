import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAdminStats } from './adminApi';
import { ApiError } from './authApi';
import { apiFetch } from './client';
import type { AdminStats } from '../types/domain';

vi.mock('./client', () => ({ apiFetch: vi.fn() }));

const apiFetchMock = vi.mocked(apiFetch);

function jsonResponse(body: unknown, status: number, ok: boolean): Response {
  return {
    ok,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

const stats: AdminStats = {
  total_completed_submissions: 30,
  by_result_type: [{ type_code: 'ENFP', count: 5, ratio: 0.1667 }],
  by_indicator: [
    {
      indicator: 'EI',
      traits: [
        { value: 'E', count: 15, ratio: 0.5 },
        { value: 'I', count: 15, ratio: 0.5 },
      ],
    },
  ],
  by_promotion: [],
};

beforeEach(() => {
  apiFetchMock.mockReset();
});

describe('getAdminStats', () => {
  it('GET /admin/stats를 호출하고 성공(200) 시 AdminStats를 그대로 반환한다', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(stats, 200, true));

    const result = await getAdminStats();

    expect(apiFetchMock).toHaveBeenCalledWith('/admin/stats');
    expect(result).toEqual(stats);
  });

  it('실패 응답(403)이면 ApiError를 throw한다', async () => {
    apiFetchMock.mockResolvedValue(
      jsonResponse({ message: '관리자만 접근할 수 있습니다.' }, 403, false),
    );

    await expect(getAdminStats()).rejects.toMatchObject({
      message: '관리자만 접근할 수 있습니다.',
      status: 403,
    });
    await expect(getAdminStats()).rejects.toBeInstanceOf(ApiError);
  });
});
