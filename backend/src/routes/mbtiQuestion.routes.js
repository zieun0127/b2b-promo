const express = require('express');
const requireAuth = require('../middlewares/requireAuth');
const mbtiQuestionController = require('../controllers/mbtiQuestion.controller');

const router = express.Router();

router.get('/', requireAuth, mbtiQuestionController.list);

module.exports = router;
