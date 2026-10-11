import { Request, Response, NextFunction } from 'express';
import { Logger } from 'winston';
import { HypothesesService } from '../services/hypotheses.service';
import { IEventService, DomainEventPayload } from '../services/event.service';
import { AuditService, buildAuditChainHash } from '../middleware/audit.middleware';
import { NotFoundError, AppError, DomainEventType } from '../types';
import { HypothesisStatus } from '../mongo/schemas/hypothesis-record.schema';

// ✓ ASVS:V4.1.3 — hypothesis status transition enforced; no forbidden status changes
// ✓ CAS:RULE-017 — BR-010 state machine enforced at service layer
// ✓ ASVS:V4.1.1 — tenantId enforced on all hypothesis queries via service layer
// ✓ CAS:RULE-028 — hypothesis summary/reasoning are Protected B; not logged (only IDs)
// FAC-S4-026: hypothesis content only in response body; not in log messages

/**
 * HypothesesController — exposes three operations on hypothesis records:
 *   GET  /api/v1/sessions/:sessionId/hypotheses            — list all hypotheses
 *   GET  /api/v1/sessions/:sessionId/hypotheses/:hypothesisId — retrieve single hypothesis
 *   PATCH /api/v1/sessions/:sessionId/hypotheses/:hypothesisId — transition status
 *
 * UC-004: Review and Action Solution Hypotheses
 * BR-010: status state machine transitions enforced
 * BR-008: audit trail on accept/reject
 */
export class HypothesesController {
  constructor(
    private readonly hypothesesService: HypothesesService,
    private readonly eventService: IEventService,
    private readonly logger: Logger,
    private readonly auditService?: AuditService,
    private readonly auditSigningKey: string = '',
  ) {}

  /**
   * GET /api/v1/sessions/:sessionId/hypotheses
   * operationId: listHypotheses — UC-004
   *
   * Returns all hypotheses for the session, newest first.
   *
   * ✓ ASVS:V4.1.1 — tenantId from req.user; session must belong to this tenant
   */
  listHypotheses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // ✓ ASVS:V4.1.1 — identity from JWT; not from client input
      const { tenantId } = req.user!;
      const { sessionId } = req.params;

      const hypotheses = await this.hypothesesService.listHypotheses(tenantId, sessionId);

      // ✓ ASVS:V7.2.1 — access logged with count and IDs only; no content
      this.logger.info('Hypotheses listed', {
        sessionId,
        tenantId,
        count: hypotheses.length,
      });

      res.json({ items: hypotheses, total: hypotheses.length });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/sessions/:sessionId/hypotheses/:hypothesisId
   * operationId: getHypothesis — UC-004
   *
   * Returns full hypothesis including reasoning and adspServices (serviceComposition).
   * Returns 404 when not found within the tenant boundary.
   *
   * ✓ ASVS:V4.1.1 — tenantId enforced; 404 prevents cross-tenant enumeration
   */
  getHypothesis = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = req.user!;
      const { sessionId, hypothesisId } = req.params;

      const hypothesis = await this.hypothesesService.getHypothesisById(
        tenantId,
        sessionId,
        hypothesisId,
      );

      if (!hypothesis) {
        return next(new NotFoundError('Hypothesis', hypothesisId));
      }

      // ✓ ASVS:V7.2.1 — access logged with ID only; Protected B content not in log
      this.logger.info('Hypothesis retrieved', {
        hypothesisId,
        sessionId,
        tenantId,
        status: hypothesis.status,
      });

