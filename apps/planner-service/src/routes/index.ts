import { Router } from 'express';
import { Logger } from 'winston';
import { IEventService } from '../services/event.service';
import { ILLMService } from '../services/llm.service';
import { AuditService } from '../middleware/audit.middleware';
import { requireAuth } from '../middleware/auth.middleware';
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

// Static catalogue of available ADSP specialist types.
// Returned by GET /specialists/types — used by the UI to populate the specialist panel.
// Adding a new ADSP service here automatically surfaces it in the UI.
const SPECIALIST_TYPES_CATALOGUE = [
  { id: 'configuration-service', label: 'Configuration service', description: 'Tenant-scoped configuration such as workflow definitions and status values.', suggestions: [] },
  { id: 'file-service',          label: 'File service',          description: 'Secure file upload, storage, and retrieval with file types and role-based access.', suggestions: [] },
  { id: 'form-service',          label: 'Form service',          description: 'Form definitions, drafts, submissions, and review dispositions.', suggestions: [] },
  { id: 'value-service',         label: 'Value service',         description: 'Store and query business values and metrics over time.', suggestions: [] },
  { id: 'event-service',         label: 'Event service',         description: 'Domain events, event log, and audit trail.', suggestions: [] },
  { id: 'notification-service',  label: 'Notification service',  description: 'Templated notifications to subscribers across email, SMS and bot channels.', suggestions: [] },
  { id: 'comment-service',       label: 'Comment service',       description: 'Topics and comments for notes and discussion.', suggestions: [] },
  { id: 'task-service',          label: 'Task service',          description: 'Task queues and assignment of work to staff.', suggestions: [] },
  { id: 'calendar-service',      label: 'Calendar service',      description: 'Calendars and scheduled events.', suggestions: [] },
  { id: 'pdf-service',           label: 'PDF service',           description: 'Template-driven PDF generation.', suggestions: [] },
  { id: 'status-service',        label: 'Status service',        description: 'Application status and public notices.', suggestions: [] },
  { id: 'feedback-service',      label: 'Feedback service',      description: 'Collect user feedback on applications.', suggestions: [] },
  { id: 'push-service',          label: 'Push service',          description: 'WebSocket gateway for real-time event streams.', suggestions: [] },
];

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

  // GET /specialists/types — static catalogue of available ADSP specialist types.
  // Requires auth (Protected B service); no session or tenant scope needed.
  // ✓ ASVS:V3.5.2 — requireAuth applied; no public access to platform metadata
  router.get('/specialists/types', requireAuth, (_req, res) => {
    res.json(SPECIALIST_TYPES_CATALOGUE);
  });

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
