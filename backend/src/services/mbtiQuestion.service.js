const mbtiQuestionDb = require('../db/mbtiQuestion.db');

async function listQuestions() {
  return mbtiQuestionDb.findAll();
}

module.exports = { listQuestions };
