/**
 * test-jwt-factory.ts — Generates RS256 JWTs for cross-system E2E tests.
 *
 * Rule 15: No real credentials appear here.  The private key is a test-only
 * keypair generated fresh per test run; the matching public key is injected
 * into the test app via TEST_RSA_PUBLIC_KEY.
 *
 * INT-008 (Keycloak JWT stub): the planner-service validates tokens via
 * passport-jwt using the public key supplied in TEST_RSA_PUBLIC_KEY.  The
 * test app factory reads that env var and configures passport accordingly.
 */
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';

// ---------------------------------------------------------------------------
// One RSA keypair per test process (generated once at import time)
// ---------------------------------------------------------------------------

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

/**
 * getTestPublicKey — returns the PEM-encoded test RSA public key.
 * Inject this into the test app via createTestApp(mongoUri, getTestPublicKey()).
 */
export function getTestPublicKey(): string {
  return publicKey as string;
}

// ---------------------------------------------------------------------------
// JWT claim shapes
// ---------------------------------------------------------------------------

export interface TestUserClaims {
  tenantId: string;
  userId: string;
  roles: string[];
  displayName?: string;
  email?: string;
}

// Default test fixture values (Protected B conventions — no real data)
export const TEST_TENANT_ID = 'tenant-test-abc';
export const TEST_USER_ID = 'user-test-xyz';
export const TEST_ADMIN_USER_ID = 'admin-test-xyz';

export const DEFAULT_PLANNER_USER: TestUserClaims = {
  tenantId: TEST_TENANT_ID,
  userId: TEST_USER_ID,
  roles: ['planner-user'],
  displayName: '[TEST-USER]',
  email: '[TEST-EMAIL]',
};

export const DEFAULT_PLANNER_ADMIN: TestUserClaims = {
  tenantId: TEST_TENANT_ID,
  userId: TEST_ADMIN_USER_ID,
  roles: ['planner-admin'],
  displayName: '[TEST-ADMIN]',
  email: '[TEST-ADMIN-EMAIL]',
};

/**
 * generateTestJwt — signs a test JWT with the test RSA private key.
 *
 * @param claims  User claims to embed in the token.
 * @param ttlSecs Token TTL in seconds (default 3600).
 */
export function generateTestJwt(
  claims: TestUserClaims = DEFAULT_PLANNER_USER,
  ttlSecs = 3600,
): string {
  return jwt.sign(
    {
      sub: claims.userId,
      tenantId: claims.tenantId,
      userId: claims.userId,
      roles: claims.roles,
      displayName: claims.displayName,
      email: claims.email,
    },
    privateKey as string,
    { algorithm: 'RS256', expiresIn: ttlSecs },
  );
}

/**
 * bearerHeader — convenience wrapper for supertest Authorization header.
 */
export function bearerHeader(claims?: TestUserClaims): { Authorization: string } {
  return { Authorization: `Bearer ${generateTestJwt(claims)}` };
}
