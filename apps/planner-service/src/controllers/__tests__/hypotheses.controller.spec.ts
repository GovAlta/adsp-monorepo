/**
 * hypotheses.controller.spec.ts — Unit tests for HypothesesController
 *
 * Protected B test data conventions (FAC-S4-027 / CAS:RULE-028):
 *   - hypothesis summary / reasoning: '[TEST-DATA]'
 *   - tenantId: 'tenant-abc'
 *   - userId: 'user-xyz'
 *   - No real Protected B content appears in any fixture or assertion.
 *
 * ✓ ASVS:V4.1.3 — server-side state machine; client cannot set arbitrary status
 * ✓ ASVS:V4.1.1 — tenantId sourced from req.user JWT; tenant isolation asserted
 * ✓ CAS:RULE-017 — BR-010 state machine enforced (valid/invalid transitions covered)
 * ✓ ASVS:V7.2.2 — domain event published on 'accepted' transition (INT-007)
 * ✓ CAS:RULE-028 — hypothesis content '[TEST-DATA]' MUST NOT appear in any logger call
 */

import { Request, Response, NextFunction } from 'express';
import { HypothesesController } from '../hypotheses.controller';
import { HypothesesService } from '../../services/hypotheses.service';
import { IEventService, DomainEventPayload } from '../../services/event.service';
import { AuditService } from '../../middleware/audit.middleware';
import { NotFoundError, AppError } from '../../types';
import { IHypothesisRecordDocument, HypothesisStatus } from '../../mongo/schemas/hypothesis-record.schema';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('../../services/hypotheses.service');
jest.mock('../../services/event.service');

const mockHypothesesService = {
  listHypotheses: jest.fn(),
  getHypothesisById: jest.fn(),
  updateHypothesisStatus: jest.fn(),
  createHypothesis: jest.fn(),
} as unknown as jest.Mocked<HypothesesService>;

const mockEventService: jest.Mocked<IEventService> = {
  publishEvent: jest.fn().mockResolvedValue(undefined),
};

const mockAuditService: jest.Mocked<AuditService> = {
  createEvent: jest.fn().mockResolvedValue(undefined),
  getLastChainHash: jest.fn().mockResolvedValue(null),
};

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeHypothesis = (
  overrides: Partial<IHypothesisRecordDocument> = {},
): IHypothesisRecordDocument =>
  ({
    hypothesisId: 'hyp-001',
    sessionId: 'session-001',
    tenantId: 'tenant-abc',
    status: 'draft' as HypothesisStatus,
    adspServices: ['form-service'],
    summary: '[TEST-DATA]',
    version: 1,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }) as unknown as IHypothesisRecordDocument;

