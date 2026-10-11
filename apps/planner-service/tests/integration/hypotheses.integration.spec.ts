/**
 * hypotheses.integration.spec.ts — Integration tests for HypothesesService
 *
 * Protected B test data conventions (FAC-S4-027 / CAS:RULE-028):
 *   - tenantId: 'tenant-abc' (Tenant A), 'tenant-xyz' (Tenant B)
 *   - userId:   'user-xyz'
 *   - summary:  '[TEST-DATA]'
 *   - No real Protected B content appears in any fixture or assertion.
 *
 * Tier 1: service-layer mock integration — full business logic with jest.spyOn on Mongoose models.
 * Tier 2: Testcontainers MongoDB      — real persistence, enum constraints, multi-tenant isolation.
 *
 * Prerequisites for Tier 2 tests:
 *   npm install --save-dev @testcontainers/mongodb
 *   Docker must be running on the CI/local host.
 *
 * ✓ ASVS:V4.1.1 — tenantId enforced on every query predicate (BR-001)
 * ✓ ASVS:V4.1.3 — BR-010 state machine enforced server-side; invalid transitions rejected
 * ✓ CAS:RULE-017 — hypothesis status machine validated at service layer
 * ✓ CAS:RULE-028 — summary/reasoning are Protected B; never logged (only IDs)
 */

jest.setTimeout(60000);

import * as crypto from 'crypto';
import mongoose from 'mongoose';

import {
  HypothesesService,
  VALID_HYPOTHESIS_TRANSITIONS,
} from '../../src/services/hypotheses.service';
import { AppError } from '../../src/types';
import {
  HypothesisRecordModel,
  IHypothesisRecordDocument,
  HypothesisStatus,
} from '../../src/mongo/schemas/hypothesis-record.schema';

// ============================================================================
// Shared constants — Protected B test data (FAC-S4-027)
// ============================================================================

const TENANT_A = 'tenant-abc';
const TENANT_B = 'tenant-xyz';
const SESSION_A = 'session-001';
const HYP_ID = 'hyp-001';

// ============================================================================
// Shared helpers
// ============================================================================

const makeMockLogger = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
});

/**
 * Creates a mock Mongoose document suitable for HypothesisRecordModel.findOne().exec().
 * The doc carries a .save() method and a .toObject() method, mirroring the Mongoose API
 * used by updateHypothesisStatus.
 */
const makeMockHypothesisDoc = (
  status: HypothesisStatus,
  overrides: Record<string, unknown> = {},
) => {
  const base = {
    hypothesisId: HYP_ID,
    tenantId: TENANT_A,
    sessionId: SESSION_A,
    status,
    version: 1,
    summary: '[TEST-DATA]',
    adspServices: ['form-service'],
    ...overrides,
  };

  const savedObj = { ...base };

  return {
    ...base,
    save: jest.fn().mockImplementation(async () => ({
      toObject: jest.fn().mockReturnValue({ ...savedObj, status: base.status }),
    })),
  };
};

/** Mimics .sort().lean().exec() for HypothesisRecordModel.find() */
const makeFindSortLeanExecChain = (results: unknown[]) => ({
  sort: jest.fn().mockReturnValue({
    lean: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(results),
    }),
  }),
});

/** Mimics .lean().exec() for HypothesisRecordModel.findOne() with lean */
const makeLeanExecChain = (result: unknown) => ({
  lean: jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue(result),
  }),
});

/** Mimics .exec() for HypothesisRecordModel.findOne() without lean */
const makeExecChain = (result: unknown) => ({
  exec: jest.fn().mockResolvedValue(result),
});

// ============================================================================
// Tier 1 — service-layer mock integration
// HypothesesService BR-010 state machine exercised with jest.spyOn on Mongoose models.
// ============================================================================

