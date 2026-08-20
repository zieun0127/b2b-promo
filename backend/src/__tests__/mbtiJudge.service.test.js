const { judge } = require('../services/mbtiJudge.service');

function buildQuestions() {
  const specs = [
    ['EI', 'E'],
    ['SN', 'S'],
    ['TF', 'T'],
    ['JP', 'J'],
  ];
  const questions = [];
  let n = 1;
  specs.forEach(([indicator, yesTrait]) => {
    for (let i = 0; i < 3; i += 1) {
      questions.push({
        id: `q${n}`,
        content: `question ${n}`,
        target_indicator: indicator,
        yes_trait_value: yesTrait,
      });
      n += 1;
    }
  });
  return questions;
}

describe('mbtiJudge.service judge', () => {
  const questions = buildQuestions();

  it('returns ESTJ when every answer is yes', () => {
    const answers = questions.map((q) => ({ question_id: q.id, answer: true }));
    const result = judge(questions, answers);

    expect(result.ei_value).toBe('E');
    expect(result.sn_value).toBe('S');
    expect(result.tf_value).toBe('T');
    expect(result.jp_value).toBe('J');
    expect(result.type_code).toBe('ESTJ');
  });

  it('returns INFP when every answer is no', () => {
    const answers = questions.map((q) => ({ question_id: q.id, answer: false }));
    const result = judge(questions, answers);

    expect(result.ei_value).toBe('I');
    expect(result.sn_value).toBe('N');
    expect(result.tf_value).toBe('F');
    expect(result.jp_value).toBe('P');
    expect(result.type_code).toBe('INFP');
  });

  it('returns ENTP for a mixed majority-vote case', () => {
    const eiIds = questions.filter((q) => q.target_indicator === 'EI').map((q) => q.id);
    const snIds = questions.filter((q) => q.target_indicator === 'SN').map((q) => q.id);
    const tfIds = questions.filter((q) => q.target_indicator === 'TF').map((q) => q.id);
    const jpIds = questions.filter((q) => q.target_indicator === 'JP').map((q) => q.id);

    const answers = [
      { question_id: eiIds[0], answer: true },
      { question_id: eiIds[1], answer: true },
      { question_id: eiIds[2], answer: false },
      { question_id: snIds[0], answer: true },
      { question_id: snIds[1], answer: false },
      { question_id: snIds[2], answer: false },
      { question_id: tfIds[0], answer: true },
      { question_id: tfIds[1], answer: true },
      { question_id: tfIds[2], answer: true },
      { question_id: jpIds[0], answer: false },
      { question_id: jpIds[1], answer: false },
      { question_id: jpIds[2], answer: false },
    ];

    const result = judge(questions, answers);

    expect(result.ei_value).toBe('E');
    expect(result.sn_value).toBe('N');
    expect(result.tf_value).toBe('T');
    expect(result.jp_value).toBe('P');
    expect(result.type_code).toBe('ENTP');
  });
});
