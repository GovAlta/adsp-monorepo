import { Router } from 'express';
import { z } from 'zod';
import { Logger } from 'winston';
import { BusinessModelController } from '../controllers/business-model.controller';
import { BusinessModelService } from '../services/business-model.service';
import { requireAuth, requirePlannerUser } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { validateBody, validateParams } from '../middleware/validation.middleware';
import { CONCEPT_TYPES } from '../mongo/schemas/business-model.schema';
import { createAuditMiddleware, AuditService } from '../middleware/audit.middleware';

// ✓ ASVS:V3.5.2 — requireAuth applied to all business-model routes; no public access
// ✓ ASVS:V4.1.1 — tenantMiddleware ensures tenantId present before any handler
// ✓ CAS:RULE-001 — authentication enforced before any Protected B model data accessed
// FAC-S4-026: concept content only in request/response body; not exposed in URL

// ---------------------------------------------------------------------------
// Validation schemas — business-model resource
// ✓ ASVS:V5.1.1 — all write inputs validated before handler execution
// ---------------------------------------------------------------------------

const BusinessModelSessionParamSchema = z.object({
  sessionId: z.string().min(1, 'sessionId is required'),
});

// PATCH body: one of (conceptId update) or (confidenceScore update), plus version
// ✓ ASVS:V5.1.4 — version required for optimistic locking (UC-003)
const UpdateBusinessModelSchema = z
  .object({
    // Required: current model version for optimistic lock
    version: z.number().int().min(1, 'version must be a positive integer'),
    // Concept-level update fields
    conceptId: z.string().min(1).optional(),
    // ✓ CAS:RULE-015 — conceptType must be one of the 15 BR-006 values
    conceptType: z.enum(CONCEPT_TYPES as [string, ...string[]]).optional(),
    name: z
      .string()
      .min(1, 'name must not be empty')
      .max(200, 'name must not exceed 200 characters')
      .optional(),
    description: z.string().optional(),
    // Model-level update
    // ✓ ASVS:V5.1.3 — confidenceScore bounded 0-100 (BR-004)
    confidenceScore: z.number().min(0).max(100).optional(),
  })
  .refine(
    (data) => data.conceptId !== undefined || data.confidenceScore !== undefined,
    { message: 'Provide at least conceptId (concept update) or confidenceScore (model update)' },
  );

// ---------------------------------------------------------------------------
// Router factory
// ---------------------------------------------------------------------------

export interface BusinessModelRouterOptions {
  logger: Logger;
  /** Optional — enables audit trail on PATCH operations when wired */
  auditService?: AuditService;
}

/**
 * createBusinessModelRouter — mounts routes for the business-model resource.
 * Expected to be mounted at /sessions/:sessionId/model in the route registry.
 * Uses { mergeParams: true } so :sessionId is available from parent.
 */
export function createBusinessModelRouter(options: BusinessModelRouterOptions): Router {
  const { logger, auditService } = options;

  const signingKey = process.env.AUDIT_SIGNING_KEY || '';

  const businessModelService = new BusinessModelService(logger);
  const businessModelController = new BusinessModelController(businessModelService, logger);

  // mergeParams: true so :sessionId from parent router is visible
  const router = Router({ mergeParams: true });

  const auditMw = (action: string) =>
    auditService
      ? createAuditMiddleware(auditService, signingKey, logger, action, 'businessModel')
      : (_req: import('express').Request, _res: import('express').Response, next: import('express').NextFunction) => next();

  // -----------------------------------------------------------------------
  // GET /api/v1/sessions/:sessionId/model
  // operationId: getBusinessModel — UC-003
  // Returns BusinessModel with embedded concepts[], conceptRelationships[], confidenceScore.
  // ✓ ASVS:V4.1.1 — tenantId enforced in service layer query
  // ✓ CAS:RULE-015 — model content only returned for authenticated tenant's session
  // -----------------------------------------------------------------------
  router.get(
    '/',
    requireAuth,
    tenantMiddleware,
    requirePlannerUser,
    validateParams(BusinessModelSessionParamSchema),
    businessModelController.getBusinessModel,
  );

  // -----------------------------------------------------------------------
  // PATCH /api/v1/sessions/:sessionId/model
  // operationId: updateBusinessModel — UC-003
  // Updates concept type/name or model-level confidenceScore.
  // Optimistic lock: version must match current model version or 409 returned.
  // ✓ ASVS:V5.1.4 — version-based optimistic locking; conceptType enum enforced
  // ✓ ASVS:V7.2.2 — audit middleware fires after response
  // -----------------------------------------------------------------------
  router.patch(
    '/',
    requireAuth,
    tenantMiddleware,
    requirePlannerUser,
    validateParams(BusinessModelSessionParamSchema),
    validateBody(UpdateBusinessModelSchema),
    auditMw('UPDATE_BUSINESS_MODEL'),
    businessModelController.updateBusinessModel,
  );

  return router;
}
