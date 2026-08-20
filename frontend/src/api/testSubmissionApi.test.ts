import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getMyHistory, getMyLatestResult } from './testSubmissionApi';
import { ApiError } from './authApi';
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

const result = {
  id: 'sub-1',
  user_id: 'user-1',
  submitted_at: '2026-01-01T00:00:00.000Z',
  ei_value: 'E' as const,
  sn_value: 'S' as const,
  tf_value: 'T' as const,
  jp_value: 'P' as const,
  status: 'COMPLETED' as const,
  mbti_result_type: {
    type_code: 'ESTP',
    description: '설명',
    business_tip: '팁',
  },
  promotion_offers: [{ id: 'promo-1', name: '프로모션1', description: '설명1' }],
};

beforeEach(() => {
  apiFetchMock.mockReset();
});

describe('getMyLatestResult', () => {
  it('GET /test-submissions/me/latest 호출 후 200이면 결과를 그대로 반환한다', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(result, 200, true));

    const data = await getMyLatestResult();

    expect(apiFetchMock).toHaveBeenCalledWith('/test-submissions/me/latest');
    expect(data).toEqual(result);
  });

  it('404이면 예외를 던지지 않고 null을 반환한다', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse({ message: '결과 없음' }, 404, false));

    const data = await getMyLatestResult();

    expect(data).toBeNull();
  });

  it('404가 아닌 실패 응답(401)이면 ApiError를 throw한다', async () => {
    apiFetchMock.mockResolvedValue(
      jsonResponse({ message: '인증 토큰이 없거나 유효하지 않습니다.' }, 401, false),
    );

    await expect(getMyLatestResult()).rejects.toMatchObject({
      message: '인증 토큰이 없거나 유효하지 않습니다.',
      status: 401,
    });
    await expect(getMyLatestResult()).rejects.toBeInstanceOf(ApiError);
  });
});

describe('getMyHistory', () => {
  it('GET /test-submissions/me 호출 후 200이면 배열을 그대로 반환한다', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse([result], 200, true));

    const data = await getMyHistory();

    expect(apiFetchMock).toHaveBeenCalledWith('/test-submissions/me');
    expect(data).toEqual([result]);
  });

  it('이력이 없으면 빈 배열을 반환한다', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse([], 200, true));

    const data = await getMyHistory();

    expect(data).toEqual([]);
  });

  it('실패 응답(401)이면 ApiError를 throw한다', async () => {
    apiFetchMock.mockResolvedValue(
      jsonResponse({ message: '인증 토큰이 없거나 유효하지 않습니다.' }, 401, false)
    );

    await expect(getMyHistory()).rejects.toBeInstanceOf(ApiError);
  });
});
