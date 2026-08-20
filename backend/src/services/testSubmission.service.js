const { AppError } = require('../errors');
const mbtiQuestionDb = require('../db/mbtiQuestion.db');
const testSubmissionDb = require('../db/testSubmission.db');
const mbtiResultTypeDb = require('../db/mbtiResultType.db');
const promotionOfferDb = require('../db/promotionOffer.db');
const mbtiJudgeService = require('./mbtiJudge.service');

async function buildResultDetail(row) {
  const resultType = await mbtiResultTypeDb.findByCode(row.mbti_result_type_code);
  const offers = await promotionOfferDb.findByResultTypeCode(row.mbti_result_type_code);
  return {
    id: row.id,
    user_id: row.user_id,
    submitted_at: row.submitted_at,
    ei_value: row.ei_value,
    sn_value: row.sn_value,
    tf_value: row.tf_value,
    jp_value: row.jp_value,
    status: row.status,
    mbti_result_type: {
      type_code: resultType.type_code,
      description: resultType.description,
      business_tip: resultType.business_tip,
    },
    promotion_offers: offers,
  };
}

async function submit({ userId, answers }) {
  if (!Array.isArray(answers) || answers.length !== 12) {
    throw new AppError('12문항 모두 답변해야 제출할 수 있습니다.', 400);
  }

  const questions = await mbtiQuestionDb.findAll();
  const { ei_value, sn_value, tf_value, jp_value, type_code } = mbtiJudgeService.judge(questions, answers);

  const row = await testSubmissionDb.create({
    userId,
    eiValue: ei_value,
    snValue: sn_value,
    tfValue: tf_value,
    jpValue: jp_value,
    mbtiResultTypeCode: type_code,
  });

  return buildResultDetail(row);
}

async function getLatestForUser(userId) {
  const row = await testSubmissionDb.findLatestByUserId(userId);
  if (!row) {
    throw new AppError('완료된 테스트 참여 이력이 없습니다.', 404);
  }
  return buildResultDetail(row);
}

module.exports = { submit, buildResultDetail, getLatestForUser };
