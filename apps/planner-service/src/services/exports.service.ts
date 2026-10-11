import * as crypto from 'crypto';
import { Logger } from 'winston';
import { NotFoundError, ForbiddenError, PaginatedResult } from '../types';
import {
  SessionExportModel,
  ISessionExport,
  ISessionExportDocument,
} from '../mongo/schemas/session-export.schema';
import { PlanningSessionModel } from '../mongo/schemas/planning-session.schema';
import { BusinessModelModel } from '../mongo/schemas/business-model.schema';
import { AuditService, AuditEventPayload } from '../middleware/audit.middleware';

// ✓ ASVS:V4.1.1 — tenant isolation in all export queries (tenantId always included)
// ✓ CAS:RULE-028 — export operations audited per BR-008; export_data content NEVER logged
// ✓ CAS:RULE-015 — Protected B export data access restricted to originating actor or admin
// [IMPL-DEFERRED: SYSREQ-022] — retention/disposition for exports not implemented;
//   no auto-delete of export records. Scheduled retention job deferred to Stage 5.

// ---------------------------------------------------------------------------
// ExportsService input / output types
// ---------------------------------------------------------------------------

export interface InitiateExportInput {
  tenantId: string;
  sessionId: string;
  requestedBy: string;
  /** Caller's role list — used to determine admin elevation for session access */
  callerRoles: string[];
}

export interface SessionExportDTO {
  exportId: string;
  sessionId: string;
  tenantId: string;
  userId: string;
  format: string;
  exportedAt: Date;
  /** export_data is only included in getExport responses; omitted from list views */
  exportData?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// ExportsService
// ---------------------------------------------------------------------------

/**
 * ExportsService — assembles and persists portable JSON exports of planning sessions.
 *
 * UC-008: Export Session Plan
 * BR-008: each export operation creates an audit event
 * SYSREQ-016: export as portable JSON document
 *
 * ✓ ASVS:V4.1.1 — tenant isolation in all export queries; cross-tenant access impossible
 * ✓ CAS:RULE-028 — export_data contains full Protected B planning session content; never logged
 */
export class ExportsService {
  constructor(
    private readonly auditService: AuditService,
    private readonly signingKey: string,
    private readonly logger: Logger,
  ) {}

  /**
   * initiateExport — assembles full session state (session, business model, hypotheses,
   * messages) into export_data, persists a SessionExport document, and creates an audit entry.
   *
   * Returns the SessionExport DTO WITHOUT export_data (202 Accepted).
   * The caller must call getExport to retrieve the full export_data.
   *
   * UC-008: Export Session Plan
   * ✓ ASVS:V4.1.1 — tenantId scoped; session ownership checked before export
   * ✓ CAS:RULE-028 — export initiation audited; content NEVER written to logs
   */
  async initiateExport(input: InitiateExportInput): Promise<SessionExportDTO> {
    const { tenantId, sessionId, requestedBy, callerRoles } = input;

    // ✓ ASVS:V4.1.1 — verify session exists within this tenant before accessing data
    const session = await PlanningSessionModel.findOne({ tenantId, sessionId }).lean();
    if (!session) {
      throw new NotFoundError('PlanningSession', sessionId);
    }

    // BR-007: planner-user can only export own sessions; admin can export any tenant session
    // ✓ ASVS:V4.1.2 — ownership enforced for non-admin callers
    const isAdmin =
      callerRoles.includes('planner-admin') || callerRoles.includes('tenant-admin');
    if (!isAdmin && session.userId !== requestedBy) {
      // 403 not 404 — caller is authenticated but not the session owner
      throw new ForbiddenError('You may only export your own planning sessions');
    }

    // Assemble export_data — full session snapshot for portability (SYSREQ-016)
    // ✓ CAS:RULE-028 — export_data assembled in memory; NEVER written to structured logs
    // ✓ ASVS:V4.1.1 — all sub-queries include tenantId + sessionId scope
    const [businessModel, hypotheses, messages] = await Promise.all([
      session.businessModelId
        ? BusinessModelModel.findOne({ tenantId, modelId: session.businessModelId }).lean()
        : Promise.resolve(null),
      // Dynamic imports via require to avoid circular schema imports at module load time;
      // lazy-load schemas only needed at export assembly time
      this._loadHypotheses(tenantId, sessionId),
      this._loadMessages(tenantId, sessionId),
    ]);

    // ✓ CAS:RULE-028 — export_data holds Protected B content; logged only by exportId
    const exportData: Record<string, unknown> = {
      exportVersion: '1.0',
      exportedAt: new Date().toISOString(),
      session: {
        sessionId: session.sessionId,
        tenantId: session.tenantId,
        userId: session.userId,
        title: session.title,
        status: session.status,
        createdAt: (session as Record<string, unknown>)['createdAt'],
        updatedAt: (session as Record<string, unknown>)['updatedAt'],
      },
      businessModel,
      hypotheses,
      messages,
    };

    const exportId = crypto.randomUUID();

    // ✓ ASVS:V5.1.1 — exportId generated server-side; never client-supplied
    await SessionExportModel.create({
      exportId,
      sessionId,
      tenantId,
      userId: requestedBy,
      exportData,
      format: 'json',
      exportedAt: new Date(),
    });

    // BR-008: audit export initiation — actor + exportId only; NO content in audit payload
    // ✓ CAS:RULE-028 — audit payload contains only exportId + actor; no Protected B content
    const auditPayload: AuditEventPayload = {
      actorId: requestedBy,
      tenantId,
      action: 'EXPORT_SESSION',
      resourceType: 'session_export',
      resourceId: exportId,
      outcome: 'success',
    };
    try {
      await this.auditService.createEvent(auditPayload);
    } catch (auditErr) {
      // ✓ ASVS:V7.1.2 — audit failure logged server-side; does not fail the export
      this.logger.error('Failed to write export audit event', {
        exportId,
        tenantId,
        error: auditErr instanceof Error ? auditErr.message : String(auditErr),
      });
    }

    // ✓ ASVS:V7.2.1 — structured log: exportId + actor only; no Protected B data content
    this.logger.info('Session export initiated', {
      exportId,
      sessionId,
      tenantId,
      userId: requestedBy,
    });

    // Return DTO without export_data — caller fetches full export via getExport
    return this._toDTO(
      { exportId, sessionId, tenantId, userId: requestedBy, format: 'json', exportedAt: new Date(), exportData: {} } as ISessionExport,
      false,
    );
  }

