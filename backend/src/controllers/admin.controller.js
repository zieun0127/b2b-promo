const adminStatsService = require('../services/adminStats.service');

async function getStats(req, res, next) {
  try {
    const stats = await adminStatsService.getStats();
    res.status(200).json(stats);
  } catch (err) {
    next(err);
  }
}

module.exports = { getStats };
