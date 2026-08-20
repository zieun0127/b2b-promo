const { AppError } = require('../errors');
const bookmarkDb = require('../db/bookmark.db');
const promotionOfferDb = require('../db/promotionOffer.db');
const promotionOfferService = require('./promotionOffer.service');

async function add(userId, promotionOfferId) {
  const exists = await promotionOfferDb.existsById(promotionOfferId);
  if (!exists) {
    throw new AppError('존재하지 않는 프로모션입니다.', 404);
  }
  return bookmarkDb.upsert(userId, promotionOfferId);
}

async function remove(userId, promotionOfferId) {
  await bookmarkDb.remove(userId, promotionOfferId);
}

async function listForUser(userId) {
  const promotions = await promotionOfferService.listForUser(userId);
  return promotions.filter((p) => p.is_bookmarked);
}

module.exports = { add, remove, listForUser };
