import type { AccessEnvironment } from './environments';

export const ACCESS_DISCOVERY_REQUIRED_ROLES = ['urn:ads:platform:agent-service:agent-user'];

export const ACCESS_DISCOVERY_TOOL_IDS = ['listAccessEnvironments', 'listAccessRealms', 'getAccessRealmInfo'];

export type AccessDiscoveryStatus = 'available' | 'unavailable' | 'not-found' | 'unreachable';

export const ACCESS_DISCOVERY_REASONS = [
  'NO_SESSION',
  'MISSING_ROLE',
  'UNKNOWN_ENVIRONMENT',
  'ENVIRONMENT_MISMATCH',
  'REALM_MISMATCH',
  'NO_PERMISSION',
  'SESSION_EXPIRED',
  'REALM_NOT_FOUND',
  'ENVIRONMENT_UNREACHABLE',
] as const;

export type AccessDiscoveryReason = (typeof ACCESS_DISCOVERY_REASONS)[number];

// Fixed wording per reason so the agent relays the same explanation every time.
export const ACCESS_DISCOVERY_MESSAGES: Record<AccessDiscoveryReason, string> = {
  NO_SESSION: 'Your sign-in could not be read, so nothing can be inspected. Sign in again and retry.',
  MISSING_ROLE:
    'You do not have the role needed to inspect the Access Service. Ask your tenant administrator to assign it.',
  UNKNOWN_ENVIRONMENT:
    'Your sign-in was issued by a Keycloak host that is not a known Access Service environment, so it cannot be inspected.',
  ENVIRONMENT_MISMATCH:
    'Your sign-in was issued by a different Access Service environment than the one this agent runs in. Use the agent in the environment you signed in to.',
  REALM_MISMATCH: 'Your sign-in realm does not match your tenant realm, so the realm cannot be inspected.',
  NO_PERMISSION: 'You do not have permission to read this information. Ask your tenant administrator for access.',
  SESSION_EXPIRED: 'Your session has expired. Sign in again and retry.',
  REALM_NOT_FOUND: 'The realm could not be found or you do not have access to it.',
  ENVIRONMENT_UNREACHABLE: 'A required Access Service endpoint did not respond. Try again later.',
};

export type AccessEnvironmentSummary = Pick<AccessEnvironment, 'id' | 'label' | 'host' | 'readOnly'>;

export type AccessRealmKind = 'tenant' | 'core';

export interface AccessDiscoveryProblem {
  status: Exclude<AccessDiscoveryStatus, 'available'>;
  reason: AccessDiscoveryReason;
  message: string;
  missingRoles?: string[];
}

export interface AvailableAccessScope {
  status: 'available';
  message: string;
  environment: AccessEnvironmentSummary;
  realm: { id: string; kind: AccessRealmKind };
  readOnly: true;
}

export interface UnavailableAccessScope extends AccessDiscoveryProblem {
  status: 'unavailable';
  environment?: AccessEnvironmentSummary;
}

export type AccessScope = AvailableAccessScope | UnavailableAccessScope;

export function createProblem(
  status: AccessDiscoveryProblem['status'],
  reason: AccessDiscoveryReason,
  missingRoles?: string[],
): AccessDiscoveryProblem {
  return {
    status,
    reason,
    message: ACCESS_DISCOVERY_MESSAGES[reason],
    ...(missingRoles ? { missingRoles } : {}),
  };
}

export function toEnvironmentSummary({ id, label, host, readOnly }: AccessEnvironment): AccessEnvironmentSummary {
  return { id, label, host, readOnly };
}
