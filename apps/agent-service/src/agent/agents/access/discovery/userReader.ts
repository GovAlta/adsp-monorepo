import { AdminReadTarget, isRepresentationList, KeycloakRepresentation, readAdmin } from './adminRead';
import { RealmClientResult, RequestErrorReasons } from './realmClient';
import { isRecord, optionalString } from './values';

const USER_REASONS: RequestErrorReasons = { forbidden: 'NO_USER_PERMISSION', notFound: 'USER_NOT_FOUND' };
const LOOKUP_REASONS: RequestErrorReasons = { forbidden: 'NO_PERMISSION', notFound: 'REALM_NOT_FOUND' };
const REALM_REASONS: RequestErrorReasons = { forbidden: 'NO_PERMISSION', notFound: 'REALM_NOT_FOUND' };

function userPath(userId: string): string {
  return `/users/${encodeURIComponent(userId)}`;
}

/**
 * Finds the user whose username or email is exactly the given text, ignoring case as Keycloak does.
 */
function pickExactMatch(users: KeycloakRepresentation[], field: 'username' | 'email', text: string) {
  const requested = text.toLowerCase();
  return users.find((user) => optionalString(user[field])?.toLowerCase() === requested);
}

/**
 * Reads Keycloak users, their groups and their role mappings through the Admin REST API. Only GET requests are ever
 * made, with the signed-in user's token, so Keycloak enforces the realm-management view-users permission.
 */
