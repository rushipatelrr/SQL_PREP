/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  setupFiles: ['<rootDir>/tests/env.setup.ts'],
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  clearMocks: true,
  // Integration tests spin up mongodb-memory-server, which downloads a MongoDB binary the
  // first time it runs — that needs network access and can take a while on a cold cache.
  testTimeout: 120000,
};

