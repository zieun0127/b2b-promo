const express = require('express');
const requireAuth = require('../middlewares/requireAuth');
const bookmarkController = require('../controllers/bookmark.controller');

const router = express.Router();

router.get('/', requireAuth, bookmarkController.list);
router.post('/', requireAuth, bookmarkController.add);
router.delete('/:promotionOfferId', requireAuth, bookmarkController.remove);

module.exports = router;
