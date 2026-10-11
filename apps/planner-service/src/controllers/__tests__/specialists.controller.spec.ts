/**
 * specialists.controller.spec.ts — Unit tests for SpecialistsController
 *
 * Protected B test data conventions (FAC-S4-027 / CAS:RULE-028):
 *   - requestPayload: { content: '[TEST-DATA]' }
 *   - tenantId: 'tenant-abc'
 *   - userId: 'user-xyz'
 *   - No real Protected B content appears in any fixture or assertion.
 *
 * ✓ ASVS:V1.6.1 — specialist stubs INT-003..006 are fail-closed
 * ✓ ASVS:V4.1.1 — identity sourced from req.user (JWT), never from request body
 * ✓ ASVS:V5.1.4 — specialistType validated server-side against enum before processing
 * ✓ CAS:RULE-028 — requestPayload (Protected B) not in log calls
 */

import { Request, Response, NextFunction } from 'express';
import { SpecialistsController } from '../specialists.controller';
import { SpecialistsService, VALID_SPECIALIST_TYPES } from '../../services/specialists.service';
import { ForbiddenError, NotFoundError, SpecialistType, PLANNER_ROLES } from '../../types';
import { IEventService } from '../../services/event.service';
import { AuditService } from '../../middleware/audit.middleware';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('../../services/specialists.service');

const mockSpecialistsService: jest.Mocked<SpecialistsService> = {
  isSpecialistEnabled: jest.fn(),
  consultSpecialist: jest.fn(),
  getSpecialistRequest: jest.fn(),
} as unknown as jest.Mocked<SpecialistsService>;

const mockEventService: jest.Mocked<IEventService> = {
  publishEvent: jest.fn().mockResolvedValue(undefined),
};

const mockAuditService: jest.Mocked<AuditService> = {
  createEvent: jest.fn().mockResolvedValue(undefined),
  getLastChainHash: jest.fn().mockResolvedValue(null),
} as unknown as jest.Mocked<AuditService>;

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeReq = (overrides: Partial<Request> = {}): Request =>
  ({
    user: {
      tenantId: 'tenant-abc',
      userId: 'user-xyz',
      roles: [PLANNER_ROLES.PLANNER_USER],
    },
    body: {
      specialistType: 'form-service' as SpecialistType,
      requestPayload: { content: '[TEST-DATA]' },
    },
    params: { sessionId: 'session-001', requestId: 'req-001' },
    path: '/api/v1/sessions/session-001/specialists',
    ...overrides,
  }) as unknown as Request;

const makeRes = (): Response => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
  };
  return res as Response;
};

const makeNext = (): NextFunction => jest.fn();

