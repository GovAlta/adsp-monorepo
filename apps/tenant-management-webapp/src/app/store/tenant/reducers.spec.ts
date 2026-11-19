import tenantReducer from './reducers';
import { FetchRealmRolesFailed, FetchRealmRolesSuccess } from './actions';
import { TENANT_INIT } from './models';

describe('tenant reducer realm roles', () => {
  it('marks realm roles as failed when the fetch fails', () => {
    // Arrange / Act
    const state = tenantReducer(TENANT_INIT, FetchRealmRolesFailed());

    // Assert
    expect(state.realmRolesFailed).toBe(true);
    expect(state.realmRoles).toBeNull();
  });

  it('clears the failed flag when roles load', () => {
    // Arrange
    const failed = { ...TENANT_INIT, realmRolesFailed: true };

    // Act
    const state = tenantReducer(failed, FetchRealmRolesSuccess([{ id: '1', name: 'admin' }]));

    // Assert
    expect(state.realmRolesFailed).toBe(false);
    expect(state.realmRoles).toEqual([{ id: '1', name: 'admin' }]);
  });
});
