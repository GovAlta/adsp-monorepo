import { Router } from 'express';
import { z } from 'zod';
import { Logger } from 'winston';
import { PatternsController } from '../controllers/patterns.controller';
import { PatternsService } from '../services/patterns.service';
import { requireAuth, requirePlannerUser, requireAdmin } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { validateBody, validateParams } from '../middleware/validation.middleware';
import { createAuditMiddleware, AuditService } from '../middleware/audit.middleware';

// ✓ ASVS:V3.5.2 — requireAuth applied to all pattern routes; no public access
// ✓ ASVS:V4.1.1 — tenantMiddleware ensures tenantId present before any handler
// ✓ ASVS:V4.1.2 — requireAdmin applied to write routes (BR-007: planner-admin+)
// ✓ CAS:RULE-001 — authentication enforced before pattern data accessed
// ✓ CAS:RULE-028 — all admin actions audited per BR-008
// [IMPL-DEFERRED: INT-002] — all pattern operations are stubs (see patterns.service.ts)

// ---------------------------------------------------------------------------
// Validation schemas — patterns resource
// ✓ ASVS:V5.1.1 — all write inputs validated before handler execution
// ---------------------------------------------------------------------------

const PatternParamSchema = z.object({
  patternId: z.string().min(1, 'patternId is required'),
});

// ✓ ASVS:V5.1.3 — pattern fields constrained; free-form strings length-bounded
const CreatePatternBodySchema = z.object({
  name: z.string().min(1, 'name is required').max(200, 'name must not exceed 200 characters'),
  description: z
    .string()
    .min(1, 'description is required')
    .max(2000, 'description must not exceed 2000 characters'),
  // ✓ ASVS:V5.1.4 — conceptTypes constrained to non-empty string array
  conceptTypes: z.array(z.string().min(1)).min(1, 'at least one conceptType is required'),
  adspServices: z.array(z.string().min(1)).min(1, 'at least one adspService is required'),
  isActive: z.boolean().optional().default(true),
});

// PATCH/PUT body: all fields optional for partial update
// ✓ ASVS:V5.1.3 — partial update; each supplied field individually length-bounded
const UpdatePatternBodySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(2000).optional(),
  conceptTypes: z.array(z.string().min(1)).min(1).optional(),
  adspServices: z.array(z.string().min(1)).min(1).optional(),
  isActive: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Router factory
// ---------------------------------------------------------------------------

export interface PatternsRouterOptions {
  logger: Logger;
  /** Optional — enables audit trail on write operations when wired */
  auditService?: AuditService;
}

/**
 * createPatternsRouter — mounts routes for the patterns resource.
 * Expected to be mounted at /patterns in the route registry.
 */
