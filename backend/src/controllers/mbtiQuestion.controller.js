const mbtiQuestionService = require('../services/mbtiQuestion.service');

async function list(req, res, next) {
  try {
    const questions = await mbtiQuestionService.listQuestions();
    res.status(200).json(questions);
  } catch (err) {
    next(err);
  }
}

module.exports = { list };
