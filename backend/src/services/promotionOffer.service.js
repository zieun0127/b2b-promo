const { AppError } = require('../errors');
const promotionOfferDb = require('../db/promotionOffer.db');
const testSubmissionDb = require('../db/testSubmission.db');

function annotateAndSort(rawPromotions, latestTypeCode) {
  const annotated = rawPromotions.map((p) => ({
    ...p,
    recommended: latestTypeCode != null && p.mbti_type_codes.includes(latestTypeCode),
  }));

  return annotated.sort((a, b) => {
    if (a.recommended !== b.recommended) return a.recommended ? -1 : 1;
    return new Date(b.created_at) - new Date(a.created_at);
  });
}

function validateMbtiTypeCodes(mbtiTypeCodes) {
  if (!Array.isArray(mbtiTypeCodes) || mbtiTypeCodes.length < 1) {
    throw new AppError('대상 MBTI 유형을 1개 이상 선택해야 합니다.', 400);
  }
}

async function listForUser(userId) {
  const [rawPromotions, latestSubmission] = await Promise.all([
    promotionOfferDb.findAllRaw(userId),
    testSubmissionDb.findLatestByUserId(userId),
  ]);
  const latestTypeCode = latestSubmission ? latestSubmission.mbti_result_type_code : null;
  return annotateAndSort(rawPromotions, latestTypeCode);
}

async function create({ name, description, endsAt, mbtiTypeCodes }, userId) {
  validateMbtiTypeCodes(mbtiTypeCodes);
  const id = await promotionOfferDb.insert({ name, description, endsAt });
  await promotionOfferDb.replaceMappings(id, mbtiTypeCodes);
  const row = await promotionOfferDb.findByIdRaw(id, userId);
  return annotateAndSort([row], null)[0];
}

async function update(id, { name, description, endsAt, mbtiTypeCodes }, userId) {
  validateMbtiTypeCodes(mbtiTypeCodes);
  const exists = await promotionOfferDb.existsById(id);
  if (!exists) {
    throw new AppError('존재하지 않는 프로모션입니다.', 404);
  }
  await promotionOfferDb.update(id, { name, description, endsAt });
  await promotionOfferDb.replaceMappings(id, mbtiTypeCodes);
  const row = await promotionOfferDb.findByIdRaw(id, userId);
  return annotateAndSort([row], null)[0];
}

async function remove(id) {
  const exists = await promotionOfferDb.existsById(id);
  if (!exists) {
    throw new AppError('존재하지 않는 프로모션입니다.', 404);
  }
  await promotionOfferDb.deleteById(id);
}

module.exports = { annotateAndSort, validateMbtiTypeCodes, listForUser, create, update, remove };
