import { apiFetch } from './client';
import { parseErrorAndThrow } from './authApi';
import type { AdminStats } from '../types/domain';

export async function getAdminStats(): Promise<AdminStats> {
  const res = await apiFetch('/admin/stats');
  if (!res.ok) return parseErrorAndThrow(res);
  return res.json();
}
