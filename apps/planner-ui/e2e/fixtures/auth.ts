import type { Page } from '@playwright/test';

/**
 * E2E auth fixtures for planner-ui Playwright tests.
 *
 * These helpers inject a mock Keycloak token into the browser window so the
 * app's Keycloak adapter is satisfied without a real OIDC round-trip.
 *
 * IMPORTANT: This is TEST-ONLY auth injection — NOT production code.
 * The injected token is a mock JWT used exclusively by Playwright tests.
 * Production auth flows through the real Keycloak instance.
 *
 * Usage:
 *   import { mockPlannerUserAuth } from './fixtures/auth';
 *   test.beforeEach(async ({ page }) => { await mockPlannerUserAuth(page); });
 */

/** Base mock token payload shared across role variants. */
const BASE_TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.e30.mock-sig';

/** Builds a mock Keycloak state object for page injection. */
function buildMockKeycloakState(
  userId: string,
  displayName: string,
  email: string,
  roles: string[],
  tenantId: string = 'tenant-001',
) {
  return {
    token: BASE_TOKEN,
    tokenParsed: {
      sub: userId,
      name: displayName,
      email,
      preferred_username: email,
      realm_access: { roles },
      resource_access: {
        'planner-ui': { roles },
      },
      tenant_id: tenantId,
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    },
    authenticated: true,
    subject: userId,
    realmAccess: { roles },
    resourceAccess: { 'planner-ui': { roles } },
  };
}

/**
 * Inject mock Keycloak state for a planner-user (standard planning role).
 * Roles: ['planner-user']
 */
export async function mockPlannerUserAuth(page: Page): Promise<void> {
  const mockState = buildMockKeycloakState(
    'user-e2e-planner-001',
    'E2E Planner User',
    'e2e.planner@gov.ab.ca',
    ['planner-user'],
  );

  await page.addInitScript((state) => {
    // Inject mock keycloak instance on window before app scripts run
    (window as unknown as Record<string, unknown>)['__keycloak_mock'] = state;
    // Stub the Keycloak constructor so the adapter uses the mock
    (window as unknown as Record<string, unknown>)['__e2e_auth_injected'] = true;
  }, mockState);
}

/**
 * Inject mock Keycloak state for a planner-admin (tenant administration role).
 * Roles: ['planner-admin']
 */
export async function mockPlannerAdminAuth(page: Page): Promise<void> {
  const mockState = buildMockKeycloakState(
    'user-e2e-admin-001',
    'E2E Admin User',
    'e2e.admin@gov.ab.ca',
    ['planner-admin'],
  );

  await page.addInitScript((state) => {
    (window as unknown as Record<string, unknown>)['__keycloak_mock'] = state;
    (window as unknown as Record<string, unknown>)['__e2e_auth_injected'] = true;
  }, mockState);
}

/**
 * Inject mock Keycloak state for a tenant-admin (full administration role).
 * Roles: ['planner-admin', 'tenant-admin']
 */
export async function mockTenantAdminAuth(page: Page): Promise<void> {
  const mockState = buildMockKeycloakState(
    'user-e2e-tenant-admin-001',
    'E2E Tenant Admin',
    'e2e.tenantadmin@gov.ab.ca',
    ['planner-admin', 'tenant-admin'],
  );

  await page.addInitScript((state) => {
    (window as unknown as Record<string, unknown>)['__keycloak_mock'] = state;
    (window as unknown as Record<string, unknown>)['__e2e_auth_injected'] = true;
  }, mockState);
}
