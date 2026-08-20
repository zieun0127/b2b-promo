import { apiFetch } from './client';
import { parseErrorAndThrow } from './authApi';
import type { TestSubmissionResult } from '../types/domain';

export async function getMyLatestResult(): Promise<TestSubmissionResult | null> {
  const res = await apiFetch('/test-submissions/me/latest');
  if (res.status === 404) return null;
  if (!res.ok) return parseErrorAndThrow(res);
  return res.json();
}

export async function getMyHistory(): Promise<TestSubmissionResult[]> {
  const res = await apiFetch('/test-submissions/me');
  if (!res.ok) return parseErrorAndThrow(res);
  return res.json();
}