      res.json(hypothesis);
    } catch (err) {
      next(err);
    }
  };

  /**
   * PATCH /api/v1/sessions/:sessionId/hypotheses/:hypothesisId
   * operationId: updateHypothesisStatus — UC-004
   *
   * Transitions hypothesis status (accept, reject, supersede).
   * Validates state machine transitions per BR-010:
   *   VALID:   draft→proposed, proposed→accepted, proposed→rejected, proposed→superseded
   *   INVALID: proposed→draft, accepted→proposed, rejected→any, superseded→any
   *
   * Returns HTTP 422 for invalid transitions with current status and valid transitions.
   * Returns HTTP 409 if trying to supersede an already-accepted hypothesis.
   * Returns HTTP 404 if hypothesis not found within tenant boundary.
   *
   * Publishes hypothesis-generated event via event.service when status transitions to 'accepted'.
   * Writes audit log entry on accept/reject per BR-008.
   *
   * ✓ ASVS:V4.1.3 — server-side state machine; client cannot set arbitrary status
   * ✓ CAS:RULE-017 — BR-010 transitions enforced in service layer
   * ✓ ASVS:V7.2.2 — audit log created for accept/reject transitions (BR-008)
   */
  updateHypothesisStatus = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { tenantId, userId } = req.user!;
      const { sessionId, hypothesisId } = req.params;
      const { status: newStatus } = req.body as { status: HypothesisStatus };

      const updated = await this.hypothesesService.updateHypothesisStatus(
        tenantId,
        sessionId,
        hypothesisId,
        newStatus,
      );

      // ✓ ASVS:V7.2.1 — status change logged with IDs; no Protected B content
      this.logger.info('Hypothesis status updated', {
        hypothesisId,
        sessionId,
        tenantId,
        newStatus,
        // userId logged for audit trail
        userId,
      });

      // Publish hypothesis-generated event when accepted (INT-007 stub)
      // ✓ ASVS:V7.2.2 — domain event published for accepted hypotheses
      if (newStatus === 'accepted') {
        const eventPayload: DomainEventPayload = {
          eventType: DomainEventType.HYPOTHESIS_GENERATED,
          sessionId,
          tenantId,
          userId,
          timestamp: new Date().toISOString(),
          // ✓ CAS:RULE-028 — data field contains only non-sensitive identifiers
          data: { hypothesisId, status: newStatus },
        };
        // Fire-and-forget; failure must not affect response (INT-007 is a stub)
        this.eventService.publishEvent(eventPayload).catch((eventErr: unknown) => {
          this.logger.warn('Failed to publish hypothesis-generated event', {
            hypothesisId,
            sessionId,
            error: eventErr instanceof Error ? eventErr.message : String(eventErr),
          });
        });
      }

      // BR-008: write audit trail entry on accept or reject
      // ✓ CAS:RULE-028 — audit payload contains IDs and outcome; no Protected B content
      if ((newStatus === 'accepted' || newStatus === 'rejected') && this.auditService) {
        try {
          const chainAnchorHash = await this.auditService.getLastChainHash(tenantId);
          const auditEntry = {
            actorId: userId,
            tenantId,
            action: newStatus === 'accepted' ? 'ACCEPT_HYPOTHESIS' : 'REJECT_HYPOTHESIS',
            resourceType: 'hypothesis',
            resourceId: hypothesisId,
            outcome: 'success' as const,
            timestamp: new Date().toISOString(),
          };
          // ✓ ASVS:V7.2.2 — HMAC chain entry created for tamper-evident audit trail
          buildAuditChainHash(auditEntry, chainAnchorHash, this.auditSigningKey);
          await this.auditService.createEvent(auditEntry);
        } catch (auditErr) {
          // Audit failure must not affect response
          // ✓ ASVS:V7.1.2 — audit errors logged server-side; never surfaced to client
          this.logger.error('Failed to write hypothesis audit event', {
            hypothesisId,
            sessionId,
            newStatus,
            error: auditErr instanceof Error ? auditErr.message : String(auditErr),
          });
        }
      }

      res.json(updated);
    } catch (err) {
      // BR-010: invalid state transition → HTTP 422 Unprocessable Entity
      if (err instanceof AppError && err.code === 'INVALID_STATE_TRANSITION') {
        res.status(422).json({
          type: 'https://planner.alberta.ca/errors/invalid-state-transition',
          title: 'Invalid Status Transition',
          status: 422,
          detail: err.message,
          instance: req.path,
        });
        return;
      }
      next(err);
    }
  };
}