export function createPatternsRouter(options: PatternsRouterOptions): Router {
  const { logger, auditService } = options;

  const signingKey = process.env.AUDIT_SIGNING_KEY || '';

  const patternsService = new PatternsService(logger);
  const patternsController = new PatternsController(
    patternsService,
    logger,
    auditService,
    signingKey,
  );

  const router = Router();

  const auditMw = (action: string) =>
    auditService
      ? createAuditMiddleware(auditService, signingKey, logger, action, 'pattern')
      : (
          _req: import('express').Request,
          _res: import('express').Response,
          next: import('express').NextFunction,
        ) => next();

  // -----------------------------------------------------------------------
  // GET /api/v1/patterns
  // operationId: listPatterns — UC-007
  // Access: planner-user or higher (planner-user, planner-admin, tenant-admin)
  // [IMPL-DEFERRED: INT-002] — returns empty array from ConfigService stub
  // ✓ ASVS:V4.1.1 — tenantId scoped; tenantMiddleware enforces tenant context
  // -----------------------------------------------------------------------
  router.get(
    '/',
    requireAuth,
    tenantMiddleware,
    requirePlannerUser,
    patternsController.listPatterns,
  );

  // -----------------------------------------------------------------------
  // POST /api/v1/patterns
  // operationId: createPattern — UC-007
  // Access: planner-admin or higher
  // [IMPL-DEFERRED: INT-002] — stub throws 503; returns HTTP 503
  // ✓ ASVS:V4.1.2 — requireAdmin enforces planner-admin+ (BR-007)
  // ✓ ASVS:V5.1.1 — body validated against CreatePatternBodySchema
  // ✓ ASVS:V7.2.2 — audit middleware fires post-response (BR-008)
  // -----------------------------------------------------------------------
  router.post(
    '/',
    requireAuth,
    tenantMiddleware,
    requireAdmin,
    validateBody(CreatePatternBodySchema),
    auditMw('CREATE_PATTERN'),
    patternsController.createPattern,
  );

  // -----------------------------------------------------------------------
  // GET /api/v1/patterns/:patternId
  // operationId: getPattern — UC-007
  // Access: planner-user or higher
  // [IMPL-DEFERRED: INT-002] — stub throws 503; returns HTTP 503
  // ✓ ASVS:V4.1.1 — tenantId from JWT; tenant-scoped lookup
  // -----------------------------------------------------------------------
  router.get(
    '/:patternId',
    requireAuth,
    tenantMiddleware,
    requirePlannerUser,
    validateParams(PatternParamSchema),
    patternsController.getPattern,
  );

  // -----------------------------------------------------------------------
  // PUT /api/v1/patterns/:patternId
  // operationId: updatePattern — UC-007
  // Access: planner-admin or higher
  // [IMPL-DEFERRED: INT-002] — stub throws 503; returns HTTP 503
  // ✓ ASVS:V4.1.2 — requireAdmin enforces planner-admin+ (BR-007)
  // ✓ ASVS:V5.1.1 — body validated against UpdatePatternBodySchema
  // ✓ ASVS:V7.2.2 — audit middleware fires post-response (BR-008)
  // -----------------------------------------------------------------------
  router.put(
    '/:patternId',
    requireAuth,
    tenantMiddleware,
    requireAdmin,
    validateParams(PatternParamSchema),
    validateBody(UpdatePatternBodySchema),
    auditMw('UPDATE_PATTERN'),
    patternsController.updatePattern,
  );

  // -----------------------------------------------------------------------
  // PUT /api/v1/patterns/:patternId/deactivate
  // operationId: deactivatePattern — UC-007
  // Access: planner-admin or higher
  // [IMPL-DEFERRED: INT-002] — stub throws 503; returns HTTP 503
  // ✓ ASVS:V4.1.2 — requireAdmin enforces planner-admin+ (BR-007)
  // ✓ ASVS:V7.2.2 — audit middleware fires post-response (BR-008)
  // Note: /:patternId/deactivate (two segments) does not shadow /:patternId (one segment)
  // -----------------------------------------------------------------------
  router.put(
    '/:patternId/deactivate',
    requireAuth,
    tenantMiddleware,
    requireAdmin,
    validateParams(PatternParamSchema),
    auditMw('DEACTIVATE_PATTERN'),
    patternsController.deactivatePattern,
  );

  // -----------------------------------------------------------------------
  // DELETE /api/v1/patterns/:patternId
  // operationId: deletePattern — UC-007
  // Access: planner-admin or higher
  // [IMPL-DEFERRED: INT-002] — stub throws 503; returns HTTP 503
  // ✓ ASVS:V4.1.2 — requireAdmin enforces planner-admin+ (BR-007)
  // ✓ ASVS:V7.2.2 — audit middleware fires post-response (BR-008)
  // -----------------------------------------------------------------------
  router.delete(
    '/:patternId',
    requireAuth,
    tenantMiddleware,
    requireAdmin,
    validateParams(PatternParamSchema),
    auditMw('DELETE_PATTERN'),
    patternsController.deletePattern,
  );

  return router;
}
