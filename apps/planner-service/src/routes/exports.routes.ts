import { Router } from 'express';
import { z } from 'zod';
import { Logger } from 'winston';
import { ExportsController } from '../controllers/exports.controller';
import { ExportsService } from '../services/exports.service';
import { requireAuth, requirePlannerUser } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { validateParams, validateQuery, PaginationSchema } from '../middleware/validation.middleware';
import { createAuditMiddleware, AuditService } from '../middleware/audit.middleware';

// ✓ ASVS:V3.5.2 — requireAuth applied to all export routes; no public access
// ✓ ASVS:V4.1.1 — tenantMiddleware ensures tenantId always present before any handler
// ✓ CAS:RULE-001 — authentication enforced before export data access
// FAC-S4-026: exportId is a reference key; no Protected B content in URL path

// ---------------------------------------------------------------------------
// Validation schemas — exports resource
// ✓ ASVS:V5.1.1 — all URL params validated before handler execution
// ---------------------------------------------------------------------------

const ExportParamSchema = z.object({
  sessionId: z.string().min(1, 'sessionId is required'),
});

const ExportIdParamSchema = z.object({
  sessionId: z.string().min(1, 'sessionId is required'),
  exportId: z.string().min(1, 'exportId is required'),
});

// ---------------------------------------------------------------------------
// Router factory
// ---------------------------------------------------------------------------

export interface ExportsRouterOptions {
  logger: Logger;
  /**
   * Required — ExportsService writes audit events via AuditService (BR-008).
   * The route itself also attaches audit middleware to POST for double coverage.
   */
  auditService: AuditService;
}

/**
 * createExportsRouter — mounts export routes at /sessions/:sessionId/exports.
 *
 * IMPORTANT: this router is mounted with mergeParams: true so that :sessionId
 * from the parent /sessions/:sessionId path is visible inside this router.
 *
 * Routes:
 *   POST   /                 — initiateExport (UC-008); returns 201 Created
 *   GET    /                 — listExports; returns paginated DTOs without export_data
 *   GET    /:exportId        — getExport; returns DTO WITH export_data (owner or admin)
 */
export function createExportsRouter(options: ExportsRouterOptions): Router {
  const { logger, auditService } = options;

  // ✓ ASVS:V14.4.1 — AUDIT_SIGNING_KEY from environment; never hardcoded (FAC-S4-028)
  const signingKey = process.env.AUDIT_SIGNING_KEY || '';

  const exportsService = new ExportsService(auditService, signingKey, logger);
  const exportsController = new ExportsController(exportsService, logger);

  // mergeParams: true — inherit :sessionId from parent router mount
  const router = Router({ mergeParams: true });

  // -----------------------------------------------------------------------
  // POST /api/v1/sessions/:sessionId/exports — initiate export (UC-008)
  // operationId: initiateExport
  // ✓ ASVS:V5.1.1 — params validated before handler
  // ✓ ASVS:V7.2.2 — audit middleware fires after successful response (BR-008)
  // -----------------------------------------------------------------------
  router.post(
    '/',
    requireAuth,
    tenantMiddleware,
    requirePlannerUser,
    validateParams(ExportParamSchema),
    // ✓ CAS:RULE-028 — POST export action audited per BR-008
    createAuditMiddleware(auditService, signingKey, logger, 'INITIATE_EXPORT', 'session_export'),
    exportsController.initiateExport,
  );

  // -----------------------------------------------------------------------
  // GET /api/v1/sessions/:sessionId/exports — list exports for session
  // operationId: listExports
  // ✓ ASVS:V4.1.1 — service layer enforces owner-or-admin scope
  // -----------------------------------------------------------------------
  router.get(
    '/',
    requireAuth,
    tenantMiddleware,
    requirePlannerUser,
    validateParams(ExportParamSchema),
    validateQuery(PaginationSchema),
    exportsController.listExports,
  );

  // -----------------------------------------------------------------------
  // GET /api/v1/sessions/:sessionId/exports/:exportId — download export
  // operationId: getExport
  // ✓ ASVS:V4.1.2 — owner or admin access check enforced in service
  // ✓ CAS:RULE-015 — Protected B export data gated; access logged
  // -----------------------------------------------------------------------
  router.get(
    '/:exportId',
    requireAuth,
    tenantMiddleware,
    requirePlannerUser,
    validateParams(ExportIdParamSchema),
    exportsController.getExport,
  );

  return router;
}
