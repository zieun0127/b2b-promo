const bookmarkService = require('../services/bookmark.service');

async function list(req, res, next) {
  try {
    const result = await bookmarkService.listForUser(req.user.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function add(req, res, next) {
  try {
    const result = await bookmarkService.add(req.user.id, req.body.promotion_offer_id);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await bookmarkService.remove(req.user.id, req.params.promotionOfferId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, add, remove };
