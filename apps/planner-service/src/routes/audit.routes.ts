import { Router } from 'express';
import { z } from 'zod';
import { Logger } from 'winston';
import rateLimit from 'express-rate-limit';
import { AuditController } from '../controllers/audit.controller';
import { AuditEventService } from '../services/audit.service';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { validateParams } from '../middleware/validation.middleware';
import { createAuditMiddleware, AuditService } from '../middleware/audit.middleware';

// ✓ ASVS:V4.2.2 — rate-limit audit routes to prevent log enumeration / DoS
const auditRateLimit = rateLimit({
  windowMs: 60_000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { statusCode: 429, error: 'Too Many Requests', message: 'Audit log rate limit exceeded' },
});

// ✓ ASVS:V3.5.2 — requireAuth applied to all audit routes; no public access
// ✓ ASVS:V4.1.2 — requireAdmin enforced on ALL audit routes (FAC-S4-030)
// ✓ CAS:RULE-001 — authentication enforced before audit log access
// ✓ CAS:RULE-028 — accessing the audit log is itself audited (via createAuditMiddleware)

// ---------------------------------------------------------------------------
// Validation schemas — audit resource
// ✓ ASVS:V5.1.1 — URL params validated before handler execution
// ---------------------------------------------------------------------------

const EventIdParamSchema = z.object({
  eventId: z.string().min(1, 'eventId is required'),
});

// ---------------------------------------------------------------------------
// Router factory
// ---------------------------------------------------------------------------

export interface AuditRouterOptions {
  logger: Logger;
  /**
   * Required — accessing the audit log generates its own audit event (BR-008 / CAS:RULE-028).
   * The same AuditService that writes events is used here to audit read access.
   */
  auditService: AuditService;
}

/**
 * createAuditRouter — mounts audit routes at /audit.
 *
 * ALL routes require planner-admin or tenant-admin (requireAdmin middleware).
 * Accessing the audit log is itself audited per BR-008 / CAS:RULE-028.
 *
 * Routes:
 *   GET /                  — listAuditEvents (paginated, filterable)
 *   GET /verify            — verifyAuditChain (BR-009 integrity check)
 *   GET /:eventId          — getAuditEvent (single event with HMAC)
 *
 * NOTE: /verify must be registered BEFORE /:eventId to prevent 'verify' being
 * matched as an eventId value.
 */
export function createAuditRouter(options: AuditRouterOptions): Router {
  const { logger, auditService } = options;

  // ✓ ASVS:V14.4.1 — AUDIT_SIGNING_KEY from environment; never hardcoded (FAC-S4-028)
  const signingKey = process.env.AUDIT_SIGNING_KEY || '';

  const auditEventService = new AuditEventService(signingKey, logger);
  const auditController = new AuditController(auditEventService, logger);

  const router = Router();
  router.use(auditRateLimit);

  // -----------------------------------------------------------------------
  // GET /api/v1/audit — list audit events (paginated, filterable)
  // operationId: listAuditEvents — UC-010 / SYSREQ-020
  // ✓ ASVS:V4.1.2 — requireAdmin enforced (FAC-S4-030)
  // ✓ CAS:RULE-028 — list access audited via middleware
  // -----------------------------------------------------------------------
  router.get(
    '/',
    requireAuth,
    tenantMiddleware,
    requireAdmin,
    // ✓ CAS:RULE-028 — accessing audit log is itself audited per BR-008
    createAuditMiddleware(auditService, signingKey, logger, 'LIST_AUDIT_EVENTS', 'audit_log'),
    auditController.listAuditEvents,
  );

  // -----------------------------------------------------------------------
  // GET /api/v1/audit/verify — HMAC chain integrity verification (BR-009)
  // operationId: verifyAuditChain
  // IMPORTANT: registered before /:eventId to prevent path collision
  // ✓ ASVS:V7.3.2 — chain verification endpoint
  // ✓ ASVS:V4.1.2 — requireAdmin enforced
  // -----------------------------------------------------------------------
  router.get(
    '/verify',
    requireAuth,
    tenantMiddleware,
    requireAdmin,
    // ✓ CAS:RULE-028 — chain verification access is itself audited
    createAuditMiddleware(auditService, signingKey, logger, 'VERIFY_AUDIT_CHAIN', 'audit_log'),
    auditController.verifyAuditChain,
  );

  // -----------------------------------------------------------------------
  // GET /api/v1/audit/:eventId — retrieve single audit event with HMAC
  // operationId: getAuditEvent — UC-010
  // ✓ ASVS:V4.1.2 — requireAdmin enforced
  // ✓ CAS:RULE-028 — single event retrieval is audited
  // -----------------------------------------------------------------------
  router.get(
    '/:eventId',
    requireAuth,
    tenantMiddleware,
    requireAdmin,
    validateParams(EventIdParamSchema),
    // ✓ CAS:RULE-028 — audit event read is itself audited per BR-008
    createAuditMiddleware(auditService, signingKey, logger, 'GET_AUDIT_EVENT', 'audit_event'),
    auditController.getAuditEvent,
  );

  return router;
}
