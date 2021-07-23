import { authenticateToken, AuthenticationConfig } from './assert';
import { adspId, User } from '@abgov/adsp-service-sdk';
describe('Token authentication', () => {
  const adminRole = 'admin';

  const user: User = {
    id: 'mock-user-id',
    name: 'tester',
    email: 'mock-user@gov.ab.ca',
    tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
    roles: [adminRole],
    isCore: false,
    token: null,
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