const makeSpecialistRequestResult = (overrides: Record<string, unknown> = {}) => ({
  requestId: 'req-001',
  sessionId: 'session-001',
  tenantId: 'tenant-abc',
  specialistType: 'form-service' as SpecialistType,
  requestPayload: { content: '[TEST-DATA]' },
  status: 'failed' as const,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

// ---------------------------------------------------------------------------
// Controller under test
// ---------------------------------------------------------------------------

let controller: SpecialistsController;

beforeEach(() => {
  jest.clearAllMocks();
  controller = new SpecialistsController(
    mockSpecialistsService,
    mockEventService,
    mockLogger as never,
    mockAuditService,
    'test-signing-key',
  );
});

// ===========================================================================
// consultSpecialist
// ===========================================================================

describe('consultSpecialist', () => {
  // TC-040 / TC-092
  it('returns 403 via next() when service throws ForbiddenError (INT-002 stub — isEnabled=false)', async () => {
    // ✓ ASVS:V1.6.1 — fail-closed: disabled specialist returns 403
    mockSpecialistsService.consultSpecialist.mockRejectedValue(
      new ForbiddenError('Specialist form-service is not enabled for this tenant'),
    );
    const req = makeReq();
    const res = makeRes();
    const next = makeNext();

    await controller.consultSpecialist(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
    expect(res.status).not.toHaveBeenCalled();
  });

  // TC-040 / TC-092 — invalid specialist type → 400 RFC 7807 (before service call)
  it('returns 400 RFC 7807 for invalid specialistType (unknown type not in enum)', async () => {
    // ✓ ASVS:V5.1.4 — specialistType validated server-side against enum
    const req = makeReq({
      body: { specialistType: 'unknown-agent', requestPayload: { content: '[TEST-DATA]' } },
    });
    const res = makeRes();
    const next = makeNext();

    await controller.consultSpecialist(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'https://planner.alberta.ca/errors/invalid-specialist-type',
        status: 400,
      }),
    );
    // Service must NOT be called for invalid type
    expect(mockSpecialistsService.consultSpecialist).not.toHaveBeenCalled();
  });

  it('returns 400 for empty string specialistType', async () => {
    const req = makeReq({ body: { specialistType: '', requestPayload: {} } });
    const res = makeRes();
    const next = makeNext();

    await controller.consultSpecialist(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockSpecialistsService.consultSpecialist).not.toHaveBeenCalled();
  });

  // TC-115 — 400 RFC 7807 detail includes valid types
  it('returns 400 RFC 7807 with detail listing VALID_SPECIALIST_TYPES', async () => {
    const req = makeReq({ body: { specialistType: 'invalid-type', requestPayload: {} } });
    const res = makeRes();

    await controller.consultSpecialist(req, res, makeNext());

    const jsonArg = (res.json as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
    expect(String(jsonArg.detail)).toContain('form-service');
  });

  // TC-007 — 202 response on valid path (isEnabled=true scenario)
  it('returns 202 with X-Integration-Stubbed header on successful (stub-enabled) path', async () => {
    const result = makeSpecialistRequestResult();
    mockSpecialistsService.consultSpecialist.mockResolvedValue(result as never);

    const req = makeReq({
      body: { specialistType: 'form-service', requestPayload: { content: '[TEST-DATA]' } },
    });
    const res = makeRes();
    const next = makeNext();

    await controller.consultSpecialist(req, res, next);

    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.setHeader).toHaveBeenCalledWith(
      'X-Integration-Stubbed',
      'INT-003,INT-004,INT-005,INT-006',
    );
    expect(res.json).toHaveBeenCalledWith(result);
    expect(next).not.toHaveBeenCalled();
  });

  // Security: requestPayload (Protected B) must not appear in logger calls
  it('does not log requestPayload content — only requestId + tenantId in log calls', async () => {
    // ✓ CAS:RULE-028 — Protected B payload not logged
    const result = makeSpecialistRequestResult();
    mockSpecialistsService.consultSpecialist.mockResolvedValue(result as never);

    const sensitivePayload = { content: '[TEST-DATA]', sensitiveField: 'DO-NOT-LOG' };
    const req = makeReq({ body: { specialistType: 'form-service', requestPayload: sensitivePayload } });
    const res = makeRes();

    await controller.consultSpecialist(req, res, makeNext());

    const allLogArgs = JSON.stringify([
      ...mockLogger.info.mock.calls,
      ...mockLogger.warn.mock.calls,
      ...mockLogger.error.mock.calls,
    ]);
    expect(allLogArgs).not.toContain('DO-NOT-LOG');
    expect(allLogArgs).not.toContain('[TEST-DATA]');
    // IDs are present in logs
    expect(allLogArgs).toContain('req-001');
    expect(allLogArgs).toContain('tenant-abc');
  });

  it('passes identity from req.user (tenantId + userId from JWT)', async () => {
    // ✓ ASVS:V4.1.1 — identity from JWT; not from client input
    const result = makeSpecialistRequestResult();
    mockSpecialistsService.consultSpecialist.mockResolvedValue(result as never);

    const req = makeReq({
      user: { tenantId: 'tenant-abc', userId: 'user-xyz', roles: [PLANNER_ROLES.PLANNER_USER] },
      body: { specialistType: 'form-service', requestPayload: {} },
    });

    await controller.consultSpecialist(req, makeRes(), makeNext());

    expect(mockSpecialistsService.consultSpecialist).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-abc', userId: 'user-xyz', sessionId: 'session-001' }),
    );
  });

  it('publishes domain event after successful consultation', async () => {
    const result = makeSpecialistRequestResult();
    mockSpecialistsService.consultSpecialist.mockResolvedValue(result as never);

    await controller.consultSpecialist(makeReq(), makeRes(), makeNext());

    expect(mockEventService.publishEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'specialist-delegated' }),
    );
  });

  it('creates audit entry after successful consultation (BR-008)', async () => {
    // ✓ ASVS:V7.2.2 — audit trail created for specialist delegation
    const result = makeSpecialistRequestResult();
    mockSpecialistsService.consultSpecialist.mockResolvedValue(result as never);

    await controller.consultSpecialist(makeReq(), makeRes(), makeNext());

    expect(mockAuditService.createEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'CONSULT_SPECIALIST', tenantId: 'tenant-abc' }),
    );
  });

  it('continues response even when audit write fails (non-blocking audit)', async () => {
    const result = makeSpecialistRequestResult();
    mockSpecialistsService.consultSpecialist.mockResolvedValue(result as never);
    mockAuditService.createEvent.mockRejectedValue(new Error('audit DB down'));

    const res = makeRes();
    const next = makeNext();
    await controller.consultSpecialist(makeReq(), res, next);

    // Response still completes — audit failure is non-blocking
    expect(res.status).toHaveBeenCalledWith(202);
    expect(next).not.toHaveBeenCalled();
  });

  it('validates all four VALID_SPECIALIST_TYPES pass the enum check', async () => {
    const result = makeSpecialistRequestResult();
    mockSpecialistsService.consultSpecialist.mockResolvedValue(result as never);

    for (const sType of VALID_SPECIALIST_TYPES) {
      jest.clearAllMocks();
      mockSpecialistsService.consultSpecialist.mockResolvedValue(result as never);
      const req = makeReq({ body: { specialistType: sType, requestPayload: {} } });
      const res = makeRes();
      await controller.consultSpecialist(req, res, makeNext());
      // Should not return 400 for valid types
      expect(res.status).not.toHaveBeenCalledWith(400);
    }
  });
});

