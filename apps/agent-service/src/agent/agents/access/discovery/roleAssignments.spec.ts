import type { User } from '@abgov/adsp-service-sdk';
import type { KeycloakRepresentation } from './adminRead';
import { createRoleAssignmentResolver, MAX_COMPOSITE_DEPTH, ResolvedRole } from './roleAssignments';
import { createProblem } from './types';
import type { UserReader } from './userReader';

const target = { host: 'https://access.adsp-dev.gov.ab.ca', realm: 'realm-1', user: {} as User };
const USER_ID = 'user-1';
const FORBIDDEN = 'forbidden';

const TENANT_SERVICE = 'urn:ads:platform:tenant-service';
const FORM_SERVICE = 'urn:ads:platform:form-service';

const realmRole = (id: string, name: string, composite = false) => ({
  id,
  name,
  composite,
  clientRole: false,
  containerId: 'realm-1',
});
const clientRole = (id: string, name: string, clientUuid: string, composite = false) => ({
  id,
  name,
  composite,
  clientRole: true,
  containerId: clientUuid,
});

// Shaped like the Development autotest realm: default roles and tenant-admin are composites.
const defaultRoles = realmRole('r-default', 'default-roles-realm-1', true);
const offlineAccess = realmRole('r-offline', 'offline_access');
const roleTest = realmRole('r-test', 'role-test');
const manageAccount = clientRole('a-manage', 'manage-account', 'c-account', true);
const manageAccountLinks = clientRole('a-links', 'manage-account-links', 'c-account');
const tenantAdmin = { ...clientRole('t-admin', 'tenant-admin', 'c-tenant', true), description: 'Tenant administrator' };
const formAdmin = clientRole('f-admin', 'form-admin', 'c-form');

type Response<T> = T | typeof FORBIDDEN;

interface FakeRealm {
  directMappings?: Response<KeycloakRepresentation>;
  groups?: Response<KeycloakRepresentation[]>;
  groupsByPath?: Record<string, KeycloakRepresentation>;
  groupMappings?: Record<string, Response<KeycloakRepresentation>>;
  composites?: Record<string, Response<KeycloakRepresentation[]>>;
  clients?: Record<string, string>;
  effectiveRealmRoles?: Response<KeycloakRepresentation[]>;
}

function respond<T>(value: Response<T> | undefined, fallback?: T) {
  if (value === FORBIDDEN) {
    return Promise.resolve({ ok: false as const, problem: createProblem('unavailable', 'NO_USER_PERMISSION') });
  }
  if (value === undefined && fallback === undefined) {
    return Promise.resolve({ ok: false as const, problem: createProblem('not-found', 'REALM_NOT_FOUND') });
  }
  return Promise.resolve({ ok: true as const, value: value ?? fallback });
}

function createFakeReader(realm: FakeRealm) {
  return {
    findUserId: jest.fn(),
    searchUsers: jest.fn(),
    getUser: jest.fn(),
    getUserRoleMappings: jest.fn(() => respond(realm.directMappings, {})),
    getUserGroups: jest.fn(() => respond(realm.groups, [])),
    getEffectiveRealmRoles: jest.fn(() => respond(realm.effectiveRealmRoles, [])),
    getGroupByPath: jest.fn((_target, path: string) => respond(realm.groupsByPath?.[path])),
    getGroupRoleMappings: jest.fn((_target, id: string) => respond(realm.groupMappings?.[id], {})),
    getRoleComposites: jest.fn((_target, id: string) => respond(realm.composites?.[id], [])),
    getClient: jest.fn((_target, uuid: string) =>
      respond(realm.clients?.[uuid] ? { id: uuid, clientId: realm.clients[uuid], secret: 'secret' } : undefined),
    ),
  };
}

const devRealm: FakeRealm = {
  directMappings: {
    realmMappings: [defaultRoles],
    clientMappings: {
      [TENANT_SERVICE]: { id: 'c-tenant', client: TENANT_SERVICE, mappings: [tenantAdmin] },
    },
  },
  composites: {
    'r-default': [offlineAccess, manageAccount],
    'a-manage': [manageAccountLinks],
    't-admin': [formAdmin, roleTest],
  },
  clients: { 'c-account': 'account', 'c-form': FORM_SERVICE },
  effectiveRealmRoles: [defaultRoles, offlineAccess, roleTest],
};

async function resolve(realm: FakeRealm) {
  const reader = createFakeReader(realm);
  const result = await createRoleAssignmentResolver(reader as unknown as UserReader).resolveUserRoleAssignments(
    target,
    USER_ID,
  );
  return { reader, result };
}

