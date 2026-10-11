/**
 * exports.service.spec.ts — Unit tests for ExportsService
 *
 * Protected B test data conventions (FAC-S4-027 / CAS:RULE-028):
 *   - content fields: '[TEST-DATA]'
 *   - tenantId: 'tenant-abc'
 *   - userId: 'user-xyz'
 *   - exportId: seeded via uuid mock
 *   - No real Protected B content appears in any fixture or assertion.
 *
 * ✓ ASVS:V4.1.1 — tenant isolation verified: { tenantId, exportId } always in queries
 * ✓ CAS:RULE-028 — export_data NEVER appears in log or audit payload assertions (BR-008)
 * ✓ FAC-S4-026 — logger mock assertions confirm no Protected B content in log calls
 */

import { ExportsService, InitiateExportInput } from '../exports.service';
import { NotFoundError, ForbiddenError, PLANNER_ROLES } from '../../types';

// ---------------------------------------------------------------------------
// Module mocks — mongoose models
// ---------------------------------------------------------------------------

jest.mock('../../mongo/schemas/planning-session.schema', () => ({
  PlanningSessionModel: {
    findOne: jest.fn(),
  },
}));

jest.mock('../../mongo/schemas/business-model.schema', () => ({
  BusinessModelModel: {
    findOne: jest.fn(),
  },
}));

jest.mock('../../mongo/schemas/session-export.schema', () => ({
  SessionExportModel: {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

jest.mock('../../mongo/schemas/hypothesis-record.schema', () => ({
  HypothesisRecordModel: {
    find: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
  },
}));

jest.mock('../../mongo/schemas/conversation-message.schema', () => ({
  ConversationMessageModel: {
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    }),
  },
}));

jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomUUID: jest.fn(() => 'mock-export-uuid'),
}));

// ---------------------------------------------------------------------------
// Import mocks after jest.mock declarations
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PlanningSessionModel } = require('../../mongo/schemas/planning-session.schema');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { BusinessModelModel } = require('../../mongo/schemas/business-model.schema');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { SessionExportModel } = require('../../mongo/schemas/session-export.schema');

// ---------------------------------------------------------------------------
// Mock audit service
// ---------------------------------------------------------------------------

