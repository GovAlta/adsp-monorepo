import type { AuditAction, AuditRecordDetails, AuditResource } from '@abgov/adsp-service-sdk';
import type { DomainEvent } from '@core-services/core-common';
import { createHash } from 'crypto';
import {
  ACCESS_SERVICE_ID,
  AccessResourceTypes,
  RealmConfigurationChangedAuditAction,
  ServiceAccountCreatedAuditAction,
  ServiceAccountCredentialRotatedAuditAction,
  ServiceAccountDeletedAuditAction,
  UserCreatedAuditAction,
  UserDeletedAuditAction,
  UserLoginFailedAuditAction,
  UserRoleAssignedAuditAction,
  UserRoleRemovedAuditAction,
  UserUpdatedAuditAction,
} from './actions';

/** Keycloak admin event as forwarded by the adsp-event-listener; the event name is `${operationType}-${resourceType}`. */
export interface AccessAdminEventPayload {
  realmId: string;
  operationType: string;
  resourceType: string;
  resourcePath?: string | null;
  /** JSON of the affected Keycloak representation; may contain PII or, for client secrets, credentials. */
  representation?: string | null;
  authDetails: {
    userId: string;
    realmId?: string;
    realmName?: string;
    clientId?: string;
  };
  error?: string | null;
}

/** Keycloak user event as forwarded by the adsp-event-listener; the event name is the Keycloak event type. */
export interface AccessUserEventPayload {
  id: string;
  type: string;
  realmId: string;
  error?: string | null;
  userId?: string | null;
  clientId?: string | null;
  sessionId?: string | null;
  details?: Record<string, unknown> | null;
}

export interface AccessAuditRecord {
  action: AuditAction;
  details: AuditRecordDetails;
}

interface AdminRecordContent {
  resource: AuditResource;
  metadata?: Record<string, unknown>;
}

interface AdminRule {
  action: AuditAction;
  /** Matched against the resource path without its leading slash. */
  path: RegExp;
  /** Returns undefined when the event does not represent an audited change. */
  describe: (path: RegExpMatchArray, payload: AccessAdminEventPayload) => AdminRecordContent | undefined;
}

type UserEventRule = (payload: AccessUserEventPayload) => AccessAuditRecord;

const USER_PATH = /^users\/([^/]+)$/;
const CLIENT_ROLE_MAPPING_PATH = /^users\/([^/]+)\/role-mappings\/clients\/([^/]+)$/;
const CLIENT_PATH = /^clients\/([^/]+)$/;
const CLIENT_SECRET_PATH = /^clients\/([^/]+)\/client-secret$/;
const ANY_PATH = /^.*$/;

// Keycloak copies representations from the admin request, including PII; only named fields are read from them.
function parseRepresentation({ representation }: AccessAdminEventPayload): unknown {
  try {
    return typeof representation === 'string' ? JSON.parse(representation) : undefined;
  } catch {
    return undefined;
  }
}

function stringField(value: unknown, key: string): string | undefined {
  const field = value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined;
  return typeof field === 'string' && field ? field : undefined;
}

const describeUser: AdminRule['describe'] = ([, userId], payload) => ({
  resource: {
    type: AccessResourceTypes.User,
    id: userId,
    name: stringField(parseRepresentation(payload), 'username'),
  },
});

const describeClientRoleMapping: AdminRule['describe'] = ([, userId, clientId], payload) => {
  const representation = parseRepresentation(payload);
  const roles = Array.isArray(representation)
    ? representation.map((role) => stringField(role, 'name')).filter((name) => !!name)
    : [];
  return roles.length
    ? { resource: { type: AccessResourceTypes.User, id: userId }, metadata: { roles, clientId } }
    : undefined;
};

const describeClient: AdminRule['describe'] = ([, clientUuid], payload) => ({
  resource: {
    type: AccessResourceTypes.ServiceAccount,
    id: clientUuid,
    name: stringField(parseRepresentation(payload), 'clientId'),
  },
});

// The representation of a regenerated secret can contain the new secret, so it is never read.
const describeClientSecret: AdminRule['describe'] = ([, clientUuid]) => ({
  resource: { type: AccessResourceTypes.ServiceAccount, id: clientUuid },
});

const describeRealm: AdminRule['describe'] = (_path, { realmId }) => ({
  resource: { type: AccessResourceTypes.Realm, id: realmId },
});

