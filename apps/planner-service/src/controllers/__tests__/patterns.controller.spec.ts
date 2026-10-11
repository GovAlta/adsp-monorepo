/**
 * patterns.controller.spec.ts — Unit tests for PatternsController
 *
 * Protected B test data conventions (FAC-S4-027 / CAS:RULE-028):
 *   - tenantId: 'tenant-abc'
 *   - userId: 'user-xyz'
 *   - pattern name/description: '[TEST-DATA]'
 *   - No real Protected B content appears in any fixture or assertion.
 *
 * ✓ ASVS:V4.1.2 — pattern write operations require planner-admin role (BR-007, FAC-S4-030)
 * ✓ ASVS:V4.1.1 — identity sourced from req.user (JWT), never from request body
 * ✓ ASVS:V7.2.2 — audit log entries created for all admin pattern actions (BR-008)
 * ✓ CAS:RULE-028 — all admin actions audited per BR-008
 * INT-002: ADSP Configuration Service stub — lookup-empty reads, 503 writes
 */

import { Request, Response, NextFunction } from 'express';
import { PatternsController } from '../patterns.controller';
import { PatternsService, CreatePatternInput } from '../../services/patterns.service';
import { ServiceUnavailableError, PLANNER_ROLES } from '../../types';
import { AuditService } from '../../middleware/audit.middleware';
import { BusinessPattern } from '../../services/config.service';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('../../services/patterns.service');

const mockPatternsService: jest.Mocked<PatternsService> = {
  listPatterns: jest.fn(),
  createPattern: jest.fn(),
  getPattern: jest.fn(),
  updatePattern: jest.fn(),
  deactivatePattern: jest.fn(),
} as unknown as jest.Mocked<PatternsService>;

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

const makeAdminReq = (overrides: Partial<Request> = {}): Request =>
  ({
    user: {
      tenantId: 'tenant-abc',
      userId: 'user-xyz',
      roles: [PLANNER_ROLES.PLANNER_ADMIN],
    },
    body: {},
    params: {},
    path: '/api/v1/patterns',
    ...overrides,
  }) as unknown as Request;

