import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addApplication, removeApplication } from '../api/applicationApi';

export function useToggleApplication() {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['promotions'] });
    queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
  };

  const addMutation = useMutation({ mutationFn: addApplication, onSuccess: invalidate });
  const removeMutation = useMutation({ mutationFn: removeApplication, onSuccess: invalidate });

  return {
    toggle: (promotionOfferId: string, isApplied: boolean) =>
      isApplied ? removeMutation.mutate(promotionOfferId) : addMutation.mutate(promotionOfferId),
    isLoading: addMutation.isPending || removeMutation.isPending,
  };
}
