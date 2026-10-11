/**
 * setup.ts — Testcontainers MongoDB lifecycle helpers for cross-system E2E.
 *
 * Each E2E file calls startTestEnvironment() in beforeAll and
 * stopTestEnvironment() in afterAll.  The Testcontainers-provided URI is
 * passed to createTestApp() — it is NEVER written into test source as a
 * literal (Rule 15).
 *
 * Pattern: one container per test FILE (not per test case) for speed.
 * Container isolation: each file gets a fresh MongoDB instance; no state leaks.
 */
import { MongoDBContainer, StartedMongoDBContainer } from '@testcontainers/mongodb';
import * as supertest from 'supertest';
import { TestApp, createTestApp } from './test-app';
import { getTestPublicKey, generateTestJwt, TestUserClaims } from './test-jwt-factory';

// ---------------------------------------------------------------------------
// E2E Environment handle
// ---------------------------------------------------------------------------

export interface E2EEnvironment {
  container: StartedMongoDBContainer;
  testApp: TestApp;
  request: ReturnType<typeof supertest>;
  /** Convenience: generates a Bearer header for the given claims */
  authHeader(claims?: TestUserClaims): { Authorization: string };
}

// ---------------------------------------------------------------------------
// Lifecycle helpers
// ---------------------------------------------------------------------------

/**
 * startTestEnvironment — starts a MongoDB Testcontainer and wires the test app.
 * Call in beforeAll(); await the result.
 *
 * Timeout guidance: container pull + startup typically takes 20–60 s.
 * Set jest testTimeout ≥ 120 000 ms in jest.config.ts.
 */
export async function startTestEnvironment(): Promise<E2EEnvironment> {
  // Start MongoDB container (Testcontainers provides the URI at runtime)
  const container = await new MongoDBContainer('mongo:7.0').start();

  // Rule 15: URI is obtained from the container at runtime; never hardcoded
  const mongoUri = container.getConnectionString();

  const testPublicKey = getTestPublicKey();
  const testApp = await createTestApp(mongoUri, testPublicKey);

  const request = supertest(testApp.app);

  return {
    container,
    testApp,
    request,
    authHeader(claims?: TestUserClaims) {
      return { Authorization: `Bearer ${generateTestJwt(claims)}` };
    },
  };
}

/**
 * stopTestEnvironment — tears down the app and stops the MongoDB container.
 * Call in afterAll().
 */
export async function stopTestEnvironment(env: E2EEnvironment): Promise<void> {
  await env.testApp.teardown();
  await env.container.stop();
}