const makeUserReq = (overrides: Partial<Request> = {}): Request =>
  ({
    user: {
      tenantId: 'tenant-abc',
      userId: 'user-xyz',
      roles: [PLANNER_ROLES.PLANNER_USER],
    },
    body: {},
    params: {},
    path: '/api/v1/patterns',
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

const makePattern = (overrides: Partial<BusinessPattern> = {}): BusinessPattern => ({
  patternId: 'pattern-001',
  tenantId: 'tenant-abc',
  name: '[TEST-DATA]',
  description: '[TEST-DATA]',
  conceptTypes: ['concept-a'],
  adspServices: ['form-service'],
  isActive: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

const makeCreateInput = (overrides: Partial<CreatePatternInput> = {}): CreatePatternInput => ({
  name: '[TEST-DATA]',
  description: '[TEST-DATA]',
  conceptTypes: ['concept-a'],
  adspServices: ['form-service'],
  isActive: true,
  ...overrides,
});

// ---------------------------------------------------------------------------
// Controller under test
// ---------------------------------------------------------------------------

let controller: PatternsController;

beforeEach(() => {
  jest.clearAllMocks();
  controller = new PatternsController(
    mockPatternsService,
    mockLogger as never,
    mockAuditService,
    'test-signing-key',
  );
});

// ===========================================================================
// listPatterns
// ===========================================================================

describe('listPatterns', () => {
  // TC-047
  it('returns 200 with empty items array (INT-002 stub returns [])', async () => {
    // ✓ ASVS:V1.6.1 — lookup-empty safe default; does not error on read
    mockPatternsService.listPatterns.mockResolvedValue([]);

    const req = makeUserReq();
    const res = makeRes();
    const next = makeNext();

    await controller.listPatterns(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ items: [], total: 0 });
    expect(next).not.toHaveBeenCalled();
  });

  // TC-047 — X-Integration-Stubbed header
  it('sets X-Integration-Stubbed: INT-002 header on listPatterns response', async () => {
    mockPatternsService.listPatterns.mockResolvedValue([]);

    const res = makeRes();
    await controller.listPatterns(makeUserReq(), res, makeNext());

    expect(res.setHeader).toHaveBeenCalledWith('X-Integration-Stubbed', 'INT-002');
  });

  it('returns 200 with pattern list when service returns patterns', async () => {
    const patterns = [makePattern(), makePattern({ patternId: 'pattern-002', name: '[TEST-DATA]' })];
    mockPatternsService.listPatterns.mockResolvedValue(patterns);

    const res = makeRes();
    await controller.listPatterns(makeUserReq(), res, makeNext());

    expect(res.json).toHaveBeenCalledWith({ items: patterns, total: 2 });
  });

  it('uses tenantId from req.user for listPatterns — not from body', async () => {
    // ✓ ASVS:V4.1.1 — identity from JWT; not from client input
    mockPatternsService.listPatterns.mockResolvedValue([]);

    const req = makeUserReq({ body: { tenantId: 'attacker-tenant' } });
    await controller.listPatterns(req, makeRes(), makeNext());

    expect(mockPatternsService.listPatterns).toHaveBeenCalledWith('tenant-abc');
  });

  it('propagates service error to next()', async () => {
    mockPatternsService.listPatterns.mockRejectedValue(new Error('DB failure'));

    const next = makeNext();
    await controller.listPatterns(makeUserReq(), makeRes(), next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

// ===========================================================================
// createPattern
// ===========================================================================

describe('createPattern', () => {
  // TC-020
  it('propagates 503 via next() when service throws ServiceUnavailableError (INT-002 stub)', async () => {
    // ✓ ASVS:V1.6.1 — fail-closed stub; 503 propagated to error handler
    mockPatternsService.createPattern.mockRejectedValue(
      new ServiceUnavailableError('INT-002 unavailable'),
    );

    const req = makeAdminReq({ body: makeCreateInput() });
    const res = makeRes();
    const next = makeNext();

    await controller.createPattern(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ServiceUnavailableError));
    expect(res.status).not.toHaveBeenCalledWith(201);
  });

  // TC-020 — X-Integration-Stubbed not set when 503 (error propagated, no response written)
  it('does not write response headers when service throws 503', async () => {
    mockPatternsService.createPattern.mockRejectedValue(
      new ServiceUnavailableError('INT-002 unavailable'),
    );

    const res = makeRes();
    const next = makeNext();
    await controller.createPattern(makeAdminReq({ body: makeCreateInput() }), res, next);

    // setHeader should not be called because error thrown before response
    expect(res.setHeader).not.toHaveBeenCalled();
  });

  // Role enforcement (BR-007, FAC-S4-030)
  // NOTE: role check is enforced at the route/middleware layer, not controller.
  // The controller trusts req.user.roles were already validated. These tests verify
  // the controller passes identity correctly to the audit trail (not role-gating itself).
  it('creates audit entry for admin user when createPattern succeeds (BR-008)', async () => {
    // ✓ ASVS:V7.2.2 — audit trail created for admin pattern creation
    const pattern = makePattern();
    mockPatternsService.createPattern.mockResolvedValue(pattern);

    const req = makeAdminReq({ body: makeCreateInput() });
    await controller.createPattern(req, makeRes(), makeNext());

    expect(mockAuditService.createEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'CREATE_PATTERN',
        tenantId: 'tenant-abc',
        actorId: 'user-xyz',
      }),
    );
  });

  it('sets X-Integration-Stubbed: INT-002 header and returns 201 when service succeeds', async () => {
    const pattern = makePattern();
    mockPatternsService.createPattern.mockResolvedValue(pattern);

    const req = makeAdminReq({ body: makeCreateInput() });
    const res = makeRes();
    await controller.createPattern(req, res, makeNext());

    expect(res.setHeader).toHaveBeenCalledWith('X-Integration-Stubbed', 'INT-002');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(pattern);
  });

  // Security: audit is recorded BEFORE service call failure risk
  // The controller calls service THEN audit — so audit only fires when service succeeds.
  // When 503, audit must NOT be called (service never returned a patternId to audit).
  it('does not create audit entry when service throws 503 (audit is post-service for patterns)', async () => {
    mockPatternsService.createPattern.mockRejectedValue(
      new ServiceUnavailableError('INT-002 unavailable'),
    );

    await controller.createPattern(
      makeAdminReq({ body: makeCreateInput() }),
      makeRes(),
      makeNext(),
    );

    expect(mockAuditService.createEvent).not.toHaveBeenCalled();
  });

  it('continues response even when audit write fails after successful create (non-blocking audit)', async () => {
    const pattern = makePattern();
    mockPatternsService.createPattern.mockResolvedValue(pattern);
    mockAuditService.createEvent.mockRejectedValue(new Error('audit DB down'));

    const res = makeRes();
    const next = makeNext();
    await controller.createPattern(makeAdminReq({ body: makeCreateInput() }), res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(next).not.toHaveBeenCalledWith(expect.any(Error));
  });
});

// ===========================================================================
// getPattern
// ===========================================================================

describe('getPattern', () => {
  // TC-020
  it('propagates 503 via next() when service throws ServiceUnavailableError (INT-002 stub)', async () => {
    // ✓ ASVS:V1.6.1 — fail-closed stub until INT-002 is enabled
    mockPatternsService.getPattern.mockRejectedValue(
      new ServiceUnavailableError('INT-002 unavailable'),
    );

    const req = makeUserReq({ params: { patternId: 'pattern-001' } });
    const res = makeRes();
    const next = makeNext();

    await controller.getPattern(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ServiceUnavailableError));
    expect(res.json).not.toHaveBeenCalled();
  });

  it('sets X-Integration-Stubbed: INT-002 header and returns pattern when service succeeds', async () => {
    const pattern = makePattern();
    mockPatternsService.getPattern.mockResolvedValue(pattern);

    const req = makeUserReq({ params: { patternId: 'pattern-001' } });
    const res = makeRes();

    await controller.getPattern(req, res, makeNext());

    expect(res.setHeader).toHaveBeenCalledWith('X-Integration-Stubbed', 'INT-002');
    expect(res.json).toHaveBeenCalledWith(pattern);
  });

  it('uses tenantId from req.user — not from request body', async () => {
    // ✓ ASVS:V4.1.1 — identity from JWT; not from client input
    mockPatternsService.getPattern.mockRejectedValue(new ServiceUnavailableError('stub'));

    const req = makeUserReq({
      params: { patternId: 'pattern-001' },
      body: { tenantId: 'attacker-tenant' },
    });

    await controller.getPattern(req, makeRes(), makeNext());

    expect(mockPatternsService.getPattern).toHaveBeenCalledWith('tenant-abc', 'pattern-001');
  });
});

// ===========================================================================
// updatePattern
// ===========================================================================

describe('updatePattern', () => {
  // TC-106
  it('propagates 503 via next() when service throws ServiceUnavailableError (INT-002 stub)', async () => {
    // ✓ ASVS:V1.6.1 — fail-closed stub; 503 propagated
    mockPatternsService.updatePattern.mockRejectedValue(
      new ServiceUnavailableError('INT-002 unavailable'),
    );

    const req = makeAdminReq({
      params: { patternId: 'pattern-001' },
      body: { name: '[TEST-DATA]' },
    });
    const next = makeNext();

    await controller.updatePattern(req, makeRes(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ServiceUnavailableError));
  });

  it('sets X-Integration-Stubbed: INT-002 header and returns updated pattern on success', async () => {
    const pattern = makePattern({ name: '[TEST-DATA]' });
    mockPatternsService.updatePattern.mockResolvedValue(pattern);

    const req = makeAdminReq({
      params: { patternId: 'pattern-001' },
      body: { name: '[TEST-DATA]' },
    });
    const res = makeRes();

    await controller.updatePattern(req, res, makeNext());

    expect(res.setHeader).toHaveBeenCalledWith('X-Integration-Stubbed', 'INT-002');
    expect(res.json).toHaveBeenCalledWith(pattern);
  });

  it('creates audit entry for admin user when updatePattern succeeds (BR-008)', async () => {
    // ✓ ASVS:V7.2.2 — audit trail created for admin pattern update
    const pattern = makePattern();
    mockPatternsService.updatePattern.mockResolvedValue(pattern);

    const req = makeAdminReq({
      params: { patternId: 'pattern-001' },
      body: { name: '[TEST-DATA]' },
    });

    await controller.updatePattern(req, makeRes(), makeNext());

    expect(mockAuditService.createEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'UPDATE_PATTERN',
        tenantId: 'tenant-abc',
        actorId: 'user-xyz',
        resourceId: 'pattern-001',
      }),
    );
  });

  // FAC-S4-030 — write operations require planner-admin role
  it('passes identity from req.user for audit (planner-admin path)', async () => {
    // ✓ ASVS:V4.1.2 — pattern update requires planner-admin (enforced at route layer)
    const pattern = makePattern();
    mockPatternsService.updatePattern.mockResolvedValue(pattern);

    const req = makeAdminReq({
      user: { tenantId: 'tenant-abc', userId: 'admin-user', roles: [PLANNER_ROLES.PLANNER_ADMIN] },
      params: { patternId: 'pattern-001' },
      body: {},
    });

    await controller.updatePattern(req, makeRes(), makeNext());

    expect(mockAuditService.createEvent).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'admin-user' }),
    );
  });
});

