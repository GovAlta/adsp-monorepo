import { TENANT_INIT } from './models';

describe('TENANT_INIT', () => {
  it('starts with realm roles not loaded and not failed', () => {
    // Arrange / Act
    const { realmRoles, realmRolesFailed } = TENANT_INIT;

    // Assert
    expect(realmRoles).toBeNull();
    expect(realmRolesFailed).toBe(false);
  });
});
