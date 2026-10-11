import { Router } from 'express';
import { Logger } from 'winston';
import { IEventService } from '../services/event.service';
import { ILLMService } from '../services/llm.service';
import { AuditService } from '../middleware/audit.middleware';
import { createSessionsRouter } from './sessions.routes';
import { createMessagesRouter } from './messages.routes';
import { createBusinessModelRouter } from './business-model.routes';
import { createHypothesesRouter } from './hypotheses.routes';
import { createSpecialistsRouter } from './specialists.routes';
import { createPatternsRouter } from './patterns.routes';
import { createExportsRouter } from './exports.routes';
import { createAuditRouter } from './audit.routes';
import { createHealthRouter } from './health.routes';
import { createMetricsRouter } from './metrics.routes';
import { createUserManagementRouter } from './user-management.router';

// Route registry — Phase C resource routes registered here as each batch is generated.
// ✓ ASVS:V4.1.3 — all routes registered through this central registry;
//   no routes added outside this module

export interface RouteRegistryOptions {
  logger: Logger;
  eventService: IEventService;
  llmService: ILLMService;
  /**
   * Required for exports and audit routes (Phase C batch 4).
   * Also used for session/hypotheses/specialist/pattern route audit middleware.
   * Optional type retained for backward compat during incremental batch rollout.
   */
  auditService?: AuditService;
}

// FAC-S4-014 — user-management tag wired via /users/me route

/**
 * createRouter — assembles and returns the main API router.
 * Mounts all resource routes under /api/v1 (business resources) and
 * at the root level (infrastructure probes: /health, /metrics).
 *
 * Phase C batch 1: sessions + messages routes mounted.
 * Phase C batch 2: business-model + hypotheses routes mounted.
 * Phase C batch 3: specialists + patterns routes mounted.
 * Phase C batch 4: exports + audit routes mounted.
 * Phase C batch 5 (FINAL): health + metrics routes mounted.
 *
 * All 10 resource routers are now registered:
 *   1. /sessions          — session lifecycle (batch 1)
 *   2. /sessions/:sessionId/messages — messages (batch 1)
 *   3. /sessions/:sessionId/model    — business model (batch 2)
 *   4. /sessions/:sessionId/hypotheses — hypotheses (batch 2)
 *   5. /sessions/:sessionId/specialists — specialists (batch 3)
 *   6. /patterns          — business patterns (batch 3)
 *   7. /sessions/:sessionId/exports  — exports (batch 4)
 *   8. /audit             — audit log (batch 4)
 *   9. /health            — health probe (batch 5)
 *  10. /metrics           — metrics probe (batch 5)
 */
export function createRouter(options: RouteRegistryOptions): Router {
  const { logger, eventService, llmService, auditService } = options;
  const router = Router();
  // ✓ ASVS:V4.1.3 — all 10 resource routers registered through this central factory

  // ✓ ASVS:V4.1.1 — router serves as the authoritative route registry

  // -----------------------------------------------------------------------
  // Phase C Batch 1 — sessions + messages
  // -----------------------------------------------------------------------

  // Session lifecycle routes
  router.use(
    '/sessions',
    createSessionsRouter({ logger, eventService, auditService }),
  );

  // Message routes (nested under /sessions/:sessionId/messages)
  // mergeParams on the messages router handles :sessionId from parent
  router.use(
    '/sessions/:sessionId/messages',
    createMessagesRouter({ logger, llmService }),
  );

  // -----------------------------------------------------------------------
  // Phase C Batch 2 — business-model + hypotheses
  // -----------------------------------------------------------------------

  // Business model routes (nested under /sessions/:sessionId/model)
  // mergeParams on the business-model router handles :sessionId from parent
  router.use(
    '/sessions/:sessionId/model',
    createBusinessModelRouter({ logger, auditService }),
  );

  // Hypotheses routes (nested under /sessions/:sessionId/hypotheses)
  // mergeParams on the hypotheses router handles :sessionId from parent
  router.use(
    '/sessions/:sessionId/hypotheses',
    createHypothesesRouter({ logger, eventService, auditService }),
  );

  // -----------------------------------------------------------------------
  // Phase C Batch 3 — specialists + patterns
  // -----------------------------------------------------------------------

  // Specialist delegation routes (nested under /sessions/:sessionId/specialists)
  // mergeParams on the specialists router handles :sessionId from parent
  // [IMPL-DEFERRED: INT-002..006] — specialist routes are stubs (403/503 responses)
  router.use(
    '/sessions/:sessionId/specialists',
    createSpecialistsRouter({ logger, eventService, auditService }),
  );

  // Business pattern routes at /patterns
  // [IMPL-DEFERRED: INT-002] — pattern routes are stubs (empty list / 503)
  router.use(
    '/patterns',
    createPatternsRouter({ logger, auditService }),
  );

  // -----------------------------------------------------------------------
  // Phase C Batch 4 — exports + audit
  // -----------------------------------------------------------------------

  // Export routes (nested under /sessions/:sessionId/exports)
  // mergeParams on the exports router handles :sessionId from parent
  // ✓ ASVS:V4.1.2 — requirePlannerUser applied at route; export_data gated to owner or admin
  // Requires auditService; if absent at startup, export + audit routes are unavailable.
  if (auditService) {
    router.use(
      '/sessions/:sessionId/exports',
      createExportsRouter({ logger, auditService }),
    );

    // Audit log routes at /audit
    // ✓ ASVS:V4.1.2 — requireAdmin enforced on all audit routes (FAC-S4-030)
    // ✓ CAS:RULE-028 — accessing the audit log is itself audited
    router.use(
      '/audit',
      createAuditRouter({ logger, auditService }),
    );
  }

  // -----------------------------------------------------------------------
  // FAC-S4-014 — user-management: GET /users/me (authenticated)
  // -----------------------------------------------------------------------

  // User management route at /users
  // ✓ ASVS:V4.1.1 — only authenticated user's own context returned
  // ✓ ASVS:V3.5.1 — user context sourced from validated JWT claims
  router.use('/users', createUserManagementRouter({ logger }));

  // -----------------------------------------------------------------------
  // Phase C Batch 5 — health + metrics (infrastructure probes, no auth)
  // -----------------------------------------------------------------------

  // Health probe at /health (no /api/v1 prefix — ADSP platform convention)
  // ✓ ASVS:V1.6.1 — no Protected B data in health response
  router.use('/health', createHealthRouter({ logger }));

  // Prometheus metrics at /metrics (no /api/v1 prefix — Prometheus scrape convention)
  // ✓ ASVS:V1.6.1 — no Protected B data in metrics response
  // [IMPL-DEFERRED: SYSREQ-023] — stub prom-client; replace with full implementation
  router.use('/metrics', createMetricsRouter({ logger }));

  // -----------------------------------------------------------------------
  // API root — no auth required; returns service discovery links
  // -----------------------------------------------------------------------
  router.get('/', (_req, res) => {
    res.json({
      service: 'planner-service',
      version: '1.0.0',
      apiVersion: 'v1',
      description: 'GoA AI-assisted business planning service',
      _links: {
        self: { href: '/api/v1' },
        health: { href: '/health' },
        metrics: { href: '/metrics' },
        docs: { href: '/swagger/docs/v1' },
      },
    });
  });

  return router;
}
