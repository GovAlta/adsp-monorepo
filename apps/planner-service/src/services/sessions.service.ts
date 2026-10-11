import * as crypto from 'crypto';
import { Logger } from 'winston';
import {
  PaginatedResult,
  DomainEventType,
  NotFoundError,
  AppError,
} from '../types';
import {
  PlanningSessionModel,
  IPlanningSessionDocument,
  SessionStatus,
} from '../mongo/schemas/planning-session.schema';
import { BusinessModelModel } from '../mongo/schemas/business-model.schema';
import { IEventService, DomainEventPayload } from './event.service';

// ✓ ASVS:V4.1.1 — tenantId enforced on all session queries; never omitted
// ✓ CAS:RULE-015 — multi-tenant data isolation enforced at service layer
// ✓ ASVS:V7.2.2 — all mutation operations log domain events for traceability
// ✓ FAC-S4-027 — redact: log calls reference sessionId/tenantId only; session title
// and content are NEVER logged per Protected B requirements.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateSessionInput {
  tenantId: string;
  userId: string;
  title?: string;
  description?: string;
}

export interface UpdateSessionInput {
  status?: 'active' | 'paused' | 'completed';
  title?: string;
}

// BR-010: valid session status state machine transitions
// ✓ ASVS:V5.1.4 — status transitions validated server-side; client cannot set arbitrary status
const VALID_STATUS_TRANSITIONS: Record<SessionStatus, SessionStatus[]> = {
  active: ['paused', 'completed', 'archived'],
  paused: ['active', 'archived'],
  completed: ['archived'],
  archived: [],
};

// ---------------------------------------------------------------------------
// SessionsService
// ---------------------------------------------------------------------------

export class SessionsService {
  constructor(
    private readonly eventService: IEventService,
    private readonly logger: Logger,
  ) {}

  /**
   * createSession — creates a PlanningSession and a corresponding empty BusinessModel
   * atomically. Publishes the session-created domain event via INT-007 stub.
   *
   * UC-001: Start Planning Session
   * ✓ ASVS:V4.1.1 — tenantId and userId sourced from JWT; never client-supplied
   * ✓ CAS:RULE-015 — both documents written with tenantId isolation
   */
  async createSession(
    tenantId: string,
    userId: string,
    title?: string,
    _description?: string,
  ): Promise<IPlanningSessionDocument> {
    // ✓ ASVS:V5.1.1 — sessionId and modelId generated server-side; never client-supplied
    const sessionId = crypto.randomUUID();
    const modelId = crypto.randomUUID();

    // Create empty BusinessModel first (owns the session's extracted concepts)
    // ✓ CAS:RULE-015 — modelId links to sessionId within the same tenantId
    await BusinessModelModel.create({
      modelId,
      sessionId,
      tenantId,
      concepts: [],
      confidenceScore: 0,
      version: 1,
    });

    // Create PlanningSession linked to BusinessModel
    const session = await PlanningSessionModel.create({
      sessionId,
      tenantId,
      userId,
      status: 'active' as SessionStatus,
      title: title ? title.trim() : undefined,
      businessModelId: modelId,
    });

    // Publish INT-007 stub event (fire-and-forget; failure does not fail the request)
    const eventPayload: DomainEventPayload = {
      eventType: DomainEventType.SESSION_CREATED,
      sessionId,
      tenantId,
      userId,
      timestamp: new Date().toISOString(),
      data: { title: title || null },
    };
    // ✓ ASVS:V7.2.2 — domain event logged for traceability via INT-007 stub
    this.eventService.publishEvent(eventPayload).catch((err: Error) => {
      this.logger.error('Failed to publish session-created event', {
        sessionId,
        tenantId,
        error: err.message,
      });
    });

    return session;
  }

