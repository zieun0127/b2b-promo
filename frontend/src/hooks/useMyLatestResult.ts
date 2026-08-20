import { useQuery } from '@tanstack/react-query';
import { getMyLatestResult } from '../api/testSubmissionApi';

export function useMyLatestResult() {
  return useQuery({ queryKey: ['my-latest-result'], queryFn: getMyLatestResult });
}
