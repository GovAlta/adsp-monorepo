/**
 * exports.controller.spec.ts — Unit tests for ExportsController
 *
 * Protected B test data conventions (FAC-S4-027 / CAS:RULE-028):
 *   - content fields: '[TEST-DATA]'
 *   - tenantId: 'tenant-abc'
 *   - userId: 'user-xyz'
 *   - exportId: 'export-001'
 *   - No real Protected B content appears in any fixture or assertion.
 *
 * ✓ ASVS:V4.1.1 — identity sourced from req.user (JWT), never from request body
 * ✓ ASVS:V4.1.2 — owner-or-admin access checks on getExport verified by negative tests
 * ✓ CAS:RULE-015 — Protected B export data access restricted; log assertions confirm no content leak
 * ✓ FAC-S4-026 — export_data content never appears in logger calls (BR-008)
 */

import { Request, Response, NextFunction } from 'express';
import { ExportsController } from '../exports.controller';
import { ExportsService, SessionExportDTO } from '../../services/exports.service';
import { NotFoundError, ForbiddenError, PLANNER_ROLES } from '../../types';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('../../services/exports.service');

const mockExportsService = {
  initiateExport: jest.fn(),
  listExportsForSession: jest.fn(),
  getExport: jest.fn(),
} as unknown as jest.Mocked<ExportsService>;

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeExportDTO = (overrides: Partial<SessionExportDTO> = {}): SessionExportDTO => ({
  exportId: 'export-001',
  sessionId: 'session-001',
  tenantId: 'tenant-abc',
  userId: 'user-xyz',
  format: 'json',
  exportedAt: new Date('2026-01-01'),
  ...overrides,
});

