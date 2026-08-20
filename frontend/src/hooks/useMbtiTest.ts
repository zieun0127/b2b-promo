import { useQuery, useMutation } from '@tanstack/react-query';
import { getMbtiQuestions, submitTest } from '../api/testApi';

export function useMbtiQuestions() {
  return useQuery({ queryKey: ['mbti-questions'], queryFn: getMbtiQuestions, staleTime: Infinity });
}

export function useSubmitTest() {
  return useMutation({ mutationFn: submitTest });
}