async function resolveRoles(realm: FakeRealm) {
  const { result } = await resolve(realm);
  if (result.ok === false) {
    throw new Error(`Expected roles, got ${result.problem.reason}`);
  }
  return result.value;
}

function findRole(roles: ResolvedRole[], name: string, client?: string): ResolvedRole {
  const role = roles.find((candidate) => candidate.name === name && candidate.client === client);
  if (!role) {
    throw new Error(`Role ${client ? `${client}:` : ''}${name} was not resolved`);
  }
  return role;
}

describe('createRoleAssignmentResolver', () => {
  it('returns directly assigned realm and client roles with the client that owns each one', async () => {
    const { roles, groups, incomplete } = await resolveRoles(devRealm);

    expect(findRole(roles, 'default-roles-realm-1')).toEqual({
      id: 'r-default',
      name: 'default-roles-realm-1',
      composite: true,
      sources: [{ type: 'direct' }],
    });
    expect(findRole(roles, 'tenant-admin', TENANT_SERVICE)).toMatchObject({
      client: TENANT_SERVICE,
      description: 'Tenant administrator',
      sources: [{ type: 'direct' }],
    });
    expect(groups).toEqual([]);
    expect(incomplete).toBe(false);
  });

  it('marks roles inherited through composites with the chain of roles they came through', async () => {
    const { roles } = await resolveRoles(devRealm);

    expect(findRole(roles, 'offline_access').sources).toEqual([
      { type: 'composite', via: [{ name: 'default-roles-realm-1' }] },
    ]);
    expect(findRole(roles, 'manage-account-links', 'account').sources).toEqual([
      { type: 'composite', via: [{ name: 'default-roles-realm-1' }, { name: 'manage-account', client: 'account' }] },
    ]);
  });

  it('follows a client composite role to the realm roles it contains', async () => {
    const { roles } = await resolveRoles(devRealm);

    expect(findRole(roles, 'role-test').sources).toEqual([
      { type: 'composite', via: [{ name: 'tenant-admin', client: TENANT_SERVICE }] },
    ]);
    expect(findRole(roles, 'form-admin', FORM_SERVICE).sources).toEqual([
      { type: 'composite', via: [{ name: 'tenant-admin', client: TENANT_SERVICE }] },
    ]);
  });

  it('reads each composite once and looks up only the clients the role mappings did not name', async () => {
    const { reader } = await resolve(devRealm);

    expect(reader.getRoleComposites.mock.calls.map(([, id]) => id).sort()).toEqual([
      'a-manage',
      'r-default',
      't-admin',
    ]);
    expect(reader.getClient.mock.calls.map(([, uuid]) => uuid).sort()).toEqual(['c-account', 'c-form']);
  });

  it('keeps every source of a role that is both assigned directly and inherited, direct first', async () => {
    const { roles } = await resolveRoles({
      ...devRealm,
      directMappings: {
        ...(devRealm.directMappings as KeycloakRepresentation),
        realmMappings: [offlineAccess, defaultRoles],
      },
    });

    expect(findRole(roles, 'offline_access').sources).toEqual([
      { type: 'direct' },
      { type: 'composite', via: [{ name: 'default-roles-realm-1' }] },
    ]);
  });

  it("includes roles from the user's groups and their parent groups, naming the group", async () => {
    const reviewer = realmRole('r-reviewer', 'reviewer');
    const { reader, result } = await resolve({
      groups: [{ id: 'g-reviewers', path: '/tenant-admins/reviewers', name: 'reviewers' }],
      groupsByPath: { '/tenant-admins': { id: 'g-admins', path: '/tenant-admins' } },
      groupMappings: {
        'g-reviewers': { realmMappings: [reviewer] },
        'g-admins': {
          clientMappings: { [TENANT_SERVICE]: { id: 'c-tenant', client: TENANT_SERVICE, mappings: [tenantAdmin] } },
        },
      },
      composites: { 't-admin': [formAdmin] },
      clients: { 'c-form': FORM_SERVICE },
    });

    if (result.ok === false) {
      throw new Error('Expected roles');
    }
    const { roles, groups } = result.value;
    expect(groups).toEqual(['/tenant-admins/reviewers']);
    expect(findRole(roles, 'reviewer').sources).toEqual([{ type: 'group', group: '/tenant-admins/reviewers' }]);
    expect(findRole(roles, 'tenant-admin', TENANT_SERVICE).sources).toEqual([
      { type: 'group', group: '/tenant-admins' },
    ]);
    expect(findRole(roles, 'form-admin', FORM_SERVICE).sources).toEqual([
      { type: 'composite', group: '/tenant-admins', via: [{ name: 'tenant-admin', client: TENANT_SERVICE }] },
    ]);
    expect(reader.getGroupByPath).toHaveBeenCalledWith(target, '/tenant-admins');
    expect(reader.getGroupByPath).not.toHaveBeenCalledWith(target, '/tenant-admins/reviewers');
  });

  it('reports a realm role Keycloak says is effective but that could not be traced as unresolved', async () => {
    const mystery = realmRole('r-mystery', 'mystery-role');
    const { roles, incomplete } = await resolveRoles({
      ...devRealm,
      effectiveRealmRoles: [defaultRoles, offlineAccess, roleTest, mystery],
    });

    expect(findRole(roles, 'mystery-role').sources).toEqual([{ type: 'unresolved' }]);
    expect(incomplete).toBe(false);
  });

  it('marks the result incomplete, rather than guessing, when a composite cannot be read', async () => {
    const { roles, incomplete } = await resolveRoles({
      ...devRealm,
      composites: { ...devRealm.composites, 'a-manage': FORBIDDEN },
    });

    expect(incomplete).toBe(true);
    expect(roles.some((role) => role.name === 'manage-account-links')).toBe(false);
    expect(findRole(roles, 'manage-account', 'account').sources).toEqual([
      { type: 'composite', via: [{ name: 'default-roles-realm-1' }] },
    ]);
  });

  it('marks the result incomplete when the effective realm roles cannot be read', async () => {
    const { incomplete } = await resolveRoles({ ...devRealm, effectiveRealmRoles: FORBIDDEN });

    expect(incomplete).toBe(true);
  });

  it('marks the result incomplete when a parent group cannot be found', async () => {
    const { incomplete } = await resolveRoles({ groups: [{ id: 'g-child', path: '/parent/child' }] });

    expect(incomplete).toBe(true);
  });

  it('stops at composite cycles', async () => {
    const roleA = realmRole('r-a', 'role-a', true);
    const roleB = realmRole('r-b', 'role-b', true);
    const { roles, incomplete } = await resolveRoles({
      directMappings: { realmMappings: [roleA] },
      composites: { 'r-a': [roleB], 'r-b': [roleA] },
    });

    expect(roles.map(({ name }) => name).sort()).toEqual(['role-a', 'role-b']);
    expect(findRole(roles, 'role-b').sources).toEqual([{ type: 'composite', via: [{ name: 'role-a' }] }]);
    expect(incomplete).toBe(false);
  });

  it('stops following composites past the depth limit and marks the result incomplete', async () => {
    const chain = Array.from({ length: MAX_COMPOSITE_DEPTH + 2 }, (_, index) =>
      realmRole(`r-${index}`, `level-${index}`, true),
    );
    const composites = Object.fromEntries(chain.slice(0, -1).map((role, index) => [role.id, [chain[index + 1]]]));

    const { roles, incomplete } = await resolveRoles({ directMappings: { realmMappings: [chain[0]] }, composites });

    expect(incomplete).toBe(true);
    expect(roles.length).toBeLessThan(chain.length);
  });

  it("names a role's client by its internal ID when the client cannot be read", async () => {
    const { roles } = await resolveRoles({ ...devRealm, clients: { 'c-account': 'account' } });

    expect(findRole(roles, 'form-admin', 'c-form')).toMatchObject({ client: 'c-form' });
  });

  it('keeps at most three sources per role', async () => {
    const parents = Array.from({ length: 5 }, (_, index) => realmRole(`r-parent-${index}`, `parent-${index}`, true));
    const { roles } = await resolveRoles({
      directMappings: { realmMappings: parents },
      composites: Object.fromEntries(parents.map((parent) => [parent.id, [offlineAccess]])),
    });

    expect(findRole(roles, 'offline_access').sources).toHaveLength(3);
  });

  it.each([
    ['role mappings', { directMappings: FORBIDDEN }],
    ['groups', { groups: FORBIDDEN }],
  ])('returns the problem when the user %s cannot be read', async (_name, realm) => {
    const { result } = await resolve(realm as FakeRealm);

    expect(result).toEqual({ ok: false, problem: createProblem('unavailable', 'NO_USER_PERMISSION') });
  });
});