const makeReq = (overrides: Partial<Request> = {}): Request =>
  ({
    user: {
      tenantId: 'tenant-abc',
      userId: 'user-xyz',
      roles: [PLANNER_ROLES.PLANNER_USER],
    },
    body: {},
    params: { sessionId: 'session-001' },
    query: {},
    path: '/api/v1/sessions/session-001/exports',
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

let controller: ExportsController;

beforeEach(() => {
  jest.clearAllMocks();
  controller = new ExportsController(mockExportsService, mockLogger as never);
});

// ---------------------------------------------------------------------------
// initiateExport
// ---------------------------------------------------------------------------

describe('initiateExport', () => {
  // TC-010 (UC-008 main flow)
  it('returns HTTP 201 with SessionExport DTO when session exists', async () => {
    // TC-010
    const dto = makeExportDTO();
    mockExportsService.initiateExport.mockResolvedValue(dto);

    const req = makeReq({ params: { sessionId: 'session-001' } });
    const res = makeRes();
    const next = makeNext();

    await controller.initiateExport(req, res, next);

    expect(mockExportsService.initiateExport).toHaveBeenCalledWith({
      tenantId: 'tenant-abc',
      sessionId: 'session-001',
      requestedBy: 'user-xyz',
      callerRoles: [PLANNER_ROLES.PLANNER_USER],
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(dto);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next(NotFoundError) when session does not exist', async () => {
    // TC-108
    mockExportsService.initiateExport.mockRejectedValue(
      new NotFoundError('PlanningSession', 'session-001'),
    );

    const req = makeReq({ params: { sessionId: 'session-001' } });
    const res = makeRes();
    const next = makeNext();

    await controller.initiateExport(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    expect(res.status).not.toHaveBeenCalled();
  });

  it('calls next(ForbiddenError) when caller does not own the session', async () => {
    // TC-015
    mockExportsService.initiateExport.mockRejectedValue(
      new ForbiddenError('You may only export your own planning sessions'),
    );

    const req = makeReq({
      user: { tenantId: 'tenant-abc', userId: 'other-user', roles: [PLANNER_ROLES.PLANNER_USER] },
      params: { sessionId: 'session-001' },
    });
    const res = makeRes();
    const next = makeNext();

    await controller.initiateExport(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
    expect(res.status).not.toHaveBeenCalled();
  });

  // ✓ ASVS:V7.2.1 — log export action by exportId only; no export_data content
  // ✓ FAC-S4-026 — Protected B export content must never appear in logger calls (BR-008)
  it('logs exportId and sessionId but NOT export_data content (ASVS:V7.2.1 / FAC-S4-027 / BR-008)', async () => {
    // TC-010
    const dto = makeExportDTO({ exportData: { session: { title: '[TEST-DATA]' }, messages: ['[TEST-DATA]'] } });
    mockExportsService.initiateExport.mockResolvedValue(dto);

    const req = makeReq({ params: { sessionId: 'session-001' } });
    await controller.initiateExport(req, makeRes(), makeNext());

    expect(mockLogger.info).toHaveBeenCalled();
    const logCalls = JSON.stringify(mockLogger.info.mock.calls);
    // exportId and sessionId should be logged
    expect(logCalls).toContain('export-001');
    expect(logCalls).toContain('session-001');
    // export_data content must NOT appear in any log call
    expect(logCalls).not.toContain('[TEST-DATA]');
  });
});

// ---------------------------------------------------------------------------
// getExport
// ---------------------------------------------------------------------------

describe('getExport', () => {
  it('returns HTTP 200 with export document when found and caller is owner', async () => {
    // TC-010
    const dto = makeExportDTO({ exportData: { session: '[TEST-DATA]' } });
    mockExportsService.getExport.mockResolvedValue(dto);

    const req = makeReq({
      params: { sessionId: 'session-001', exportId: 'export-001' },
    });
    const res = makeRes();
    const next = makeNext();

    await controller.getExport(req, res, next);

    expect(mockExportsService.getExport).toHaveBeenCalledWith(
      'tenant-abc',
      'export-001',
      'user-xyz',
      [PLANNER_ROLES.PLANNER_USER],
    );
    expect(res.json).toHaveBeenCalledWith(dto);
  });

  it('returns RFC 7807 HTTP 404 when export document not found', async () => {
    // TC-108
    mockExportsService.getExport.mockRejectedValue(
      new NotFoundError('SessionExport', 'export-001'),
    );

    const req = makeReq({
      params: { sessionId: 'session-001', exportId: 'export-001' },
      path: '/api/v1/sessions/session-001/exports/export-001',
    });
    const res = makeRes();
    const next = makeNext();

    await controller.getExport(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    const body = (res.json as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
    expect(body).toMatchObject({
      type: expect.stringContaining('not-found'),
      status: 404,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns RFC 7807 HTTP 403 when caller is not export owner AND not planner-admin', async () => {
    // TC-015 / ASVS:V4.1.2
    mockExportsService.getExport.mockRejectedValue(
      new ForbiddenError('Access to this export requires admin role or ownership'),
    );

    const req = makeReq({
      user: { tenantId: 'tenant-abc', userId: 'other-user', roles: [PLANNER_ROLES.PLANNER_USER] },
      params: { sessionId: 'session-001', exportId: 'export-001' },
      path: '/api/v1/sessions/session-001/exports/export-001',
    });
    const res = makeRes();
    const next = makeNext();

    await controller.getExport(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    const body = (res.json as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
    expect(body).toMatchObject({
      type: expect.stringContaining('forbidden'),
      status: 403,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('planner-admin can retrieve any tenant export (no 403 thrown)', async () => {
    // TC-010 / ASVS:V4.1.2
    const dto = makeExportDTO();
    mockExportsService.getExport.mockResolvedValue(dto);

    const req = makeReq({
      user: { tenantId: 'tenant-abc', userId: 'admin-user', roles: [PLANNER_ROLES.PLANNER_ADMIN] },
      params: { sessionId: 'session-001', exportId: 'export-001' },
    });
    const res = makeRes();
    const next = makeNext();

    await controller.getExport(req, res, next);

    expect(res.json).toHaveBeenCalledWith(dto);
    expect(next).not.toHaveBeenCalled();
  });

  // ✓ ASVS:V7.2.1 — log access event: exportId + actor; no content in log
  it('logs exportId but NOT export_data content on getExport success (ASVS:V7.2.1)', async () => {
    // TC-010
    const dto = makeExportDTO({ exportData: { session: { title: '[TEST-DATA]' } } });
    mockExportsService.getExport.mockResolvedValue(dto);

    const req = makeReq({
      params: { sessionId: 'session-001', exportId: 'export-001' },
    });
    await controller.getExport(req, makeRes(), makeNext());

    const logCalls = JSON.stringify(mockLogger.info.mock.calls);
    expect(logCalls).toContain('export-001');
    expect(logCalls).not.toContain('[TEST-DATA]');
  });
});
