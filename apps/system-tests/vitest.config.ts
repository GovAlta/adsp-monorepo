/**
 * vitest.config.ts — Vitest configuration for cross-system E2E suite.
 *
 * FAC-S7-006: This config is the execution entry point that makes the
 * cross-system E2E suite runnable from the monorepo root via:
 *   npm run test:system
 *
 * The suite lives outside the app workspaces and is NOT covered by
 * `npm test --workspaces`. It must be explicitly invokable from root.
 *
 * testTimeout: 120 000 ms — accommodates Testcontainers MongoDB container
 * startup (20-60 s on a cold daemon) plus test execution.
 *
 * Note: E2E tests use Jest syntax (@jest/globals). Vitest is compatible
 * with Jest's describe/it/expect API when using the `globals: true` option.
 * The suite can run under either vitest or jest (via jest.config.ts).
 * FAC-S7-006 requires a vitest config specifically, so both are provided.
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'system-tests',
    environment: 'node',
    include: [
      'apps/system-tests/e2e/**/*.e2e.ts',
      'apps/system-tests/contract/**/*.contract.test.ts',
    ],
    // 120 seconds for Testcontainers startup + test execution
    testTimeout: 120_000,
    // Serial execution — one container at a time to avoid Docker resource contention
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    globals: true,
    // Reporter for CI
    reporters: ['verbose'],
  },
});
