const express = require('express');
const requireAuth = require('../middlewares/requireAuth');
const testSubmissionController = require('../controllers/testSubmission.controller');

const router = express.Router();

router.post('/', requireAuth, testSubmissionController.submit);
router.get('/me/latest', requireAuth, testSubmissionController.getLatest);
router.get('/me', requireAuth, testSubmissionController.getHistory);

module.exports = router;
