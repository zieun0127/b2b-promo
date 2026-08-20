const testSubmissionService = require('../services/testSubmission.service');

async function submit(req, res, next) {
  try {
    const result = await testSubmissionService.submit({
      userId: req.user.id,
      answers: req.body.answers,
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function getLatest(req, res, next) {
  try {
    const result = await testSubmissionService.getLatestForUser(req.user.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { submit, getLatest };
