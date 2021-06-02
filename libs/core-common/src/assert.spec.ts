import { authenticateToken, AuthenticationConfig } from './assert';

describe('Token authentication', () => {
  const adminRole = 'admin';

  const user = {
    id: 'mock-user-id',
    name: 'tester',
    email: 'mock-user@gov.ab.ca',
    tenantName: 'mock-tenant',
    client: 'mock-client',
    roles: [adminRole],
  };

  it('Can pass', () => {
    const emptyConfig: AuthenticationConfig = {};
    expect(authenticateToken(emptyConfig, user)).toBe(true);

    const roleConfig: AuthenticationConfig = {
      allowedRoles: ['admin'],
    };
    expect(authenticateToken(roleConfig, user)).toBe(true);

    const roleErrConfig: AuthenticationConfig = {
      allowedRoles: ['admin2'],
    };

    expect(authenticateToken(roleErrConfig, user)).toBe(false);
  });
});
