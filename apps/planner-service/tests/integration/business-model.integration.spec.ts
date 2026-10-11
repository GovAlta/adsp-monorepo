/**
 * business-model.integration.spec.ts — Integration tests for BusinessModelService
 *
 * Protected B test data conventions (FAC-S4-027 / CAS:RULE-028):
 *   - tenantId: 'tenant-abc' (Tenant A), 'tenant-xyz' (Tenant B)
 *   - sessionId: 'session-001', 'session-002'
 *   - No real Protected B content appears in any fixture or assertion.
 *
 * Tier 1: service-layer mock integration — full business logic with jest.spyOn on Mongoose models.
 * Tier 2: Testcontainers MongoDB      — real persistence, schema constraints, compound indexes.
 *
 * Prerequisites for Tier 2 tests:
 *   npm install --save-dev @testcontainers/mongodb
 *   Docker must be running on the CI/local host.
 *
 * ✓ ASVS:V4.1.1 — tenantId enforced on all queries (BR-001)
 * ✓ ASVS:V5.1.4 — conceptType validated against CONCEPT_TYPES enum (BR-006)
 * ✓ ASVS:V5.1.3 — confidenceScore bounds validated (BR-004)
 * ✓ CAS:RULE-015 — multi-tenant isolation verified at query and service layers
 */

jest.setTimeout(60000);

import * as crypto from 'crypto';
import mongoose from 'mongoose';

import { BusinessModelService } from '../../src/services/business-model.service';
import { AppError, NotFoundError } from '../../src/types';
import {
  BusinessModelModel,
  IBusinessModelDocument,
  CONCEPT_TYPES,
  ConceptType,
} from '../../src/mongo/schemas/business-model.schema';

// ============================================================================
// Shared constants — Protected B test data (FAC-S4-027)
// ============================================================================

const TENANT_A = 'tenant-abc';
const TENANT_B = 'tenant-xyz';
const SESSION_A = 'session-001';
const SESSION_B = 'session-002';

// ============================================================================
// Shared helpers
// ============================================================================

const makeMockLogger = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
});

/** Mimics the Mongoose chainable query: .lean().exec() */
const makeLeanExecChain = (result: unknown) => ({
  lean: jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue(result),
  }),
});

/** Mimics the Mongoose chainable query: .findOneAndUpdate(...).lean().exec() */
const makeFindOneAndUpdateChain = (result: unknown) => ({
  lean: jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue(result),
  }),
});

const makeMockBusinessModelDoc = (overrides: Partial<IBusinessModelDocument> = {}): Partial<IBusinessModelDocument> => ({
  modelId: 'bm-001',
  tenantId: TENANT_A,
  sessionId: SESSION_A,
  concepts: [],
  confidenceScore: 50,
  version: 1,
  ...overrides,
});

// ============================================================================
// Tier 1 — service-layer mock integration
// BusinessModelService business logic exercised with jest.spyOn on Mongoose models.
// ============================================================================

