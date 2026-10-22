import type { User } from '@abgov/adsp-service-sdk';
import { ACCESS_ENVIRONMENTS, findAccessEnvironmentByOrigin, getAccessEnvironments } from './environments';
import { resolveAccessScope } from './scope';
import { ACCESS_DISCOVERY_MESSAGES } from './types';

const DEV_URL = new URL('https://access.adsp-dev.gov.ab.ca');
const AGENT_USER_ROLE = 'urn:ads:platform:agent-service:agent-user';
const TENANT_ID = { toString: () => 'urn:ads:platform:tenant-service:v2:/tenants/tenant-1' };

function createUser(
  overrides: Partial<User> = {},
  iss = 'https://access.adsp-dev.gov.ab.ca/auth/realms/realm-1',
): User {
  return {
    id: 'user-1',
    name: 'Tester',
    email: 'tester@example.com',
    roles: [AGENT_USER_ROLE],
    tenantId: TENANT_ID,
    isCore: false,
    token: { iss, bearer: 'user-token', azp: 'client', aud: 'aud', email_verified: true },
    ...overrides,
  } as unknown as User;
}

describe('access environments', () => {
  it('lists Development, UAT and Production as read-only', () => {
    expect(ACCESS_ENVIRONMENTS.map(({ id, label, host, readOnly }) => ({ id, label, host, readOnly }))).toEqual([
      { id: 'dev', label: 'Development', host: 'https://access.adsp-dev.gov.ab.ca', readOnly: true },
      { id: 'uat', label: 'UAT', host: 'https://access-uat.alberta.ca', readOnly: true },
      { id: 'prod', label: 'Production', host: 'https://access.alberta.ca', readOnly: true },
    ]);
  });

  it('cannot be modified at runtime', () => {
    expect(Object.isFrozen(ACCESS_ENVIRONMENTS)).toBe(true);
  });

  it('adds a Local environment only for a loopback Keycloak', () => {
    expect(getAccessEnvironments(DEV_URL).map(({ id }) => id)).toEqual(['dev', 'uat', 'prod']);
    expect(getAccessEnvironments(new URL('http://localhost:8080'))).toContainEqual({
      id: 'local',
      label: 'Local',
      host: 'http://localhost:8080',
      readOnly: true,
    });
  });

  it('finds an environment by origin', () => {
    expect(findAccessEnvironmentByOrigin(getAccessEnvironments(DEV_URL), 'https://access.alberta.ca')?.id).toBe('prod');
    expect(findAccessEnvironmentByOrigin(getAccessEnvironments(DEV_URL), 'https://evil.example.com')).toBeUndefined();
  });
});

