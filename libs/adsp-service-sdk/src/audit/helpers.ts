import type { User } from '../access';
import type { AdspId } from '../utils';
import type { AuditActor, AuditRecordDetails } from './types';

// Keycloak names service account users with this prefix.
const SERVICE_ACCOUNT_PREFIX = 'service-account-';

/** Request context used to derive audit details; an Express request authenticated by the SDK satisfies it. */
export interface AuditRequestContext {
  user?: User;
  tenant?: { id: AdspId };
}

/** Audit record details where the actor is optional because it defaults to the request user. */
export type AuditRequestRecordDetails = Omit<AuditRecordDetails, 'actor'> & { actor?: AuditActor };

/**
 * Converts an authenticated user into the actor of an audit event.
 * Keycloak service accounts become `service` actors; other users become `user` actors.
 *
 * @param {User} user Authenticated user, e.g. `req.user`.
 * @returns {AuditActor}
 * @throws {Error} When there is no user, so events are never attributed to an unknown actor.
 */
export function toAuditActor(user: User): AuditActor {
  if (!user) {
    throw new Error('Cannot create an audit actor without a user.');
  }

  return {
    id: user.id,
    type: user.name?.startsWith(SERVICE_ACCOUNT_PREFIX) ? 'service' : 'user',
    name: user.name || undefined,
    email: user.email || undefined,
    roles: user.roles,
  };
}

/**
 * Builds audit record details for a request. The actor defaults to the request user and the tenant
 * to the request tenant (or the user's tenant). Values in `details` take precedence, e.g. the
 * `tenantId` of a different target tenant when a core service acts on it.
 *
 * @param {AuditRequestContext} req Request, e.g. an Express request authenticated by the SDK.
 * @param {AuditRequestRecordDetails} [details] Event details and overrides.
 * @returns {AuditRecordDetails}
 * @throws {Error} When no actor is provided and the request has no user.
 */
export function auditDetailsFromRequest(
  req: AuditRequestContext,
  details: AuditRequestRecordDetails = {},
): AuditRecordDetails {
  return {
    ...details,
    actor: details.actor ?? toAuditActor(req?.user),
    tenantId: details.tenantId ?? req?.tenant?.id ?? req?.user?.tenantId,
  };
}
