import { areRolesUnavailable, canShowFormEditor, ROLES_UNAVAILABLE_REASON } from './rolesAvailability';

const ready = {
  definitionId: 'my-form',
  realmRoles: [{ id: '1', name: 'admin' }],
  realmRolesFailed: false,
  queueTasks: {},
  fileTypes: [],
};

describe('canShowFormEditor', () => {
  it('shows the editor when everything has loaded', () => {
    // Arrange / Act / Assert
    expect(canShowFormEditor(ready)).toBe(true);
  });

  it('shows the editor when realm roles failed to load', () => {
    // Arrange
    const input = { ...ready, realmRoles: null, realmRolesFailed: true };

    // Act / Assert
    expect(canShowFormEditor(input)).toBe(true);
  });

  it('waits while realm roles are still loading', () => {
    // Arrange
    const input = { ...ready, realmRoles: null, realmRolesFailed: false };

    // Act / Assert
    expect(canShowFormEditor(input)).toBe(false);
  });

  it.each(['definitionId', 'queueTasks', 'fileTypes'])('waits while %s is missing', (key) => {
    // Arrange
    const input = { ...ready, [key]: undefined };

    // Act / Assert
    expect(canShowFormEditor(input)).toBe(false);
  });
});

describe('areRolesUnavailable', () => {
  it.each([
    [false, false, false],
    [true, false, true],
    [false, true, true],
    [undefined, undefined, false],
  ])('realm failed %s, service failed %s -> %s', (realm, service, expected) => {
    // Arrange / Act / Assert
    expect(areRolesUnavailable(realm, service)).toBe(expected);
  });
});

describe('ROLES_UNAVAILABLE_REASON', () => {
  it('names the Keycloak roles needed to load roles', () => {
    // Arrange / Act / Assert
    expect(ROLES_UNAVAILABLE_REASON).toContain('view-realm');
    expect(ROLES_UNAVAILABLE_REASON).toContain('view-clients');
    expect(ROLES_UNAVAILABLE_REASON).toContain('realm-management');
  });
});