describe('resolveAccessScope', () => {
  it('scopes a tenant user to their tenant realm in the issuing environment', () => {
    expect(resolveAccessScope(createUser(), DEV_URL)).toEqual({
      status: 'available',
      message: 'You can inspect the realm-1 realm in Development (read-only).',
      environment: { id: 'dev', label: 'Development', host: 'https://access.adsp-dev.gov.ab.ca', readOnly: true },
      realm: { id: 'realm-1', kind: 'tenant' },
      readOnly: true,
    });
  });

  it('scopes a core user to the core realm', () => {
    const user = createUser(
      { isCore: true, tenantId: undefined },
      'https://access.adsp-dev.gov.ab.ca/auth/realms/core',
    );

    expect(resolveAccessScope(user, DEV_URL)).toMatchObject({
      status: 'available',
      realm: { id: 'core', kind: 'core' },
    });
  });

  it('scopes a Production user read-only', () => {
    const user = createUser({}, 'https://access.alberta.ca/auth/realms/realm-1');

    expect(resolveAccessScope(user, new URL('https://access.alberta.ca'))).toMatchObject({
      status: 'available',
      environment: { id: 'prod', readOnly: true },
      readOnly: true,
    });
  });

  it('scopes a local user when running against a loopback Keycloak', () => {
    const user = createUser({}, 'http://localhost:8080/auth/realms/realm-1');

    expect(resolveAccessScope(user, new URL('http://localhost:8080'))).toMatchObject({
      status: 'available',
      environment: { id: 'local' },
    });
  });

  it('accepts a trailing slash on the issuer path', () => {
    const user = createUser({}, 'https://access.adsp-dev.gov.ab.ca/auth/realms/realm-1/');

    expect(resolveAccessScope(user, DEV_URL)).toMatchObject({ status: 'available', realm: { id: 'realm-1' } });
  });

  it.each([
    ['there is no user', undefined],
    ['the token has no issuer', createUser({ token: { bearer: 'user-token' } as never })],
    ['the issuer is not a URL', createUser({}, 'not-a-url')],
    ['the issuer is not a realm issuer', createUser({}, 'https://access.adsp-dev.gov.ab.ca/auth/admin/realms/realm-1')],
  ])('reports NO_SESSION when %s', (_case, user) => {
    expect(resolveAccessScope(user as User, DEV_URL)).toEqual({
      status: 'unavailable',
      reason: 'NO_SESSION',
      message: ACCESS_DISCOVERY_MESSAGES.NO_SESSION,
    });
  });

  it('reports the missing role instead of failing', () => {
    expect(resolveAccessScope(createUser({ roles: ['some-other-role'] }), DEV_URL)).toEqual({
      status: 'unavailable',
      reason: 'MISSING_ROLE',
      missingRoles: [AGENT_USER_ROLE],
      message: ACCESS_DISCOVERY_MESSAGES.MISSING_ROLE,
    });
  });

  it('does not accept the unqualified role name alone', () => {
    expect(resolveAccessScope(createUser({ roles: ['agent-user'] }), DEV_URL)).toMatchObject({
      reason: 'MISSING_ROLE',
    });
  });

  it('reports UNKNOWN_ENVIRONMENT for an issuer that is not a known environment', () => {
    const user = createUser({}, 'https://evil.example.com/auth/realms/realm-1');

    expect(resolveAccessScope(user, DEV_URL)).toEqual({
      status: 'unavailable',
      reason: 'UNKNOWN_ENVIRONMENT',
      message: ACCESS_DISCOVERY_MESSAGES.UNKNOWN_ENVIRONMENT,
    });
  });

  it('reports ENVIRONMENT_MISMATCH when the token is from another environment', () => {
    const user = createUser({}, 'https://access-uat.alberta.ca/auth/realms/realm-1');

    expect(resolveAccessScope(user, DEV_URL)).toMatchObject({
      status: 'unavailable',
      reason: 'ENVIRONMENT_MISMATCH',
      environment: { id: 'uat' },
    });
  });

  it('reports REALM_MISMATCH for a core user with a tenant realm issuer', () => {
    const user = createUser({ isCore: true, tenantId: undefined });

    expect(resolveAccessScope(user, DEV_URL)).toMatchObject({ status: 'unavailable', reason: 'REALM_MISMATCH' });
  });

  it('reports REALM_MISMATCH for a tenant user with the core realm issuer', () => {
    const user = createUser({}, 'https://access.adsp-dev.gov.ab.ca/auth/realms/core');

    expect(resolveAccessScope(user, DEV_URL)).toMatchObject({ status: 'unavailable', reason: 'REALM_MISMATCH' });
  });

  it('reports REALM_MISMATCH for a tenant user without a tenant', () => {
    expect(resolveAccessScope(createUser({ tenantId: undefined }), DEV_URL)).toMatchObject({
      status: 'unavailable',
      reason: 'REALM_MISMATCH',
    });
  });

  it('never includes the token or personal details in the result', () => {
    const serialized = JSON.stringify(resolveAccessScope(createUser(), DEV_URL));

    expect(serialized).not.toContain('user-token');
    expect(serialized).not.toContain('tester@example.com');
    expect(serialized).not.toContain('Tester');
  });
});
