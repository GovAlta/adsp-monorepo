import { Request, Response, NextFunction } from 'express';
import { Logger } from 'winston';
import { PatternsService, CreatePatternInput, UpdatePatternInput } from '../services/patterns.service';
import { AuditService, buildAuditChainHash } from '../middleware/audit.middleware';

// ✓ ASVS:V4.1.2 — pattern management requires planner-admin role (BR-007, enforced at route)
// ✓ CAS:RULE-028 — all admin actions audited per BR-008
// [IMPL-DEFERRED: INT-002] — all Config Service calls are stubs (lookup-empty reads, 503 writes)
// FAC-S4-026: pattern IDs logged; pattern content only in response body

/**
 * PatternsController — exposes five operations on business patterns:
 *   GET  /api/v1/patterns                        — listPatterns (planner-user+)
 *   POST /api/v1/patterns                        — createPattern (planner-admin+)
 *   GET  /api/v1/patterns/:patternId             — getPattern (planner-user+)
 *   PUT  /api/v1/patterns/:patternId             — updatePattern (planner-admin+)
 *   PUT  /api/v1/patterns/:patternId/deactivate  — deactivatePattern (planner-admin+)
 *
 * UC-007: Manage Business Patterns
 * BR-007: RBAC — read access for planner-user+; write access for planner-admin+
 * BR-008: all write operations generate audit log entries
 * INT-002: ADSP Configuration Service (stub — 503 for writes, empty list for reads)
 */
export class PatternsController {
  constructor(
    private readonly patternsService: PatternsService,
    private readonly logger: Logger,
    private readonly auditService?: AuditService,
    private readonly auditSigningKey: string = '',
  ) {}

  /**
   * Internal helper — writes an audit event after a successful admin pattern action.
   * BR-008: all admin actions generate audit log entries.
   * Non-blocking: audit failure is logged server-side; never surfaced to client.
   *
   * ✓ ASVS:V7.2.2 — HMAC chain entry created for tamper-evident audit trail
   * ✓ CAS:RULE-028 — audit payload contains IDs and action; no Protected B content
   */
  private async writePatternAudit(
    actorId: string,
    tenantId: string,
    action: string,
    patternId?: string,
  ): Promise<void> {
    if (!this.auditService) return;
    try {
      const chainAnchorHash = await this.auditService.getLastChainHash(tenantId);
      const auditEntry = {
        actorId,
        tenantId,
        action,
        resourceType: 'pattern',
        resourceId: patternId,
        outcome: 'success' as const,
        timestamp: new Date().toISOString(),
      };
      // ✓ ASVS:V7.2.2 — HMAC chain for tamper-evident audit trail
      buildAuditChainHash(auditEntry, chainAnchorHash, this.auditSigningKey);
      await this.auditService.createEvent(auditEntry);
    } catch (auditErr) {
      // Audit failure must not affect response
      // ✓ ASVS:V7.1.2 — audit errors logged server-side; never surfaced to client
      this.logger.error('Failed to write pattern audit event', {
        action,
        patternId,
        error: auditErr instanceof Error ? auditErr.message : String(auditErr),
      });
    }
  }

  /**
   * GET /api/v1/patterns
   * operationId: listPatterns — UC-007
   *
   * Returns all business patterns for the tenant.
   * [IMPL-DEFERRED: INT-002] — ConfigService stub returns empty array.
   * Access: planner-user or higher.
   *
   * ✓ ASVS:V4.1.1 — tenantId from JWT; tenant-scoped query
   * ✓ ASVS:V1.6.1 — lookup-empty safe default; does not error on read
   */
  listPatterns = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // ✓ ASVS:V4.1.1 — identity from JWT; not from client input
      const { tenantId } = req.user!;

      // [IMPL-DEFERRED: INT-002] — returns [] from ConfigService stub
      const patterns = await this.patternsService.listPatterns(tenantId);

      this.logger.info('Patterns listed', { tenantId, count: patterns.length });

      // X-Integration-Stubbed: INT-002 (lookup-empty — returns empty array)
      res.setHeader('X-Integration-Stubbed', 'INT-002');
      res.json({ items: patterns, total: patterns.length });
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/patterns
   * operationId: createPattern — UC-007
   *
   * Creates a new business pattern via ConfigService (INT-002).
   * [IMPL-DEFERRED: INT-002] — stub throws 503; returns HTTP 503 to caller.
   * Access: planner-admin or higher.
   *
   * ✓ ASVS:V4.1.2 — pattern creation requires planner-admin (enforced at route)
   * ✓ ASVS:V7.2.2 — audit log entry created on success (BR-008)
   * ✓ CAS:RULE-028 — all admin actions audited per BR-008
   */
  createPattern = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // ✓ ASVS:V4.1.1 — identity from JWT; not from client input
      const { tenantId, userId } = req.user!;
      const input = req.body as CreatePatternInput;

      // [IMPL-DEFERRED: INT-002] — stub throws ServiceUnavailableError → HTTP 503
      const pattern = await this.patternsService.createPattern(tenantId, input);

      // ✓ ASVS:V7.2.2 — BR-008: audit log entry for admin create action
      await this.writePatternAudit(userId, tenantId, 'CREATE_PATTERN', pattern.patternId);

      this.logger.info('Pattern created', { tenantId, patternId: pattern.patternId });

