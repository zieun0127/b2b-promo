const express = require('express');
const requireAuth = require('../middlewares/requireAuth');
const requireAdmin = require('../middlewares/requireAdmin');
const promotionOfferController = require('../controllers/promotionOffer.controller');

const router = express.Router();

router.get('/', requireAuth, promotionOfferController.list);
router.post('/', requireAuth, requireAdmin, promotionOfferController.create);
router.put('/:id', requireAuth, requireAdmin, promotionOfferController.update);
router.delete('/:id', requireAuth, requireAdmin, promotionOfferController.remove);
router.get('/:id/applicants', requireAuth, requireAdmin, promotionOfferController.listApplicants);

module.exports = router;
