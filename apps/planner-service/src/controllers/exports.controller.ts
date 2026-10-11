import { Request, Response, NextFunction } from 'express';
import { Logger } from 'winston';
import { ExportsService } from '../services/exports.service';
import { NotFoundError, ForbiddenError, PLANNER_ROLES } from '../types';

// ✓ ASVS:V4.1.2 — export access controls enforced: owner or planner-admin can download
// ✓ CAS:RULE-015 — Protected B export data access logged per BR-008
// ✓ ASVS:V4.1.1 — tenantId enforced on all export queries via service layer
// FAC-S4-026 — no Protected B data in URL path or query params; sessionId is a reference key only

export class ExportsController {
  constructor(
    private readonly exportsService: ExportsService,
    private readonly logger: Logger,
  ) {}

  /**
   * POST /api/v1/sessions/:sessionId/exports
   * operationId: initiateExport — UC-008
   *
   * Initiates a session export. Assembles session, business model, hypotheses, and
   * messages into a portable JSON export_data blob stored in MongoDB.
   * Requires planner-user+ role. Returns 201 Created with export DTO (no data content).
   *
   * ✓ ASVS:V4.1.1 — tenantId and userId from JWT; sessionId from URL path (reference only)
   * ✓ CAS:RULE-028 — export operation audited in service layer per BR-008
   */
  initiateExport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // ✓ ASVS:V4.1.1 — identity sourced from validated JWT; never from request body
      const { tenantId, userId, roles } = req.user!;
      const { sessionId } = req.params;

      const exportDTO = await this.exportsService.initiateExport({
        tenantId,
        sessionId,
        requestedBy: userId,
        callerRoles: roles,
      });

      // ✓ ASVS:V7.2.1 — log export action with exportId; NO content logged
      this.logger.info('Export initiated', {
        exportId: exportDTO.exportId,
        sessionId,
        tenantId,
        userId,
      });

      // 201 Created — export record created synchronously; client uses getExport for data (D-002)
      res.status(201).json(exportDTO);
    } catch (err) {
      if (err instanceof NotFoundError || err instanceof ForbiddenError) {
        return next(err);
      }
      next(err);
    }
  };

  /**
   * GET /api/v1/sessions/:sessionId/exports
   * operationId: listExports — UC-008
   *
   * Lists export records for a session. Does NOT include export_data content.
   * Requires planner-user+ role. Non-admin users see only their own exports.
   *
   * ✓ ASVS:V4.1.1 — scope enforced at service layer (owner or admin)
   * ✓ CAS:RULE-028 — export_data excluded from list; download via getExport endpoint
   */
  listExports = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, userId, roles } = req.user!;
      const { sessionId } = req.params;
      const page = parseInt(String(req.query['page'] ?? '1'), 10);
      const pageSize = Math.min(parseInt(String(req.query['pageSize'] ?? '20'), 10), 100);

      const result = await this.exportsService.listExportsForSession(
        tenantId,
        sessionId,
        userId,
        roles,
        page,
        pageSize,
      );

      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/sessions/:sessionId/exports/:exportId
   * operationId: getExport — UC-008
   *
   * Retrieves a single export record INCLUDING export_data content.
   * Requires: original requestor OR planner-admin/tenant-admin.
   *
   * ✓ ASVS:V4.1.2 — export_data access restricted: owner or admin only (CAS:RULE-015)
   * ✓ CAS:RULE-015 — Protected B export data access logged
   * ✓ FAC-S4-026 — exportId is a reference identifier; no Protected B content in URL
   */
  getExport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // ✓ ASVS:V4.1.1 — tenantId from JWT; exportId from URL path (reference only)
      const { tenantId, userId, roles } = req.user!;
      const { exportId } = req.params;

      const exportDTO = await this.exportsService.getExport(
        tenantId,
        exportId,
        userId,
        roles,
      );

      // ✓ ASVS:V7.2.1 — log access: exportId + actor; no content in log
      this.logger.info('Export retrieved', {
        exportId,
        tenantId,
        userId,
      });

      res.json(exportDTO);
    } catch (err) {
      // RFC 7807 shapes for 404 and 403
      if (err instanceof NotFoundError) {
        res.status(404).json({
          type: 'https://planner.alberta.ca/errors/not-found',
          title: 'Export Not Found',
          status: 404,
          detail: err.message,
          instance: req.path,
        });
        return;
      }
      if (err instanceof ForbiddenError) {
        res.status(403).json({
          type: 'https://planner.alberta.ca/errors/forbidden',
          title: 'Forbidden',
          status: 403,
          detail: err.message,
          instance: req.path,
        });
        return;
      }
      next(err);
    }
  };
}
