import { toAccessUser, toAccessUserRoles } from './userView';

// Shaped like GET /users/{id} on Keycloak 25, including the fields that must never be copied.
const keycloakUser = {
  id: 'user-id-1',
  username: 'jane.doe@gov.ab.ca',
  email: 'jane.doe@gov.ab.ca',
  firstName: 'Jane',
  lastName: 'Doe',
  enabled: true,
  emailVerified: false,
  totp: false,
  createdTimestamp: 1700000000000,
  notBefore: 0,
  access: { manage: true, impersonate: true },
  attributes: { phone: ['780-555-0100'] },
  credentials: [{ type: 'password', value: 'hunter2' }],
  disableableCredentialTypes: [],
  requiredActions: ['VERIFY_EMAIL', 'CONFIGURE_TOTP'],
  federatedIdentities: [
    { identityProvider: 'core', userId: 'idp-user-id-9', userName: 'jdoe-at-idp' },
    { identityProvider: 'goa-ad', userId: 'ad-object-id', userName: 'Jane.Doe@gov.ab.ca' },
  ],
};

describe('toAccessUser', () => {
  it('keeps only the details needed to identify the user', () => {
    expect(toAccessUser(keycloakUser)).toEqual({
      id: 'user-id-1',
      username: 'jane.doe@gov.ab.ca',
      enabled: true,
      emailVerified: false,
      requiredActions: ['CONFIGURE_TOTP', 'VERIFY_EMAIL'],
      identityProviders: ['core', 'goa-ad'],
    });
  });

  it('never copies names, email, attributes, credentials or identity provider user details', () => {
    const serialized = JSON.stringify(toAccessUser({ ...keycloakUser, username: 'jdoe' }));

    for (const value of [
      'Jane',
      'Doe',
      'jane.doe@gov.ab.ca',
      '780-555-0100',
      'hunter2',
      'idp-user-id-9',
      'ad-object-id',
      'manage',
    ]) {
      expect(serialized).not.toContain(value);
    }
  });

  it('leaves out flags Keycloak did not return and lists nothing for missing lists', () => {
    expect(toAccessUser({ id: 'id-1', username: 'jdoe' })).toEqual({
      id: 'id-1',
      username: 'jdoe',
      requiredActions: [],
      identityProviders: [],
    });
  });

  it.each([[{ username: 'jdoe' }], [{ id: 'id-1' }], [{ id: 1, username: 'jdoe' }]])(
    'returns undefined without a string ID and username: %j',
    (user) => {
      expect(toAccessUser(user)).toBeUndefined();
    },
  );
});

describe('toAccessUserRoles', () => {
  const view = toAccessUserRoles({
    roles: [
      {
        id: 'r-2',
        name: 'offline_access',
        composite: false,
        sources: [{ type: 'composite', via: [{ name: 'default-roles' }] }],
      },
      { id: 'r-1', name: 'default-roles', composite: true, sources: [{ type: 'direct' }] },
      {
        id: 't-1',
        name: 'tenant-admin',
        client: 'urn:ads:platform:tenant-service',
        description: 'Tenant administrator',
        composite: true,
        sources: [{ type: 'direct' }, { type: 'group', group: '/tenant-admins' }],
      },
      {
        id: 'f-2',
        name: 'form-support',
        client: 'urn:ads:platform:form-service',
        composite: false,
        sources: [{ type: 'group', group: '/tenant-admins' }],
      },
      {
        id: 'f-1',
        name: 'form-admin',
        client: 'urn:ads:platform:form-service',
        composite: false,
        sources: [{ type: 'composite', via: [{ name: 'tenant-admin', client: 'urn:ads:platform:tenant-service' }] }],
      },
    ],
    groups: ['/tenant-admins'],
    incomplete: false,
  });

  it('separates realm roles from client roles grouped by client, in name order', () => {
    expect(view.realmRoles.map(({ name }) => name)).toEqual(['default-roles', 'offline_access']);
    expect(view.clientRoles.map(({ clientId, roles }) => [clientId, roles.map(({ name }) => name)])).toEqual([
      ['urn:ads:platform:form-service', ['form-admin', 'form-support']],
      ['urn:ads:platform:tenant-service', ['tenant-admin']],
    ]);
  });

  it('marks a role inherited unless it is assigned to the user directly', () => {
    expect(view.realmRoles).toEqual([
      { name: 'default-roles', composite: true, inherited: false, sources: [{ type: 'direct' }] },
      {
        name: 'offline_access',
        composite: false,
        inherited: true,
        sources: [{ type: 'composite', via: [{ name: 'default-roles' }] }],
      },
    ]);
    expect(view.clientRoles[1].roles[0]).toMatchObject({ description: 'Tenant administrator', inherited: false });
    expect(view.clientRoles[0].roles.every(({ inherited }) => inherited)).toBe(true);
  });

  it('counts direct and inherited roles and keeps the groups', () => {
    expect(view.counts).toEqual({ direct: 2, inherited: 3 });
    expect(view.groups).toEqual(['/tenant-admins']);
    expect(view).not.toHaveProperty('incomplete');
  });

  it('flags an incomplete result', () => {
    expect(toAccessUserRoles({ roles: [], groups: [], incomplete: true })).toEqual({
      realmRoles: [],
      clientRoles: [],
      groups: [],
      counts: { direct: 0, inherited: 0 },
      incomplete: true,
    });
  });
});
