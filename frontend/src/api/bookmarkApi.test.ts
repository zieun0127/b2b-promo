import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addBookmark, getBookmarks, removeBookmark } from './bookmarkApi';
import { ApiError } from './authApi';
import { apiFetch } from './client';
import type { PromotionOfferListItem } from '../types/domain';

vi.mock('./client', () => ({ apiFetch: vi.fn() }));

const apiFetchMock = vi.mocked(apiFetch);

function jsonResponse(body: unknown, status: number, ok: boolean): Response {
  return {
    ok,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

const promotion: PromotionOfferListItem = {
  id: 'promo-1',
  name: '프로모션1',
  description: '설명1',
  created_at: '2026-08-01T00:00:00.000Z',
  ends_at: null,
  mbti_type_codes: ['ENFP'],
  recommended: false,
  bookmark_count: 1,
  is_bookmarked: true,
  application_count: 0,
  is_applied: false,
};

beforeEach(() => {
  apiFetchMock.mockReset();
});

describe('getBookmarks', () => {
  it('GET /bookmarks를 호출하고 목록을 그대로 반환한다', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse([promotion], 200, true));

    const result = await getBookmarks();

    expect(apiFetchMock).toHaveBeenCalledWith('/bookmarks');
    expect(result).toEqual([promotion]);
  });

  it('실패 응답이면 ApiError를 throw한다', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse({ message: '인증 필요' }, 401, false));

    await expect(getBookmarks()).rejects.toBeInstanceOf(ApiError);
  });
});

describe('addBookmark', () => {
  it('POST /bookmarks를 promotion_offer_id와 함께 호출한다', async () => {
    apiFetchMock.mockResolvedValue(
      jsonResponse({ promotion_offer_id: 'promo-1', created_at: '2026-08-20T00:00:00.000Z' }, 201, true)
    );

    const result = await addBookmark('promo-1');

    expect(apiFetchMock).toHaveBeenCalledWith('/bookmarks', {
      method: 'POST',
      body: JSON.stringify({ promotion_offer_id: 'promo-1' }),
    });
    expect(result.promotion_offer_id).toBe('promo-1');
  });

  it('존재하지 않는 프로모션(404)이면 ApiError를 throw한다', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse({ message: '존재하지 않는 프로모션입니다.' }, 404, false));

    await expect(addBookmark('missing')).rejects.toBeInstanceOf(ApiError);
  });
});

describe('removeBookmark', () => {
  it('DELETE /bookmarks/:id를 호출한다', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(null, 204, true));

    await removeBookmark('promo-1');

    expect(apiFetchMock).toHaveBeenCalledWith('/bookmarks/promo-1', { method: 'DELETE' });
  });
});