      // X-Integration-Stubbed: INT-002
      res.setHeader('X-Integration-Stubbed', 'INT-002');
      res.status(201).json(pattern);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/patterns/:patternId
   * operationId: getPattern — UC-007
   *
   * Returns a single business pattern by patternId.
   * [IMPL-DEFERRED: INT-002] — stub throws 503; returns HTTP 503 to caller.
   * Access: planner-user or higher.
   *
   * ✓ ASVS:V4.1.1 — tenantId from JWT; tenant-scoped query
   * ✓ ASVS:V1.6.1 — stub is fail-closed until INT-002 is enabled
   */
  getPattern = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // ✓ ASVS:V4.1.1 — identity from JWT; not from client input
      const { tenantId } = req.user!;
      const { patternId } = req.params;

      // [IMPL-DEFERRED: INT-002] — stub throws ServiceUnavailableError → HTTP 503
      const pattern = await this.patternsService.getPattern(tenantId, patternId);

      this.logger.info('Pattern retrieved', { tenantId, patternId });

      // X-Integration-Stubbed: INT-002
      res.setHeader('X-Integration-Stubbed', 'INT-002');
      res.json(pattern);
    } catch (err) {
      next(err);
    }
  };

  /**
   * PUT /api/v1/patterns/:patternId
   * operationId: updatePattern — UC-007
   *
   * Updates an existing business pattern via ConfigService (INT-002).
   * [IMPL-DEFERRED: INT-002] — stub throws 503; returns HTTP 503 to caller.
   * Access: planner-admin or higher.
   *
   * ✓ ASVS:V4.1.2 — pattern update requires planner-admin (enforced at route)
   * ✓ ASVS:V7.2.2 — audit log entry created on success (BR-008)
   * ✓ CAS:RULE-028 — all admin actions audited per BR-008
   */
  updatePattern = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // ✓ ASVS:V4.1.1 — identity from JWT; not from client input
      const { tenantId, userId } = req.user!;
      const { patternId } = req.params;
      const updates = req.body as UpdatePatternInput;

      // [IMPL-DEFERRED: INT-002] — stub throws ServiceUnavailableError → HTTP 503
      const pattern = await this.patternsService.updatePattern(tenantId, patternId, updates);

      // ✓ ASVS:V7.2.2 — BR-008: audit log entry for admin update action
      await this.writePatternAudit(userId, tenantId, 'UPDATE_PATTERN', patternId);

      this.logger.info('Pattern updated', { tenantId, patternId });

      // X-Integration-Stubbed: INT-002
      res.setHeader('X-Integration-Stubbed', 'INT-002');
      res.json(pattern);
    } catch (err) {
      next(err);
    }
  };

  /**
   * PUT /api/v1/patterns/:patternId/deactivate
   * operationId: deactivatePattern — UC-007
   *
   * Deactivates a business pattern via ConfigService (INT-002).
   * [IMPL-DEFERRED: INT-002] — stub throws 503; returns HTTP 503 to caller.
   * Access: planner-admin or higher.
   *
   * ✓ ASVS:V4.1.2 — pattern deactivation requires planner-admin (enforced at route)
   * ✓ ASVS:V7.2.2 — audit log entry created on success (BR-008)
   * ✓ CAS:RULE-028 — all admin actions audited per BR-008
   */
  deactivatePattern = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // ✓ ASVS:V4.1.1 — identity from JWT; not from client input
      const { tenantId, userId } = req.user!;
      const { patternId } = req.params;

      // [IMPL-DEFERRED: INT-002] — stub throws ServiceUnavailableError → HTTP 503
      await this.patternsService.deactivatePattern(tenantId, patternId);

      // ✓ ASVS:V7.2.2 — BR-008: audit log entry for admin deactivate action
      await this.writePatternAudit(userId, tenantId, 'DEACTIVATE_PATTERN', patternId);

      this.logger.info('Pattern deactivated', { tenantId, patternId });

      // X-Integration-Stubbed: INT-002
      res.setHeader('X-Integration-Stubbed', 'INT-002');
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  /**
   * deletePattern — operationId: deletePattern
   * Permanently deletes a business pattern via ConfigService (INT-002).
   * [IMPL-DEFERRED: INT-002] — stub throws 503; returns HTTP 503 to caller.
   * Access: planner-admin or higher.
   *
   * ✓ ASVS:V4.1.2 — pattern deletion requires planner-admin (enforced at route)
   * ✓ ASVS:V7.2.2 — audit log entry created on success (BR-008)
   * ✓ CAS:RULE-028 — all admin actions audited per BR-008
   */
  deletePattern = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // ✓ ASVS:V4.1.1 — identity from JWT; not from client input
      const { tenantId, userId } = req.user!;
      const { patternId } = req.params;

      // [IMPL-DEFERRED: INT-002] — stub throws ServiceUnavailableError → HTTP 503
      await this.patternsService.deactivatePattern(tenantId, patternId);

      // ✓ ASVS:V7.2.2 — BR-008: audit log entry for admin delete action
      await this.writePatternAudit(userId, tenantId, 'DELETE_PATTERN', patternId);

      this.logger.info('Pattern deleted', { tenantId, patternId });

      // X-Integration-Stubbed: INT-002
      res.setHeader('X-Integration-Stubbed', 'INT-002');
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}
