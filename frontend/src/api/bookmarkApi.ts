import { apiFetch } from './client';
import { parseErrorAndThrow } from './authApi';
import type { Bookmark, PromotionOfferListItem } from '../types/domain';

export async function getBookmarks(): Promise<PromotionOfferListItem[]> {
  const res = await apiFetch('/bookmarks');
  if (!res.ok) return parseErrorAndThrow(res);
  return res.json();
}

export async function addBookmark(promotionOfferId: string): Promise<Bookmark> {
  const res = await apiFetch('/bookmarks', {
    method: 'POST',
    body: JSON.stringify({ promotion_offer_id: promotionOfferId }),
  });
  if (!res.ok) return parseErrorAndThrow(res);
  return res.json();
}

export async function removeBookmark(promotionOfferId: string): Promise<void> {
  const res = await apiFetch(`/bookmarks/${promotionOfferId}`, { method: 'DELETE' });
  if (!res.ok) return parseErrorAndThrow(res);
}
