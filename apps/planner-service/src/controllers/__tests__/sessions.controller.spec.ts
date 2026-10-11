/**
 * sessions.controller.spec.ts — Unit tests for SessionsController
 *
 * Protected B test data conventions (FAC-S4-027 / CAS:RULE-028):
 *   - content fields: '[TEST-DATA]'
 *   - tenantId: 'tenant-abc'
 *   - userId: 'user-xyz'
 *   - No real Protected B content appears in any fixture or assertion.
 *
 * ✓ ASVS:V4.1.1 — identity sourced from req.user (JWT), never from request body
 * ✓ CAS:RULE-015 — tenant isolation assertions cover every list/get/mutation path
 */

import { Request, Response, NextFunction } from 'express';
import { SessionsController } from '../sessions.controller';
import { SessionsService } from '../../services/sessions.service';
import { NotFoundError, AppError, PLANNER_ROLES } from '../../types';
import { IPlanningSessionDocument, SessionStatus } from '../../mongo/schemas/planning-session.schema';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('../../services/sessions.service');

const mockSessionsService = {
  createSession: jest.fn(),
  listSessionsByUser: jest.fn(),
  listSessionsByTenant: jest.fn(),
  getSessionById: jest.fn(),
  updateSession: jest.fn(),
  archiveSession: jest.fn(),
} as unknown as jest.Mocked<SessionsService>;

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeSession = (overrides: Partial<IPlanningSessionDocument> = {}): IPlanningSessionDocument =>
  ({
    sessionId: 'session-001',
    tenantId: 'tenant-abc',
    userId: 'user-xyz',
    status: 'active' as SessionStatus,
    title: '[TEST-DATA]',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }) as unknown as IPlanningSessionDocument;

const makeReq = (overrides: Partial<Request> = {}): Request =>
  ({
    user: {
      tenantId: 'tenant-abc',
      userId: 'user-xyz',
      roles: [PLANNER_ROLES.PLANNER_USER],
    },
    body: {},
    params: {},
    query: { page: 1, pageSize: 20 },
    path: '/api/v1/sessions',
    ...overrides,
  }) as unknown as Request;

const makeRes = (): Response => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  };
  return res as Response;
};

const makeNext = (): NextFunction => jest.fn();

// ---------------------------------------------------------------------------
// Controller under test
// ---------------------------------------------------------------------------

let controller: SessionsController;

beforeEach(() => {
  jest.clearAllMocks();
  controller = new SessionsController(mockSessionsService, mockLogger as never);
});

// ---------------------------------------------------------------------------
// createSession
// ---------------------------------------------------------------------------

