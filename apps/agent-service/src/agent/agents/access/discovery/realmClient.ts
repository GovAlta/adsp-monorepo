import type { ServiceDirectory, User } from '@abgov/adsp-service-sdk';
import axios, { isAxiosError } from 'axios';
import { AccessDiscoveryProblem, AccessRealmKind, createProblem } from './types';

const REQUEST_TIMEOUT_MS = 5000;

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

/**
 * Maps an expected HTTP failure to a user-facing problem. Anything else is a defect and is rethrown.
 */
export function mapRequestError(err: unknown): AccessDiscoveryProblem {
  if (!isAxiosError(err)) {
    throw err;
  }

  const status = err.response?.status;
  if (status === undefined || status >= 500) {
    return createProblem('unreachable', 'ENVIRONMENT_UNREACHABLE');
  }
  if (status === 401) {
    return createProblem('unavailable', 'SESSION_EXPIRED');
  }
  if (status === 403) {
    return createProblem('unavailable', 'NO_PERMISSION');
  }
  if (status === 404) {
    return createProblem('not-found', 'REALM_NOT_FOUND');
  }

  throw err;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
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
        timeout: REQUEST_TIMEOUT_MS,
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
        timeout: REQUEST_TIMEOUT_MS,
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
