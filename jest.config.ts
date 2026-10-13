const { getJestProjectsAsync } = require('@nx/jest');

export default async () => ({
  testMatch: ['**/+(*.)+(spec|test).+(ts|js)?(x)'],
  setupFiles: ['<rootDir>/.jest/polyfills.js'],
  transform: {
    '^.+\\.(ts|js|html)$': 'ts-jest',
  },
  preset: './jest.preset.js',
  resolver: '@nx/jest/plugins/resolver',
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageReporters: ['html'],
  projects: await getJestProjectsAsync(),
  testEnvironment: 'node',
});
