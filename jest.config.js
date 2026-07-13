module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    'services/**/*.js',
    'controllers/**/*.js',
    '!**/*.test.js',
  ],
};
