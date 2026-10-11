import { Request, Response, NextFunction } from 'express';
import { Logger } from 'winston';
import { AuditEventService, AuditQuery } from '../services/audit.service';
import { NotFoundError } from '../types';

// ✓ ASVS:V4.1.2 — audit read restricted to planner-admin (FAC-S4-030)
// ✓ CAS:RULE-028 — access to audit log itself is logged (via route middleware)
// ✓ FAC-S4-026 — no Protected B data in URL query params; only actor IDs and action names
// ✓ ASVS:V7.3.2 — chain verification endpoint for BR-009 integrity checks

/**
 * AuditController — provides read-only access to the immutable audit event log.
 *
 * ALL endpoints require planner-admin or tenant-admin role (enforced at route level).
 * Access to the audit log is itself audited via route-level audit middleware.
 *
 * Audit events contain: actorId, action, resourceType, resourceId, outcome, timestamp.
 * They do NOT contain Protected B session content (CAS:RULE-028 / FAC-S4-026).
 */
export class AuditController {
  constructor(
    private readonly auditService: AuditEventService,
    private readonly logger: Logger,
  ) {}

  /**
   * GET /api/v1/audit
   * operationId: listAuditEvents — UC-010 / SYSREQ-020
   *
   * Returns paginated audit events for the caller's tenant.
   * Supports filtering by actorId, action, resourceType, resourceId, date range.
   *
   * Query parameters: actorId, action, resourceType, resourceId, from (ISO-8601),
   *   to (ISO-8601), page, pageSize (max 100, default 20).
   *
   * ✓ ASVS:V4.1.2 — admin-only; enforced by requireAdmin middleware at route level
   * ✓ FAC-S4-026 — query params contain only actor IDs and action type strings; no session content
   * ✓ CAS:RULE-028 — read-only; no write operations in this handler
   */
  listAuditEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // ✓ ASVS:V4.1.1 — tenantId from JWT; never from query param (cross-tenant blocked)
      const { tenantId } = req.user!;

      // ✓ ASVS:V5.1.2 — query params validated; integers bounded to prevent DoS
      const rawPage = parseInt(String(req.query['page'] ?? '1'), 10);
      const rawPageSize = parseInt(String(req.query['pageSize'] ?? '20'), 10);
      const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
      const pageSize = isNaN(rawPageSize) || rawPageSize < 1 ? 20 : Math.min(rawPageSize, 100);

      const query: AuditQuery = {
        page,
        pageSize,
      };

      // ✓ FAC-S4-026 — actorId and action are metadata identifiers; no Protected B session content
      if (req.query['actorId']) {
        query.actorId = String(req.query['actorId']);
      }
      if (req.query['action']) {
        query.action = String(req.query['action']);
      }
      if (req.query['resourceType']) {
        query.resourceType = String(req.query['resourceType']);
      }
      if (req.query['resourceId']) {
        query.resourceId = String(req.query['resourceId']);
      }
      if (req.query['from']) {
        query.from = String(req.query['from']);
      }
      if (req.query['to']) {
        query.to = String(req.query['to']);
      }

      const result = await this.auditService.listAuditEvents(tenantId, query);

      // ✓ ASVS:V7.2.1 — admin audit log access logged by route middleware (BR-008)
      this.logger.info('Audit events listed', {
        tenantId,
        userId: req.user!.userId,
        page,
        pageSize,
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/audit/:eventId
   * operationId: getAuditEvent — UC-010 / SYSREQ-020
   *
   * Retrieves a single audit event including its HMAC hash field.
   * Returns RFC 7807 404 if not found within caller's tenant.
   *
   * ✓ ASVS:V4.1.2 — admin-only; enforced by requireAdmin middleware at route level
   * ✓ ASVS:V4.1.1 — tenantId scopes retrieval; cross-tenant event access is impossible
   * ✓ CAS:RULE-028 — read-only retrieval; no state changes
   */
  getAuditEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // ✓ ASVS:V4.1.1 — tenantId from JWT; cross-tenant event access blocked in service
      const { tenantId } = req.user!;
      const { eventId } = req.params;

      const event = await this.auditService.getAuditEvent(tenantId, eventId);

      if (!event) {
        return next(new NotFoundError('AuditEvent', eventId));
      }

      // ✓ ASVS:V7.2.1 — admin retrieval logged by route middleware; no content in this log
      this.logger.info('Audit event retrieved', {
        eventId,
        tenantId,
        userId: req.user!.userId,
      });

      res.json(event);
    } catch (err) {
      // RFC 7807 shape for 404
      if (err instanceof NotFoundError) {
        res.status(404).json({
          type: 'https://planner.alberta.ca/errors/not-found',
          title: 'Audit Event Not Found',
          status: 404,
          detail: err.message,
          instance: req.path,
        });
        return;
      }
      next(err);
    }
  };

  /**
   * GET /api/v1/audit/verify
   * operationId: verifyAuditChain — BR-009 audit chain integrity check
   *
   * Re-computes the HMAC chain for a slice of events and reports whether
   * all hashes match (verified=true) or where the first failure occurs.
   *
   * Query params: startIndex (default 0), endIndex (default 99, max startIndex+499).
   *
   * ✓ ASVS:V7.3.2 — chain verification endpoint for integrity audits
   * ✓ ASVS:V4.1.2 — admin-only; enforced by requireAdmin at route level
   */
  verifyAuditChain = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = req.user!;

      const rawStart = parseInt(String(req.query['startIndex'] ?? '0'), 10);
      const rawEnd = parseInt(String(req.query['endIndex'] ?? '99'), 10);
      const startIndex = isNaN(rawStart) || rawStart < 0 ? 0 : rawStart;
      // ✓ ASVS:V5.1.3 — range capped at 500 events to prevent runaway verification
      const endIndex = isNaN(rawEnd) || rawEnd < startIndex
        ? startIndex + 99
        : Math.min(rawEnd, startIndex + 499);

      const result = await this.auditService.verifyAuditChain(tenantId, startIndex, endIndex);

      this.logger.info('Audit chain verification performed', {
        tenantId,
        userId: req.user!.userId,
        startIndex,
        endIndex,
        verified: result.verified,
        checkedCount: result.checkedCount,
      });

      // Return 200 in both cases — client inspects result.verified to determine integrity
      res.json(result);
    } catch (err) {
      next(err);
    }
  };
}