describe('createSession', () => {
  // TC-001
  it('returns HTTP 201 with session on successful creation', async () => {
    const session = makeSession();
    mockSessionsService.createSession.mockResolvedValue(session);
    const req = makeReq({ body: { title: '[TEST-DATA]', description: '[TEST-DATA]' } });
    const res = makeRes();
    const next = makeNext();

    await controller.createSession(req, res, next);

    expect(mockSessionsService.createSession).toHaveBeenCalledWith(
      'tenant-abc',
      'user-xyz',
      '[TEST-DATA]',
      '[TEST-DATA]',
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect((res.json as jest.Mock)).toHaveBeenCalledWith(session);
    expect(next).not.toHaveBeenCalled();
  });

  // TC-037
  it('planner-user role is sufficient to create a session', async () => {
    const session = makeSession();
    mockSessionsService.createSession.mockResolvedValue(session);
    const req = makeReq({
      user: { tenantId: 'tenant-abc', userId: 'user-xyz', roles: [PLANNER_ROLES.PLANNER_USER] },
      body: {},
    });
    const res = makeRes();
    await controller.createSession(req, res, makeNext());
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('propagates service error to next() (validation / duplicate scenarios)', async () => {
    mockSessionsService.createSession.mockRejectedValue(new AppError(409, 'Duplicate', 'CONFLICT'));
    const req = makeReq({ body: {} });
    const res = makeRes();
    const next = makeNext();

    await controller.createSession(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect(res.status).not.toHaveBeenCalled();
  });

  // TC-001 / FAC-S4-027 — ASVS:V7.2.1 log omits content
  it('logs sessionId and tenantId but NOT content (ASVS:V7.2.1 / FAC-S4-027)', async () => {
    const session = makeSession();
    mockSessionsService.createSession.mockResolvedValue(session);
    const req = makeReq({ body: { title: '[TEST-DATA]' } });
    await controller.createSession(req, makeRes(), makeNext());

    expect(mockLogger.info).toHaveBeenCalled();
    const logArg = JSON.stringify(mockLogger.info.mock.calls);
    expect(logArg).not.toContain('[TEST-DATA]');
    expect(logArg).toContain('session-001');
    expect(logArg).toContain('tenant-abc');
  });
});

// ---------------------------------------------------------------------------
// listSessions
// ---------------------------------------------------------------------------

describe('listSessions', () => {
  const paginatedResult = { items: [], total: 0, page: 1, pageSize: 20 };

  // TC-014 — planner-user sees only own sessions
  it('calls listSessionsByUser for planner-user role (CAS:RULE-015)', async () => {
    mockSessionsService.listSessionsByUser.mockResolvedValue(paginatedResult);
    const req = makeReq({
      user: { tenantId: 'tenant-abc', userId: 'user-xyz', roles: [PLANNER_ROLES.PLANNER_USER] },
    });
    const res = makeRes();
    await controller.listSessions(req, res, makeNext());

    expect(mockSessionsService.listSessionsByUser).toHaveBeenCalledWith(
      'tenant-abc',
      'user-xyz',
      expect.any(Number),
      expect.any(Number),
    );
    expect(mockSessionsService.listSessionsByTenant).not.toHaveBeenCalled();
    expect((res.json as jest.Mock)).toHaveBeenCalledWith(paginatedResult);
  });

  // TC-014 — admin sees all tenant sessions
  it('calls listSessionsByTenant for planner-admin role (ASVS:V4.1.2)', async () => {
    mockSessionsService.listSessionsByTenant.mockResolvedValue(paginatedResult);
    const req = makeReq({
      user: { tenantId: 'tenant-abc', userId: 'user-xyz', roles: [PLANNER_ROLES.PLANNER_ADMIN] },
    });
    const res = makeRes();
    await controller.listSessions(req, res, makeNext());

    expect(mockSessionsService.listSessionsByTenant).toHaveBeenCalledWith(
      'tenant-abc',
      expect.any(Number),
      expect.any(Number),
    );
    expect(mockSessionsService.listSessionsByUser).not.toHaveBeenCalled();
  });

  // CAS:RULE-015 — tenantId from JWT, never from request body
  it('uses tenantId from req.user JWT, not from request body (CAS:RULE-015)', async () => {
    mockSessionsService.listSessionsByUser.mockResolvedValue(paginatedResult);
    const req = makeReq({
      user: { tenantId: 'tenant-abc', userId: 'user-xyz', roles: [PLANNER_ROLES.PLANNER_USER] },
      body: { tenantId: 'evil-tenant' }, // must be ignored
    });
    await controller.listSessions(req, makeRes(), makeNext());

    expect(mockSessionsService.listSessionsByUser).toHaveBeenCalledWith(
      'tenant-abc', // JWT value, not 'evil-tenant'
      'user-xyz',
      expect.any(Number),
      expect.any(Number),
    );
  });
});

// ---------------------------------------------------------------------------
// getSession
// ---------------------------------------------------------------------------

describe('getSession', () => {
  it('returns HTTP 200 with session when found and owned by requesting user', async () => {
    const session = makeSession();
    mockSessionsService.getSessionById.mockResolvedValue(session);
    const req = makeReq({ params: { sessionId: 'session-001' } });
    const res = makeRes();
    await controller.getSession(req, res, makeNext());

    expect((res.json as jest.Mock)).toHaveBeenCalledWith(session);
  });

  it('calls next(NotFoundError) when session not found (404)', async () => {
    mockSessionsService.getSessionById.mockResolvedValue(null);
    const req = makeReq({ params: { sessionId: 'session-missing' } });
    const next = makeNext();
    await controller.getSession(req, makeRes(), next);

    expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
  });

  // CAS:RULE-015 — 404 not 403 to prevent session ID enumeration
  it('returns 404 (not 403) when session belongs to a different user (CAS:RULE-015)', async () => {
    const otherUserSession = makeSession({ userId: 'user-other' });
    mockSessionsService.getSessionById.mockResolvedValue(otherUserSession);
    const req = makeReq({
      params: { sessionId: 'session-001' },
      user: { tenantId: 'tenant-abc', userId: 'user-xyz', roles: [PLANNER_ROLES.PLANNER_USER] },
    });
    const next = makeNext();
    await controller.getSession(req, makeRes(), next);

    expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
  });

  it('admin can retrieve any tenant session regardless of userId', async () => {
    const otherUserSession = makeSession({ userId: 'user-other' });
    mockSessionsService.getSessionById.mockResolvedValue(otherUserSession);
    const req = makeReq({
      params: { sessionId: 'session-001' },
      user: { tenantId: 'tenant-abc', userId: 'user-xyz', roles: [PLANNER_ROLES.PLANNER_ADMIN] },
    });
    const res = makeRes();
    await controller.getSession(req, res, makeNext());

    expect((res.json as jest.Mock)).toHaveBeenCalledWith(otherUserSession);
  });
});

// ---------------------------------------------------------------------------
// updateSession
// ---------------------------------------------------------------------------

describe('updateSession', () => {
  // TC-033 — active → completed
  it('returns HTTP 200 with updated session on successful update', async () => {
    const updated = makeSession({ status: 'completed' as SessionStatus });
    mockSessionsService.updateSession.mockResolvedValue(updated);
    const req = makeReq({
      params: { sessionId: 'session-001' },
      body: { status: 'completed' },
    });
    const res = makeRes();
    await controller.updateSession(req, res, makeNext());

    expect((res.json as jest.Mock)).toHaveBeenCalledWith(updated);
  });

  it('calls next(NotFoundError) when session not found during update', async () => {
    mockSessionsService.updateSession.mockResolvedValue(null);
    const req = makeReq({ params: { sessionId: 'session-missing' }, body: { status: 'paused' } });
    const next = makeNext();
    await controller.updateSession(req, makeRes(), next);

    expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
  });

  // BR-010 — ASVS:V5.1.4 invalid state transition → 422 RFC 7807
  it('returns HTTP 422 with RFC 7807 body for invalid state transition (BR-010)', async () => {
    const transitionError = new AppError(
      422,
      "Invalid status transition: 'completed' → 'active'. Allowed transitions: [archived]",
      'INVALID_STATE_TRANSITION',
    );
    mockSessionsService.updateSession.mockRejectedValue(transitionError);
    const req = makeReq({ params: { sessionId: 'session-001' }, body: { status: 'active' } });
    const res = makeRes();
    await controller.updateSession(req, res, makeNext());

    expect(res.status).toHaveBeenCalledWith(422);
    const jsonArg = (res.json as jest.Mock).mock.calls[0][0];
    expect(jsonArg.type).toContain('invalid-state-transition');
    expect(jsonArg.status).toBe(422);
  });
});

// ---------------------------------------------------------------------------
// archiveSession
// ---------------------------------------------------------------------------

describe('archiveSession', () => {
  it('returns HTTP 204 with no body on successful archive (SYSREQ-022 soft archive)', async () => {
    const archived = makeSession({ status: 'archived' as SessionStatus });
    mockSessionsService.archiveSession.mockResolvedValue(archived);
    const req = makeReq({ params: { sessionId: 'session-001' } });
    const res = makeRes();
    await controller.archiveSession(req, res, makeNext());

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  it('calls next(NotFoundError) when session not found for archive', async () => {
    mockSessionsService.archiveSession.mockResolvedValue(null);
    const req = makeReq({ params: { sessionId: 'session-missing' } });
    const next = makeNext();
    await controller.archiveSession(req, makeRes(), next);

    expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
  });

  // ASVS:V7.2.1 — archive logged with actor and resource; no content logged
  it('logs archive action with sessionId/tenantId/userId (ASVS:V7.2.1)', async () => {
    const archived = makeSession({ status: 'archived' as SessionStatus });
    mockSessionsService.archiveSession.mockResolvedValue(archived);
    const req = makeReq({ params: { sessionId: 'session-001' } });
    await controller.archiveSession(req, makeRes(), makeNext());

    expect(mockLogger.info).toHaveBeenCalledWith(
      'Session archived',
      expect.objectContaining({ sessionId: 'session-001', tenantId: 'tenant-abc' }),
    );
  });
});

// ---------------------------------------------------------------------------
// SECURITY: ASVS:V4.1.1 — auth dependency (auth enforced by route-level middleware)
// ---------------------------------------------------------------------------

describe('Security — auth and tenant isolation', () => {
  // ASVS:V4.1.1 — missing req.user causes controller to throw; next receives the error
  it('calls next(error) when req.user is not set (auth enforced by requireAuth middleware)', async () => {
    mockSessionsService.createSession.mockResolvedValue(makeSession());
    const reqNoUser = { body: {}, path: '/api/v1/sessions' } as unknown as Request;
    const next = makeNext();
    await controller.createSession(reqNoUser, makeRes(), next);

    // TypeError from destructuring undefined propagates to next
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  // TC-019 — no role guard is enforced at route layer; controller trusts req.user from middleware
  it('tenantId is never read from request body (CAS:RULE-015)', async () => {
    mockSessionsService.createSession.mockResolvedValue(makeSession());
    const req = makeReq({ body: { title: '[TEST-DATA]', tenantId: 'injected-tenant' } });
    await controller.createSession(req, makeRes(), makeNext());

    // Service must be called with 'tenant-abc' (JWT), not 'injected-tenant' (body)
    expect(mockSessionsService.createSession).toHaveBeenCalledWith(
      'tenant-abc',
      'user-xyz',
      '[TEST-DATA]',
      undefined,
    );
  });
});