const ADMIN_RULES = new Map<string, AdminRule>([
  ['CREATE-USER', { action: UserCreatedAuditAction, path: USER_PATH, describe: describeUser }],
  ['UPDATE-USER', { action: UserUpdatedAuditAction, path: USER_PATH, describe: describeUser }],
  ['DELETE-USER', { action: UserDeletedAuditAction, path: USER_PATH, describe: describeUser }],
  [
    'CREATE-CLIENT_ROLE_MAPPING',
    { action: UserRoleAssignedAuditAction, path: CLIENT_ROLE_MAPPING_PATH, describe: describeClientRoleMapping },
  ],
  [
    'DELETE-CLIENT_ROLE_MAPPING',
    { action: UserRoleRemovedAuditAction, path: CLIENT_ROLE_MAPPING_PATH, describe: describeClientRoleMapping },
  ],
  ['CREATE-CLIENT', { action: ServiceAccountCreatedAuditAction, path: CLIENT_PATH, describe: describeClient }],
  ['DELETE-CLIENT', { action: ServiceAccountDeletedAuditAction, path: CLIENT_PATH, describe: describeClient }],
  [
    'ACTION-CLIENT',
    { action: ServiceAccountCredentialRotatedAuditAction, path: CLIENT_SECRET_PATH, describe: describeClientSecret },
  ],
  ['UPDATE-REALM', { action: RealmConfigurationChangedAuditAction, path: ANY_PATH, describe: describeRealm }],
]);

// Only the attempted username is read from login details; other details can include credentials.
const toLoginFailedRecord: UserEventRule = ({ id, realmId, userId, clientId, sessionId, error, details }) => {
  const username = stringField(details, 'username');
  return {
    action: UserLoginFailedAuditAction,
    details: {
      eventId: id,
      status: 'failure',
      actor: { id: userId || username || 'unknown', type: 'user', name: username },
      resource: userId ? { type: AccessResourceTypes.User, id: userId } : undefined,
      sessionId: sessionId || undefined,
      metadata: { realm: realmId, clientId, reason: error },
    },
  };
};

const USER_EVENT_RULES = new Map<string, UserEventRule>([['LOGIN_ERROR', toLoginFailedRecord]]);

const isString = (value: unknown): value is string => typeof value === 'string' && !!value;

function isAdminEventPayload(payload: unknown): payload is AccessAdminEventPayload {
  const { realmId, operationType, resourceType, resourcePath, authDetails } = (payload ||
    {}) as Partial<AccessAdminEventPayload>;
  return (
    isString(realmId) &&
    isString(operationType) &&
    isString(resourceType) &&
    (resourcePath === undefined || resourcePath === null || typeof resourcePath === 'string') &&
    isString(authDetails?.userId)
  );
}

function isUserEventPayload(payload: unknown): payload is AccessUserEventPayload {
  const { id, realmId } = (payload || {}) as Partial<AccessUserEventPayload>;
  return isString(id) && isString(realmId);
}

// Admin events carry no event ID, so a name-based (v5 layout) UUID makes redelivered events idempotent.
function toAdminEventId(event: DomainEvent, resourcePath: string, actorId: string): string {
  const hash = createHash('sha1')
    .update([event.tenantId, event.name, event.timestamp.toISOString(), resourcePath, actorId].join('|'))
    .digest('hex');
  const variant = ((parseInt(hash.substring(16, 18), 16) & 0x3f) | 0x80).toString(16);
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    `5${hash.substring(13, 16)}`,
    `${variant}${hash.substring(18, 20)}`,
    hash.substring(20, 32),
  ].join('-');
}

function toAdminRecord(event: DomainEvent, rule: AdminRule): AccessAuditRecord | undefined {
  const payload = event.payload;
  if (!isAdminEventPayload(payload)) {
    return undefined;
  }

  const resourcePath = (payload.resourcePath || '').replace(/^\//, '');
  const path = resourcePath.match(rule.path);
  const content = path && rule.describe(path, payload);
  if (!content) {
    return undefined;
  }

  const { userId, realmName, realmId: actorRealmId } = payload.authDetails;
  return {
    action: rule.action,
    details: {
      eventId: toAdminEventId(event, resourcePath, userId),
      actor: { id: userId, type: 'user' },
      resource: content.resource,
      metadata: {
        realm: payload.realmId,
        operationType: payload.operationType,
        resourcePath: resourcePath || undefined,
        actorRealm: realmName || actorRealmId,
        ...content.metadata,
      },
    },
  };
}

function toRecord(event: DomainEvent): AccessAuditRecord | undefined {
  const adminRule = ADMIN_RULES.get(event.name);
  if (adminRule) {
    return toAdminRecord(event, adminRule);
  }
  const userRule = USER_EVENT_RULES.get(event.name);
  return userRule && isUserEventPayload(event.payload) ? userRule(event.payload) : undefined;
}

function isTenantAccessEvent(event: DomainEvent): boolean {
  return (
    event.namespace === ACCESS_SERVICE_ID.service &&
    !!event.tenantId &&
    event.timestamp instanceof Date &&
    !isNaN(event.timestamp.getTime())
  );
}

/**
 * Converts an access service (Keycloak) domain event into the audit record of the affected tenant.
 * Returns undefined for events that are not audited and for malformed events.
 */
export function toAccessAuditRecord(event: DomainEvent): AccessAuditRecord | undefined {
  const record = isTenantAccessEvent(event) ? toRecord(event) : undefined;
  return (
    record && {
      action: record.action,
      details: {
        ...record.details,
        tenantId: event.tenantId,
        occurredAt: event.timestamp,
        correlationId: event.correlationId || undefined,
      },
    }
  );
}