export function createUserReader() {
  /**
   * Finds the user whose username, or failing that email, is exactly the given text, and which of the two matched.
   * Resolves to undefined when no user matches.
   */
  async function findUserId(
    target: AdminReadTarget,
    text: string,
  ): Promise<RealmClientResult<{ id: string; field: 'username' | 'email' } | undefined>> {
    for (const field of ['username', 'email'] as const) {
      const result = await readAdmin(target, '/users', USER_REASONS, isRepresentationList, {
        [field]: text,
        exact: true,
        briefRepresentation: true,
      });
      if (result.ok === false) {
        return result;
      }

      const id = optionalString(pickExactMatch(result.value, field, text)?.id);
      if (id) {
        return { ok: true, value: { id, field } };
      }
    }

    return { ok: true, value: undefined };
  }

  /**
   * Lists users whose username, email, first or last name starts with each word of the text. Wrapping the text in
   * asterisks, as in *doe*, matches anywhere in those fields instead.
   */
  function searchUsers(
    target: AdminReadTarget,
    text: string,
    max: number,
  ): Promise<RealmClientResult<KeycloakRepresentation[]>> {
    return readAdmin(target, '/users', USER_REASONS, isRepresentationList, {
      search: text,
      first: 0,
      max,
      briefRepresentation: true,
    });
  }

  function getUser(target: AdminReadTarget, userId: string): Promise<RealmClientResult<KeycloakRepresentation>> {
    return readAdmin(target, userPath(userId), USER_REASONS, isRecord);
  }

  /**
   * Reads the roles mapped directly to a user, as realm mappings and client mappings keyed by client ID.
   */
  function getUserRoleMappings(
    target: AdminReadTarget,
    userId: string,
  ): Promise<RealmClientResult<KeycloakRepresentation>> {
    return readAdmin(target, `${userPath(userId)}/role-mappings`, USER_REASONS, isRecord);
  }

  function getUserGroups(
    target: AdminReadTarget,
    userId: string,
  ): Promise<RealmClientResult<KeycloakRepresentation[]>> {
    return readAdmin(target, `${userPath(userId)}/groups`, USER_REASONS, isRepresentationList, {
      briefRepresentation: true,
    });
  }

  /**
   * Reads the user's effective realm roles as Keycloak computes them, including those from groups and composites.
   */
  function getEffectiveRealmRoles(
    target: AdminReadTarget,
    userId: string,
  ): Promise<RealmClientResult<KeycloakRepresentation[]>> {
    return readAdmin(target, `${userPath(userId)}/role-mappings/realm/composite`, USER_REASONS, isRepresentationList);
  }

  /**
   * Finds a group by its full path, such as /tenant-admins/reviewers, to read the roles of a member's parent groups.
   */
  function getGroupByPath(target: AdminReadTarget, path: string): Promise<RealmClientResult<KeycloakRepresentation>> {
    const encodedPath = path
      .split('/')
      .filter((segment) => segment !== '')
      .map(encodeURIComponent)
      .join('/');
    return readAdmin(target, `/group-by-path/${encodedPath}`, LOOKUP_REASONS, isRecord);
  }

  function getGroupRoleMappings(
    target: AdminReadTarget,
    groupId: string,
  ): Promise<RealmClientResult<KeycloakRepresentation>> {
    return readAdmin(target, `/groups/${encodeURIComponent(groupId)}/role-mappings`, LOOKUP_REASONS, isRecord);
  }

  /**
   * Reads the realm and client roles a composite role contains, one level deep.
   */
  function getRoleComposites(
    target: AdminReadTarget,
    roleId: string,
  ): Promise<RealmClientResult<KeycloakRepresentation[]>> {
    return readAdmin(
      target,
      `/roles-by-id/${encodeURIComponent(roleId)}/composites`,
      LOOKUP_REASONS,
      isRepresentationList,
    );
  }

  /**
   * Reads a client by Keycloak's internal ID. Only its client ID is used, to name the client a role belongs to.
   */
  function getClient(target: AdminReadTarget, clientUuid: string): Promise<RealmClientResult<KeycloakRepresentation>> {
    return readAdmin(target, `/clients/${encodeURIComponent(clientUuid)}`, LOOKUP_REASONS, isRecord);
  }

  /**
   * Reads the user's brute-force lockout state: whether they are locked out, the failure count and the failure times.
   */
  function getLockoutStatus(
    target: AdminReadTarget,
    userId: string,
  ): Promise<RealmClientResult<KeycloakRepresentation>> {
    return readAdmin(
      target,
      `/attack-detection/brute-force/users/${encodeURIComponent(userId)}`,
      USER_REASONS,
      isRecord,
    );
  }

  function getUserSessions(
    target: AdminReadTarget,
    userId: string,
  ): Promise<RealmClientResult<KeycloakRepresentation[]>> {
    return readAdmin(target, `${userPath(userId)}/sessions`, USER_REASONS, isRepresentationList);
  }

  /**
   * Reads the user's stored credentials. Only each credential's type is used; the rest is discarded.
   */
  function getUserCredentials(
    target: AdminReadTarget,
    userId: string,
  ): Promise<RealmClientResult<KeycloakRepresentation[]>> {
    return readAdmin(target, `${userPath(userId)}/credentials`, USER_REASONS, isRepresentationList);
  }

  /**
   * Reads whether the realm records user events such as sign-in errors. Needs the view-events role.
   */
  function getEventsConfig(target: AdminReadTarget): Promise<RealmClientResult<KeycloakRepresentation>> {
    return readAdmin(target, '/events/config', REALM_REASONS, isRecord);
  }

  /**
   * Reads the most recent stored events for the user, newest first. Needs the view-events role.
   */
  function listUserEvents(
    target: AdminReadTarget,
    userId: string,
    max: number,
  ): Promise<RealmClientResult<KeycloakRepresentation[]>> {
    return readAdmin(target, '/events', REALM_REASONS, isRepresentationList, { user: userId, first: 0, max });
  }

  /**
   * Reads the realm's settings. Only lockout protection settings are used; the rest is discarded.
   */
  function getRealmSettings(target: AdminReadTarget): Promise<RealmClientResult<KeycloakRepresentation>> {
    return readAdmin(target, '', REALM_REASONS, isRecord);
  }

  return {
    findUserId,
    searchUsers,
    getLockoutStatus,
    getUserSessions,
    getUserCredentials,
    getEventsConfig,
    listUserEvents,
    getRealmSettings,
    getUser,
    getUserRoleMappings,
    getUserGroups,
    getEffectiveRealmRoles,
    getGroupByPath,
    getGroupRoleMappings,
    getRoleComposites,
    getClient,
  };
}

export type UserReader = ReturnType<typeof createUserReader>;
