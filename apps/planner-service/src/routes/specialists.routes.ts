import { Router } from 'express';
import { z } from 'zod';
import { Logger } from 'winston';
import { SpecialistsController } from '../controllers/specialists.controller';
import { SpecialistsService } from '../services/specialists.service';
import { requireAuth, requirePlannerUser } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { validateBody, validateParams } from '../middleware/validation.middleware';
import { messagingRateLimit } from '../middleware/rate-limit.middleware';
import { createAuditMiddleware, AuditService } from '../middleware/audit.middleware';
import { IEventService } from '../services/event.service';

// ✓ ASVS:V3.5.2 — requireAuth applied to all specialist routes; no public access
// ✓ ASVS:V4.1.1 — tenantMiddleware ensures tenantId present before any handler
// ✓ ASVS:V4.2.1 — messagingRateLimit applied to POST route (BR-003: 50 req/hour per tenant)
// ✓ CAS:RULE-001 — authentication enforced before Protected B specialist data accessed
// ✓ CAS:RULE-028 — specialist delegation tracked per BR-009
// FAC-S4-026: specialist type only in route params; requestPayload only in request body

// ---------------------------------------------------------------------------
// Validation schemas — specialists resource
// ✓ ASVS:V5.1.1 — all write inputs validated before handler execution
// ---------------------------------------------------------------------------

const SpecialistSessionParamSchema = z.object({
  sessionId: z.string().min(1, 'sessionId is required'),
});

const SpecialistRequestParamSchema = z.object({
  sessionId: z.string().min(1, 'sessionId is required'),
  requestId: z.string().min(1, 'requestId is required'),
});

const SpecialistTypeParamSchema = z.object({
  sessionId: z.string().min(1, 'sessionId is required'),
  type: z.string().min(1, 'specialist type is required'),
});

// ✓ ASVS:V5.1.1 — content validated before handler; max 10 000 chars matches schema
const DirectMessageBodySchema = z.object({
  content: z.string().min(1, 'content is required').max(10000, 'content must be 10 000 characters or fewer'),
});

// ✓ ASVS:V5.1.4 — specialistType constrained to known enum values; free-form strings rejected
const ConsultSpecialistBodySchema = z.object({
  specialistType: z.enum(
    ['form-service', 'pdf-service', 'comment-service', 'notification-service'],
    {
      errorMap: () => ({
        message:
          "specialistType must be one of: 'form-service', 'pdf-service', 'comment-service', 'notification-service'",
      }),
    },
  ),
  // ✓ ASVS:V5.1.3 — payload object allowed; individual fields validated by specialist layer
  requestPayload: z.record(z.unknown()).optional().default({}),
});

// ---------------------------------------------------------------------------
// Router factory
// ---------------------------------------------------------------------------

export interface SpecialistsRouterOptions {
  logger: Logger;
  eventService: IEventService;
  /** Optional — enables audit trail for specialist delegation when wired */
  auditService?: AuditService;
}

/**
 * createSpecialistsRouter — mounts routes for the specialists resource.
 * Expected to be mounted at /sessions/:sessionId/specialists in the route registry.
 * Uses { mergeParams: true } so :sessionId is available from parent router.
 */
export function createSpecialistsRouter(options: SpecialistsRouterOptions): Router {
  const { logger, eventService, auditService } = options;

  const signingKey = process.env.AUDIT_SIGNING_KEY || '';

  const specialistsService = new SpecialistsService(logger);
  const specialistsController = new SpecialistsController(
    specialistsService,
    eventService,
    logger,
    auditService,
    signingKey,
  );

  // mergeParams: true so :sessionId from parent router is visible
  const router = Router({ mergeParams: true });

  const auditMw = (action: string) =>
    auditService
      ? createAuditMiddleware(auditService, signingKey, logger, action, 'specialistRequest')
      : (
          _req: import('express').Request,
          _res: import('express').Response,
          next: import('express').NextFunction,
        ) => next();

  // -----------------------------------------------------------------------
  // POST /api/v1/sessions/:sessionId/specialists
  // operationId: consultSpecialist — UC-005
  // BR-009: specialist must be enabled (stub: isEnabled always false → 403)
  // BR-003: rate limited to 50/hour per tenant
  // ✓ ASVS:V4.2.1 — messagingRateLimit applied
  // ✓ ASVS:V5.1.4 — specialistType validated against enum
  // ✓ ASVS:V7.2.2 — audit middleware fires post-response
  // -----------------------------------------------------------------------
  router.post(
    '/',
    requireAuth,
    tenantMiddleware,
    requirePlannerUser,
    messagingRateLimit,
    validateParams(SpecialistSessionParamSchema),
    validateBody(ConsultSpecialistBodySchema),
    auditMw('CONSULT_SPECIALIST'),
    specialistsController.consultSpecialist,
  );

  // -----------------------------------------------------------------------
  // GET /api/v1/sessions/:sessionId/specialists/:requestId
  // operationId: getSpecialistRequest — UC-005
  // Returns SpecialistRequest with linked SpecialistResponse (if present).
  // 404 returned when not found (prevents cross-tenant enumeration).
  // ✓ ASVS:V4.1.1 — three-key lookup (tenantId+sessionId+requestId)
  // -----------------------------------------------------------------------
  router.get(
    '/:requestId',
    requireAuth,
    tenantMiddleware,
    requirePlannerUser,
    validateParams(SpecialistRequestParamSchema),
    specialistsController.getSpecialistRequest,
  );

  // -----------------------------------------------------------------------
  // POST /api/v1/sessions/:sessionId/specialists/:type/messages
  // operationId: sendSpecialistMessage — UC-005 direct chat
  // Persists user message + returns stub assistant reply synchronously.
  // [IMPL-DEFERRED: INT-003..006] — reply is a stub until agents are live.
  // ✓ ASVS:V4.2.1 — messagingRateLimit applied (BR-003: 50 req/hour per tenant)
  // ✓ ASVS:V5.1.1 — content validated by DirectMessageBodySchema
  // -----------------------------------------------------------------------
  router.post(
    '/:type/messages',
    requireAuth,
    tenantMiddleware,
    requirePlannerUser,
    messagingRateLimit,
    validateParams(SpecialistTypeParamSchema),
    validateBody(DirectMessageBodySchema),
    specialistsController.sendDirectMessage,
  );

  // -----------------------------------------------------------------------
  // GET /api/v1/sessions/:sessionId/specialists/:type/messages
  // operationId: getSpecialistMessages — UC-005 direct chat history
  // Returns full message history for the specialist type, oldest-first.
  // ✓ ASVS:V4.1.1 — three-key predicate (tenantId+sessionId+specialistType)
  // -----------------------------------------------------------------------
  router.get(
    '/:type/messages',
    requireAuth,
    tenantMiddleware,
    requirePlannerUser,
    validateParams(SpecialistTypeParamSchema),
    specialistsController.getDirectMessages,
  );

  return router;
}
