import { authenticateToken, AuthenticationConfig } from './assert';
import { User, UserRole } from './types';

describe('Token authentication', () => {
  const adminRole: UserRole = 'admin';

  const user: User = {
    id: 'mock-user-id',
    name: 'tester',
    email: 'mock-user@gov.ab.ca',
    tenantName: 'mock-tenant',
    client: 'mock-client',
    organizationId: 'gov-1234',
    roles: [adminRole],
  };
  it('Can pass', () => {
    const emptyConfig: AuthenticationConfig = {};
    expect(authenticateToken(emptyConfig, user)).toBe(true);
    const tenantClientConfig: AuthenticationConfig = {
      tenantName: 'mock-tenant',
      client: 'mock-client',
    };
    expect(authenticateToken(tenantClientConfig, user)).toBe(true);

    const tenantClientErrConfig1: AuthenticationConfig = {
      tenantName: 'mock-tenant-1',
      client: 'mock-client',
    };
    expect(authenticateToken(tenantClientErrConfig1, user)).toBe(false);
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
