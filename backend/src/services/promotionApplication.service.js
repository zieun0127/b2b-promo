const { AppError } = require('../errors');
const promotionApplicationDb = require('../db/promotionApplication.db');
const promotionOfferDb = require('../db/promotionOffer.db');

async function add(userId, promotionOfferId) {
  const exists = await promotionOfferDb.existsById(promotionOfferId);
  if (!exists) {
    throw new AppError('존재하지 않는 프로모션입니다.', 404);
  }
  return promotionApplicationDb.upsert(userId, promotionOfferId);
}

async function remove(userId, promotionOfferId) {
  await promotionApplicationDb.remove(userId, promotionOfferId);
}

module.exports = { add, remove };
