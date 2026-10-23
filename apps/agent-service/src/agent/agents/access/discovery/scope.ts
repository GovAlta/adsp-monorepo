import type { User } from '@abgov/adsp-service-sdk';
import { findAccessEnvironmentByOrigin, getAccessEnvironments } from './environments';
import {
  ACCESS_DISCOVERY_REQUIRED_ROLES,
  AccessDiscoveryReason,
  AccessEnvironmentSummary,
  AccessScope,
  createProblem,
  toEnvironmentSummary,
  UnavailableAccessScope,
} from './types';

const CORE_REALM = 'core';
const ISSUER_REALM_PATH = /^\/auth\/realms\/([^/]+)\/?$/;

function unavailable(
  reason: AccessDiscoveryReason,
  { missingRoles, environment }: { missingRoles?: string[]; environment?: AccessEnvironmentSummary } = {},
): UnavailableAccessScope {
  return {
    ...createProblem('unavailable', reason, missingRoles),
    status: 'unavailable',
    ...(environment ? { environment } : {}),
  };
}

function parseIssuer(issuer: string): { origin: string; realm: string } | null {
  try {
    const issuerUrl = new URL(issuer);
    const match = ISSUER_REALM_PATH.exec(issuerUrl.pathname);
    return match ? { origin: issuerUrl.origin, realm: decodeURIComponent(match[1]) } : null;
  } catch {
    return null;
  }
}

/**
 * Determines which Access Service environment and realm the user may inspect, using only the verified
 * user token. Nothing here comes from model input, so the scope cannot be widened by a prompt.
 */
export function resolveAccessScope(user: User | undefined, accessServiceUrl: URL): AccessScope {
  const issuer = user?.token?.iss;
  if (!user || typeof issuer !== 'string') {
    return unavailable('NO_SESSION');
  }

  const missingRoles = ACCESS_DISCOVERY_REQUIRED_ROLES.filter((role) => !user.roles?.includes(role));
  if (missingRoles.length > 0) {
    return unavailable('MISSING_ROLE', { missingRoles });
  }

  const parsedIssuer = parseIssuer(issuer);
  if (!parsedIssuer) {
    return unavailable('NO_SESSION');
  }

  const environment = findAccessEnvironmentByOrigin(getAccessEnvironments(accessServiceUrl), parsedIssuer.origin);
  if (!environment) {
    return unavailable('UNKNOWN_ENVIRONMENT');
  }

  const environmentSummary = toEnvironmentSummary(environment);
  if (parsedIssuer.origin !== accessServiceUrl.origin) {
    return unavailable('ENVIRONMENT_MISMATCH', { environment: environmentSummary });
  }

  const { realm } = parsedIssuer;
  const isRealmForUser = user.isCore ? realm === CORE_REALM : !!user.tenantId && realm !== CORE_REALM;
  if (!isRealmForUser) {
    return unavailable('REALM_MISMATCH', { environment: environmentSummary });
  }

  return {
    status: 'available',
    message: `You can inspect the ${realm} realm in ${environment.label} (read-only).`,
    environment: environmentSummary,
    realm: { id: realm, kind: user.isCore ? 'core' : 'tenant' },
    readOnly: true,
  };
}
