import type { ServiceDirectory, User } from '@abgov/adsp-service-sdk';
import axios, { isAxiosError } from 'axios';
import * as HttpStatusCodes from 'http-status-codes';
import {
  ACCESS_REQUEST_TIMEOUT_MS,
  AccessDiscoveryProblem,
  AccessDiscoveryReason,
  AccessRealmKind,
  AvailableAccessScope,
  createProblem,
} from './types';
import { optionalString } from './values';

export interface AccessRealmRecord {
  realm: string;
  name: string;
  kind: AccessRealmKind;
  status?: string;
}

export interface RealmOpenIdConfiguration {
  issuer: string;
  endpoints: {
    authorization?: string;
    token?: string;
    userInfo?: string;
    endSession?: string;
    jwks?: string;
  };
}

export type RealmClientResult<T> = { ok: true; value: T } | { ok: false; problem: AccessDiscoveryProblem };

export interface RequestErrorReasons {
  forbidden: AccessDiscoveryReason;
  notFound: AccessDiscoveryReason;
}

const DEFAULT_REQUEST_ERROR_REASONS: RequestErrorReasons = { forbidden: 'NO_PERMISSION', notFound: 'REALM_NOT_FOUND' };

/**
 * Maps an expected HTTP failure to a user-facing problem. Anything else is a defect and is rethrown.
 * Callers can name the reasons for forbidden and not found, since what was refused or missing depends on the request.
 */
export function mapRequestError(
  err: unknown,
  reasons: RequestErrorReasons = DEFAULT_REQUEST_ERROR_REASONS,
): AccessDiscoveryProblem {
  if (!isAxiosError(err)) {
    throw err;
  }

  const status = err.response?.status;
  if (status === undefined || status >= HttpStatusCodes.INTERNAL_SERVER_ERROR) {
    return createProblem('unreachable', 'ENVIRONMENT_UNREACHABLE');
  }
  if (status === HttpStatusCodes.UNAUTHORIZED) {
    return createProblem('unavailable', 'SESSION_EXPIRED');
  }
  if (status === HttpStatusCodes.FORBIDDEN) {
    return createProblem('unavailable', reasons.forbidden);
  }
  if (status === HttpStatusCodes.NOT_FOUND) {
    return createProblem('not-found', reasons.notFound);
  }

  throw err;
}

interface RealmClientProps {
  directory: ServiceDirectory;
}

export function createRealmClient({ directory }: RealmClientProps) {
  /**
   * Reads the user's own tenant with the user's token, so tenant-service enforces its own authorization.
   * Only the realm, name and status are kept; other fields such as the admin email are dropped.
   */
  async function getTenantRealm(user: User): Promise<RealmClientResult<AccessRealmRecord>> {
    const tenantUrl = await directory.getResourceUrl(user.tenantId);

    try {
      const { data } = await axios.get<Record<string, unknown>>(tenantUrl.href, {
        headers: { Authorization: `Bearer ${user.token.bearer}` },
        timeout: ACCESS_REQUEST_TIMEOUT_MS,
      });

      const realm = optionalString(data?.realm);
      if (!realm) {
        return { ok: false, problem: createProblem('unavailable', 'REALM_MISMATCH') };
      }

      return {
        ok: true,
        value: {
          realm,
          name: optionalString(data.name) ?? realm,
          kind: 'tenant',
          status: optionalString(data.status),
        },
      };
    } catch (err) {
      return { ok: false, problem: mapRequestError(err) };
    }
  }

  /**
   * Reads the realm's public OpenID configuration. This endpoint needs no credentials, so none are sent.
   */
  async function getRealmOpenIdConfiguration(
    host: string,
    realm: string,
  ): Promise<RealmClientResult<RealmOpenIdConfiguration>> {
    const configurationUrl = new URL(
      `/auth/realms/${encodeURIComponent(realm)}/.well-known/openid-configuration`,
      host,
    );

    try {
      const { data } = await axios.get<Record<string, unknown>>(configurationUrl.href, {
        headers: { Accept: 'application/json' },
        timeout: ACCESS_REQUEST_TIMEOUT_MS,
      });

      const issuer = optionalString(data?.issuer);
      if (!issuer) {
        return { ok: false, problem: createProblem('unreachable', 'ENVIRONMENT_UNREACHABLE') };
      }

      return {
        ok: true,
        value: {
          issuer,
          endpoints: {
            authorization: optionalString(data.authorization_endpoint),
            token: optionalString(data.token_endpoint),
            userInfo: optionalString(data.userinfo_endpoint),
            endSession: optionalString(data.end_session_endpoint),
            jwks: optionalString(data.jwks_uri),
          },
        },
      };
    } catch (err) {
      return { ok: false, problem: mapRequestError(err) };
    }
  }

  return { getTenantRealm, getRealmOpenIdConfiguration };
}

export type RealmClient = ReturnType<typeof createRealmClient>;

/**
 * Resolves the realm record for an available scope. Core users get the core realm directly; tenant users get their
 * tenant's realm, which must match the realm their sign-in was issued by.
 */
export async function resolveRealmRecord(
  realmClient: RealmClient,
  user: User,
  scope: AvailableAccessScope,
): Promise<RealmClientResult<AccessRealmRecord>> {
  if (scope.realm.kind === 'core') {
    return { ok: true, value: { realm: scope.realm.id, name: 'Core', kind: 'core' } };
  }

  const tenantRealm = await realmClient.getTenantRealm(user);
  if (tenantRealm.ok === true && tenantRealm.value.realm !== scope.realm.id) {
    return { ok: false, problem: createProblem('unavailable', 'REALM_MISMATCH') };
  }

  return tenantRealm;
}
