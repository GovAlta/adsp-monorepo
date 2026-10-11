import { Request, Response, NextFunction } from 'express';
import { Logger } from 'winston';
import { MessagesService } from '../services/messages.service';
import { ILLMService } from '../services/llm.service';
import { LLMRequest } from '../types';

// ✓ ASVS:V1.6.1 — LLM integration stub; fail-closed until INT-001 unblocked (OPEN-001/002/006)
// ✓ CAS:RULE-028 — sensitive conversation content isolated per tenant; never logged
// ✓ ASVS:V4.1.1 — tenantId enforced on all message operations
// FAC-S4-027: ConversationMessage.content MUST NOT appear in any logger call

export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly llmService: ILLMService,
    private readonly logger: Logger,
  ) {}

  /**
   * POST /api/v1/sessions/:sessionId/messages
   * operationId: sendMessage — UC-002
   *
   * Flow:
   *   1. Persist the user's ConversationMessage to MongoDB (always succeeds or throws 404)
   *   2. Call llmService.callLLM() — INT-001 stub ALWAYS throws ServiceUnavailableError
   *   3. Catch the 503 from the stub and return HTTP 503 with RFC 7807 error body
   *      The user's message IS persisted even when the LLM call fails (UC-002 exception flow)
   *
   * BR-003: messagingRateLimit middleware applied at route level (50 req/hour/tenant)
   *
   * ✓ ASVS:V1.6.1 — fail-closed: LLM stub throws; message still saved per UC-002
   * ✓ CAS:RULE-028 — content NOT logged at any step (FAC-S4-027)
   * ✓ ASVS:V4.1.1 — session ownership verified in messagesService.saveMessage
   */
  sendMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, userId } = req.user!;
      const { sessionId } = req.params;
      // ✓ ASVS:V5.1.1 — content already validated by SendMessageSchema middleware (max 10000 chars)
      const { content } = req.body as { content: string; role: string };

      // Step 1: Persist user message (UC-002 — message saved BEFORE LLM call)
      // ✓ CAS:RULE-028 — content stored only; never appears in logger calls
      const userMessage = await this.messagesService.saveMessage(
        tenantId,
        sessionId,
        'user',
        content,
      );

      // ✓ ASVS:V7.2.1 — message persisted logged with ID only; content never logged (FAC-S4-027)
      this.logger.info('User message persisted', {
        sessionId,
        tenantId,
        messageId: userMessage.messageId,
        // ✓ CAS:RULE-028 — content field intentionally omitted from log context
        contentLength: content.length, // length is safe; content is not
      });

      // Step 2: Invoke LLM via INT-001 stub
      // [IMPL-DEFERRED: INT-001] — stub always throws ServiceUnavailableError
      // When INT-001 is live, context messages will be assembled here via getLastMessages()
      // ✓ ASVS:V1.6.1 — fail-closed: no live Anthropic calls until governance approved
      const llmRequest: LLMRequest = {
        messages: [{ role: 'user', content }],
        // Future: systemPrompt, maxTokens, model will be configured via INT-002 Config Service
      };

      try {
        await this.llmService.callLLM(llmRequest);

        // This path is unreachable while INT-001 is stubbed.
        // When INT-001 is live:
        //   - save assistant response as ConversationMessage (role='assistant')
        //   - update BusinessModel from LLM response
        //   - return both user message and assistant message
        // 201 Created — message persisted; spec declares 201 (D-003)
        res.status(201).json(userMessage);
      } catch (_llmErr) {
        // Step 3: INT-001 unavailable — return HTTP 503 RFC 7807
        // The user message is already persisted (UC-002 exception path is intentional)
        // ✓ ASVS:V1.6.1 — stub error surfaced as 503; no sensitive error detail leaked
        res.status(503).json({
          type: 'https://planner.alberta.ca/errors/llm-unavailable',
          title: 'AI Planning Assistance Unavailable',
          status: 503,
          detail:
            'AI planning assistance is currently unavailable pending governance approval ' +
            '(OPEN-001: legal review, OPEN-002: data processing agreement, OPEN-006: privacy sign-off). ' +
            'Your message has been saved. Please try again when the service becomes available.',
          instance: req.path,
          // X-Integration-Stubbed header set at route level
        });
      }
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/sessions/:sessionId/messages
   * operationId: listMessages — UC-006
   *
   * Returns paginated conversation history sorted chronologically (timestamp ASC).
   * Default pageSize is 50 (last 50 messages per UC-006 specification).
   * Maximum pageSize is 100 per BR-011.
   *
   * ✓ ASVS:V4.1.1 — session must belong to tenantId; 404 if not found
   * ✓ CAS:RULE-015 — tenant-scoped query; no cross-tenant message access
   */
  listMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = req.user!;
      const { sessionId } = req.params;

      // UC-006: default to 50 messages (conversation context window)
      // BR-011: maximum 100 per page
      const page = Math.max(1, parseInt((req.query['page'] as string) || '1', 10));
      const pageSize = Math.min(
        100,
        Math.max(1, parseInt((req.query['pageSize'] as string) || '50', 10)),
      );

      const result = await this.messagesService.listMessages(tenantId, sessionId, page, pageSize);

      res.json(result);
    } catch (err) {
      next(err);
    }
  };
}