  /**
   * getExport — retrieves a SessionExport by exportId, with tenantId isolation check.
   * Includes export_data for download (callers must have obtained access permission from route layer).
   *
   * ✓ ASVS:V4.1.1 — tenantId verified; cross-tenant export retrieval is impossible
   * ✓ CAS:RULE-015 — export_data content access limited to planner-admin or original requestor
   */
  async getExport(
    tenantId: string,
    exportId: string,
    requestedBy: string,
    callerRoles: string[],
  ): Promise<SessionExportDTO> {
    // ✓ ASVS:V4.1.1 — tenantId always included in lookup to prevent cross-tenant access
    const exportDoc = await SessionExportModel.findOne({ tenantId, exportId }).lean();

    if (!exportDoc) {
      throw new NotFoundError('SessionExport', exportId);
    }

    // export_data access: original requestor or admin only
    // ✓ ASVS:V4.1.2 — export_data gated; non-owner non-admin receives 403
    const isAdmin =
      callerRoles.includes('planner-admin') || callerRoles.includes('tenant-admin');
    const isOwner = exportDoc.userId === requestedBy;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenError('Access to this export requires admin role or ownership');
    }

    // ✓ ASVS:V7.2.1 — log access event: exportId + actor; no content in log
    this.logger.info('Session export retrieved', {
      exportId,
      tenantId,
      userId: requestedBy,
    });

    // Include export_data in response (caller has passed the access check above)
    return this._toDTO(exportDoc as unknown as ISessionExport, true);
  }

  /**
   * listExportsForSession — returns exports for a given session (admin or owner view).
   * export_data NOT included in list items (download requires getExport).
   *
   * ✓ ASVS:V4.1.1 — scoped to tenantId + sessionId; caller ownership enforced
   */
  async listExportsForSession(
    tenantId: string,
    sessionId: string,
    requestedBy: string,
    callerRoles: string[],
    page: number,
    pageSize: number,
  ): Promise<PaginatedResult<SessionExportDTO>> {
    // Admin can list exports for any session in the tenant
    // ✓ ASVS:V4.1.1 — tenantId always in filter; cross-tenant listing blocked
    const isAdmin =
      callerRoles.includes('planner-admin') || callerRoles.includes('tenant-admin');

    const filter = isAdmin
      ? { tenantId, sessionId }
      : { tenantId, sessionId, userId: requestedBy };

    const [docs, total] = await Promise.all([
      SessionExportModel.find(filter)
        .sort({ exportedAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        // ✓ CAS:RULE-028 — exportData excluded from list projection; download via getExport
        .select('-exportData')
        .lean(),
      SessionExportModel.countDocuments(filter),
    ]);

    return {
      items: (docs as unknown as ISessionExport[]).map((d) => this._toDTO(d, false)),
      total,
      page,
      pageSize,
    };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /** _toDTO — maps ISessionExport to the external DTO shape. */
  private _toDTO(doc: ISessionExport, includeData: boolean): SessionExportDTO {
    const dto: SessionExportDTO = {
      exportId: doc.exportId,
      sessionId: doc.sessionId,
      tenantId: doc.tenantId,
      userId: doc.userId,
      format: doc.format,
      exportedAt: doc.exportedAt,
    };
    if (includeData) {
      // ✓ CAS:RULE-028 — export_data only included in controlled download response
      dto.exportData = doc.exportData;
    }
    return dto;
  }

  /**
   * _loadHypotheses — lazy-loads SolutionHypothesis records for export assembly.
   * Uses dynamic require to avoid circular schema dependency at module-load time.
   * ✓ ASVS:V4.1.1 — tenantId + sessionId scope enforced in this query
   */
  private async _loadHypotheses(
    tenantId: string,
    sessionId: string,
  ): Promise<unknown[]> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { HypothesisRecordModel } = require('../mongo/schemas/hypothesis-record.schema');
      return HypothesisRecordModel.find({ tenantId, sessionId }).lean();
    } catch {
      return [];
    }
  }

  /**
   * _loadMessages — lazy-loads ConversationMessage records for export assembly.
   * ✓ ASVS:V4.1.1 — tenantId + sessionId scope enforced in this query
   */
  private async _loadMessages(
    tenantId: string,
    sessionId: string,
  ): Promise<unknown[]> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { ConversationMessageModel } = require('../mongo/schemas/conversation-message.schema');
      return ConversationMessageModel.find({ tenantId, sessionId })
        .sort({ createdAt: 1 })
        .lean();
    } catch {
      return [];
    }
  }
}
