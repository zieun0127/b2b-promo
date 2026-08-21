import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addApplication, removeApplication } from './applicationApi';
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

beforeEach(() => {
  apiFetchMock.mockReset();
});

describe('addApplication', () => {
  it('POST /applications를 promotion_offer_id와 함께 호출한다', async () => {
    apiFetchMock.mockResolvedValue(
      jsonResponse({ promotion_offer_id: 'promo-1', applied_at: '2026-08-21T00:00:00.000Z' }, 201, true)
    );

    const result = await addApplication('promo-1');

    expect(apiFetchMock).toHaveBeenCalledWith('/applications', {
      method: 'POST',
      body: JSON.stringify({ promotion_offer_id: 'promo-1' }),
    });
    expect(result.promotion_offer_id).toBe('promo-1');
  });

  it('존재하지 않는 프로모션(404)이면 ApiError를 throw한다', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse({ message: '존재하지 않는 프로모션입니다.' }, 404, false));

    await expect(addApplication('missing')).rejects.toBeInstanceOf(ApiError);
  });
});

describe('removeApplication', () => {
  it('DELETE /applications/:id를 호출한다', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(null, 204, true));

    await removeApplication('promo-1');

    expect(apiFetchMock).toHaveBeenCalledWith('/applications/promo-1', { method: 'DELETE' });
  });

  it('실패 응답이면 ApiError를 throw한다', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse({ message: '인증 필요' }, 401, false));

    await expect(removeApplication('promo-1')).rejects.toBeInstanceOf(ApiError);
  });
});
