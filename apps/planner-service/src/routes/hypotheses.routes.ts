import { Router } from 'express';
import { z } from 'zod';
import { Logger } from 'winston';
import { HypothesesController } from '../controllers/hypotheses.controller';
import { HypothesesService } from '../services/hypotheses.service';
import { requireAuth, requirePlannerUser } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { validateBody, validateParams } from '../middleware/validation.middleware';
import { createAuditMiddleware, AuditService } from '../middleware/audit.middleware';
import { IEventService } from '../services/event.service';

// ✓ ASVS:V3.5.2 — requireAuth applied to all hypotheses routes; no public access
// ✓ ASVS:V4.1.1 — tenantMiddleware ensures tenantId present before any handler
// ✓ CAS:RULE-001 — authentication enforced before Protected B hypothesis data accessed
// ✓ CAS:RULE-017 — status transitions validated via service layer (BR-010)
// FAC-S4-026: hypothesis content only in response body; not in URL

// ---------------------------------------------------------------------------
// Validation schemas — hypotheses resource
// ✓ ASVS:V5.1.1 — all write inputs validated before handler execution
// ---------------------------------------------------------------------------

const HypothesisSessionParamSchema = z.object({
  sessionId: z.string().min(1, 'sessionId is required'),
});

const HypothesisParamSchema = z.object({
  sessionId: z.string().min(1, 'sessionId is required'),
  hypothesisId: z.string().min(1, 'hypothesisId is required'),
});

// PATCH body: only status field accepted; transitions validated in service
// ✓ ASVS:V5.1.4 — status constrained to enum; free-form strings rejected
const UpdateHypothesisStatusSchema = z.object({
  status: z.enum(['draft', 'proposed', 'accepted', 'rejected', 'superseded'], {
    errorMap: () => ({
      message:
        "status must be one of: 'draft', 'proposed', 'accepted', 'rejected', 'superseded'",
    }),
  }),
});

// ---------------------------------------------------------------------------
// Router factory
// ---------------------------------------------------------------------------

export interface HypothesesRouterOptions {
  logger: Logger;
  eventService: IEventService;
  /** Optional — enables audit trail on accept/reject transitions when wired */
  auditService?: AuditService;
}

/**
 * createHypothesesRouter — mounts routes for the hypotheses resource.
 * Expected to be mounted at /sessions/:sessionId/hypotheses in the route registry.
 * Uses { mergeParams: true } so :sessionId is available from parent router.
 */
export function createHypothesesRouter(options: HypothesesRouterOptions): Router {
  const { logger, eventService, auditService } = options;

  const signingKey = process.env.AUDIT_SIGNING_KEY || '';

  const hypothesesService = new HypothesesService(logger);
  const hypothesesController = new HypothesesController(
    hypothesesService,
    eventService,
    logger,
    auditService,
    signingKey,
  );

  // mergeParams: true so :sessionId from parent router is visible
  const router = Router({ mergeParams: true });

  const auditMw = (action: string) =>
    auditService
      ? createAuditMiddleware(auditService, signingKey, logger, action, 'hypothesis')
      : (_req: import('express').Request, _res: import('express').Response, next: import('express').NextFunction) => next();

  // -----------------------------------------------------------------------
  // GET /api/v1/sessions/:sessionId/hypotheses
  // operationId: listHypotheses — UC-004
  // Returns all hypotheses for the session, newest first.
  // ✓ ASVS:V4.1.1 — tenantId enforced in service layer; no cross-tenant records
  // -----------------------------------------------------------------------
  router.get(
    '/',
    requireAuth,
    tenantMiddleware,
    requirePlannerUser,
    validateParams(HypothesisSessionParamSchema),
    hypothesesController.listHypotheses,
  );

  // -----------------------------------------------------------------------
  // GET /api/v1/sessions/:sessionId/hypotheses/:hypothesisId
  // operationId: getHypothesis — UC-004
  // Returns full hypothesis including reasoning and adspServices (serviceComposition).
  // 404 returned when not found (prevents cross-tenant enumeration).
  // ✓ ASVS:V4.1.1 — three-key lookup (tenantId+sessionId+hypothesisId)
  // -----------------------------------------------------------------------
  router.get(
    '/:hypothesisId',
    requireAuth,
    tenantMiddleware,
    requirePlannerUser,
    validateParams(HypothesisParamSchema),
    hypothesesController.getHypothesis,
  );

  // -----------------------------------------------------------------------
  // PATCH /api/v1/sessions/:sessionId/hypotheses/:hypothesisId
  // operationId: updateHypothesisStatus — UC-004
  // Transitions hypothesis status; enforces BR-010 state machine.
  // Returns 422 for invalid transitions, 409 for supersede on accepted hypothesis.
  // ✓ ASVS:V5.1.4 — status validated against enum; transitions validated in service
  // ✓ ASVS:V7.2.2 — audit middleware fires on accept/reject
  // ✓ CAS:RULE-017 — BR-010 state machine enforced
  // -----------------------------------------------------------------------
  router.patch(
    '/:hypothesisId',
    requireAuth,
    tenantMiddleware,
    requirePlannerUser,
    validateParams(HypothesisParamSchema),
    validateBody(UpdateHypothesisStatusSchema),
    auditMw('UPDATE_HYPOTHESIS_STATUS'),
    hypothesesController.updateHypothesisStatus,
  );

  return router;
}
