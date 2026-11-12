import type { AccessEnvironment } from './environments';

export const ACCESS_DISCOVERY_REQUIRED_ROLES = ['urn:ads:platform:agent-service:agent-user'];

export const ACCESS_DISCOVERY_TOOL_IDS = ['listAccessEnvironments', 'listAccessRealms', 'getAccessRealmInfo'];

export const ACCESS_CLIENT_TOOL_IDS = [
  'listAccessClients',
  'getAccessClient',
  'checkAccessClientSetup',
  'checkAccessClientUrl',
  'previewAccessToken',
  'getAccessServiceAccount',
];

export const ACCESS_USER_TOOL_IDS = [
  'findAccessUser',
  'getAccessUserRoles',
  'getAccessUserSignInStatus',
  'checkAccessUserForService',
  'compareAccessUsers',
];

export const ACCESS_ROLE_TOOL_IDS = ['listAccessServiceRoles', 'getAccessRole', 'listAccessRoleMembers'];

export const ACCESS_GUIDE_TOOL_IDS = ['getAccessGuide'];

export const ACCESS_REQUEST_TIMEOUT_MS = 5000;

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
  'NO_CLIENT_PERMISSION',
  'CLIENT_NOT_FOUND',
  'NO_USER_PERMISSION',
  'USER_NOT_FOUND',
  'USER_INSPECTION_NOT_ALLOWED',
  'USER_AMBIGUOUS',
  'ROLE_NOT_FOUND',
  'ROLE_AMBIGUOUS',
  'SERVICE_NOT_FOUND',
  'NO_SERVICE_ACCOUNT',
  'NO_ROLE_CATALOG_ACCESS',
  'INVALID_URL',
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
  NO_CLIENT_PERMISSION:
    'You do not have permission to view clients in this realm. Viewing clients needs the realm-management view-clients role; ask your tenant administrator.',
  CLIENT_NOT_FOUND: 'No client with that client ID could be found in your realm, or you do not have access to it.',
  NO_USER_PERMISSION:
    'You do not have permission to view users in this realm. Viewing users needs the realm-management view-users role, which tenant administrators get through the tenant admin group; ask your tenant administrator to add you to it.',
  USER_NOT_FOUND:
    'No user with that username or email could be found in your realm, or you do not have access to them.',
  USER_INSPECTION_NOT_ALLOWED:
    'Users and their role assignments cannot be inspected in this environment. Inspect the user in Development or UAT instead.',
  USER_AMBIGUOUS: 'More than one user matches. Choose one of the usernames listed.',
  ROLE_NOT_FOUND: 'No role with that name could be found in your realm, or you do not have access to it.',
  ROLE_AMBIGUOUS: 'More than one app or service has a role with that name. Choose one of the roles listed.',
  SERVICE_NOT_FOUND: 'No ADSP service or client matching that name could be found in your realm.',
  NO_SERVICE_ACCOUNT: 'This client does not have a service account. Service accounts are turned on per client.',
  NO_ROLE_CATALOG_ACCESS:
    'The list of ADSP service roles could not be read with your sign-in. Ask your tenant administrator for access to configuration.',
  INVALID_URL:
    'That is not a full web address. Give it with its scheme, for example https://my-app.alberta.ca/callback.',
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

/**
 * Returns only the problem fields a tool result carries, so a problem can be spread into any tool output.
 */
export function toProblemFields({ status, reason, message, missingRoles }: AccessDiscoveryProblem) {
  return { status, reason, message, ...(missingRoles ? { missingRoles } : {}) };
}

export function toEnvironmentSummary({ id, label, host, readOnly }: AccessEnvironment): AccessEnvironmentSummary {
  return { id, label, host, readOnly };
}