// ===========================================================================
// getSpecialistRequest
// ===========================================================================

describe('getSpecialistRequest', () => {
  // TC-007
  it('returns 200 with SpecialistRequest when found', async () => {
    const requestDoc = makeSpecialistRequestResult();
    mockSpecialistsService.getSpecialistRequest.mockResolvedValue(requestDoc as never);

    const req = makeReq({ params: { sessionId: 'session-001', requestId: 'req-001' } });
    const res = makeRes();
    const next = makeNext();

    await controller.getSpecialistRequest(req, res, next);

    expect(res.json).toHaveBeenCalledWith(requestDoc);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next(NotFoundError) when service returns null', async () => {
    mockSpecialistsService.getSpecialistRequest.mockResolvedValue(null);

    const req = makeReq({ params: { sessionId: 'session-001', requestId: 'req-999' } });
    const res = makeRes();
    const next = makeNext();

    await controller.getSpecialistRequest(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    expect(res.json).not.toHaveBeenCalled();
  });

  it('returns 404 (via NotFoundError) when requestId belongs to different tenantId', async () => {
    // ✓ ASVS:V4.1.1 — cross-tenant enumeration prevented; 404 returned
    mockSpecialistsService.getSpecialistRequest.mockResolvedValue(null);

    const req = makeReq({
      user: { tenantId: 'tenant-OTHER', userId: 'user-xyz', roles: [] },
      params: { sessionId: 'session-001', requestId: 'req-001' },
    });
    const res = makeRes();
    const next = makeNext();

    await controller.getSpecialistRequest(req, res, next);

    expect(mockSpecialistsService.getSpecialistRequest).toHaveBeenCalledWith(
      'tenant-OTHER',
      'session-001',
      'req-001',
    );
    expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
  });

  it('propagates unexpected service errors to next()', async () => {
    mockSpecialistsService.getSpecialistRequest.mockRejectedValue(new Error('DB connection lost'));

    const next = makeNext();
    await controller.getSpecialistRequest(makeReq(), makeRes(), next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('uses tenantId from req.user — not from request body', async () => {
    // ✓ ASVS:V4.1.1 — identity from JWT; not from client input
    const requestDoc = makeSpecialistRequestResult();
    mockSpecialistsService.getSpecialistRequest.mockResolvedValue(requestDoc as never);

    const req = makeReq({
      user: { tenantId: 'tenant-abc', userId: 'user-xyz', roles: [] },
      params: { sessionId: 'session-001', requestId: 'req-001' },
      body: { tenantId: 'attacker-tenant' }, // must be ignored
    });

    await controller.getSpecialistRequest(req, makeRes(), makeNext());

    expect(mockSpecialistsService.getSpecialistRequest).toHaveBeenCalledWith(
      'tenant-abc',
      'session-001',
      'req-001',
    );
  });
});
