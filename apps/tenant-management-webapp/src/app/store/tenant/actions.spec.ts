import {
  FETCH_REALM_ROLES,
  FETCH_REALM_ROLES_FAILED,
  FETCH_REALM_ROLES_SUCCESS,
  FetchRealmRoles,
  FetchRealmRolesFailed,
  FetchRealmRolesSuccess,
} from './actions';

describe('tenant realm role actions', () => {
  it('creates the fetch action', () => {
    // Arrange / Act
    const action = FetchRealmRoles();

    // Assert
    expect(action).toEqual({ type: FETCH_REALM_ROLES });
  });

  it('creates the success action with the roles', () => {
    // Arrange
    const roles = [{ id: '1', name: 'admin' }];

    // Act
    const action = FetchRealmRolesSuccess(roles);

    // Assert
    expect(action).toEqual({ type: FETCH_REALM_ROLES_SUCCESS, payload: roles });
  });

  it('creates the failed action', () => {
    // Arrange / Act
    const action = FetchRealmRolesFailed();

    // Assert
    expect(action).toEqual({ type: FETCH_REALM_ROLES_FAILED });
  });
});
