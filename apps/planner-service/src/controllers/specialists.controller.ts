import { Request, Response, NextFunction } from 'express';
import { Logger } from 'winston';
import { SpecialistsService, VALID_SPECIALIST_TYPES } from '../services/specialists.service';
import { AuditService, buildAuditChainHash } from '../middleware/audit.middleware';
import { NotFoundError, SpecialistType, DomainEventType } from '../types';
import { IEventService, DomainEventPayload } from '../services/event.service';

// ✓ ASVS:V1.6.1 — specialist agent stubs INT-003..006 are fail-closed
// ✓ CAS:RULE-028 — specialist delegation tracked in specialist_request entity
// ✓ ASVS:V4.1.3 — specialistType validated server-side against enum before processing
// ✓ ASVS:V4.1.1 — tenantId enforced on all specialist queries via service layer
// FAC-S4-026: specialist requestPayload is Protected B; not in log messages

/**
 * SpecialistsController — exposes two operations on specialist delegation:
 *   POST /api/v1/sessions/:sessionId/specialists    — consultSpecialist (UC-005)
 *   GET  /api/v1/sessions/:sessionId/specialists/:requestId — getSpecialistRequest (UC-005)
 *
 * UC-005: Consult Specialist Agent
 * BR-009: specialist must be enabled in SpecialistAgentConfig
 * INT-002: ADSP Configuration Service (stub — isEnabled always false → HTTP 403)
 * INT-003..006: specialist agents (stub — fail-closed)
 */
export class SpecialistsController {
  constructor(
    private readonly specialistsService: SpecialistsService,
    private readonly eventService: IEventService,
    private readonly logger: Logger,
    private readonly auditService?: AuditService,
    private readonly auditSigningKey: string = '',
  ) {}

  /**
   * POST /api/v1/sessions/:sessionId/specialists
   * operationId: consultSpecialist — UC-005
   *
   * Delegates a task to a specialist agent.
   * BR-009: specialist must be enabled in SpecialistAgentConfig.
   * Current stub behavior: isEnabled always false → HTTP 403.
   *
   * ✓ ASVS:V1.6.1 — specialist agent stubs INT-003..006 are fail-closed
   * ✓ CAS:RULE-028 — specialist delegation tracked in specialist_request entity
   * ✓ ASVS:V5.1.4 — specialistType validated against enum before processing
   * ✓ ASVS:V4.2.1 — messagingRateLimit applied at route layer (BR-003)
   */
  consultSpecialist = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // ✓ ASVS:V4.1.1 — identity from JWT; not from client input
      const { tenantId, userId } = req.user!;
      const { sessionId } = req.params;
      const { specialistType, requestPayload } = req.body as {
        specialistType: SpecialistType;
        requestPayload: Record<string, unknown>;
      };

      // ✓ ASVS:V5.1.4 — specialistType validated against enum; rejects unknown types
      if (!VALID_SPECIALIST_TYPES.includes(specialistType)) {
        res.status(400).json({
          type: 'https://planner.alberta.ca/errors/invalid-specialist-type',
          title: 'Invalid Specialist Type',
          status: 400,
          detail: `specialistType must be one of: ${VALID_SPECIALIST_TYPES.join(', ')}`,
          instance: req.path,
        });
        return;
      }

      // BR-009 availability check + delegate
      // [IMPL-DEFERRED: INT-002] — isEnabled stub returns false → ForbiddenError → 403
      // ✓ CAS:RULE-028 — requestPayload contains Protected B context; not logged
      const result = await this.specialistsService.consultSpecialist({
        tenantId,
        sessionId,
        specialistType,
        requestPayload: requestPayload ?? {},
        userId,
      });

      // ✓ ASVS:V7.2.1 — logged with IDs only; no Protected B content
      this.logger.info('Specialist consulted', {
        requestId: result.requestId,
        sessionId,
        tenantId,
        specialistType,
        status: result.status,
      });

      // Publish specialist-delegated domain event (INT-007 stub)
      // ✓ ASVS:V7.2.2 — domain event published for specialist delegation
      const eventPayload: DomainEventPayload = {
        eventType: DomainEventType.SPECIALIST_DELEGATED,
        sessionId,
        tenantId,
        userId,
        timestamp: new Date().toISOString(),
        // ✓ CAS:RULE-028 — data contains only non-sensitive identifiers; no Protected B content
        data: {
          requestId: result.requestId,
          specialistType,
          status: result.status,
        },
      };
      // Fire-and-forget; INT-007 is a stub; failure must not affect response
      this.eventService.publishEvent(eventPayload).catch((eventErr: unknown) => {
        this.logger.warn('Failed to publish specialist-delegated event', {
          requestId: result.requestId,
          sessionId,
          error: eventErr instanceof Error ? eventErr.message : String(eventErr),
        });
      });

