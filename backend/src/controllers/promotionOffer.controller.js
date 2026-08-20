const promotionOfferService = require('../services/promotionOffer.service');

async function list(req, res, next) {
  try {
    const result = await promotionOfferService.listForUser(req.user.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { name, description, ends_at, mbti_type_codes } = req.body;
    const result = await promotionOfferService.create(
      { name, description, endsAt: ends_at, mbtiTypeCodes: mbti_type_codes },
      req.user.id
    );
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { name, description, ends_at, mbti_type_codes } = req.body;
    const result = await promotionOfferService.update(
      req.params.id,
      { name, description, endsAt: ends_at, mbtiTypeCodes: mbti_type_codes },
      req.user.id
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await promotionOfferService.remove(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, update, remove };
