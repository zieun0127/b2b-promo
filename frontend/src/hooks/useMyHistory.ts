import { useQuery } from '@tanstack/react-query';
import { getMyHistory } from '../api/testSubmissionApi';

export function useMyHistory() {
  return useQuery({ queryKey: ['my-history'], queryFn: getMyHistory });
}
