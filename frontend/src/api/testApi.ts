import { apiFetch } from './client';
import { parseErrorAndThrow } from './authApi';
import type { MbtiQuestion, TestSubmissionResult } from '../types/domain';

export async function getMbtiQuestions(): Promise<MbtiQuestion[]> {
  const res = await apiFetch('/mbti-questions');
  if (!res.ok) return parseErrorAndThrow(res);
  return res.json();
}

export interface AnswerInput {
  question_id: string;
  answer: boolean;
}

export async function submitTest(answers: AnswerInput[]): Promise<TestSubmissionResult> {
  const res = await apiFetch('/test-submissions', {
    method: 'POST',
    body: JSON.stringify({ answers }),
  });
  if (!res.ok) return parseErrorAndThrow(res);
  return res.json();
}
