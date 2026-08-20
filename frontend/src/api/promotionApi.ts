import { apiFetch } from './client';
import { parseErrorAndThrow } from './authApi';
import type { PromotionOfferInput, PromotionOfferListItem } from '../types/domain';

export async function getPromotions(): Promise<PromotionOfferListItem[]> {
  const res = await apiFetch('/promotion-offers');
  if (!res.ok) return parseErrorAndThrow(res);
  return res.json();
}

export async function createPromotion(input: PromotionOfferInput): Promise<PromotionOfferListItem> {
  const res = await apiFetch('/promotion-offers', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (!res.ok) return parseErrorAndThrow(res);
  return res.json();
}

export async function updatePromotion(
  id: string,
  input: PromotionOfferInput
): Promise<PromotionOfferListItem> {
  const res = await apiFetch(`/promotion-offers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
  if (!res.ok) return parseErrorAndThrow(res);
  return res.json();
}

export async function deletePromotion(id: string): Promise<void> {
  const res = await apiFetch(`/promotion-offers/${id}`, { method: 'DELETE' });
  if (!res.ok) return parseErrorAndThrow(res);
}
