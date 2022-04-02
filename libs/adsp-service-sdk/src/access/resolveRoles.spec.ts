import { resolveRoles } from './resolveRoles';

describe('resolveRoles', () => {
  it('can resolve realm roles', () => {
    const roles = resolveRoles('test-service', {
      realm_access: { roles: ['realm-role'] },
      resource_access: {
        'test-service': { roles: ['aud-client-role'] },
        'other-service': { roles: ['other-client-role'] },
      },
    });

    expect(roles).toEqual(expect.arrayContaining(['realm-role', 'aud-client-role', 'other-service:other-client-role']));
  });

  it('can handle missing realm_access', () => {
    const roles = resolveRoles('test-service', {
      resource_access: {
        'test-service': { roles: ['aud-client-role'] },
        'other-service': { roles: ['other-client-role'] },
      },
    });

    expect(roles).toEqual(expect.arrayContaining(['aud-client-role', 'other-service:other-client-role']));
  });

  it('can handle missing resource_access', () => {
    const roles = resolveRoles('test-service', {
      realm_access: { roles: ['realm-role'] },
    });

    expect(roles).toEqual(expect.arrayContaining(['realm-role']));
  });

  it('can handle null resource_access property', () => {
    const roles = resolveRoles('test-service', {
      realm_access: { roles: ['realm-role'] },
      resource_access: {
        'test-service': null,
        'other-service': { roles: ['other-client-role'] },
      },
    });

    expect(roles).toEqual(expect.arrayContaining(['realm-role', 'other-service:other-client-role']));
  });

  it('can handle null roles', () => {
    const roles = resolveRoles('test-service', {
      realm_access: { roles: ['realm-role'] },
      resource_access: {
        'test-service': { roles: null },
        'other-service': { roles: ['other-client-role'] },
      },
    });

    expect(roles).toEqual(expect.arrayContaining(['realm-role', 'other-service:other-client-role']));
  });
});
