import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPromotion, deletePromotion, updatePromotion } from '../api/promotionApi';
import type { PromotionOfferInput } from '../types/domain';

export function useAdminPromotions() {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['promotions'] });
    queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
  };

  const create = useMutation({
    mutationFn: (input: PromotionOfferInput) => createPromotion(input),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: PromotionOfferInput }) => updatePromotion(id, input),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => deletePromotion(id),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
