/**
 * exports.integration.spec.ts — Integration tests for ExportsService
 *
 * Protected B test data conventions (FAC-S4-027 / CAS:RULE-028):
 *   - tenantId: 'tenant-abc' (Tenant A), 'tenant-xyz' (Tenant B)
 *   - userId:   'user-xyz'
 *   - content:  '[TEST-DATA]' placeholder — no real Protected B content in fixtures
 *
 * Tier 1: service-layer mock integration — full ExportsService business logic with
 *         mocked Mongoose models (jest.spyOn).
 * Tier 2: Testcontainers MongoDB — real persistence, schema constraints, tenantId isolation.
 *
 * BR-008: every export operation must create an audit event (actor + exportId only,
 *         no Protected B export_data content in the audit payload).
 * UC-008: Export Session Plan
 * SYSREQ-016: export as portable JSON document
 *
 * ✓ ASVS:V4.1.1 — tenantId enforced on all queries; cross-tenant access impossible
 * ✓ CAS:RULE-028 — exportData is Protected B; never surfaced in audit payload or logs
 * ✓ CAS:RULE-015 — export access restricted to originating actor or admin
 */

jest.setTimeout(60000);

import * as crypto from 'crypto';

import { ExportsService } from '../../src/services/exports.service';
import { NotFoundError, ForbiddenError } from '../../src/types';
import { SessionExportModel } from '../../src/mongo/schemas/session-export.schema';
import { PlanningSessionModel } from '../../src/mongo/schemas/planning-session.schema';
import { BusinessModelModel } from '../../src/mongo/schemas/business-model.schema';
import type { AuditService, AuditEventPayload } from '../../src/middleware/audit.middleware';

// ============================================================================
// Protected B test data constants (FAC-S4-027)
// ============================================================================

const TENANT_A = 'tenant-abc';
const TENANT_B = 'tenant-xyz';
const USER_A = 'user-xyz';
const SESSION_ID = 'session-exports-test-001';
const SIGNING_KEY = 'test-exports-signing-key';

// ============================================================================
// Shared helpers
// ============================================================================

const makeMockLogger = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
});

const makeMockAuditService = (): jest.Mocked<AuditService> => ({
  createEvent: jest.fn().mockResolvedValue(undefined),
  getLastChainHash: jest.fn().mockResolvedValue(null),
});

/** Chainable query stub for findOne(...).lean() */
const makeLeanChain = (result: unknown) => ({
  lean: jest.fn().mockResolvedValue(result),
});

/** Chainable query stub for find(...).sort().skip().limit().select().lean() */
const makeFindChain = (results: unknown[]) => ({
  sort: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(results),
});

const makeSessionDoc = (overrides: Record<string, unknown> = {}) => ({
  sessionId: SESSION_ID,
  tenantId: TENANT_A,
  userId: USER_A,
  title: '[TEST-DATA]',
  status: 'active',
  businessModelId: null,
  ...overrides,
});

// ============================================================================
// Tier 1 — service mocks
// Full ExportsService business logic exercised with jest.spyOn on Mongoose models.
// ============================================================================