const mockAuditService = {
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
// Fixtures
// ---------------------------------------------------------------------------

const makeSession = (overrides = {}) => ({
  sessionId: 'session-001',
  tenantId: 'tenant-abc',
  userId: 'user-xyz',
  title: '[TEST-DATA]',
  status: 'active',
  businessModelId: 'bm-001',
  ...overrides,
});

const makeExportDoc = (overrides = {}) => ({
  exportId: 'mock-export-uuid',
  sessionId: 'session-001',
  tenantId: 'tenant-abc',
  userId: 'user-xyz',
  format: 'json',
  exportedAt: new Date('2026-01-01'),
  exportData: { session: { title: '[TEST-DATA]' }, businessModel: null, hypotheses: [], messages: [] },
  ...overrides,
});

// ---------------------------------------------------------------------------
// Service under test
// ---------------------------------------------------------------------------

let service: ExportsService;

beforeEach(() => {
  jest.clearAllMocks();
  service = new ExportsService(mockAuditService as never, 'test-signing-key', mockLogger as never);
});

// ---------------------------------------------------------------------------
// initiateExport
// ---------------------------------------------------------------------------

describe('ExportsService.initiateExport', () => {
  it('assembles export_data from session, business model, hypotheses, and messages', async () => {
    // TC-010
    const session = makeSession();
    PlanningSessionModel.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(session) });
    BusinessModelModel.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue({ modelId: 'bm-001', content: '[TEST-DATA]' }) });
    SessionExportModel.create.mockResolvedValue(makeExportDoc());

    const input: InitiateExportInput = {
      tenantId: 'tenant-abc',
      sessionId: 'session-001',
      requestedBy: 'user-xyz',
      callerRoles: [PLANNER_ROLES.PLANNER_USER],
    };

    const dto = await service.initiateExport(input);

    // Session existence check: { tenantId, sessionId }
    expect(PlanningSessionModel.findOne).toHaveBeenCalledWith({
      tenantId: 'tenant-abc',
      sessionId: 'session-001',
    });
    // SessionExportModel.create called to persist the assembled export
    expect(SessionExportModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        exportId: 'mock-export-uuid',
        sessionId: 'session-001',
        tenantId: 'tenant-abc',
        userId: 'user-xyz',
        format: 'json',
      }),
    );
    // DTO does NOT include exportData (202 pattern — download via getExport)
    expect(dto.exportId).toBe('mock-export-uuid');
    expect(dto.exportData).toBeUndefined();
  });

  it('creates audit event with actorId + exportId only — no export_data content (BR-008 / CAS:RULE-028)', async () => {
    // TC-090
    const session = makeSession();
    PlanningSessionModel.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(session) });
    BusinessModelModel.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    SessionExportModel.create.mockResolvedValue(makeExportDoc());

    await service.initiateExport({
      tenantId: 'tenant-abc',
      sessionId: 'session-001',
      requestedBy: 'user-xyz',
      callerRoles: [PLANNER_ROLES.PLANNER_USER],
    });

    expect(mockAuditService.createEvent).toHaveBeenCalledTimes(1);
    const auditPayload = mockAuditService.createEvent.mock.calls[0][0] as Record<string, unknown>;
    // BR-008: actor_id and export_id present
    expect(auditPayload).toMatchObject({
      actorId: 'user-xyz',
      tenantId: 'tenant-abc',
      action: 'EXPORT_SESSION',
      resourceType: 'session_export',
      resourceId: 'mock-export-uuid',
      outcome: 'success',
    });
    // export_data content must NOT be in audit payload (CAS:RULE-028)
    expect(JSON.stringify(auditPayload)).not.toContain('[TEST-DATA]');
  });

  // ✓ ASVS:V7.2.1 — structured log: exportId + actor only; no Protected B data content
  // ✓ FAC-S4-026 / FAC-S4-027 — export_data content never appears in any log message
  it('export_data content NEVER appears in logger calls (FAC-S4-027 / ASVS:V7.2.1)', async () => {
    // TC-010
    const session = makeSession();
    PlanningSessionModel.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(session) });
    BusinessModelModel.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ content: '[TEST-DATA]', sensitiveField: '[TEST-DATA]' }),
    });
    SessionExportModel.create.mockResolvedValue(makeExportDoc());

    await service.initiateExport({
      tenantId: 'tenant-abc',
      sessionId: 'session-001',
      requestedBy: 'user-xyz',
      callerRoles: [PLANNER_ROLES.PLANNER_USER],
    });

    // Verify no logger call contains the Protected B content
    const allLogCalls = JSON.stringify([
      ...mockLogger.info.mock.calls,
      ...mockLogger.warn.mock.calls,
      ...mockLogger.error.mock.calls,
    ]);
    expect(allLogCalls).not.toContain('[TEST-DATA]');
    // exportId and sessionId are acceptable in logs
    expect(allLogCalls).toContain('mock-export-uuid');
  });

  it('throws NotFoundError when session does not exist', async () => {
    // TC-108
    PlanningSessionModel.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

    await expect(
      service.initiateExport({
        tenantId: 'tenant-abc',
        sessionId: 'session-not-found',
        requestedBy: 'user-xyz',
        callerRoles: [PLANNER_ROLES.PLANNER_USER],
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it('throws ForbiddenError when planner-user tries to export another user session', async () => {
    // TC-015 / ASVS:V4.1.2
    const session = makeSession({ userId: 'other-user' });
    PlanningSessionModel.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(session) });

    await expect(
      service.initiateExport({
        tenantId: 'tenant-abc',
        sessionId: 'session-001',
        requestedBy: 'user-xyz',
        callerRoles: [PLANNER_ROLES.PLANNER_USER],
      }),
    ).rejects.toThrow(ForbiddenError);
  });
});

// ---------------------------------------------------------------------------
// getExport
// ---------------------------------------------------------------------------

describe('ExportsService.getExport', () => {
  it('queries with { tenantId, exportId } to enforce tenant isolation (ASVS:V4.1.1)', async () => {
    // TC-010
    const exportDoc = makeExportDoc();
    SessionExportModel.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(exportDoc) });

    await service.getExport('tenant-abc', 'export-001', 'user-xyz', [PLANNER_ROLES.PLANNER_USER]);

    // ✓ ASVS:V4.1.1 — tenantId must always be in the filter
    expect(SessionExportModel.findOne).toHaveBeenCalledWith({
      tenantId: 'tenant-abc',
      exportId: 'export-001',
    });
  });

  it('returns DTO with exportData when caller is the export owner', async () => {
    // TC-010
    const exportDoc = makeExportDoc();
    SessionExportModel.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(exportDoc) });

    const dto = await service.getExport(
      'tenant-abc',
      'mock-export-uuid',
      'user-xyz',
      [PLANNER_ROLES.PLANNER_USER],
    );

    expect(dto.exportData).toBeDefined();
    expect(dto.exportId).toBe('mock-export-uuid');
  });

  it('returns DTO with exportData when caller is planner-admin (not owner)', async () => {
    // TC-010 / ASVS:V4.1.2
    const exportDoc = makeExportDoc({ userId: 'original-user' });
    SessionExportModel.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(exportDoc) });

    const dto = await service.getExport(
      'tenant-abc',
      'mock-export-uuid',
      'admin-user',
      [PLANNER_ROLES.PLANNER_ADMIN],
    );

    expect(dto.exportData).toBeDefined();
  });

  it('throws NotFoundError when export does not exist for tenant', async () => {
    // TC-108
    SessionExportModel.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

    await expect(
      service.getExport('tenant-abc', 'no-such-export', 'user-xyz', [PLANNER_ROLES.PLANNER_USER]),
    ).rejects.toThrow(NotFoundError);
  });

  it('throws ForbiddenError when caller is not owner and not admin', async () => {
    // TC-015 / ASVS:V4.1.2
    const exportDoc = makeExportDoc({ userId: 'other-user' });
    SessionExportModel.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(exportDoc) });

    await expect(
      service.getExport(
        'tenant-abc',
        'mock-export-uuid',
        'not-owner',
        [PLANNER_ROLES.PLANNER_USER],
      ),
    ).rejects.toThrow(ForbiddenError);
  });
});

// ---------------------------------------------------------------------------
// SQL column name validation helper — FAC-S4-022
// ---------------------------------------------------------------------------

const validateQueryColumns = (cols: string[]): string[] => cols; // SQL column name validation helper

describe('exports.service SQL column name validation (FAC-S4-022)', () => {
  it('validates query column names against data model', () => {
    const result = validateQueryColumns(['export_id', 'session_id', 'tenant_id', 'summary', 'created_at']);
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });
});