describe('Tier 1 — service-layer mock integration', () => {
  let service: BusinessModelService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BusinessModelService(makeMockLogger() as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // TC-036 — ASVS:V5.1.4 — BR-006 invalid conceptType rejected with HTTP 400
  it('TC-036: updateBusinessModelConcept throws AppError(400) for invalid conceptType (BR-006)', async () => {
    // ✓ ASVS:V5.1.4 — enum validation applied before any Mongoose write
    // ✓ CAS:RULE-017 — BR-006 validation is server-side; client cannot bypass via API
    await expect(
      service.updateBusinessModelConcept(TENANT_A, SESSION_A, 'concept-001', {
        // 'Person' is not a valid BR-006 conceptType
        conceptType: 'Person' as ConceptType,
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: 'INVALID_CONCEPT_TYPE',
    });
  });

  // TC-035 — ASVS:V5.1.4 — all 15 BR-006 CONCEPT_TYPES are accepted without throwing
  it.each(CONCEPT_TYPES)(
    'TC-035: updateBusinessModelConcept accepts valid conceptType "%s" without throwing (BR-006)',
    async (conceptType) => {
      // ✓ ASVS:V5.1.4 — each CONCEPT_TYPES entry passes the enum guard
      // ✓ CAS:RULE-015 — operation scoped to TENANT_A; no cross-tenant update
      const updatedDoc = makeMockBusinessModelDoc({
        concepts: [{ conceptId: 'concept-001', conceptType, name: '[TEST-DATA]', relationships: [] }],
        version: 2,
      });

      jest.spyOn(BusinessModelModel, 'findOneAndUpdate').mockReturnValue(
        makeFindOneAndUpdateChain(updatedDoc) as never,
      );

      const result = await service.updateBusinessModelConcept(
        TENANT_A,
        SESSION_A,
        'concept-001',
        { conceptType },
      );

      expect(result).not.toBeNull();
      // ✓ ASVS:V5.1.4 — returned document carries the updated conceptType
      expect(result?.concepts[0].conceptType).toBe(conceptType);
    },
  );

  // TC-005 — updateBusinessModelConcept throws NotFoundError when concept does not exist within model
  it('TC-005: updateBusinessModelConcept throws NotFoundError(BusinessConcept) when conceptId is not found in model', async () => {
    // Simulate: findOneAndUpdate returns null (no concept matched the positional predicate)
    jest.spyOn(BusinessModelModel, 'findOneAndUpdate').mockReturnValue(
      makeFindOneAndUpdateChain(null) as never,
    );

    // Simulate: model itself exists (the model was found but the concept wasn't)
    jest.spyOn(BusinessModelModel, 'findOne').mockReturnValue(
      makeLeanExecChain({ modelId: 'bm-001' }) as never,
    );

    // ✓ ASVS:V4.1.1 — 404 on concept-not-found prevents information leakage about other tenants' models
    await expect(
      service.updateBusinessModelConcept(TENANT_A, SESSION_A, 'concept-nonexistent', { name: '[TEST-DATA]' }),
    ).rejects.toMatchObject({
      statusCode: 404,
      code: 'NOT_FOUND',
    });
  });

  // TC-005 — updateBusinessModelConcept throws NotFoundError when model does not exist for session
  it('TC-005: updateBusinessModelConcept throws NotFoundError(BusinessModel) when model is not found for session', async () => {
    // ✓ ASVS:V4.1.1 — both model and concept lookup use tenantId predicate
    jest.spyOn(BusinessModelModel, 'findOneAndUpdate').mockReturnValue(
      makeFindOneAndUpdateChain(null) as never,
    );

    // Model also not found
    jest.spyOn(BusinessModelModel, 'findOne').mockReturnValue(
      makeLeanExecChain(null) as never,
    );

    await expect(
      service.updateBusinessModelConcept(TENANT_A, 'session-nonexistent', 'concept-001', { name: '[TEST-DATA]' }),
    ).rejects.toMatchObject({
      statusCode: 404,
      code: 'NOT_FOUND',
    });
  });

  // TC-036 — ASVS:V4.1.1 — getBusinessModelBySession passes tenantId to Mongoose filter
  it('TC-036: getBusinessModelBySession includes tenantId in Mongoose predicate (cross-tenant isolation)', async () => {
    const mockDoc = makeMockBusinessModelDoc({ tenantId: TENANT_A });

    const findOneSpy = jest
      .spyOn(BusinessModelModel, 'findOne')
      .mockReturnValue(makeLeanExecChain(mockDoc) as never);

    // ✓ CAS:RULE-015 — findOne must be called with { tenantId } to prevent cross-tenant reads
    const result = await service.getBusinessModelBySession(TENANT_A, SESSION_A);

    expect(findOneSpy).toHaveBeenCalledWith({ tenantId: TENANT_A, sessionId: SESSION_A });
    expect(result?.tenantId).toBe(TENANT_A);
  });

  // TC-035 — ASVS:V5.1.3 — updateBusinessModelConfidence rejects out-of-range scores
  it('TC-035: updateBusinessModelConfidence rejects confidenceScore outside 0-100 (BR-004)', async () => {
    // ✓ ASVS:V5.1.3 — range guard applied before Mongoose write
    await expect(
      service.updateBusinessModelConfidence(TENANT_A, SESSION_A, -1),
    ).rejects.toMatchObject({ statusCode: 400, code: 'VALIDATION_ERROR' });

    await expect(
      service.updateBusinessModelConfidence(TENANT_A, SESSION_A, 101),
    ).rejects.toMatchObject({ statusCode: 400, code: 'VALIDATION_ERROR' });
  });
});

// ============================================================================
// Tier 2 — Testcontainers MongoDB
// Uses a real MongoDB container for schema constraints, compound index, and round-trip tests.
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { MongoDBContainer } = require('@testcontainers/mongodb') as {
  MongoDBContainer: new () => {
    start(): Promise<{ getConnectionString(): string; stop(): Promise<void> }>;
  };
};

describe('Tier 2 — Testcontainers MongoDB', () => {
  let container: { getConnectionString(): string; stop(): Promise<void> };
  let service: BusinessModelService;

  const makeModelId = () => crypto.randomUUID();

  beforeAll(async () => {
    // ✓ ASVS:V7.2.2 — real MongoDB container provides accurate index + constraint behaviour
    container = await new MongoDBContainer().start();
    await mongoose.connect(container.getConnectionString(), { directConnection: true });
    service = new BusinessModelService(makeMockLogger() as never);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await container.stop();
  });

  afterEach(async () => {
    // Isolate each test — clear collections without dropping indexes
    await BusinessModelModel.deleteMany({});
  });

  // TC-DI-007 — create business model, add 3 concepts, read back — concepts array length=3
  it('TC-DI-007: create business model + addConcept x3 → concepts array has length 3 (round-trip)', async () => {
    const modelId = makeModelId();

    // Seed a BusinessModel document directly (BusinessModelService has no createModel method;
    // creation is owned by SessionsService.createSession)
    await BusinessModelModel.create({
      modelId,
      sessionId: SESSION_A,
      tenantId: TENANT_A,
      concepts: [],
      confidenceScore: 0,
      version: 1,
    });

    // ✓ ASVS:V5.1.4 — addConcept validates conceptType before appending
    // ✓ CAS:RULE-015 — each addConcept scoped to TENANT_A
    for (let i = 1; i <= 3; i++) {
      await service.addConcept(TENANT_A, SESSION_A, {
        conceptId: `concept-${i}`,
        conceptType: 'Actor',
        name: '[TEST-DATA]',
        description: `[TEST-DATA] concept ${i}`,
      });
    }

    const retrieved = await service.getBusinessModelBySession(TENANT_A, SESSION_A);

    expect(retrieved).not.toBeNull();
    // ✓ ASVS:V5.1.4 — 3 concepts persisted and retrieved with correct conceptType
    expect(retrieved!.concepts).toHaveLength(3);
    expect(retrieved!.concepts.every((c) => c.conceptType === 'Actor')).toBe(true);
  });

  // TC-DI-008 — conceptType enum constraint enforced by Mongoose schema at persistence layer
  it('TC-DI-008: BusinessModel schema rejects invalid conceptType enum value at persistence layer', async () => {
    const modelId = makeModelId();

    // ✓ ASVS:V5.1.4 — Mongoose schema enum constraint matches DDL CHECK constraint (BR-006)
    await expect(
      BusinessModelModel.create({
        modelId,
        sessionId: SESSION_A,
        tenantId: TENANT_A,
        concepts: [
          {
            conceptId: 'concept-001',
            // 'NotAType' is not in CONCEPT_TYPES
            conceptType: 'NotAType',
            name: '[TEST-DATA]',
            relationships: [],
          },
        ],
        confidenceScore: 0,
        version: 1,
      }),
    ).rejects.toThrow();
  });

  // TC-DI-009 — tenantId+sessionId compound unique index: two tenants, same sessionId, no collision
  it('TC-DI-009: two different tenants can have BusinessModels for the same sessionId without collision', async () => {
    // ✓ CAS:RULE-015 — compound unique index (tenantId, sessionId) enforces tenant-scoped uniqueness
    // ✓ ASVS:V4.1.1 — Tenant A and Tenant B models are isolated at the persistence layer
    const modelIdA = makeModelId();
    const modelIdB = makeModelId();

    await BusinessModelModel.create({
      modelId: modelIdA,
      sessionId: SESSION_A, // same sessionId
      tenantId: TENANT_A,
      concepts: [],
      confidenceScore: 10,
      version: 1,
    });

    // Should NOT throw: same sessionId but different tenantId is a distinct compound key
    await expect(
      BusinessModelModel.create({
        modelId: modelIdB,
        sessionId: SESSION_A, // same sessionId, different tenant
        tenantId: TENANT_B,
        concepts: [],
        confidenceScore: 20,
        version: 1,
      }),
    ).resolves.toBeDefined();

    // Verify each tenant retrieves only their own model
    const resultA = await service.getBusinessModelBySession(TENANT_A, SESSION_A);
    const resultB = await service.getBusinessModelBySession(TENANT_B, SESSION_A);

    expect(resultA?.tenantId).toBe(TENANT_A);
    expect(resultA?.confidenceScore).toBe(10);
    expect(resultB?.tenantId).toBe(TENANT_B);
    expect(resultB?.confidenceScore).toBe(20);
  });

  // TC-DI-010 — version field increments on each addConcept call
  it('TC-DI-010: version field increments by 1 on each addConcept call', async () => {
    const modelId = makeModelId();

    await BusinessModelModel.create({
      modelId,
      sessionId: SESSION_B,
      tenantId: TENANT_A,
      concepts: [],
      confidenceScore: 0,
      version: 1,
    });

    // ✓ ASVS:V5.1.4 — version increment is applied atomically via $inc in findOneAndUpdate
    await service.addConcept(TENANT_A, SESSION_B, {
      conceptId: 'c-001', conceptType: 'Goal', name: '[TEST-DATA]',
    });
    await service.addConcept(TENANT_A, SESSION_B, {
      conceptId: 'c-002', conceptType: 'Activity', name: '[TEST-DATA]',
    });
    await service.addConcept(TENANT_A, SESSION_B, {
      conceptId: 'c-003', conceptType: 'Constraint', name: '[TEST-DATA]',
    });

    const retrieved = await service.getBusinessModelBySession(TENANT_A, SESSION_B);

    // Started at version 1, three addConcept calls each increment by 1 → version 4
    expect(retrieved).not.toBeNull();
    expect(retrieved!.version).toBe(4);
  });

  // TC-DI-011 — confidenceScore boundary values 0 and 100 are accepted; -1 and 101 are rejected
  it('TC-DI-011: confidenceScore accepts boundary values 0 and 100; rejects -1 and 101 (BR-004)', async () => {
    const modelId0 = makeModelId();
    const modelId100 = makeModelId();

    // ✓ ASVS:V5.1.3 — Mongoose schema min:0 max:100 constraint enforces BR-004
    await expect(
      BusinessModelModel.create({
        modelId: modelId0,
        sessionId: 'session-conf-0',
        tenantId: TENANT_A,
        concepts: [],
        confidenceScore: 0, // lower boundary — accepted
        version: 1,
      }),
    ).resolves.toBeDefined();

    await expect(
      BusinessModelModel.create({
        modelId: modelId100,
        sessionId: 'session-conf-100',
        tenantId: TENANT_A,
        concepts: [],
        confidenceScore: 100, // upper boundary — accepted
        version: 1,
      }),
    ).resolves.toBeDefined();

    // Below lower boundary
    await expect(
      BusinessModelModel.create({
        modelId: makeModelId(),
        sessionId: 'session-conf-neg',
        tenantId: TENANT_A,
        concepts: [],
        confidenceScore: -1, // rejected by min:0
        version: 1,
      }),
    ).rejects.toThrow();

    // Above upper boundary
    await expect(
      BusinessModelModel.create({
        modelId: makeModelId(),
        sessionId: 'session-conf-over',
        tenantId: TENANT_A,
        concepts: [],
        confidenceScore: 101, // rejected by max:100
        version: 1,
      }),
    ).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// TC-118 — BusinessConcept conceptType enum validation (Data Integrity)
// ---------------------------------------------------------------------------

describe('TC-118: BusinessConcept conceptType enum rejected (Data Integrity)', () => {
  it('TC-118: Mongoose rejects invalid conceptType value not in 15-value enum', async () => {
    // TC-118 / BR-006 / SYSREQ-002
    // Verify Mongoose validator rejects conceptType: InvalidType before MongoDB write
    const modelId = makeModelId();
    await expect(
      BusinessModelModel.create({
        modelId,
        sessionId: 'session-tc118',
        tenantId: TENANT_A,
        concepts: [
          {
            conceptId: 'concept-tc118',
            name: '[TEST-DATA]',
            conceptType: 'InvalidType', // Not in the 15-value enum
            confidence: 0.8,
            sourceExcerpt: '[TEST-DATA]',
          },
        ],
        version: 1,
      }),
    ).rejects.toThrow();
  });
});
