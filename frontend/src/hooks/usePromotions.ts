import { useQuery } from '@tanstack/react-query';
import { getPromotions } from '../api/promotionApi';

export function usePromotions() {
  return useQuery({ queryKey: ['promotions'], queryFn: getPromotions });
}