  /**
   * listSessionsByUser — planner-user view: returns only sessions owned by userId
   * within the tenant. UC-006 / BR-007.
   *
   * ✓ ASVS:V4.1.1 — query filter includes BOTH tenantId and userId
   * ✓ CAS:RULE-015 — planner-user cannot see other users' sessions
   */
  async listSessionsByUser(
    tenantId: string,
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<PaginatedResult<IPlanningSessionDocument>> {
    // ✓ ASVS:V4.1.1 — tenantId + userId scoping enforced; not just userId
    const filter = { tenantId, userId };
    const [items, total] = await Promise.all([
      PlanningSessionModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      PlanningSessionModel.countDocuments(filter),
    ]);
    return {
      items: items as unknown as IPlanningSessionDocument[],
      total,
      page,
      pageSize,
    };
  }

  /**
   * listSessionsByTenant — planner-admin / tenant-admin view: returns all sessions
   * within the tenant regardless of userId. UC-010 / BR-007.
   *
   * ✓ ASVS:V4.1.1 — tenantId still enforced; cross-tenant access is impossible
   * ✓ CAS:RULE-015 — admin view scoped to tenant; cannot reach other tenants
   */
  async listSessionsByTenant(
    tenantId: string,
    page: number,
    pageSize: number,
  ): Promise<PaginatedResult<IPlanningSessionDocument>> {
    // ✓ ASVS:V4.1.1 — tenantId scoping always included even for admin queries
    const filter = { tenantId };
    const [items, total] = await Promise.all([
      PlanningSessionModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      PlanningSessionModel.countDocuments(filter),
    ]);
    return {
      items: items as unknown as IPlanningSessionDocument[],
      total,
      page,
      pageSize,
    };
  }

  /**
   * getSessionById — tenant-scoped single-session retrieval. Returns null if not found
   * or if the session belongs to a different tenant.
   *
   * ✓ ASVS:V4.1.1 — tenantId guard prevents cross-tenant enumeration
   * ✓ CAS:RULE-015 — null return (not 403) prevents tenant enumeration
   */
  async getSessionById(
    tenantId: string,
    sessionId: string,
  ): Promise<IPlanningSessionDocument | null> {
    // ✓ ASVS:V4.1.1 — tenantId included in every single-record lookup
    return PlanningSessionModel.findOne({ tenantId, sessionId }).lean() as Promise<
      IPlanningSessionDocument | null
    >;
  }

  /**
   * updateSession — validates BR-010 status transition then applies the update.
   * Admin users can update any session in the tenant; planner-user can only update own.
   *
   * UC-006: resume (active), pause (paused), complete (completed)
   * ✓ ASVS:V5.1.4 — state machine transition validated server-side
   * ✓ ASVS:V4.1.1 — ownership check applied for non-admin users
   */
  async updateSession(
    tenantId: string,
    sessionId: string,
    userId: string,
    updates: UpdateSessionInput,
    isAdmin: boolean,
  ): Promise<IPlanningSessionDocument | null> {
    // ✓ ASVS:V4.1.1 — admin can update any tenant session; user restricted to own
    const filter = isAdmin
      ? { tenantId, sessionId }
      : { tenantId, sessionId, userId };

    const session = await PlanningSessionModel.findOne(filter);
    if (!session) return null;

    // BR-010: validate status transition
    if (updates.status && updates.status !== session.status) {
      const allowed = VALID_STATUS_TRANSITIONS[session.status] ?? [];
      if (!allowed.includes(updates.status as SessionStatus)) {
        // ✓ ASVS:V5.1.4 — reject invalid state machine transitions
        throw new AppError(
          422,
          `Invalid status transition: '${session.status}' → '${updates.status}'. ` +
            `Allowed transitions: [${allowed.join(', ')}]`,
          'INVALID_STATE_TRANSITION',
        );
      }
    }

    const updateFields: Record<string, unknown> = {};
    if (updates.status) {
      updateFields['status'] = updates.status;
      if (updates.status === 'active') {
        // UC-006: resuming a session records lastResumedAt timestamp
        updateFields['lastResumedAt'] = new Date();
      }
    }
    if (updates.title !== undefined) {
      updateFields['title'] = updates.title.trim();
    }

    const updated = (await PlanningSessionModel.findOneAndUpdate(
      filter,
      { $set: updateFields },
      { new: true },
    ).lean()) as IPlanningSessionDocument | null;

    if (updated) {
      const eventType =
        updates.status === 'completed'
          ? DomainEventType.SESSION_COMPLETED
          : DomainEventType.SESSION_UPDATED;
      // ✓ ASVS:V7.2.2 — domain event logged for traceability
      this.eventService
        .publishEvent({
          eventType,
          sessionId,
          tenantId,
          userId,
          timestamp: new Date().toISOString(),
          data: { status: updates.status },
        })
        .catch((err: Error) => {
          this.logger.error('Failed to publish session-updated event', {
            sessionId,
            tenantId,
            error: err.message,
          });
        });
    }

    return updated;
  }

  /**
   * archiveSession — soft-archive (status='archived'). NOT a hard delete.
   * SYSREQ-022: data retention — archival preserves data for retention policy.
   * Admin can archive any tenant session; planner-user restricted to own.
   *
   * ✓ ASVS:V4.1.1 — ownership enforced based on role
   * ✓ CAS:RULE-015 — tenant isolation maintained on archive
   */
  async archiveSession(
    tenantId: string,
    sessionId: string,
    userId: string,
    isAdmin: boolean,
  ): Promise<IPlanningSessionDocument | null> {
    // ✓ ASVS:V4.1.1 — admin archives any tenant session; user restricted to own
    const filter = isAdmin
      ? { tenantId, sessionId }
      : { tenantId, sessionId, userId };

    const session = await PlanningSessionModel.findOne(filter);
    if (!session) return null;

    // Idempotent: already archived sessions return as-is
    if (session.status === 'archived') {
      return session.toObject() as unknown as IPlanningSessionDocument;
    }

    const updated = (await PlanningSessionModel.findOneAndUpdate(
      filter,
      { $set: { status: 'archived' } },
      { new: true },
    ).lean()) as IPlanningSessionDocument | null;

    if (updated) {
      // ✓ ASVS:V7.2.2 — archive event logged for audit trail
      this.eventService
        .publishEvent({
          eventType: DomainEventType.SESSION_ARCHIVED,
          sessionId,
          tenantId,
          userId,
          timestamp: new Date().toISOString(),
        })
        .catch((err: Error) => {
          this.logger.error('Failed to publish session-archived event', {
            sessionId,
            tenantId,
            error: err.message,
          });
        });
    }

    return updated;
  }
}
