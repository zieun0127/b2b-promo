const INDICATOR_PAIRS = { EI: ['E', 'I'], SN: ['S', 'N'], TF: ['T', 'F'], JP: ['J', 'P'] };

function judge(questions, answers) {
  const answerByQuestionId = new Map(answers.map((a) => [a.question_id, a.answer]));
  const counts = {
    EI: { E: 0, I: 0 },
    SN: { S: 0, N: 0 },
    TF: { T: 0, F: 0 },
    JP: { J: 0, P: 0 },
  };

  for (const q of questions) {
    if (!answerByQuestionId.has(q.id)) continue; // 매칭 안 되는 문항은 집계에서 제외(방어적, 크래시 방지)
    const isYes = answerByQuestionId.get(q.id);
    const [a, b] = INDICATOR_PAIRS[q.target_indicator];
    const selected = isYes ? q.yes_trait_value : q.yes_trait_value === a ? b : a;
    counts[q.target_indicator][selected] += 1;
  }

  const pick = (indicator) => {
    const [a, b] = INDICATOR_PAIRS[indicator];
    const c = counts[indicator];
    if (c[a] === c[b]) console.warn(`mbtiJudge: tie on ${indicator}, defaulting to ${a}`);
    return c[a] >= c[b] ? a : b;
  };

  const ei_value = pick('EI');
  const sn_value = pick('SN');
  const tf_value = pick('TF');
  const jp_value = pick('JP');
  const type_code = `${ei_value}${sn_value}${tf_value}${jp_value}`;

  return { ei_value, sn_value, tf_value, jp_value, type_code };
}

module.exports = { judge };
