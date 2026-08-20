import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getMbtiQuestions, submitTest } from './testApi';
import { ApiError } from './authApi';
import { apiFetch } from './client';

vi.mock('./client', () => ({ apiFetch: vi.fn() }));

const apiFetchMock = vi.mocked(apiFetch);

function jsonResponse(body: unknown, status: number, ok: boolean): Response {
  return {
    ok,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

const questions = [
  { id: 'q1', content: '문항1', target_indicator: 'EI' as const, yes_trait_value: 'E' as const },
  { id: 'q2', content: '문항2', target_indicator: 'SN' as const, yes_trait_value: 'S' as const },
];

const submissionResult = {
  id: 'sub-1',
  user_id: 'user-1',
  submitted_at: '2026-01-01T00:00:00.000Z',
  ei_value: 'E' as const,
  sn_value: 'S' as const,
  tf_value: 'T' as const,
};

beforeEach(() => {
  apiFetchMock.mockReset();
});

describe('getMbtiQuestions', () => {
  it('GET /mbti-questions를 호출하고 성공 시 배열을 그대로 반환한다', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(questions, 200, true));

    const result = await getMbtiQuestions();

    expect(apiFetchMock).toHaveBeenCalledWith('/mbti-questions');
    expect(result).toEqual(questions);
  });

  it('실패 응답(401)이면 ApiError를 throw한다', async () => {
    apiFetchMock.mockResolvedValue(
      jsonResponse({ message: '인증 토큰이 없거나 유효하지 않습니다.' }, 401, false),
    );

    await expect(getMbtiQuestions()).rejects.toMatchObject({
      message: '인증 토큰이 없거나 유효하지 않습니다.',
      status: 401,
    });
    await expect(getMbtiQuestions()).rejects.toBeInstanceOf(ApiError);
  });
});

describe('submitTest', () => {
  it('POST /test-submissions를 {answers} body로 호출하고 성공(201) 시 결과를 그대로 반환한다', async () => {
    apiFetchMock.mockResolvedValue(jsonResponse(submissionResult, 201, true));
    const answers = [
      { question_id: 'q1', answer: true },
      { question_id: 'q2', answer: false },
    ];

    const result = await submitTest(answers);

    expect(apiFetchMock).toHaveBeenCalledWith('/test-submissions', {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
    expect(result).toEqual(submissionResult);
  });

  it('실패 응답(400)이면 ApiError를 throw한다', async () => {
    apiFetchMock.mockResolvedValue(
      jsonResponse({ message: '12문항 모두 답변해야 제출할 수 있습니다.' }, 400, false),
    );

    await expect(submitTest([])).rejects.toMatchObject({
      message: '12문항 모두 답변해야 제출할 수 있습니다.',
      status: 400,
    });
    await expect(submitTest([])).rejects.toBeInstanceOf(ApiError);
  });
});
