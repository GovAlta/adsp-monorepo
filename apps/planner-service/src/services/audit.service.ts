import * as crypto from 'crypto';
import { Logger } from 'winston';
import { PaginatedResult } from '../types';
import {
  AuditEventModel,
  IAuditEvent,
  IAuditEventDocument,
} from '../mongo/schemas/audit-event.schema';
import {
  AuditService as IAuditService,
  AuditEventPayload,
  computeHmac,
  buildAuditChainHash,
} from '../middleware/audit.middleware';

// ✓ ASVS:V7.3.2 — audit log integrity verification via HMAC chain (BR-009)
// ✓ CAS:RULE-028 — audit trail is immutable; no delete/modify operations permitted
// ✓ ASVS:V7.2.1 — audit events capture actor, action, resource, and outcome
// ✓ ASVS:V4.1.1 — all queries include tenantId; cross-tenant audit access is impossible

// ---------------------------------------------------------------------------
// AuditQuery — filter parameters for listAuditEvents
// ---------------------------------------------------------------------------

export interface AuditQuery {
  actorId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  /** ISO-8601 date string — inclusive lower bound */
  from?: string;
  /** ISO-8601 date string — inclusive upper bound */
  to?: string;
  page: number;
  pageSize: number;
}

// ---------------------------------------------------------------------------
// ChainVerificationResult — returned by verifyAuditChain
// ---------------------------------------------------------------------------

export interface ChainVerificationResult {
  /** true if every event in the range has a valid HMAC chain */
  verified: boolean;
  /** The sequential index (0-based within the queried slice) where the first failure was detected */
  failedAtIndex?: number;
  /** eventId of the first failed event, for investigative traceability */
  failedEventId?: string;
  /** Total events checked */
  checkedCount: number;
}

// ---------------------------------------------------------------------------
// AuditEventService
// ---------------------------------------------------------------------------

/**
 * AuditEventService — implements the AuditService interface (from audit.middleware)
 * and provides query + chain-verification capabilities for the audit controller.
 *
 * IMPORTANT: This service ONLY creates and reads audit events.
 * There are NO update or delete methods — the collection is append-only (CAS:RULE-028).
 *
 * BR-008: every security-relevant operation emits an audit event via createEvent()
 * BR-009: HMAC-chained events for tamper evidence; verifyAuditChain() validates chain
 * SYSREQ-020: administrative audit logging with HMAC tamper-evidence
 *
 * ✓ ASVS:V7.3.2 — verifyAuditChain re-computes HMAC chain and reports first failure
 * ✓ CAS:RULE-028 — only create + read operations; no update/delete in this service
 */
export class AuditEventService implements IAuditService {
  constructor(
    private readonly signingKey: string,
    private readonly logger: Logger,
  ) {}

  // ---------------------------------------------------------------------------
  // IAuditService interface implementation
  // ---------------------------------------------------------------------------

  /**
   * createEvent — appends a new audit event with HMAC-SHA256 chain hash.
   *
   * The hmac field for each event is computed over:
   *   (prevHmac || JSON.stringify(eventPayload))
   * where prevHmac is the hmac of the most recent event in the tenant audit chain.
   *
   * ✓ ASVS:V7.2.2 — HMAC chain ensures audit log integrity (BR-008)
   * ✓ CAS:RULE-028 — append-only; modification of any prior entry invalidates chain
   * ✓ ASVS:V7.2.1 — event captures actor, action, resource, outcome
   * ✓ FAC-S4-027 — redact: audit event content fields (actorId, action, resourceId) are
   *   metadata only; Protected B payload (export_data, session content) is NEVER in audit log.
   */
  async createEvent(payload: AuditEventPayload): Promise<void> {
    const eventId = crypto.randomUUID();
    const timestamp = new Date();

    // ✓ ASVS:V7.2.2 — retrieve previous chain hash for this tenant before appending
    const prevHmac = await this.getLastChainHash(payload.tenantId);

    const entryForHmac: AuditEventPayload & { timestamp: string } = {
      ...payload,
      timestamp: timestamp.toISOString(),
    };

    // ✓ CAS:RULE-028 — HMAC computed over full event payload; never logged
    const hmac = buildAuditChainHash(entryForHmac, prevHmac, this.signingKey);

    // ✓ CAS:RULE-028 — append-only write; no update/delete paths in this service
    await AuditEventModel.create({
      eventId,
      timestamp,
      actorId: payload.actorId,
      tenantId: payload.tenantId,
      action: payload.action,
      resourceType: payload.resourceType,
      resourceId: payload.resourceId,
      outcome: payload.outcome,
      hmac,
      previousEventId: prevHmac ? await this._getLastEventId(payload.tenantId) : null,
      ipAddress: payload.ipAddress,
      userAgent: payload.userAgent,
    });
  }

