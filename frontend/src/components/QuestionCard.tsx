import type { MbtiQuestion } from '../types/domain';

interface QuestionCardProps {
  question: MbtiQuestion;
  index: number;
  value: boolean | undefined;
  onAnswer: (answer: boolean) => void;
}

export default function QuestionCard({ question, index, value, onAnswer }: QuestionCardProps) {
  return (
    <div className="question-card">
      <p className="question-card__text">Q{index}. {question.content}</p>
      <div className="question-card__actions">
        <button
          type="button"
          className={`answer-button${value === true ? ' answer-button--selected' : ''}`}
          onClick={() => onAnswer(true)}
        >
          예
        </button>
        <button
          type="button"
          className={`answer-button${value === false ? ' answer-button--selected' : ''}`}
          onClick={() => onAnswer(false)}
        >
          아니오
        </button>
      </div>
    </div>
  );
}