// ===========================================================================
// deactivatePattern
// ===========================================================================

describe('deactivatePattern', () => {
  // TC-107
  it('propagates 503 via next() when service throws ServiceUnavailableError (INT-002 stub)', async () => {
    // ✓ ASVS:V1.6.1 — fail-closed stub; 503 propagated
    mockPatternsService.deactivatePattern.mockRejectedValue(
      new ServiceUnavailableError('INT-002 unavailable'),
    );

    const req = makeAdminReq({ params: { patternId: 'pattern-001' } });
    const next = makeNext();

    await controller.deactivatePattern(req, makeRes(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ServiceUnavailableError));
  });

  it('sets X-Integration-Stubbed: INT-002 header and returns 204 on success', async () => {
    mockPatternsService.deactivatePattern.mockResolvedValue(undefined);

    const req = makeAdminReq({ params: { patternId: 'pattern-001' } });
    const res = makeRes();

    await controller.deactivatePattern(req, res, makeNext());

    expect(res.setHeader).toHaveBeenCalledWith('X-Integration-Stubbed', 'INT-002');
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  // TC-054
  it('creates audit entry when deactivatePattern succeeds (BR-008)', async () => {
    // ✓ ASVS:V7.2.2 — audit trail created for admin pattern deactivation
    mockPatternsService.deactivatePattern.mockResolvedValue(undefined);

    const req = makeAdminReq({ params: { patternId: 'pattern-001' } });
    await controller.deactivatePattern(req, makeRes(), makeNext());

    expect(mockAuditService.createEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'DEACTIVATE_PATTERN',
        tenantId: 'tenant-abc',
        actorId: 'user-xyz',
        resourceId: 'pattern-001',
      }),
    );
  });

  // FAC-S4-030: write ops require planner-admin (route-enforced, controller verifies audit actor)
  it('audit entry actorId matches the authenticated admin userId (FAC-S4-030 / BR-007)', async () => {
    // ✓ ASVS:V4.1.2 — planner-admin role enforced at route layer; controller logs correct actor
    mockPatternsService.deactivatePattern.mockResolvedValue(undefined);

    const req = makeAdminReq({
      user: { tenantId: 'tenant-abc', userId: 'admin-user-001', roles: [PLANNER_ROLES.PLANNER_ADMIN] },
      params: { patternId: 'pattern-001' },
    });

    await controller.deactivatePattern(req, makeRes(), makeNext());

    expect(mockAuditService.createEvent).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'admin-user-001' }),
    );
  });

  it('does not create audit entry when service throws 503 (audit is post-service)', async () => {
    mockPatternsService.deactivatePattern.mockRejectedValue(
      new ServiceUnavailableError('INT-002 unavailable'),
    );

    await controller.deactivatePattern(
      makeAdminReq({ params: { patternId: 'pattern-001' } }),
      makeRes(),
      makeNext(),
    );

    expect(mockAuditService.createEvent).not.toHaveBeenCalled();
  });

  it('continues response even when audit write fails (non-blocking audit)', async () => {
    mockPatternsService.deactivatePattern.mockResolvedValue(undefined);
    mockAuditService.createEvent.mockRejectedValue(new Error('audit failure'));

    const res = makeRes();
    const next = makeNext();
    await controller.deactivatePattern(
      makeAdminReq({ params: { patternId: 'pattern-001' } }),
      res,
      next,
    );

    expect(res.status).toHaveBeenCalledWith(204);
    expect(next).not.toHaveBeenCalledWith(expect.any(Error));
  });
});

