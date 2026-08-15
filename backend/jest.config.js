module.exports = {
  testEnvironment: 'node',
  setupFiles: ['dotenv/config'],
  collectCoverageFrom: ['src/**/*.js', '!src/server.js'],
};
