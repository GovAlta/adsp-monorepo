import { AdminReadTarget, isRepresentationList, KeycloakRepresentation, readAdmin } from './adminRead';
import { RealmClientResult, RequestErrorReasons } from './realmClient';
import { isRecord } from './values';

const ROLE_REASONS: RequestErrorReasons = { forbidden: 'NO_PERMISSION', notFound: 'ROLE_NOT_FOUND' };
const LIST_REASONS: RequestErrorReasons = { forbidden: 'NO_PERMISSION', notFound: 'REALM_NOT_FOUND' };
const MEMBER_REASONS: RequestErrorReasons = { forbidden: 'NO_USER_PERMISSION', notFound: 'ROLE_NOT_FOUND' };

/**
 * A role in the realm: a realm role, or a client role identified by Keycloak's internal ID of its client.
 */
export interface RoleLocator {
  name: string;
  clientUuid?: string;
}

function rolePath({ name, clientUuid }: RoleLocator): string {
  const roleName = encodeURIComponent(name);
  return clientUuid ? `/clients/${encodeURIComponent(clientUuid)}/roles/${roleName}` : `/roles/${roleName}`;
}

/**
 * Reads realm and client roles, who holds them and group membership through the Admin REST API. Only GET requests
 * are ever made, with the signed-in user's token, so Keycloak enforces the user's realm-management permissions.
 */
export function createRoleReader() {
  function getRole(target: AdminReadTarget, role: RoleLocator): Promise<RealmClientResult<KeycloakRepresentation>> {
    return readAdmin(target, rolePath(role), ROLE_REASONS, isRecord);
  }

  function listRealmRoles(target: AdminReadTarget): Promise<RealmClientResult<KeycloakRepresentation[]>> {
    return readAdmin(target, '/roles', LIST_REASONS, isRepresentationList, { briefRepresentation: true });
  }

  function listClientRoles(
    target: AdminReadTarget,
    clientUuid: string,
  ): Promise<RealmClientResult<KeycloakRepresentation[]>> {
    return readAdmin(target, `/clients/${encodeURIComponent(clientUuid)}/roles`, LIST_REASONS, isRepresentationList, {
      briefRepresentation: true,
    });
  }

  /**
   * Lists the users the role is assigned to directly, not through groups or composite roles.
   */
  function listRoleUsers(
    target: AdminReadTarget,
    role: RoleLocator,
    max: number,
  ): Promise<RealmClientResult<KeycloakRepresentation[]>> {
    return readAdmin(target, `${rolePath(role)}/users`, MEMBER_REASONS, isRepresentationList, {
      first: 0,
      max,
      briefRepresentation: true,
    });
  }

  /**
   * Lists the groups the role is assigned to directly.
   */
  function listRoleGroups(
    target: AdminReadTarget,
    role: RoleLocator,
    max: number,
  ): Promise<RealmClientResult<KeycloakRepresentation[]>> {
    return readAdmin(target, `${rolePath(role)}/groups`, MEMBER_REASONS, isRepresentationList, {
      first: 0,
      max,
      briefRepresentation: true,
    });
  }

  function listGroupMembers(
    target: AdminReadTarget,
    groupId: string,
    max: number,
  ): Promise<RealmClientResult<KeycloakRepresentation[]>> {
    return readAdmin(target, `/groups/${encodeURIComponent(groupId)}/members`, MEMBER_REASONS, isRepresentationList, {
      first: 0,
      max,
      briefRepresentation: true,
    });
  }

  function listSubgroups(
    target: AdminReadTarget,
    groupId: string,
    max: number,
  ): Promise<RealmClientResult<KeycloakRepresentation[]>> {
    return readAdmin(target, `/groups/${encodeURIComponent(groupId)}/children`, LIST_REASONS, isRepresentationList, {
      first: 0,
      max,
      briefRepresentation: true,
    });
  }

  return {
    getRole,
    listRealmRoles,
    listClientRoles,
    listRoleUsers,
    listRoleGroups,
    listGroupMembers,
    listSubgroups,
  };
}

export type RoleReader = ReturnType<typeof createRoleReader>;