      // BR-008: audit trail for specialist delegation
      // ✓ CAS:RULE-028 — audit payload contains IDs and outcome; no Protected B content
      if (this.auditService) {
        try {
          const chainAnchorHash = await this.auditService.getLastChainHash(tenantId);
          const auditEntry = {
            actorId: userId,
            tenantId,
            action: 'CONSULT_SPECIALIST',
            resourceType: 'specialistRequest',
            resourceId: result.requestId,
            outcome: 'success' as const,
            timestamp: new Date().toISOString(),
          };
          // ✓ ASVS:V7.2.2 — HMAC chain entry created for tamper-evident audit trail
          buildAuditChainHash(auditEntry, chainAnchorHash, this.auditSigningKey);
          await this.auditService.createEvent(auditEntry);
        } catch (auditErr) {
          // Audit failure must not affect response
          // ✓ ASVS:V7.1.2 — audit errors logged server-side; never surfaced to client
          this.logger.error('Failed to write specialist audit event', {
            sessionId,
            error: auditErr instanceof Error ? auditErr.message : String(auditErr),
          });
        }
      }

      // X-Integration-Stubbed: INT-003..006 (specialist agent stubs)
      res.setHeader('X-Integration-Stubbed', 'INT-003,INT-004,INT-005,INT-006');
      res.status(202).json(result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/sessions/:sessionId/specialists/:requestId
   * operationId: getSpecialistRequest — UC-005
   *
   * Returns a SpecialistRequest with its linked SpecialistResponse (if exists).
   * Multi-tenant: sessionId must belong to the authenticated tenant.
   *
   * ✓ ASVS:V4.1.1 — tenantId + sessionId + requestId enforced; 404 prevents cross-tenant enumeration
   */
  getSpecialistRequest = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      // ✓ ASVS:V4.1.1 — identity from JWT; not from client input
      const { tenantId } = req.user!;
      const { sessionId, requestId } = req.params;

      const request = await this.specialistsService.getSpecialistRequest(
        tenantId,
        sessionId,
        requestId,
      );

      if (!request) {
        return next(new NotFoundError('SpecialistRequest', requestId));
      }

      // ✓ ASVS:V7.2.1 — access logged with IDs only
      this.logger.info('SpecialistRequest retrieved', {
        requestId,
        sessionId,
        tenantId,
        status: request.status,
      });

      res.json(request);
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/sessions/:sessionId/specialists/:type/messages
   * operationId: sendSpecialistMessage — UC-005 direct chat
   *
   * Persists the user message and returns a stub assistant reply synchronously.
   * [IMPL-DEFERRED: INT-003..006] — assistant reply is a static stub until live agents are enabled.
   *
   * ✓ ASVS:V4.1.1 — tenantId enforced from JWT
   * ✓ CAS:RULE-028 — content never logged; IDs + lengths only
   * ✓ ASVS:V4.2.1 — messagingRateLimit applied at route layer
   */
  sendDirectMessage = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { tenantId } = req.user!;
      const { sessionId, type } = req.params;
      const { content } = req.body as { content: string };

      const { userMessage, assistantMessage } =
        await this.specialistsService.sendDirectMessage(sessionId, tenantId, type, content);

      this.logger.info('Specialist direct message exchange completed', {
        sessionId,
        tenantId,
        specialistType: type,
        userMessageId: userMessage.messageId,
        assistantMessageId: assistantMessage.messageId,
      });

      // X-Integration-Stubbed: assistant reply is a stub until INT-003..006 are live
      res.setHeader('X-Integration-Stubbed', 'INT-003,INT-004,INT-005,INT-006');
      res.status(201).json({ userMessage, assistantMessage });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/sessions/:sessionId/specialists/:type/messages
   * operationId: getSpecialistMessages — UC-005 direct chat history
   *
   * Returns the full message history for a specialist type in this session, oldest-first.
   *
   * ✓ ASVS:V4.1.1 — three-key predicate (tenantId+sessionId+specialistType)
   */
  getDirectMessages = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { tenantId } = req.user!;
      const { sessionId, type } = req.params;

      const messages = await this.specialistsService.getDirectMessages(tenantId, sessionId, type);

      this.logger.info('Specialist direct messages retrieved', {
        sessionId,
        tenantId,
        specialistType: type,
        count: messages.length,
      });

      res.json(messages);
    } catch (err) {
      next(err);
    }
  };
}