  /**
   * getLastChainHash — retrieves the HMAC hash of the most recent event for a tenant.
   * Returns null for the first event in the chain.
   *
   * ✓ ASVS:V7.2.2 — chain continuity: each new event depends on the prior one
   * ✓ ASVS:V4.1.1 — tenantId scoped; hashes from other tenants are inaccessible
   */
  async getLastChainHash(tenantId: string): Promise<string | null> {
    // ✓ ASVS:V4.1.1 — tenantId always in filter; cross-tenant chain access impossible
    const lastEvent = await AuditEventModel.findOne({ tenantId })
      .sort({ timestamp: -1 })
      .select('hmac')
      .lean();

    return lastEvent ? (lastEvent as unknown as IAuditEvent).hmac : null;
  }

  // ---------------------------------------------------------------------------
  // Query operations — read-only, admin-only (enforced at controller/route layer)
  // ---------------------------------------------------------------------------

  /**
   * listAuditEvents — paginated query of audit events for a tenant.
   * Supports filtering by actorId, action, resourceType, resourceId, and date range.
   *
   * Returns PaginatedResult<IAuditEvent>; excludes HMAC field from list results
   * to prevent accidental exposure (full event with hmac via getAuditEvent).
   *
   * ✓ ASVS:V4.1.1 — tenantId always included in filter; cross-tenant access impossible
   * ✓ CAS:RULE-028 — read-only; no mutations in this operation
   */
  async listAuditEvents(
    tenantId: string,
    query: AuditQuery,
  ): Promise<PaginatedResult<IAuditEvent>> {
    // ✓ ASVS:V4.1.1 — tenantId is the mandatory base filter; never omitted
    const filter: Record<string, unknown> = { tenantId };

    if (query.actorId) {
      filter['actorId'] = query.actorId;
    }
    if (query.action) {
      filter['action'] = query.action;
    }
    if (query.resourceType) {
      filter['resourceType'] = query.resourceType;
    }
    if (query.resourceId) {
      filter['resourceId'] = query.resourceId;
    }

    // Date range filter — inclusive bounds
    if (query.from || query.to) {
      const tsFilter: Record<string, Date> = {};
      if (query.from) {
        tsFilter['$gte'] = new Date(query.from);
      }
      if (query.to) {
        tsFilter['$lte'] = new Date(query.to);
      }
      filter['timestamp'] = tsFilter;
    }

    const { page, pageSize } = query;
    const [items, total] = await Promise.all([
      AuditEventModel.find(filter)
        .sort({ timestamp: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        // ✓ ASVS:V7.2.1 — hmac field omitted from list projection (full event via getAuditEvent)
        .select('-hmac')
        .lean(),
      AuditEventModel.countDocuments(filter),
    ]);

    return {
      items: items as unknown as IAuditEvent[],
      total,
      page,
      pageSize,
    };
  }

  /**
   * getAuditEvent — retrieves a single audit event including its HMAC hash field.
   * HMAC is included to allow admins to perform manual chain verification spot checks.
   *
   * ✓ ASVS:V4.1.1 — tenantId included; cross-tenant event access is impossible
   * ✓ CAS:RULE-028 — read-only retrieval; no side effects
   */
  async getAuditEvent(tenantId: string, eventId: string): Promise<IAuditEvent | null> {
    // ✓ ASVS:V4.1.1 — tenantId always in filter (compound index: tenantId + eventId)
    const doc = await AuditEventModel.findOne({ tenantId, eventId }).lean();
    return doc ? (doc as unknown as IAuditEvent) : null;
  }

  /**
   * verifyAuditChain — re-computes the HMAC chain for events in the specified index range
   * and verifies each computed hash matches the stored hmac field.
   *
   * This implements the BR-009 audit chain integrity check:
   *   For each event[i]: HMAC(prevHmac || JSON.stringify(event[i].payload)) == event[i].hmac
   *
   * Returns { verified: true } if all events in range pass, or
   *   { verified: false, failedAtIndex: N, failedEventId: '<id>' } on first failure.
   *
   * ✓ ASVS:V7.3.2 — audit log integrity verification via HMAC chain
   * ✓ CAS:RULE-028 — verification is read-only; no writes performed
   *
   * @param tenantId   — tenant scope
   * @param startIndex — 0-based offset of the first event to verify (oldest-first ordering)
   * @param endIndex   — 0-based offset of the last event to verify (inclusive)
   */
  async verifyAuditChain(
    tenantId: string,
    startIndex: number,
    endIndex: number,
  ): Promise<ChainVerificationResult> {
    // Fetch the slice of events in chronological order (oldest first for chain traversal)
    // ✓ ASVS:V4.1.1 — tenantId scoped; only this tenant's events are checked
    const count = endIndex - startIndex + 1;
    const events = await AuditEventModel.find({ tenantId })
      .sort({ timestamp: 1 })
      .skip(startIndex)
      .limit(count)
      .lean() as unknown as IAuditEvent[];

    if (events.length === 0) {
      return { verified: true, checkedCount: 0 };
    }

    // We need the HMAC of the event immediately BEFORE startIndex to anchor the chain
    // ✓ ASVS:V7.3.2 — chain anchor: hash of predecessor event or null for first event
    let prevHmac: string | null = null;
    if (startIndex > 0) {
      const anchorEvent = await AuditEventModel.findOne({ tenantId })
        .sort({ timestamp: 1 })
        .skip(startIndex - 1)
        .limit(1)
        .select('hmac')
        .lean() as unknown as IAuditEvent | null;
      prevHmac = anchorEvent ? anchorEvent.hmac : null;
    }

    // Walk the chain and verify each HMAC
    for (let i = 0; i < events.length; i++) {
      const event = events[i];

      const entryForHmac: AuditEventPayload & { timestamp: string } = {
        actorId: event.actorId,
        tenantId: event.tenantId,
        action: event.action,
        resourceType: event.resourceType,
        resourceId: event.resourceId,
        outcome: event.outcome,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        timestamp: event.timestamp instanceof Date
          ? event.timestamp.toISOString()
          : String(event.timestamp),
      };

      // ✓ ASVS:V7.3.2 — recompute HMAC and compare to stored value
      const expectedHmac = buildAuditChainHash(entryForHmac, prevHmac, this.signingKey);

      if (expectedHmac !== event.hmac) {
        // Chain broken at this event
        this.logger.warn('Audit chain integrity failure detected', {
          tenantId,
          eventId: event.eventId,
          index: startIndex + i,
        });
        return {
          verified: false,
          failedAtIndex: startIndex + i,
          failedEventId: event.eventId,
          checkedCount: i + 1,
        };
      }

      prevHmac = event.hmac;
    }

    return { verified: true, checkedCount: events.length };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * _getLastEventId — retrieves the eventId of the most recent event for a tenant.
   * Used to populate the previousEventId chain reference field on new events.
   */
  private async _getLastEventId(tenantId: string): Promise<string | null> {
    const lastEvent = await AuditEventModel.findOne({ tenantId })
      .sort({ timestamp: -1 })
      .select('eventId')
      .lean() as unknown as IAuditEvent | null;

    return lastEvent ? lastEvent.eventId : null;
  }
}

// ---------------------------------------------------------------------------
// Factory helper — creates a singleton AuditEventService for DI into routes
// ---------------------------------------------------------------------------

let _auditServiceInstance: AuditEventService | null = null;

/**
 * getAuditService — returns a singleton AuditEventService instance.
 * AUDIT_SIGNING_KEY is read from environment — never hardcoded (FAC-S4-028).
 *
 * ✓ ASVS:V14.4.1 — signing key sourced from process.env; not from request input
 */
export function getAuditService(logger: Logger): AuditEventService {
  if (!_auditServiceInstance) {
    // ✓ ASVS:V14.4.1 — AUDIT_SIGNING_KEY from environment variable; never hardcoded
    const signingKey = process.env.AUDIT_SIGNING_KEY || '';
    if (!signingKey) {
      logger.warn(
        'AUDIT_SIGNING_KEY is not set — audit HMAC chain will use empty key. ' +
          'Set AUDIT_SIGNING_KEY in environment before production deployment.',
      );
    }
    _auditServiceInstance = new AuditEventService(signingKey, logger);
  }
  return _auditServiceInstance;
}
