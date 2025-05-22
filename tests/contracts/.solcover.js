module.exports = {
  skipFiles: [
    'mocks/',
    'interfaces/',
    'test/'
  ],
  configureYulOptimizer: true,
  mocha: {
    timeout: 120000
  }
}; 