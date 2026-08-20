import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMbtiQuestions, useSubmitTest } from '../hooks/useMbtiTest';
import { ApiError } from '../api/authApi';
import QuestionCard from '../components/QuestionCard';

export default function MbtiTestPage() {
  const { data: questions, isLoading, isError } = useMbtiQuestions();
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();
  const submitMutation = useSubmitTest();

  const answeredCount = Object.keys(answers).length;

  const handleSubmit = () => {
    const payload = Object.entries(answers).map(([question_id, answer]) => ({ question_id, answer }));
    submitMutation.mutate(payload, {
      onSuccess: (result) => navigate('/result', { state: result }),
    });
  };

  if (isLoading) return <div className="mbti-test-page">불러오는 중...</div>;
  if (isError || !questions) return <div className="mbti-test-page">문항을 불러오지 못했습니다.</div>;

  return (
    <div className="mbti-test-page">
      <h1 className="auth-title">사장님 MBTI 테스트</h1>

      <div className="progress-bar">
        <div
          className="progress-bar__fill"
          style={{ width: `${(answeredCount / (questions.length || 12)) * 100}%` }}
        />
      </div>
      <p className="question-card__text">{answeredCount}/{questions.length}</p>

      {questions.map((q, i) => (
        <QuestionCard
          key={q.id}
          question={q}
          index={i + 1}
          value={answers[q.id]}
          onAnswer={(a) => setAnswers((prev) => ({ ...prev, [q.id]: a }))}
        />
      ))}

      {submitMutation.isError && (
        <p className="auth-error">{(submitMutation.error as ApiError).message}</p>
      )}

      <button
        type="button"
        className="submit-button"
        disabled={!(questions && answeredCount === questions.length && questions.length > 0)}
        onClick={handleSubmit}
      >
        제출하기
      </button>
    </div>
  );
}
