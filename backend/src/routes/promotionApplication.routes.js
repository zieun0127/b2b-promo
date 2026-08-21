const express = require('express');
const requireAuth = require('../middlewares/requireAuth');
const promotionApplicationController = require('../controllers/promotionApplication.controller');

const router = express.Router();

router.post('/', requireAuth, promotionApplicationController.add);
router.delete('/:promotionOfferId', requireAuth, promotionApplicationController.remove);

module.exports = router;
