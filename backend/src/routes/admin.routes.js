const express = require('express');
const requireAuth = require('../middlewares/requireAuth');
const requireAdmin = require('../middlewares/requireAdmin');
const adminController = require('../controllers/admin.controller');

const router = express.Router();

router.get('/stats', requireAuth, requireAdmin, adminController.getStats);

module.exports = router;