describe('Tier 1 — service-layer mock integration', () => {
  let service: HypothesesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new HypothesesService(makeMockLogger() as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // TC-006 — BR-010: draft → proposed transition succeeds
  it('TC-006: updateHypothesisStatus allows draft → proposed transition (BR-010)', async () => {
    // ✓ ASVS:V4.1.3 — draft→proposed is the only forward transition from draft state
    // ✓ CAS:RULE-017 — BR-010 state machine accepts this move
    const mockDoc = makeMockHypothesisDoc('draft');
    // After save the status should be 'proposed'
    mockDoc.save.mockImplementation(async () => ({
      toObject: jest.fn().mockReturnValue({ ...mockDoc, status: 'proposed', version: 2 }),
    }));

    jest.spyOn(HypothesisRecordModel, 'findOne').mockReturnValue(makeExecChain(mockDoc) as never);

    const result = await service.updateHypothesisStatus(TENANT_A, SESSION_A, HYP_ID, 'proposed');

    expect(result.status).toBe('proposed');
    expect(mockDoc.save).toHaveBeenCalledTimes(1);
  });

  // TC-029 — BR-010: proposed → accepted transition succeeds
  it('TC-029: updateHypothesisStatus allows proposed → accepted transition (BR-010)', async () => {
    // ✓ ASVS:V4.1.3 — proposed→accepted is in VALID_HYPOTHESIS_TRANSITIONS['proposed']
    // ✓ CAS:RULE-017 — valid forward transition; no 422 thrown
    const mockDoc = makeMockHypothesisDoc('proposed');
    mockDoc.save.mockImplementation(async () => ({
      toObject: jest.fn().mockReturnValue({ ...mockDoc, status: 'accepted', version: 2 }),
    }));

    jest.spyOn(HypothesisRecordModel, 'findOne').mockReturnValue(makeExecChain(mockDoc) as never);

    const result = await service.updateHypothesisStatus(TENANT_A, SESSION_A, HYP_ID, 'accepted');

    expect(result.status).toBe('accepted');
  });

  // TC-031 — BR-010: proposed → rejected transition succeeds
  it('TC-031: updateHypothesisStatus allows proposed → rejected transition (BR-010)', async () => {
    // ✓ ASVS:V4.1.3 — rejected is a valid terminal state reachable from proposed
    // ✓ CAS:RULE-017 — BR-010 accepts proposed→rejected as a valid move
    const mockDoc = makeMockHypothesisDoc('proposed');
    mockDoc.save.mockImplementation(async () => ({
      toObject: jest.fn().mockReturnValue({ ...mockDoc, status: 'rejected', version: 2 }),
    }));

    jest.spyOn(HypothesisRecordModel, 'findOne').mockReturnValue(makeExecChain(mockDoc) as never);

    const result = await service.updateHypothesisStatus(TENANT_A, SESSION_A, HYP_ID, 'rejected');

    expect(result.status).toBe('rejected');
  });

  // TC-014 — BR-010: proposed → superseded transition succeeds (revision flow)
  it('TC-014: updateHypothesisStatus allows proposed → superseded transition (BR-010 revision flow)', async () => {
    // ✓ ASVS:V4.1.3 — superseded is reachable from proposed (hypothesis revision per UC-004)
    // ✓ CAS:RULE-017 — BR-010: prior hypothesis superseded when a new hypothesis is proposed
    const mockDoc = makeMockHypothesisDoc('proposed');
    mockDoc.save.mockImplementation(async () => ({
      toObject: jest.fn().mockReturnValue({ ...mockDoc, status: 'superseded', version: 2 }),
    }));

    jest.spyOn(HypothesisRecordModel, 'findOne').mockReturnValue(makeExecChain(mockDoc) as never);

    const result = await service.updateHypothesisStatus(TENANT_A, SESSION_A, HYP_ID, 'superseded');

    expect(result.status).toBe('superseded');
  });

  // TC-030 — BR-010: accepted → proposed throws AppError(422, INVALID_STATE_TRANSITION)
  it('TC-030: updateHypothesisStatus throws AppError(422) for invalid accepted → proposed transition (BR-010)', async () => {
    // ✓ ASVS:V4.1.3 — accepted is a terminal state; no further transitions allowed
    // ✓ CAS:RULE-017 — 422 Unprocessable returned for invalid state machine move
    const mockDoc = makeMockHypothesisDoc('accepted');

    jest.spyOn(HypothesisRecordModel, 'findOne').mockReturnValue(makeExecChain(mockDoc) as never);

    await expect(
      service.updateHypothesisStatus(TENANT_A, SESSION_A, HYP_ID, 'proposed'),
    ).rejects.toMatchObject({
      statusCode: 422,
      code: 'INVALID_STATE_TRANSITION',
    });

    // ✓ ASVS:V4.1.3 — save must NOT have been called; status is unchanged
    expect(mockDoc.save).not.toHaveBeenCalled();
  });

  // TC-029 (variant) — BR-010: accepted → superseded throws AppError(409, CONFLICT)
  it('TC-029-conflict: updateHypothesisStatus throws AppError(409) when attempting accepted → superseded (BR-010 special constraint)', async () => {
    // ✓ ASVS:V4.1.3 — special HTTP 409 (not 422) when trying to supersede an already-accepted hypothesis
    // ✓ CAS:RULE-017 — BR-010: accepted hypothesis cannot be superseded; 409 CONFLICT returned
    const mockDoc = makeMockHypothesisDoc('accepted');

    jest.spyOn(HypothesisRecordModel, 'findOne').mockReturnValue(makeExecChain(mockDoc) as never);

    await expect(
      service.updateHypothesisStatus(TENANT_A, SESSION_A, HYP_ID, 'superseded'),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: 'CONFLICT',
    });

    // ✓ ASVS:V4.1.3 — no persistence call on conflict
    expect(mockDoc.save).not.toHaveBeenCalled();
  });

  // TC-041 / TC-122 — ASVS:V4.1.1 — listHypotheses returns only own-tenant hypotheses
  it('TC-041: listHypotheses passes tenantId filter to Mongoose find — cross-tenant isolation', async () => {
    const tenantAHypotheses: Partial<IHypothesisRecordDocument>[] = [
      { hypothesisId: 'hyp-a1', tenantId: TENANT_A, sessionId: SESSION_A, status: 'proposed' },
      { hypothesisId: 'hyp-a2', tenantId: TENANT_A, sessionId: SESSION_A, status: 'accepted' },
    ];

    // ✓ CAS:RULE-015 — find must be called with { tenantId: TENANT_A } filter
    // ✓ ASVS:V4.1.1 — records from TENANT_B must never appear in TENANT_A results
    const findSpy = jest
      .spyOn(HypothesisRecordModel, 'find')
      .mockReturnValue(makeFindSortLeanExecChain(tenantAHypotheses) as never);

    const results = await service.listHypotheses(TENANT_A, SESSION_A);

    expect(findSpy).toHaveBeenCalledWith({ tenantId: TENANT_A, sessionId: SESSION_A });
    expect(results).toHaveLength(2);
    expect(results.every((h) => h.tenantId === TENANT_A)).toBe(true);
  });

  // TC-030 — terminal state rejection for rejected → accepted (422)
  it('TC-030: updateHypothesisStatus throws AppError(422) for rejected → accepted (terminal state BR-010)', async () => {
    // ✓ ASVS:V4.1.3 — rejected is terminal; no transitions permitted
    // ✓ CAS:RULE-017 — BR-010: terminal states have empty allowed-transitions list
    const mockDoc = makeMockHypothesisDoc('rejected');

    jest.spyOn(HypothesisRecordModel, 'findOne').mockReturnValue(makeExecChain(mockDoc) as never);

    await expect(
      service.updateHypothesisStatus(TENANT_A, SESSION_A, HYP_ID, 'accepted'),
    ).rejects.toMatchObject({
      statusCode: 422,
      code: 'INVALID_STATE_TRANSITION',
    });
  });

  // TC-032 — terminal state rejection for superseded → proposed (422)
  it('TC-032: updateHypothesisStatus throws AppError(422) for superseded → proposed (terminal state BR-010)', async () => {
    // ✓ ASVS:V4.1.3 — superseded is terminal; no transitions permitted
    const mockDoc = makeMockHypothesisDoc('superseded');

    jest.spyOn(HypothesisRecordModel, 'findOne').mockReturnValue(makeExecChain(mockDoc) as never);

    await expect(
      service.updateHypothesisStatus(TENANT_A, SESSION_A, HYP_ID, 'proposed'),
    ).rejects.toMatchObject({
      statusCode: 422,
      code: 'INVALID_STATE_TRANSITION',
    });
  });

  // TC-029 — BR-010: verify VALID_HYPOTHESIS_TRANSITIONS table is correct
  it('TC-029: VALID_HYPOTHESIS_TRANSITIONS table matches BR-010 specification exactly', () => {
    // ✓ ASVS:V5.1.4 — state machine table validated at module level
    expect(VALID_HYPOTHESIS_TRANSITIONS.draft).toEqual(['proposed']);
    expect(VALID_HYPOTHESIS_TRANSITIONS.proposed).toEqual(
      expect.arrayContaining(['accepted', 'rejected', 'superseded']),
    );
    expect(VALID_HYPOTHESIS_TRANSITIONS.proposed).toHaveLength(3);
    expect(VALID_HYPOTHESIS_TRANSITIONS.accepted).toEqual([]);
    expect(VALID_HYPOTHESIS_TRANSITIONS.rejected).toEqual([]);
    expect(VALID_HYPOTHESIS_TRANSITIONS.superseded).toEqual([]);
  });
});

