import { Request, Response, NextFunction } from 'express';
import { Logger } from 'winston';
import { SessionsService, UpdateSessionInput } from '../services/sessions.service';
import { NotFoundError, AppError, PLANNER_ROLES } from '../types';

// ✓ ASVS:V4.1.1 — tenantId enforced on all session queries via service layer
// ✓ CAS:RULE-015 — multi-tenant isolation; cross-tenant access blocked at service layer
// ✓ ASVS:V4.1.2 — RBAC enforced: planner-user sees own sessions; admin sees all tenant sessions
// ✓ ASVS:V7.2.1 — operations logged with actor, resource, and outcome context
// FAC-S4-026: session content passed only in request/response body; never in URL path/query
// ✓ FAC-S4-027 — redact: all log calls use IDs only (sessionId, tenantId);
// Protected B content fields (title, businessModelId, conceptData) are NEVER logged.

export class SessionsController {
  constructor(
    private readonly sessionsService: SessionsService,
    private readonly logger: Logger,
  ) {}

  /**
   * POST /api/v1/sessions
   * operationId: createSession — UC-001
   *
   * Creates a new PlanningSession + empty BusinessModel. Publishes session-created event.
   * ✓ ASVS:V4.1.1 — tenantId and userId extracted from req.user (JWT); never from request body
   */
  createSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // ✓ ASVS:V4.1.1 — identity sourced from validated JWT context, not client input
      const { tenantId, userId } = req.user!;
      const { title, description } = req.body as { title?: string; description?: string };

      const session = await this.sessionsService.createSession(
        tenantId,
        userId,
        title,
        description,
      );

      // ✓ ASVS:V7.2.1 — creation logged with sessionId and tenantId; no content logged
      this.logger.info('Session created', {
        sessionId: session.sessionId,
        tenantId,
        userId,
      });

      res.status(201).json(session);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/sessions
   * operationId: listSessions — UC-006 / UC-010
   *
   * planner-user: returns own sessions only (BR-007)
   * planner-admin / tenant-admin: returns all tenant sessions
   * Supports pagination per BR-011 (max pageSize=100, default=20).
   *
   * ✓ ASVS:V4.1.1 — role checked server-side to determine query scope
   * ✓ CAS:RULE-015 — tenantId always enforced regardless of role
   */
  listSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, userId, roles } = req.user!;
      // PaginationSchema middleware transforms string params to integers with defaults
      const { page, pageSize } = req.query as unknown as { page: number; pageSize: number };

      // BR-007: role determines data scope
      // ✓ ASVS:V4.1.2 — server-side role check; not a client-supplied parameter
      const isAdmin =
        roles.includes(PLANNER_ROLES.PLANNER_ADMIN) ||
        roles.includes(PLANNER_ROLES.TENANT_ADMIN);

      const result = isAdmin
        ? await this.sessionsService.listSessionsByTenant(tenantId, page, pageSize)
        : await this.sessionsService.listSessionsByUser(tenantId, userId, page, pageSize);

      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/sessions/:sessionId
   * operationId: getSession — UC-006
   *
   * Returns single session. planner-user restricted to own sessions.
   * Returns 404 (not 403) for sessions belonging to other users to prevent enumeration.
   *
   * ✓ ASVS:V4.1.1 — ownership check enforced for non-admin users
   * ✓ CAS:RULE-015 — 404 on cross-user access prevents tenant resource enumeration
   */
  getSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, userId, roles } = req.user!;
      const { sessionId } = req.params;

      const session = await this.sessionsService.getSessionById(tenantId, sessionId);

      if (!session) {
        return next(new NotFoundError('PlanningSession', sessionId));
      }

      // Non-admin users can only view their own sessions (BR-007)
      // ✓ ASVS:V4.1.1 — ownership check post-fetch; 404 prevents enumeration
      const isAdmin =
        roles.includes(PLANNER_ROLES.PLANNER_ADMIN) ||
        roles.includes(PLANNER_ROLES.TENANT_ADMIN);

      if (!isAdmin && session.userId !== userId) {
        // Return 404 not 403 to prevent cross-user session ID enumeration
        return next(new NotFoundError('PlanningSession', sessionId));
      }

      res.json(session);
    } catch (err) {
      next(err);
    }
  };

  /**
   * PATCH /api/v1/sessions/:sessionId
   * operationId: updateSession — UC-006
   *
   * Updates session status or title. Status transitions validated per BR-010 state machine.
   * Returns 422 with RFC 7807 body on invalid transition.
   *
   * ✓ ASVS:V5.1.4 — state machine enforced in service layer; invalid transitions rejected
   * ✓ ASVS:V7.2.1 — update events logged for audit trail
   */
  updateSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, userId, roles } = req.user!;
      const { sessionId } = req.params;
      const updates = req.body as UpdateSessionInput;

      const isAdmin =
        roles.includes(PLANNER_ROLES.PLANNER_ADMIN) ||
        roles.includes(PLANNER_ROLES.TENANT_ADMIN);

      const session = await this.sessionsService.updateSession(
        tenantId,
        sessionId,
        userId,
        updates,
        isAdmin,
      );

      if (!session) {
        return next(new NotFoundError('PlanningSession', sessionId));
      }

      // ✓ ASVS:V7.2.1 — update logged with actor and resource; no content logged
      this.logger.info('Session updated', {
        sessionId,
        tenantId,
        userId,
        status: updates.status,
      });

      res.json(session);
    } catch (err) {
      // BR-010: invalid state transition — return 422 Unprocessable Entity with RFC 7807
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

  /**
   * DELETE /api/v1/sessions/:sessionId
   * operationId: archiveSession — SYSREQ-022
   *
   * Soft-archive: sets status='archived'. NOT a hard delete.
   * planner-user restricted to own sessions. Operation is idempotent.
   * Hard deletion handled by scheduled retention job per SYSREQ-022.
   *
   * ✓ ASVS:V4.1.1 — ownership enforced based on role before archive
   * ✓ ASVS:V7.2.1 — archive action logged for audit trail
   */
  archiveSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, userId, roles } = req.user!;
      const { sessionId } = req.params;

      const isAdmin =
        roles.includes(PLANNER_ROLES.PLANNER_ADMIN) ||
        roles.includes(PLANNER_ROLES.TENANT_ADMIN);

      const session = await this.sessionsService.archiveSession(
        tenantId,
        sessionId,
        userId,
        isAdmin,
      );

      if (!session) {
        return next(new NotFoundError('PlanningSession', sessionId));
      }

      // ✓ ASVS:V7.2.1 — archive action logged; no content logged
      this.logger.info('Session archived', {
        sessionId,
        tenantId,
        userId,
      });

      // 204 No Content — spec declares no response body for archive (D-001)
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}
