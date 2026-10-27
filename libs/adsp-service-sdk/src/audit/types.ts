import type { Results } from '../common';
import type { AdspId } from '../utils';
import type { AuditAction, AuditCategory, AuditSeverity } from './definitions';

export type AuditEventStatus = 'success' | 'failure' | 'blocked' | 'error';

export type AuditActorType = 'user' | 'service' | 'system';

export interface AuditActor {
  id: string;
  type: AuditActorType;
  name?: string;
  email?: string;
  roles?: string[];
}

export interface AuditResource {
  type: string;
  id: string;
  name?: string;
}

export interface AuditChangeSet {
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}

export interface AuditRecordDetails {
  /**
   * Tenant of the event. Required for a core (platform) service; ignored for a tenant service,
   * whose tenant comes from its service account token.
   */
  tenantId?: AdspId;
  /** Defaults to `success`. */
  status?: AuditEventStatus;
  actor: AuditActor;
  /** Defaults to the time `record()` is called. */
  occurredAt?: Date;
  /** Idempotency key; generated when omitted. Retries reuse it so the service absorbs duplicates. */
  eventId?: string;
  resource?: AuditResource;
  scopeIds?: string[];
  correlationId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
  /** Dropped before sending unless the action has `captureChangeSet: true`. */
  changeSet?: AuditChangeSet;
}

/** Why an event was not stored. Also the `reason` attribute of the dropped-event metric. */
export type AuditDropReason =
  | 'rejected'
  | 'invalid_event'
  | 'buffer_full'
  | 'retries_exhausted'
  | 'request_failed'
  | 'invalid_response';

/**
 * Result of recording an event.
 *
 * - `recorded`: the service stored the event, or had already stored an event with the same `eventId`.
 * - `rejected`: the service refused the event (e.g. unknown action or invalid metadata); it is not resent.
 * - `failed`: the event could not be delivered, e.g. the buffer was full or retries were exhausted.
 *   Delivery may still have succeeded if a response was lost, which a resend with the same `eventId` resolves.
 */
export type AuditRecordOutcome =
  | { status: 'recorded'; eventId: string }
  | { status: 'rejected'; eventId: string; code: string; reason: string }
  | { status: 'failed'; eventId: string; reason: Exclude<AuditDropReason, 'rejected'>; error: string };

export interface AuditEventCriteria {
  actor?: string;
  resourceType?: string;
  resourceId?: string;
  action?: string;
  status?: AuditEventStatus;
  category?: AuditCategory;
  scope?: string;
  occurredFrom?: Date | string;
  occurredTo?: Date | string;
}

export interface AuditQueryOptions {
  /** Page size; the service defaults to 10. */
  top?: number;
  /** Cursor from the previous page's `page.next`. */
  after?: string;
  /** Namespace to read; defaults to this service's namespace (`serviceId.service`). */
  namespace?: string;
  /** Tenant to read. Used by core callers; tenant callers can only read their own tenant. */
  tenantId?: AdspId;
  /** Bearer token to query as, e.g. the signed-in user's. Defaults to the service account token. */
  token?: string;
}

export interface AuditEventRecord {
  id: string;
  eventId: string;
  namespace: string;
  writtenBy: string;
  occurredAt: string;
  receivedAt: string;
  action: string;
  actionVersion: number;
  category: AuditCategory;
  status: AuditEventStatus;
  severity: AuditSeverity;
  actor: AuditActor;
  resource?: AuditResource;
  scopeIds: string[];
  correlationId?: string;
  sessionId?: string;
  changeSet?: AuditChangeSet;
  metadata: Record<string, unknown>;
  retentionClass: string;
  retentionUntil: string;
}

/**
 * Interface to the audit service for recording and querying audit events.
 *
 * Events are recorded in the service's namespace (`serviceId.service`).
 *
 * @export
 * @interface AuditService
 */
export interface AuditService {
  /**
   * Records an audit event. Events are batched and sent at 100 events or 500 ms, whichever comes first.
   *
   * The returned promise never rejects, so an unawaited call cannot crash the process. It resolves
   * with the outcome once the event is stored, rejected, or dropped.
   *
   * @param {AuditAction} action Definition of the action, as registered in `auditActions`.
   * @param {AuditRecordDetails} details
   * @returns {Promise<AuditRecordOutcome>}
   * @memberof AuditService
   */
  record(action: AuditAction, details: AuditRecordDetails): Promise<AuditRecordOutcome>;
  /**
   * Queries audit events, newest first.
   *
   * @param {AuditEventCriteria} [criteria]
   * @param {AuditQueryOptions} [options]
   * @returns {Promise<Results<AuditEventRecord>>}
   * @memberof AuditService
   */
  query(criteria?: AuditEventCriteria, options?: AuditQueryOptions): Promise<Results<AuditEventRecord>>;
  /**
   * Sends every buffered event and resolves when all of them, including retries, have settled.
   * Call it on shutdown. Never rejects; per-event results are on the `record()` promises.
   *
   * @returns {Promise<void>}
   * @memberof AuditService
   */
  flush(): Promise<void>;
  /**
   * Number of events this client has not stored since startup: rejections and delivery failures.
   * Also exported as the `audit.client.dropped_events` OpenTelemetry counter.
   *
   * @type {number}
   * @memberof AuditService
   */
  readonly droppedEventCount: number;
}
