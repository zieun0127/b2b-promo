import { apiFetch } from './client';
import { parseErrorAndThrow } from './authApi';
import type { Application } from '../types/domain';

export async function addApplication(promotionOfferId: string): Promise<Application> {
  const res = await apiFetch('/applications', {
    method: 'POST',
    body: JSON.stringify({ promotion_offer_id: promotionOfferId }),
  });
  if (!res.ok) return parseErrorAndThrow(res);
  return res.json();
}

export async function removeApplication(promotionOfferId: string): Promise<void> {
  const res = await apiFetch(`/applications/${promotionOfferId}`, { method: 'DELETE' });
  if (!res.ok) return parseErrorAndThrow(res);
}
