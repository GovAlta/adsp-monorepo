import { AdminReadTarget, isRepresentationList, KeycloakRepresentation, readAdmin } from './adminRead';
import { RealmClientResult, RequestErrorReasons } from './realmClient';
import { displayText, isRecord, optionalString } from './values';

export type { KeycloakRepresentation } from './adminRead';

/**
 * Where a client read goes: the Keycloak host and realm from the user's resolved scope, read with the user's own
 * token so Keycloak enforces the user's realm-management permissions.
 */
export type ClientReaderTarget = AdminReadTarget;

export interface KeycloakClientConfiguration {
  client: KeycloakRepresentation;
  roles: KeycloakRepresentation[];
  scopeMappings: KeycloakRepresentation;
}

interface ListClientsOptions {
  search?: string;
  max: number;
}

// Searching by name or description reads the realm's clients and filters them here, since Keycloak's client search
// only matches client IDs. Realms rarely have more clients than this.
export const MAX_SCANNED_CLIENTS = 500;

/**
 * Whether the client's ID, name or description contains the text, ignoring case.
 */
export function clientMatchesText(client: KeycloakRepresentation, text: string): boolean {
  const search = text.toLowerCase();
  return [optionalString(client.clientId), displayText(client.name), displayText(client.description)].some((value) =>
    value?.toLowerCase().includes(search),
  );
}

const LIST_REASONS: RequestErrorReasons = { forbidden: 'NO_CLIENT_PERMISSION', notFound: 'REALM_NOT_FOUND' };
const CLIENT_REASONS: RequestErrorReasons = { forbidden: 'NO_CLIENT_PERMISSION', notFound: 'CLIENT_NOT_FOUND' };

/**
 * Reads Keycloak client configuration through the Admin REST API. Only GET requests are ever made.
 */
export function createClientReader() {
  function listAllClients(target: ClientReaderTarget): Promise<RealmClientResult<KeycloakRepresentation[]>> {
    return readAdmin(target, '/clients', LIST_REASONS, isRepresentationList, { first: 0, max: MAX_SCANNED_CLIENTS });
  }

  /**
   * Lists clients in the realm, optionally only those whose client ID, name or description contains the search text
   * (case-insensitive).
   */
  async function listClients(
    target: ClientReaderTarget,
    { search, max }: ListClientsOptions,
  ): Promise<RealmClientResult<KeycloakRepresentation[]>> {
    if (!search) {
      return readAdmin(target, '/clients', LIST_REASONS, isRepresentationList, { first: 0, max });
    }

    const all = await listAllClients(target);
    return all.ok === false
      ? all
      : { ok: true, value: all.value.filter((client) => clientMatchesText(client, search)).slice(0, max) };
  }

  /**
   * Finds Keycloak's internal ID for the client with this client ID. Resolves to undefined when there is no such
   * client. Keycloak's exact lookup ignores case, so a match differing only in case is accepted when there is no
   * exact match.
   */
  async function findClientInternalId(
    target: ClientReaderTarget,
    clientId: string,
  ): Promise<RealmClientResult<string | undefined>> {
    const result = await readAdmin(target, '/clients', LIST_REASONS, isRepresentationList, { clientId });
    if (result.ok === false) {
      return result;
    }

    const requestedClientId = clientId.toLowerCase();
    const client =
      result.value.find((candidate) => candidate.clientId === clientId) ??
      result.value.find(
        (candidate) => typeof candidate.clientId === 'string' && candidate.clientId.toLowerCase() === requestedClientId,
      );
    return { ok: true, value: typeof client?.id === 'string' ? client.id : undefined };
  }

  /**
   * Reads a client's full configuration, its client roles and its role scope mappings by Keycloak's internal ID.
   */
  async function getClientConfiguration(
    target: ClientReaderTarget,
    id: string,
  ): Promise<RealmClientResult<KeycloakClientConfiguration>> {
    const clientPath = `/clients/${encodeURIComponent(id)}`;
    const [client, roles, scopeMappings] = await Promise.all([
      readAdmin(target, clientPath, CLIENT_REASONS, isRecord),
      readAdmin(target, `${clientPath}/roles`, CLIENT_REASONS, isRepresentationList),
      readAdmin(target, `${clientPath}/scope-mappings`, CLIENT_REASONS, isRecord),
    ]);

    if (client.ok === false) {
      return client;
    }
    if (roles.ok === false) {
      return roles;
    }
    if (scopeMappings.ok === false) {
      return scopeMappings;
    }

    return { ok: true, value: { client: client.value, roles: roles.value, scopeMappings: scopeMappings.value } };
  }

  /**
   * Reads the Keycloak user that represents the client's service account.
   */
  function getServiceAccountUser(
    target: ClientReaderTarget,
    id: string,
  ): Promise<RealmClientResult<KeycloakRepresentation>> {
    return readAdmin(target, `/clients/${encodeURIComponent(id)}/service-account-user`, CLIENT_REASONS, isRecord);
  }

  /**
   * Asks Keycloak which claims an access token from this client would carry for the user, without issuing a token.
   * Keycloak returns the claims as JSON; no signed token is created.
   */
  function generateExampleAccessToken(
    target: ClientReaderTarget,
    id: string,
    userId: string,
    scope: string,
  ): Promise<RealmClientResult<KeycloakRepresentation>> {
    return readAdmin(
      target,
      `/clients/${encodeURIComponent(id)}/evaluate-scopes/generate-example-access-token`,
      CLIENT_REASONS,
      isRecord,
      { scope, userId },
    );
  }

  /**
   * Lists the protocol mappers that apply to tokens from this client for the scope, including those from its client
   * scopes, with where each comes from.
   */
  function listEffectiveProtocolMappers(
    target: ClientReaderTarget,
    id: string,
    scope: string,
  ): Promise<RealmClientResult<KeycloakRepresentation[]>> {
    return readAdmin(
      target,
      `/clients/${encodeURIComponent(id)}/evaluate-scopes/protocol-mappers`,
      CLIENT_REASONS,
      isRepresentationList,
      { scope },
    );
  }

  return {
    listAllClients,
    listClients,
    findClientInternalId,
    getClientConfiguration,
    getServiceAccountUser,
    generateExampleAccessToken,
    listEffectiveProtocolMappers,
  };
}

export type ClientReader = ReturnType<typeof createClientReader>;
