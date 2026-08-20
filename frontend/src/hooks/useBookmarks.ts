import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addBookmark, getBookmarks, removeBookmark } from '../api/bookmarkApi';

export function useBookmarks() {
  return useQuery({ queryKey: ['bookmarks'], queryFn: getBookmarks });
}

export function useToggleBookmark() {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['promotions'] });
    queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
  };

  const addMutation = useMutation({ mutationFn: addBookmark, onSuccess: invalidate });
  const removeMutation = useMutation({ mutationFn: removeBookmark, onSuccess: invalidate });

  return {
    toggle: (promotionOfferId: string, isBookmarked: boolean) =>
      isBookmarked ? removeMutation.mutate(promotionOfferId) : addMutation.mutate(promotionOfferId),
    isLoading: addMutation.isPending || removeMutation.isPending,
  };
}