// ============================================================================
// Tier 2 — Testcontainers MongoDB
// Uses a real MongoDB container for schema constraints, tenant isolation, and round-trips.
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { MongoDBContainer } = require('@testcontainers/mongodb') as {
  MongoDBContainer: new () => {
    start(): Promise<{ getConnectionString(): string; stop(): Promise<void> }>;
  };
};

describe('Tier 2 — Testcontainers MongoDB', () => {
  let container: { getConnectionString(): string; stop(): Promise<void> };
  let service: HypothesesService;

  beforeAll(async () => {
    // ✓ ASVS:V7.2.2 — real MongoDB container provides accurate schema and index behaviour
    container = await new MongoDBContainer().start();
    await mongoose.connect(container.getConnectionString(), { directConnection: true });
    service = new HypothesesService(makeMockLogger() as never);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await container.stop();
  });

  afterEach(async () => {
    // Isolate each test — clear collections without dropping indexes
    await HypothesisRecordModel.deleteMany({});
  });

  // TC-DI-012 — create hypothesis in draft, transition to proposed — persisted correctly
  it('TC-DI-012: createHypothesis (status=draft) + updateHypothesisStatus (→proposed) — persisted correctly (round-trip)', async () => {
    // ✓ ASVS:V5.1.4 — draft is the required initial status per BR-010
    // ✓ CAS:RULE-028 — summary/reasoning stored but not logged (only identifiers in log)
    const created = await service.createHypothesis(
      TENANT_A,
      SESSION_A,
      '[TEST-DATA]',
      undefined,
      ['form-service'],
    );

    expect(created.status).toBe('draft');
    expect(created.tenantId).toBe(TENANT_A);
    expect(created.hypothesisId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );

    // ✓ ASVS:V4.1.3 — transition draft → proposed validated and persisted
    const updated = await service.updateHypothesisStatus(
      TENANT_A,
      SESSION_A,
      created.hypothesisId,
      'proposed',
    );

    expect(updated.status).toBe('proposed');
    expect(updated.hypothesisId).toBe(created.hypothesisId);

    // Confirm persistence via independent read
    const fromDb = await service.getHypothesisById(TENANT_A, SESSION_A, created.hypothesisId);
    expect(fromDb).not.toBeNull();
    expect(fromDb!.status).toBe('proposed');
  });

  // TC-DI-013 — tenantId isolation: two tenants with same sessionId
  it('TC-DI-013: listHypotheses returns only own-tenant hypotheses when two tenants share same sessionId', async () => {
    // ✓ CAS:RULE-015 — compound index (tenantId, sessionId) enforces tenant-scoped list query
    // ✓ ASVS:V4.1.1 — Tenant B hypotheses must never appear in Tenant A list results
    await service.createHypothesis(TENANT_A, SESSION_A, '[TEST-DATA]', undefined, ['pdf-service']);
    await service.createHypothesis(TENANT_A, SESSION_A, '[TEST-DATA]', undefined, ['pdf-service']);
    await service.createHypothesis(TENANT_B, SESSION_A, '[TEST-DATA]', undefined, ['pdf-service']);

    const resultsA = await service.listHypotheses(TENANT_A, SESSION_A);
    const resultsB = await service.listHypotheses(TENANT_B, SESSION_A);

    expect(resultsA).toHaveLength(2);
    expect(resultsA.every((h) => h.tenantId === TENANT_A)).toBe(true);

    expect(resultsB).toHaveLength(1);
    expect(resultsB.every((h) => h.tenantId === TENANT_B)).toBe(true);
  });

  // TC-DI-014 — all 5 HypothesisStatus enum values are accepted by Mongoose schema
  it('TC-DI-014: all 5 HypothesisStatus enum values are valid Mongoose schema enum values', async () => {
    const validStatuses: HypothesisStatus[] = ['draft', 'proposed', 'accepted', 'rejected', 'superseded'];

    // ✓ ASVS:V5.1.4 — Mongoose schema enum matches DDL CHECK constraint (BR-010)
    for (const status of validStatuses) {
      await expect(
        HypothesisRecordModel.create({
          hypothesisId: crypto.randomUUID(),
          tenantId: TENANT_A,
          sessionId: `session-${status}`,
          status,
          summary: '[TEST-DATA]',
          adspServices: ['form-service'],
          version: 1,
        }),
      ).resolves.toBeDefined();
    }
  });

  // TC-DI-014 — invalid status enum value is rejected by Mongoose schema
  it('TC-DI-014: HypothesisRecord schema rejects invalid status enum value at persistence layer', async () => {
    // ✓ ASVS:V5.1.4 — 'pending' is not a valid HypothesisStatus; schema rejects it
    await expect(
      HypothesisRecordModel.create({
        hypothesisId: crypto.randomUUID(),
        tenantId: TENANT_A,
        sessionId: SESSION_A,
        status: 'pending', // not in ['draft','proposed','accepted','rejected','superseded']
        summary: '[TEST-DATA]',
        adspServices: ['form-service'],
        version: 1,
      }),
    ).rejects.toThrow();
  });

  // TC-DI-015 — adspServices array persists and retrieves correctly
  it('TC-DI-015: adspServices array (multiple services) persists and retrieves with correct membership', async () => {
    // ✓ ASVS:V5.1.3 — adspServices requires at least one entry; schema enforces this
    // ✓ CAS:RULE-028 — adspServices contains ADSP service IDs (non-sensitive configuration data)
    const services = ['form-service', 'pdf-service', 'comment-service'];

    const created = await service.createHypothesis(
      TENANT_A,
      SESSION_A,
      '[TEST-DATA]',
      undefined,
      services,
    );

    const retrieved = await service.getHypothesisById(TENANT_A, SESSION_A, created.hypothesisId);

    expect(retrieved).not.toBeNull();
    expect(retrieved!.adspServices).toHaveLength(3);
    expect(retrieved!.adspServices).toEqual(expect.arrayContaining(services));
  });

  // TC-DI-015 — adspServices with zero entries is rejected by Mongoose schema validation
  it('TC-DI-015: HypothesisRecord schema rejects adspServices array with zero entries', async () => {
    // ✓ ASVS:V5.1.3 — at least one ADSP service must be recommended (schema validates v.length >= 1)
    await expect(
      HypothesisRecordModel.create({
        hypothesisId: crypto.randomUUID(),
        tenantId: TENANT_A,
        sessionId: SESSION_A,
        status: 'draft',
        summary: '[TEST-DATA]',
        adspServices: [], // violates validator: v.length >= 1
        version: 1,
      }),
    ).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// TC-119 — SolutionHypothesis status field enum validation (Data Integrity)
// ---------------------------------------------------------------------------

describe('TC-119: SolutionHypothesis status enum rejected (Data Integrity)', () => {
  it('TC-119: Mongoose rejects invalid status value outside 5-value enum', async () => {
    // TC-119 / BR-010 / SYSREQ-004
    // Verify Mongoose validator rejects status: cancelled (not in enum) before MongoDB write
    await expect(
      HypothesisRecordModel.create({
        hypothesisId: crypto.randomUUID(),
        tenantId: TENANT_A,
        sessionId: SESSION_A,
        status: 'cancelled', // Not in 5-value enum (draft, pending-review, accepted, rejected, superseded)
        summary: '[TEST-DATA]',
        adspServices: ['form-service'],
        version: 1,
      }),
    ).rejects.toThrow();
  });
});
