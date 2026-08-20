import { useQuery } from '@tanstack/react-query';
import { getAdminStats } from '../api/adminApi';

export function useAdminStats() {
  return useQuery({ queryKey: ['admin-stats'], queryFn: getAdminStats });
}
