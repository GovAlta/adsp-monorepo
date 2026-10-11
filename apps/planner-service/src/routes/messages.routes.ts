import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Logger } from 'winston';
import { MessagesController } from '../controllers/messages.controller';
import { MessagesService } from '../services/messages.service';
import { requireAuth, requirePlannerUser } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { validateBody, validateParams } from '../middleware/validation.middleware';
import { messagingRateLimit } from '../middleware/rate-limit.middleware';
import { ILLMService } from '../services/llm.service';

// ✓ ASVS:V3.5.2 — requireAuth applied to all message routes; no public access
// ✓ ASVS:V4.1.1 — tenantMiddleware ensures tenantId always present
// ✓ CAS:RULE-001 — authentication enforced before message data access
// ✓ ASVS:V1.6.1 — LLM integration stub; fail-closed (INT-001)
// FAC-S4-026: session content only in request/response body; sessionId is a path param (not content)

// ---------------------------------------------------------------------------
// Validation schemas — messages resource
// ✓ ASVS:V5.1.1 — all write inputs validated before handler execution
// ✓ ASVS:V5.1.3 — max 10,000 characters enforced per SYSREQ-024
// ---------------------------------------------------------------------------

export const SendMessageSchema = z.object({
  // SYSREQ-024: server-side max length enforcement
  // ✓ ASVS:V5.1.3 — content length bounded to prevent excessive payload
  content: z
    .string({ required_error: 'Message content is required' })
    .min(1, 'Message content must not be empty')
    .max(10000, 'Message content must not exceed 10,000 characters'),
  // Only 'user' role accepted from API clients; 'assistant'/'system' are server-generated
  // ✓ ASVS:V5.1.4 — role enum enforced; clients cannot inject assistant/system messages
  role: z.enum(['user']).default('user'),
});

const MessageSessionParamSchema = z.object({
  sessionId: z.string().min(1, 'sessionId is required'),
});

// ---------------------------------------------------------------------------
// Inline INT-001 stub header middleware
// Sets X-Integration-Stubbed response header for POST /messages
// [IMPL-DEFERRED: INT-001] — header removed when INT-001 is live
// ---------------------------------------------------------------------------
function setIntegrationStubbedHeader(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  // [IMPL-DEFERRED: INT-001] — signals to API consumers that LLM integration is stubbed
  res.setHeader('X-Integration-Stubbed', 'INT-001');
  next();
}

// ---------------------------------------------------------------------------
// Router factory
// ---------------------------------------------------------------------------

export interface MessagesRouterOptions {
  logger: Logger;
  llmService: ILLMService;
}

/**
 * createMessagesRouter — creates the Express router for /sessions/:sessionId/messages.
 *
 * Mount with mergeParams: true is handled internally so that :sessionId from the
 * parent router (/sessions/:sessionId) is accessible to message handlers.
 *
 * Expected parent mounting:
 *   router.use('/sessions/:sessionId/messages', createMessagesRouter(options));
 *
 * ✓ ASVS:V4.1.1 — sessionId from parent route available via mergeParams
 */
export function createMessagesRouter(options: MessagesRouterOptions): Router {
  const { logger, llmService } = options;

  const messagesService = new MessagesService();
  const messagesController = new MessagesController(messagesService, llmService, logger);

  // mergeParams: true — required to access :sessionId from the parent session route
  const router = Router({ mergeParams: true });

  // -----------------------------------------------------------------------
  // POST /api/v1/sessions/:sessionId/messages — send a user message
  // operationId: sendMessage — UC-002
  //
  // Middleware order:
  //   1. requireAuth — JWT validation (ASVS V3.5.2)
  //   2. tenantMiddleware — extract tenantId (CAS:RULE-015)
  //   3. requirePlannerUser — role gate (ASVS V4.1.1)
  //   4. validateParams — sessionId format check
  //   5. messagingRateLimit — BR-003: 50 req/hour/tenant (ASVS V4.2.1)
  //   6. validateBody — SYSREQ-024 content length enforcement
  //   7. setIntegrationStubbedHeader — [IMPL-DEFERRED: INT-001] header
  //   8. sendMessage handler
  //
  // ✓ ASVS:V4.2.1 — rate limiting on AI-assisted endpoint
  // ✓ CAS:RULE-013 — BR-003 tenant-level rate limit enforced
  // ✓ ASVS:V1.6.1 — fail-closed LLM stub; user message persisted even on 503
  // -----------------------------------------------------------------------
  router.post(
    '/',
    requireAuth,
    tenantMiddleware,
    requirePlannerUser,
    validateParams(MessageSessionParamSchema),
    // ✓ ASVS:V4.2.1 — rate limiting: BR-003 50 LLM requests per hour per tenant
    // ✓ CAS:RULE-013 — tenant-level rate limit prevents excessive LLM costs
    messagingRateLimit,
    validateBody(SendMessageSchema),
    setIntegrationStubbedHeader,
    messagesController.sendMessage,
  );

  // -----------------------------------------------------------------------
  // GET /api/v1/sessions/:sessionId/messages — list conversation history
  // operationId: listMessages — UC-006
  //
  // Returns paginated messages sorted chronologically (timestamp ASC).
  // Default pageSize=50 (last 50 messages per UC-006); max 100 (BR-011).
  //
  // ✓ ASVS:V4.1.1 — session must belong to tenantId; 404 if not found
  // ✓ CAS:RULE-015 — tenant-scoped query
  // -----------------------------------------------------------------------
  router.get(
    '/',
    requireAuth,
    tenantMiddleware,
    requirePlannerUser,
    validateParams(MessageSessionParamSchema),
    messagesController.listMessages,
  );

  return router;
}