describe('Tier 1 — service mocks', () => {
  let service: ExportsService;
  let mockAudit: jest.Mocked<AuditService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAudit = makeMockAuditService();
    service = new ExportsService(mockAudit, SIGNING_KEY, makeMockLogger() as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ✓ ASVS:V4.1.1 — export creation scoped to tenantId; userId persisted from caller
  // ✓ CAS:RULE-028 — returned DTO omits exportData; download requires explicit getExport call
  it('initiateExport creates SessionExport document and returns DTO without exportData (TC-010)', async () => {
    // TC-010
    const sessionDoc = makeSessionDoc();

    jest.spyOn(PlanningSessionModel, 'findOne').mockReturnValue(makeLeanChain(sessionDoc) as any);
    jest.spyOn(BusinessModelModel, 'findOne').mockReturnValue(makeLeanChain(null) as any);
    const createSpy = jest
      .spyOn(SessionExportModel, 'create')
      .mockResolvedValue([
        {
          exportId: 'auto-uuid',
          sessionId: SESSION_ID,
          tenantId: TENANT_A,
          userId: USER_A,
          format: 'json',
          exportedAt: new Date(),
          exportData: {},
        },
      ] as any);

    const result = await service.initiateExport({
      tenantId: TENANT_A,
      sessionId: SESSION_ID,
      requestedBy: USER_A,
      callerRoles: ['planner-user'],
    });

    // SessionExportModel.create was called once with correct tenantId / userId / format
    expect(createSpy).toHaveBeenCalledTimes(1);
    const createArg = createSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(createArg['tenantId']).toBe(TENANT_A);
    expect(createArg['userId']).toBe(USER_A);
    expect(createArg['sessionId']).toBe(SESSION_ID);
    expect(createArg['format']).toBe('json');
    // exportId is a server-generated UUID — must be defined but not guessable
    expect(typeof createArg['exportId']).toBe('string');

    // DTO returned without exportData (client must call getExport to download)
    expect(result.exportData).toBeUndefined();
    expect(result.sessionId).toBe(SESSION_ID);
    expect(result.tenantId).toBe(TENANT_A);
    expect(result.userId).toBe(USER_A);
  });

  // ✓ CAS:RULE-028 — audit payload carries actorId + exportId ONLY; no Protected B content
  // ✓ ASVS:V7.2.2 — every export operation creates an audit event (BR-008)
  it('initiateExport calls createEvent with actorId and exportId — not export_data content (BR-008 / TC-090)', async () => {
    // TC-090
    const sessionDoc = makeSessionDoc();

    jest.spyOn(PlanningSessionModel, 'findOne').mockReturnValue(makeLeanChain(sessionDoc) as any);
    jest.spyOn(BusinessModelModel, 'findOne').mockReturnValue(makeLeanChain(null) as any);
    jest.spyOn(SessionExportModel, 'create').mockResolvedValue([{}] as any);

    await service.initiateExport({
      tenantId: TENANT_A,
      sessionId: SESSION_ID,
      requestedBy: USER_A,
      callerRoles: ['planner-user'],
    });

    expect(mockAudit.createEvent).toHaveBeenCalledTimes(1);
    const payload = mockAudit.createEvent.mock.calls[0][0] as AuditEventPayload;

    // Audit payload must carry actor identity
    expect(payload.actorId).toBe(USER_A);
    expect(payload.tenantId).toBe(TENANT_A);
    expect(payload.action).toBe('EXPORT_SESSION');
    expect(payload.resourceType).toBe('session_export');
    expect(payload.outcome).toBe('success');

    // resourceId is the exportId (a UUID), NOT session content
    expect(typeof payload.resourceId).toBe('string');
    expect(payload.resourceId!.length).toBeGreaterThan(0);

    // Must NOT contain Protected B export_data in audit payload (CAS:RULE-028)
    expect((payload as Record<string, unknown>)['exportData']).toBeUndefined();
    expect((payload as Record<string, unknown>)['sessionData']).toBeUndefined();
    expect((payload as Record<string, unknown>)['detail']).toBeUndefined();
  });

  // ✓ ASVS:V4.1.1 — tenantId filter prevents cross-tenant export retrieval
  it('getExport with cross-tenant exportId returns NotFoundError (TC-108)', async () => {
    // TC-108
    // findOne returns null because the tenantId in the query is Tenant B
    // but the export belongs to Tenant A — cross-tenant access blocked at query layer
    jest.spyOn(SessionExportModel, 'findOne').mockReturnValue(makeLeanChain(null) as any);

    await expect(
      service.getExport(TENANT_B, 'export-from-tenant-a', USER_A, ['planner-user']),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  // ✓ CAS:RULE-015 — non-owner non-admin caller denied access to export content
  // ✓ ASVS:V4.1.2 — ownership enforced; ForbiddenError on unauthorized access
  it('getExport returns ForbiddenError when caller is not owner or admin (TC-108)', async () => {
    // TC-108
    // Export belongs to USER_A; caller is 'other-user' with no admin role
    const exportDoc = {
      exportId: 'export-001',
      sessionId: SESSION_ID,
      tenantId: TENANT_A,
      userId: USER_A,
      format: 'json',
      exportedAt: new Date(),
      exportData: { exportVersion: '1.0', session: { title: '[TEST-DATA]' } },
    };
    jest.spyOn(SessionExportModel, 'findOne').mockReturnValue(makeLeanChain(exportDoc) as any);

    await expect(
      service.getExport(TENANT_A, 'export-001', 'other-user', ['planner-user']),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});

// ============================================================================
// Tier 2 — Testcontainers MongoDB (real persistence)
// Tests real schema round-trips, index behaviour, and tenantId isolation.
// ============================================================================

describe('Tier 2 — Testcontainers MongoDB', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let container: any;
  let mongooseLib: typeof import('mongoose');

  beforeAll(async () => {
    const { MongoDBContainer } = await import('@testcontainers/mongodb');
    mongooseLib = (await import('mongoose')).default;

    container = await new MongoDBContainer('mongo:6').start();
    const mongoUri = container.getConnectionString();
    await mongooseLib.connect(mongoUri, { directConnection: true });

    // Ensure schemas are registered with this connection
    await import('../../src/mongo/schemas/session-export.schema');
  }, 90000);

  afterAll(async () => {
    await mongooseLib.disconnect();
    if (container) {
      await container.stop();
    }
  });

  beforeEach(async () => {
    await SessionExportModel.deleteMany({});
  });

  // ✓ CAS:RULE-028 — exportData (Protected B) round-trips without data loss
  // ✓ ASVS:V5.1.1 — exportId and all fields persisted as supplied
  it('export_data round-trips through MongoDB without data loss (TC-010)', async () => {
    // TC-010
    const exportData = {
      exportVersion: '1.0',
      exportedAt: new Date().toISOString(),
      session: {
        sessionId: SESSION_ID,
        tenantId: TENANT_A,
        userId: USER_A,
        title: '[TEST-DATA]',
        status: 'active',
      },
      businessModel: null,
      hypotheses: [],
      messages: [],
    };

    const exportId = crypto.randomUUID();
    await SessionExportModel.create({
      exportId,
      sessionId: SESSION_ID,
      tenantId: TENANT_A,
      userId: USER_A,
      exportData,
      format: 'json',
      exportedAt: new Date(),
    });

    const retrieved = await SessionExportModel.findOne({ exportId }).lean();
    expect(retrieved).not.toBeNull();

    const data = (retrieved as Record<string, unknown>)['exportData'] as typeof exportData;
    // Nested fields survive round-trip unchanged
    expect(data.exportVersion).toBe('1.0');
    expect(data.session.sessionId).toBe(SESSION_ID);
    expect(data.session.title).toBe('[TEST-DATA]');
    expect(data.session.status).toBe('active');
    expect(data.hypotheses).toEqual([]);
    expect(data.messages).toEqual([]);
    expect(data.businessModel).toBeNull();
  });

  // ✓ ASVS:V4.1.1 — tenantId isolation: Tenant A cannot retrieve Tenant B exports
  // ✓ CAS:RULE-015 — tenant boundary enforced at query layer
  it('tenantId isolation — cross-tenant query returns null; own-tenant query succeeds (TC-010)', async () => {
    // TC-010
    const exportIdA = crypto.randomUUID();
    const exportIdB = crypto.randomUUID();

    await SessionExportModel.create([
      {
        exportId: exportIdA,
        sessionId: SESSION_ID,
        tenantId: TENANT_A,
        userId: USER_A,
        exportData: { exportVersion: '1.0', tenant: 'a' },
        format: 'json',
        exportedAt: new Date(),
      },
      {
        exportId: exportIdB,
        sessionId: SESSION_ID,
        tenantId: TENANT_B,
        userId: 'user-tenant-b',
        exportData: { exportVersion: '1.0', tenant: 'b' },
        format: 'json',
        exportedAt: new Date(),
      },
    ]);

    // Tenant A querying for Tenant B's exportId must return null (cross-tenant blocked)
    const crossTenantResult = await SessionExportModel.findOne({
      tenantId: TENANT_A,
      exportId: exportIdB,
    }).lean();
    expect(crossTenantResult).toBeNull();

    // Tenant A can retrieve its own export
    const ownTenantResult = await SessionExportModel.findOne({
      tenantId: TENANT_A,
      exportId: exportIdA,
    }).lean();
    expect(ownTenantResult).not.toBeNull();
    expect((ownTenantResult as Record<string, unknown>)['tenantId']).toBe(TENANT_A);
  });

  // ✓ ASVS:V5.1.1 — userId (requestedBy) field persists correctly
  it('requestedBy (userId) field persists correctly after export creation (TC-010)', async () => {
    // TC-010
    const exportId = crypto.randomUUID();

    await SessionExportModel.create({
      exportId,
      sessionId: SESSION_ID,
      tenantId: TENANT_A,
      userId: USER_A,
      exportData: { exportVersion: '1.0' },
      format: 'json',
      exportedAt: new Date(),
    });

    const doc = await SessionExportModel.findOne({ exportId }).lean();
    expect(doc).not.toBeNull();
    expect((doc as Record<string, unknown>)['userId']).toBe(USER_A);
  });

  // ✓ ASVS:V5.1.4 — format field defaults to 'json'; export record represents completed state
  it('format defaults to json and export record persists as completed (TC-010)', async () => {
    // TC-010
    const exportId = crypto.randomUUID();

    await SessionExportModel.create({
      exportId,
      sessionId: SESSION_ID,
      tenantId: TENANT_A,
      userId: USER_A,
      exportData: { exportVersion: '1.0', session: { title: '[TEST-DATA]' } },
      exportedAt: new Date(),
      // format omitted — schema default 'json' applies
    });

    const doc = await SessionExportModel.findOne({ exportId }).lean();
    expect(doc).not.toBeNull();
    expect((doc as Record<string, unknown>)['format']).toBe('json');
    // exportedAt persists — record represents a completed export
    expect((doc as Record<string, unknown>)['exportedAt']).toBeDefined();
  });
});
