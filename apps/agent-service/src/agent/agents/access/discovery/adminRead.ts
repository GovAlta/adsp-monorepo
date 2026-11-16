import type { User } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import { mapRequestError, RealmClientResult, RequestErrorReasons } from './realmClient';
import { ACCESS_REQUEST_TIMEOUT_MS, createProblem } from './types';
import { isRecord } from './values';

/**
 * Where a Keycloak Admin REST API read goes: the Keycloak host and realm from the user's resolved scope, read with
 * the user's own token so Keycloak enforces the user's realm-management permissions.
 */
export interface AdminReadTarget {
  host: string;
  realm: string;
  user: User;
}

export type KeycloakRepresentation = Record<string, unknown>;

export type AdminReadParams = Record<string, string | number | boolean>;

export function isRepresentationList(value: unknown): value is KeycloakRepresentation[] {
  return Array.isArray(value) && value.every(isRecord);
}

// A response that isn't JSON of the expected shape (for example a proxy error page) means Keycloak wasn't reached.
const UNEXPECTED_RESPONSE = createProblem('unreachable', 'ENVIRONMENT_UNREACHABLE');

/**
 * Reads one resource of the user's realm through the Keycloak Admin REST API. Only GET requests are ever made.
 */
export async function readAdmin<T>(
  { host, realm, user }: AdminReadTarget,
  path: string,
  reasons: RequestErrorReasons,
  isExpected: (data: unknown) => data is T,
  params?: AdminReadParams,
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
 * Maps items with an async function, running at most `limit` at a time so wide scans do not flood Keycloak.
 */
export async function mapWithConcurrency<T, R>(items: T[], limit: number, map: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await map(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}