const makeReq = (overrides: Partial<Request> = {}): Request =>
  ({
    user: { tenantId: 'tenant-abc', userId: 'user-xyz', roles: ['planner-user'] },
    params: { sessionId: 'session-001' },
    body: {},
    path: '/api/v1/sessions/session-001/hypotheses',
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

let controller: HypothesesController;

beforeEach(() => {
  jest.clearAllMocks();
  controller = new HypothesesController(
    mockHypothesesService,
    mockEventService,
    mockLogger as never,
    mockAuditService,
    'test-signing-key',
  );
});

// ---------------------------------------------------------------------------
// listHypotheses
// ---------------------------------------------------------------------------

describe('listHypotheses', () => {
  // TC-006 — UC-004: list returns items and total for authenticated tenant's session
  it('returns { items, total } for the tenant\'s session', async () => {
    const hypotheses = [makeHypothesis(), makeHypothesis({ hypothesisId: 'hyp-002' })];
    mockHypothesesService.listHypotheses.mockResolvedValue(hypotheses);

    const req = makeReq();
    const res = makeRes();
    const next = makeNext();

    await controller.listHypotheses(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ items: hypotheses, total: 2 });
    expect(next).not.toHaveBeenCalled();
  });

  // TC-006 — ASVS:V4.1.1: service called with JWT tenantId (not client-supplied)
  it('ASVS:V4.1.1 / CAS:RULE-015 — passes JWT tenantId (not body) to service', async () => {
    mockHypothesesService.listHypotheses.mockResolvedValue([]);

    const req = makeReq({
      user: { tenantId: 'tenant-abc', userId: 'user-xyz', roles: ['planner-user'] },
    });

    await controller.listHypotheses(req, makeRes(), makeNext());

    expect(mockHypothesesService.listHypotheses).toHaveBeenCalledWith(
      'tenant-abc',
      'session-001',
    );
  });

  // TC-006 — tenant isolation: different tenantId yields different query
  it('CAS:RULE-015 — tenant A and tenant B sessions are queried independently', async () => {
    mockHypothesesService.listHypotheses.mockResolvedValue([]);

    const reqA = makeReq({
      user: { tenantId: 'tenant-A', userId: 'user-xyz', roles: ['planner-user'] },
      params: { sessionId: 'session-A' },
    });
    await controller.listHypotheses(reqA, makeRes(), makeNext());

    const reqB = makeReq({
      user: { tenantId: 'tenant-B', userId: 'user-xyz', roles: ['planner-user'] },
      params: { sessionId: 'session-B' },
    });
    await controller.listHypotheses(reqB, makeRes(), makeNext());

    const [callA, callB] = mockHypothesesService.listHypotheses.mock.calls;
    expect(callA).toEqual(['tenant-A', 'session-A']);
    expect(callB).toEqual(['tenant-B', 'session-B']);
  });
});

// ---------------------------------------------------------------------------
// getHypothesis
// ---------------------------------------------------------------------------

describe('getHypothesis', () => {
  // TC-006 — UC-004: returns full hypothesis for valid ID
  it('returns HTTP 200 with full hypothesis when found', async () => {
    const hypothesis = makeHypothesis({ status: 'proposed' });
    mockHypothesesService.getHypothesisById.mockResolvedValue(hypothesis);

    const req = makeReq({ params: { sessionId: 'session-001', hypothesisId: 'hyp-001' } });
    const res = makeRes();
    const next = makeNext();

    await controller.getHypothesis(req, res, next);

    expect(res.json).toHaveBeenCalledWith(hypothesis);
    expect(next).not.toHaveBeenCalled();
  });

  // TC-016 — 404 when hypothesis not found within tenant boundary
  it('calls next with NotFoundError (404) when hypothesis does not exist', async () => {
    mockHypothesesService.getHypothesisById.mockResolvedValue(null);

    const req = makeReq({ params: { sessionId: 'session-001', hypothesisId: 'hyp-missing' } });
    const res = makeRes();
    const next = makeNext();

    await controller.getHypothesis(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(NotFoundError);
    expect(err.statusCode).toBe(404);
  });

  // TC-006 — ASVS:V7.2.1: hypothesis summary MUST NOT appear in logger.info call
  it('ASVS:V7.2.1 / FAC-S4-027 — hypothesis summary [TEST-DATA] never in logger.info args', async () => {
    const hypothesis = makeHypothesis({ summary: '[TEST-DATA]', reasoning: '[TEST-DATA]' });
    mockHypothesesService.getHypothesisById.mockResolvedValue(hypothesis);

    const req = makeReq({ params: { sessionId: 'session-001', hypothesisId: 'hyp-001' } });
    await controller.getHypothesis(req, makeRes(), makeNext());

    const allLogArgs = JSON.stringify(mockLogger.info.mock.calls);
    expect(allLogArgs).not.toContain('[TEST-DATA]');
  });
});

// ---------------------------------------------------------------------------
// updateHypothesisStatus
// ---------------------------------------------------------------------------

describe('updateHypothesisStatus', () => {
  // TC-077 — CAS:RULE-017 BR-010: draft → proposed is a valid transition
  it('returns HTTP 200 with updated hypothesis for valid draft→proposed transition', async () => {
    const updated = makeHypothesis({ status: 'proposed', version: 2 });
    mockHypothesesService.updateHypothesisStatus.mockResolvedValue(updated);

    const req = makeReq({
      params: { sessionId: 'session-001', hypothesisId: 'hyp-001' },
      body: { status: 'proposed' },
    });
    const res = makeRes();
    const next = makeNext();

    await controller.updateHypothesisStatus(req, res, next);

    expect(res.json).toHaveBeenCalledWith(updated);
    expect(next).not.toHaveBeenCalled();
  });

  // TC-029 — CAS:RULE-017 BR-010: proposed → accepted is a valid transition
  it('returns HTTP 200 with updated hypothesis for valid proposed→accepted transition', async () => {
    const updated = makeHypothesis({ status: 'accepted', version: 2 });
    mockHypothesesService.updateHypothesisStatus.mockResolvedValue(updated);

    const req = makeReq({
      params: { sessionId: 'session-001', hypothesisId: 'hyp-001' },
      body: { status: 'accepted' },
    });
    const res = makeRes();
    const next = makeNext();

    await controller.updateHypothesisStatus(req, res, next);

    expect(res.json).toHaveBeenCalledWith(updated);
    expect(next).not.toHaveBeenCalled();
  });

  // TC-030 — CAS:RULE-017 BR-010 invalid transition: accepted→draft → RFC 7807 422
  it('returns RFC 7807 422 when service throws INVALID_STATE_TRANSITION (BR-010 accepted→draft)', async () => {
    mockHypothesesService.updateHypothesisStatus.mockRejectedValue(
      new AppError(
        422,
        "Cannot transition hypothesis from 'accepted' to 'draft'. Valid transitions from 'accepted': [none].",
        'INVALID_STATE_TRANSITION',
      ),
    );

    const req = makeReq({
      params: { sessionId: 'session-001', hypothesisId: 'hyp-001' },
      body: { status: 'draft' },
    });
    const res = makeRes();
    const next = makeNext();

    await controller.updateHypothesisStatus(req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    const body = (res.json as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
    expect(body.status).toBe(422);
    expect(body.type).toContain('invalid-state-transition');
    // 422 handled inline; must NOT go to next()
    expect(next).not.toHaveBeenCalled();
  });

  // TC-079 — BR-010 special constraint: accepted→superseded → 409 (not 422)
  it('calls next with 409 AppError when service rejects accepted→superseded transition', async () => {
    mockHypothesesService.updateHypothesisStatus.mockRejectedValue(
      new AppError(
        409,
        "Cannot supersede hypothesis 'hyp-001': it is already accepted.",
        'CONFLICT',
      ),
    );

    const req = makeReq({
      params: { sessionId: 'session-001', hypothesisId: 'hyp-001' },
      body: { status: 'superseded' },
    });
    const res = makeRes();
    const next = makeNext();

    await controller.updateHypothesisStatus(req, res, next);

    // 409 CONFLICT is not INVALID_STATE_TRANSITION; must propagate to next()
    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect((err as AppError).statusCode).toBe(409);
    expect((err as AppError).code).toBe('CONFLICT');
  });

  // TC-006 — ASVS:V7.2.2 / INT-007: domain event published on accepted transition
  it('ASVS:V7.2.2 — publishes hypothesis-generated event when status transitions to accepted', async () => {
    const updated = makeHypothesis({ status: 'accepted', version: 2 });
    mockHypothesesService.updateHypothesisStatus.mockResolvedValue(updated);

    const req = makeReq({
      params: { sessionId: 'session-001', hypothesisId: 'hyp-001' },
      body: { status: 'accepted' },
    });

    await controller.updateHypothesisStatus(req, makeRes(), makeNext());

    expect(mockEventService.publishEvent).toHaveBeenCalledTimes(1);
    const event: DomainEventPayload = (mockEventService.publishEvent as jest.Mock).mock.calls[0][0];
    expect(event.eventType).toBe('hypothesis-generated');
    expect(event.tenantId).toBe('tenant-abc');
    expect(event.data).toMatchObject({ hypothesisId: 'hyp-001', status: 'accepted' });
  });

  // TC-029 — event NOT published for non-accepted transitions (e.g. draft→proposed)
  it('does NOT publish event when transition is not to accepted', async () => {
    const updated = makeHypothesis({ status: 'proposed', version: 2 });
    mockHypothesesService.updateHypothesisStatus.mockResolvedValue(updated);

    const req = makeReq({
      params: { sessionId: 'session-001', hypothesisId: 'hyp-001' },
      body: { status: 'proposed' },
    });

    await controller.updateHypothesisStatus(req, makeRes(), makeNext());

    expect(mockEventService.publishEvent).not.toHaveBeenCalled();
  });

  // TC-103 — ASVS:V7.2.2: event publish failure must not abort response
  it('responds 200 even when event publishEvent rejects (fire-and-forget INT-007 stub)', async () => {
    const updated = makeHypothesis({ status: 'accepted', version: 2 });
    mockHypothesesService.updateHypothesisStatus.mockResolvedValue(updated);
    mockEventService.publishEvent.mockRejectedValueOnce(new Error('RabbitMQ unavailable'));

    const req = makeReq({
      params: { sessionId: 'session-001', hypothesisId: 'hyp-001' },
      body: { status: 'accepted' },
    });
    const res = makeRes();
    const next = makeNext();

    await controller.updateHypothesisStatus(req, res, next);

    // response was sent before the async event settled
    expect(res.json).toHaveBeenCalledWith(updated);
    expect(next).not.toHaveBeenCalled();
  });

  // TC-031 — BR-010 invalid transition: rejected→accepted → 422
  it('returns 422 for rejected→accepted transition (terminal state, BR-010)', async () => {
    mockHypothesesService.updateHypothesisStatus.mockRejectedValue(
      new AppError(
        422,
        "Cannot transition hypothesis from 'rejected' to 'accepted'.",
        'INVALID_STATE_TRANSITION',
      ),
    );

    const req = makeReq({
      params: { sessionId: 'session-001', hypothesisId: 'hyp-001' },
      body: { status: 'accepted' },
    });
    const res = makeRes();

    await controller.updateHypothesisStatus(req, res, makeNext());

    expect(res.status).toHaveBeenCalledWith(422);
  });
});