// ===========================================================================
// X-Integration-Stubbed header — cross-cutting concern (TC-047)
// ===========================================================================

describe('X-Integration-Stubbed header on all pattern operations', () => {
  it('listPatterns sets X-Integration-Stubbed: INT-002', async () => {
    mockPatternsService.listPatterns.mockResolvedValue([]);
    const res = makeRes();
    await controller.listPatterns(makeUserReq(), res, makeNext());
    expect(res.setHeader).toHaveBeenCalledWith('X-Integration-Stubbed', 'INT-002');
  });

  it('createPattern sets X-Integration-Stubbed: INT-002 on success', async () => {
    mockPatternsService.createPattern.mockResolvedValue(makePattern());
    const res = makeRes();
    await controller.createPattern(makeAdminReq({ body: makeCreateInput() }), res, makeNext());
    expect(res.setHeader).toHaveBeenCalledWith('X-Integration-Stubbed', 'INT-002');
  });

  it('getPattern sets X-Integration-Stubbed: INT-002 on success', async () => {
    mockPatternsService.getPattern.mockResolvedValue(makePattern());
    const res = makeRes();
    await controller.getPattern(makeUserReq({ params: { patternId: 'pattern-001' } }), res, makeNext());
    expect(res.setHeader).toHaveBeenCalledWith('X-Integration-Stubbed', 'INT-002');
  });

  it('updatePattern sets X-Integration-Stubbed: INT-002 on success', async () => {
    mockPatternsService.updatePattern.mockResolvedValue(makePattern());
    const res = makeRes();
    await controller.updatePattern(
      makeAdminReq({ params: { patternId: 'pattern-001' }, body: {} }),
      res,
      makeNext(),
    );
    expect(res.setHeader).toHaveBeenCalledWith('X-Integration-Stubbed', 'INT-002');
  });

  it('deactivatePattern sets X-Integration-Stubbed: INT-002 on success', async () => {
    mockPatternsService.deactivatePattern.mockResolvedValue(undefined);
    const res = makeRes();
    await controller.deactivatePattern(
      makeAdminReq({ params: { patternId: 'pattern-001' } }),
      res,
      makeNext(),
    );
    expect(res.setHeader).toHaveBeenCalledWith('X-Integration-Stubbed', 'INT-002');
  });
});
