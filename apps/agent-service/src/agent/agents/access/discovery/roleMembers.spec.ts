import type { User } from '@abgov/adsp-service-sdk';
import type { IndexedRole, RoleIndex } from './roleIndex';
import { createRoleMemberResolver, MAX_ROLE_MEMBERS } from './roleMembers';
import type { RoleLocator, RoleReader } from './roleReader';
import { createProblem } from './types';

const target = { host: 'https://access.adsp-dev.gov.ab.ca', realm: 'realm-1', user: {} as User };
const TENANT_SERVICE = 'urn:ads:platform:tenant-service';
const FORM_SERVICE = 'urn:ads:platform:form-service';

const formAdmin: IndexedRole = {
  id: 'r-form-admin',
  name: 'form-admin',
  client: FORM_SERVICE,
  clientUuid: 'c-form',
  composite: false,
};
const tenantAdmin: IndexedRole = {
  id: 'r-admin',
  name: 'tenant-admin',
  client: TENANT_SERVICE,
  clientUuid: 'c-tenant',
  composite: true,
};

const index: RoleIndex = {
  roles: new Map([
    [formAdmin.id, formAdmin],
    [tenantAdmin.id, tenantAdmin],
  ]),
  parents: new Map([['r-form-admin', ['r-admin']]]),
  children: new Map([['r-admin', ['r-form-admin']]]),
  incomplete: false,
};

const user = (id: string, username: string, extra: Record<string, unknown> = {}) => ({
  id,
  username,
  email: `${username}@example.com`,
  ...extra,
});

function createReader(overrides: Partial<Record<keyof RoleReader, jest.Mock>> = {}) {
  const reader = {
    listRoleUsers: jest.fn(async (_target, role: RoleLocator) => ({
      ok: true,
      value:
        role.name === 'form-admin'
          ? [user('u-1', 'zed'), user('u-2', 'service-account-intake')]
          : [user('u-3', 'amy'), user('u-1', 'zed')],
    })),
    listRoleGroups: jest.fn(async (_target, role: RoleLocator) => ({
      ok: true,
      value: role.name === 'tenant-admin' ? [{ id: 'g-1', path: '/tenant-admins' }] : [],
    })),
    listGroupMembers: jest.fn(async (_target, groupId: string) => ({
      ok: true,
      value: groupId === 'g-1' ? [user('u-4', 'bob', { enabled: false })] : [user('u-5', 'cat')],
    })),
    listSubgroups: jest.fn(async (_target, groupId: string) => ({
      ok: true,
      value: groupId === 'g-1' ? [{ id: 'g-2', path: '/tenant-admins/reviewers' }] : [],
    })),
    ...overrides,
  };
  return { reader, resolver: createRoleMemberResolver(reader as unknown as RoleReader) };
}

describe('createRoleMemberResolver', () => {
  it('lists holders directly, through composites and through groups and subgroups, with usernames only', async () => {
    const { resolver } = createReader();

    const result = await resolver.resolveRoleMembers(target, index, formAdmin);

    const via = [{ name: 'tenant-admin', client: TENANT_SERVICE }];
    expect(result).toEqual({
      ok: true,
      value: {
        truncated: false,
        members: [
          { username: 'service-account-intake', serviceAccount: true, sources: [{ type: 'direct' }] },
          { username: 'zed', serviceAccount: false, sources: [{ type: 'direct' }, { type: 'composite', via }] },
          { username: 'amy', serviceAccount: false, sources: [{ type: 'composite', via }] },
          {
            username: 'bob',
            serviceAccount: false,
            enabled: false,
            sources: [{ type: 'composite', via, group: '/tenant-admins' }],
          },
          { username: 'cat', serviceAccount: false, sources: [{ type: 'composite', via, group: '/tenant-admins' }] },
        ],
      },
    });
    expect(JSON.stringify(result)).not.toContain('@example.com');
  });

  it('reports group holders of the role itself as group sources', async () => {
    const { resolver } = createReader({
      listRoleUsers: jest.fn().mockResolvedValue({ ok: true, value: [] }),
      listRoleGroups: jest.fn().mockResolvedValue({ ok: true, value: [{ id: 'g-9', path: '/editors' }] }),
      listSubgroups: jest.fn().mockResolvedValue({ ok: true, value: [] }),
    });

    const result = await resolver.resolveRoleMembers(target, { ...index, parents: new Map() }, formAdmin);

    expect(result.ok === true && result.value.members).toEqual([
      { username: 'cat', serviceAccount: false, sources: [{ type: 'group', group: '/editors' }] },
    ]);
  });

  it('caps the members and marks the result truncated', async () => {
    const many = Array.from({ length: MAX_ROLE_MEMBERS + 1 }, (_, i) => user(`u-${i}`, `user${i}`));
    const { resolver } = createReader({
      listRoleUsers: jest.fn().mockResolvedValue({ ok: true, value: many }),
      listRoleGroups: jest.fn().mockResolvedValue({ ok: true, value: [] }),
    });

    const result = await resolver.resolveRoleMembers(target, { ...index, parents: new Map() }, formAdmin);

    expect(result.ok === true && result.value.members).toHaveLength(MAX_ROLE_MEMBERS);
    expect(result.ok === true && result.value.truncated).toBe(true);
  });

  it('returns the problem when the role itself cannot be read', async () => {
    const problem = createProblem('unavailable', 'NO_USER_PERMISSION');
    const { resolver } = createReader({ listRoleUsers: jest.fn().mockResolvedValue({ ok: false, problem }) });

    expect(await resolver.resolveRoleMembers(target, index, formAdmin)).toEqual({ ok: false, problem });
  });

  it('marks the result truncated when the index is incomplete', async () => {
    const { resolver } = createReader();

    const result = await resolver.resolveRoleMembers(target, { ...index, incomplete: true }, formAdmin);

    expect(result.ok === true && result.value.truncated).toBe(true);
  });
});
