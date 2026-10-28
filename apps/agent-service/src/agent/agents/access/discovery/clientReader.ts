import type { User } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import { mapRequestError, RealmClientResult, RequestErrorReasons } from './realmClient';
import { ACCESS_REQUEST_TIMEOUT_MS, createProblem } from './types';
import { isRecord } from './values';

/**
 * Where a client read goes: the Keycloak host and realm from the user's resolved scope, read with the user's own
 * token so Keycloak enforces the user's realm-management permissions.
 */
export interface ClientReaderTarget {
  host: string;
  realm: string;
  user: User;
}

export type KeycloakRepresentation = Record<string, unknown>;

export interface KeycloakClientConfiguration {
  client: KeycloakRepresentation;
  roles: KeycloakRepresentation[];
  scopeMappings: KeycloakRepresentation;
}

interface ListClientsOptions {
  search?: string;
  max: number;
}

const LIST_REASONS: RequestErrorReasons = { forbidden: 'NO_CLIENT_PERMISSION', notFound: 'REALM_NOT_FOUND' };
const CLIENT_REASONS: RequestErrorReasons = { forbidden: 'NO_CLIENT_PERMISSION', notFound: 'CLIENT_NOT_FOUND' };

function isRepresentationList(value: unknown): value is KeycloakRepresentation[] {
  return Array.isArray(value) && value.every(isRecord);
}

// A response that isn't JSON of the expected shape (for example a proxy error page) means Keycloak wasn't reached.
const UNEXPECTED_RESPONSE = createProblem('unreachable', 'ENVIRONMENT_UNREACHABLE');

/**
 * Reads Keycloak client configuration through the Admin REST API. Only GET requests are ever made.
 */
export function createClientReader() {
  async function get<T>(
    { host, realm, user }: ClientReaderTarget,
    path: string,
    reasons: RequestErrorReasons,
    isExpected: (data: unknown) => data is T,
    params?: Record<string, string | number | boolean>,
  ): Promise<RealmClientResult<T>> {
    const url = new URL(`/auth/admin/realms/${encodeURIComponent(realm)}${path}`, host);

    try {
      const { data } = await axios.get<unknown>(url.href, {
        headers: { Authorization: `Bearer ${user.token.bearer}`, Accept: 'application/json' },
        params,
        timeout: ACCESS_REQUEST_TIMEOUT_MS,
      });

      return isExpected(data) ? { ok: true, value: data } : { ok: false, problem: UNEXPECTED_RESPONSE };
    } catch (err) {
      return { ok: false, problem: mapRequestError(err, reasons) };
    }
  }

  /**
   * Lists clients in the realm, optionally only those whose client ID contains the search text (case-insensitive).
   */
  async function listClients(
    target: ClientReaderTarget,
    { search, max }: ListClientsOptions,
  ): Promise<RealmClientResult<KeycloakRepresentation[]>> {
    const params = search ? { clientId: search, search: true, first: 0, max } : { first: 0, max };
    return get(target, '/clients', LIST_REASONS, isRepresentationList, params);
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
    const result = await get(target, '/clients', LIST_REASONS, isRepresentationList, { clientId });
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
      get(target, clientPath, CLIENT_REASONS, isRecord),
      get(target, `${clientPath}/roles`, CLIENT_REASONS, isRepresentationList),
      get(target, `${clientPath}/scope-mappings`, CLIENT_REASONS, isRecord),
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

  return { listClients, findClientInternalId, getClientConfiguration };
}

export type ClientReader = ReturnType<typeof createClientReader>;
