const promotionApplicationService = require('../services/promotionApplication.service');

async function add(req, res, next) {
  try {
    const result = await promotionApplicationService.add(req.user.id, req.body.promotion_offer_id);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await promotionApplicationService.remove(req.user.id, req.params.promotionOfferId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { add, remove };
