import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPromotion, deletePromotion, getPromotions, updatePromotion } from './promotionApi';
import { ApiError } from './authApi';
import { apiFetch } from './client';
import type { PromotionOfferInput, PromotionOfferListItem } from '../types/domain';

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
  bookmark_count: 3,
  is_bookmarked: false,
};

const input: PromotionOfferInput = {
  name: '신규 프로모션',
  description: '설명',
  ends_at: null,
  mbti_type_codes: ['ENFP'],
};

beforeEach(() => {
  apiFetchMock.mockReset();
});

describe('getPromotions', () => {
  it('GET /promotion-offers를 호출하고 성공 시 목록을 그대로 반환한다', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse([promotion], 200, true));

    const result = await getPromotions();

    expect(apiFetchMock).toHaveBeenCalledWith('/promotion-offers');
    expect(result).toEqual([promotion]);
  });

  it('실패 응답이면 ApiError를 throw한다', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse({ message: '인증 필요' }, 401, false));

    await expect(getPromotions()).rejects.toBeInstanceOf(ApiError);
  });
});

describe('createPromotion', () => {
  it('POST /promotion-offers를 본문과 함께 호출하고 생성된 항목을 반환한다', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(promotion, 201, true));

    const result = await createPromotion(input);

    expect(apiFetchMock).toHaveBeenCalledWith('/promotion-offers', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    expect(result).toEqual(promotion);
  });

  it('mbti_type_codes 누락(400) 시 ApiError를 throw한다', async () => {
    apiFetchMock.mockResolvedValue(
      jsonResponse({ message: '대상 MBTI 유형을 1개 이상 선택해야 합니다.' }, 400, false)
    );

    await expect(createPromotion({ ...input, mbti_type_codes: [] })).rejects.toMatchObject({
      message: '대상 MBTI 유형을 1개 이상 선택해야 합니다.',
      status: 400,
    });
  });
});

describe('updatePromotion', () => {
  it('PUT /promotion-offers/:id를 호출하고 수정된 항목을 반환한다', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(promotion, 200, true));

    const result = await updatePromotion('promo-1', input);

    expect(apiFetchMock).toHaveBeenCalledWith('/promotion-offers/promo-1', {
      method: 'PUT',
      body: JSON.stringify(input),
    });
    expect(result).toEqual(promotion);
  });
});

describe('deletePromotion', () => {
  it('DELETE /promotion-offers/:id를 호출한다', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(null, 204, true));

    await deletePromotion('promo-1');

    expect(apiFetchMock).toHaveBeenCalledWith('/promotion-offers/promo-1', { method: 'DELETE' });
  });

  it('404이면 ApiError를 throw한다', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse({ message: '존재하지 않는 프로모션입니다.' }, 404, false));

    await expect(deletePromotion('missing')).rejects.toBeInstanceOf(ApiError);
  });
});
