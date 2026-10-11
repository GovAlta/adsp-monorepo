/**
 * jest.config.ts — Jest configuration for cross-system E2E and contract tests.
 *
 * Separate from planner-service unit tests (which live in apps/planner-service/).
 * testTimeout is 120 000 ms to accommodate Testcontainers MongoDB container startup
 * (pull + start typically 20-60 seconds on a cold Docker daemon).
 */
import type { Config } from 'jest';

const config: Config = {
  displayName: 'system-tests',
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: [
    '<rootDir>/e2e/**/*.e2e.ts',
    '<rootDir>/contract/**/*.contract.test.ts',
  ],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
      },
    ],
  },
  // 120 seconds — Testcontainers MongoDB startup + test execution
  testTimeout: 120_000,
  // Run test files serially to avoid competing for Docker resources
  maxWorkers: 1,
  // Module name mapper for planner-service imports
  moduleNameMapper: {
    '^../../apps/planner-service/src/(.*)$': '<rootDir>/../planner-service/src/$1',
  },
  // Verbose output for CI readability
  verbose: true,
};

export default config;
