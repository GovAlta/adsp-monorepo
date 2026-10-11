import { Router } from 'express';
import { z } from 'zod';
import { Logger } from 'winston';
import { SessionsController } from '../controllers/sessions.controller';
import { SessionsService } from '../services/sessions.service';
import { requireAuth, requirePlannerUser } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import {
  validateBody,
  validateQuery,
  validateParams,
  PaginationSchema,
} from '../middleware/validation.middleware';
import { createAuditMiddleware, AuditService } from '../middleware/audit.middleware';
import { IEventService } from '../services/event.service';

// ✓ ASVS:V3.5.2 — requireAuth applied to all session routes; no public access
// ✓ ASVS:V4.1.1 — tenantMiddleware ensures tenantId always present before any handler
// ✓ CAS:RULE-001 — authentication enforced before session data access
// FAC-S4-026: session title/description only in request body; not exposed in URL

// ---------------------------------------------------------------------------
// Validation schemas — session resource
// ✓ ASVS:V5.1.1 — all write inputs validated before handler execution
// ✓ ASVS:V5.1.3 — field-length constraints enforced (title: 200, description: 2000)
// ---------------------------------------------------------------------------

export const CreateSessionSchema = z.object({
  title: z
    .string({ required_error: 'title is required' })
    .min(1, 'title must not be empty')
    .max(200, 'title must not exceed 200 characters'),
  description: z
    .string()
    .max(2000, 'description must not exceed 2000 characters')
    .optional(),
});

export const UpdateSessionSchema = z
  .object({
    // Only client-controllable transitions: active→paused / paused→active / any→completed
    // 'archived' is only reachable via DELETE endpoint; not allowed through PATCH
    status: z.enum(['active', 'paused', 'completed']).optional(),
    title: z
      .string()
      .min(1, 'title must not be empty')
      .max(200, 'title must not exceed 200 characters')
      .optional(),
  })
  .refine((data) => data.status !== undefined || data.title !== undefined, {
    message: 'At least one of status or title must be provided',
  });

const SessionParamSchema = z.object({
  sessionId: z.string().min(1, 'sessionId is required'),
});

// ---------------------------------------------------------------------------
// Router factory
// ---------------------------------------------------------------------------

export interface SessionsRouterOptions {
  logger: Logger;
  eventService: IEventService;
  /** Optional — when provided, mutation routes attach audit middleware (SYSREQ-020).
   *  Will be wired to the concrete AuditService once audit.service.ts is generated. */
  auditService?: AuditService;
}

export function createSessionsRouter(options: SessionsRouterOptions): Router {
  const { logger, eventService, auditService } = options;

  // ✓ ASVS:V14.4.1 — AUDIT_SIGNING_KEY from environment; never hardcoded (FAC-S4-028)
  const signingKey = process.env.AUDIT_SIGNING_KEY || '';

  const sessionsService = new SessionsService(eventService, logger);
  const sessionsController = new SessionsController(sessionsService, logger);

  const router = Router();

  // Helper — conditionally applies audit middleware when auditService is available
  // Allows the route to compile and run before the concrete audit service is wired up.
  const auditMw = (action: string) =>
    auditService
      ? createAuditMiddleware(auditService, signingKey, logger, action, 'session')
      : (_req: import('express').Request, _res: import('express').Response, next: import('express').NextFunction) => next();

  // -----------------------------------------------------------------------
  // POST /api/v1/sessions — create a new planning session
  // operationId: createSession — UC-001
  // ✓ ASVS:V5.1.1 — body validated with CreateSessionSchema before handler
  // ✓ ASVS:V7.2.2 — audit middleware fires after successful response
  // -----------------------------------------------------------------------
  router.post(
    '/',
    requireAuth,
    tenantMiddleware,
    requirePlannerUser,
    validateBody(CreateSessionSchema),
    auditMw('CREATE_SESSION'),
    sessionsController.createSession,
  );

  // -----------------------------------------------------------------------
  // GET /api/v1/sessions — list sessions
  // operationId: listSessions — UC-006 / UC-010
  // BR-011: pageSize max 100, default 20; enforced by PaginationSchema
  // ✓ ASVS:V5.1.3 — pagination params validated and bounded
  // -----------------------------------------------------------------------
  router.get(
    '/',
    requireAuth,
    tenantMiddleware,
    requirePlannerUser,
    validateQuery(PaginationSchema),
    sessionsController.listSessions,
  );

  // -----------------------------------------------------------------------
  // GET /api/v1/sessions/:sessionId — retrieve a single session
  // operationId: getSession — UC-006
  // ✓ ASVS:V4.1.1 — ownership check in controller; 404 prevents enumeration
  // -----------------------------------------------------------------------
  router.get(
    '/:sessionId',
    requireAuth,
    tenantMiddleware,
    requirePlannerUser,
    validateParams(SessionParamSchema),
    sessionsController.getSession,
  );

  // -----------------------------------------------------------------------
  // PATCH /api/v1/sessions/:sessionId — update session status or title
  // operationId: updateSession — UC-006
  // ✓ ASVS:V5.1.4 — status transitions validated in service (BR-010)
  // ✓ ASVS:V7.2.2 — audit middleware fires after response
  // -----------------------------------------------------------------------
  router.patch(
    '/:sessionId',
    requireAuth,
    tenantMiddleware,
    requirePlannerUser,
    validateParams(SessionParamSchema),
    validateBody(UpdateSessionSchema),
    auditMw('UPDATE_SESSION'),
    sessionsController.updateSession,
  );

  // -----------------------------------------------------------------------
  // DELETE /api/v1/sessions/:sessionId — soft-archive (SYSREQ-022)
  // operationId: archiveSession
  // Hard deletion is deferred to scheduled retention job; this sets status='archived'.
  // ✓ ASVS:V4.1.1 — planner-user restricted to own sessions; admin unrestricted in tenant
  // ✓ ASVS:V7.2.2 — audit middleware fires after archive
  // -----------------------------------------------------------------------
  router.delete(
    '/:sessionId',
    requireAuth,
    tenantMiddleware,
    requirePlannerUser,
    validateParams(SessionParamSchema),
    auditMw('ARCHIVE_SESSION'),
    sessionsController.archiveSession,
  );

  return router;
}
