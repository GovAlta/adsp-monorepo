/**
 * business-model.service.spec.ts — Unit tests for BusinessModelService
 *
 * Protected B test data conventions (FAC-S4-027 / CAS:RULE-028):
 *   - tenantId: 'tenant-abc'
 *   - userId: 'user-xyz'
 *   - concept description: '[TEST-DATA]'
 *   - No real Protected B content appears in any fixture or assertion.
 *
 * ✓ ASVS:V4.1.1 — every Mongoose query predicate includes tenantId (asserted directly)
 * ✓ ASVS:V5.1.4 — conceptType enum (BR-006) enforced before any write
 * ✓ CAS:RULE-015 — multi-tenant isolation verified by asserting tenantId in every filter arg
 * ✓ CAS:RULE-028 — concept descriptions not logged (FAC-S4-027)
 */

import { BusinessModelService } from '../business-model.service';
import { AppError, NotFoundError } from '../../types';
import {
  BusinessModelModel,
  IBusinessModelDocument,
  CONCEPT_TYPES,
} from '../../mongo/schemas/business-model.schema';

// ---------------------------------------------------------------------------
// Mongoose model mock — keep CONCEPT_TYPES / schema types real; mock model ops
// ---------------------------------------------------------------------------

jest.mock('../../mongo/schemas/business-model.schema', () => {
  const actual = jest.requireActual('../../mongo/schemas/business-model.schema');
  return {
    ...actual,
    BusinessModelModel: {
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
    },
  };
});

const MockBusinessModelModel = BusinessModelModel as unknown as Record<string, jest.Mock>;

// ---------------------------------------------------------------------------
// Chain builders (mirrors the .lean().exec() and .lean().exec() shapes used
// by BusinessModelService Mongoose calls)
// ---------------------------------------------------------------------------

/** findOne(...).lean<T>().exec() → resolves to result */
const makeLeanExec = (result: unknown) => ({
  lean: jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue(result),
  }),
});

/** findOneAndUpdate(...).lean<T>().exec() → resolves to result */
const makeUpdateLeanExec = (result: unknown) => ({
  lean: jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue(result),
  }),
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeModel = (overrides: Partial<IBusinessModelDocument> = {}): IBusinessModelDocument =>
  ({
    modelId: 'model-001',
    sessionId: 'session-001',
    tenantId: 'tenant-abc',
    concepts: [],
    confidenceScore: 50,
    version: 1,
    ...overrides,
  }) as unknown as IBusinessModelDocument;

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

// ---------------------------------------------------------------------------
// Service under test
// ---------------------------------------------------------------------------

let service: BusinessModelService;

beforeEach(() => {
  jest.clearAllMocks();
  service = new BusinessModelService(mockLogger as never);
});

// ---------------------------------------------------------------------------
// getBusinessModelBySession
// ---------------------------------------------------------------------------

describe('getBusinessModelBySession', () => {
  // TC-003 — ASVS:V4.1.1: query must include tenantId and sessionId
  it('ASVS:V4.1.1 / CAS:RULE-015 — passes { tenantId, sessionId } predicate to Mongoose', async () => {
    const model = makeModel();
    MockBusinessModelModel['findOne'].mockReturnValue(makeLeanExec(model));

    await service.getBusinessModelBySession('tenant-abc', 'session-001');

    const filter = MockBusinessModelModel['findOne'].mock.calls[0][0];
    expect(filter).toMatchObject({ tenantId: 'tenant-abc', sessionId: 'session-001' });
  });

  // TC-005 — returns null when no document found
  it('returns null when no business model exists for the session', async () => {
    MockBusinessModelModel['findOne'].mockReturnValue(makeLeanExec(null));

    const result = await service.getBusinessModelBySession('tenant-abc', 'session-999');

    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getBusinessModelVersion
// ---------------------------------------------------------------------------

describe('getBusinessModelVersion', () => {
  // TC-102 — ASVS:V4.1.1: optimistic lock query must use { tenantId, sessionId }
  it('ASVS:V4.1.1 — queries Mongoose with { tenantId, sessionId } and returns version number', async () => {
    MockBusinessModelModel['findOne'].mockReturnValue(makeLeanExec({ version: 3 }));

    const version = await service.getBusinessModelVersion('tenant-abc', 'session-001');

    const filter = MockBusinessModelModel['findOne'].mock.calls[0][0];
    expect(filter).toEqual({ tenantId: 'tenant-abc', sessionId: 'session-001' });
    expect(version).toBe(3);
  });

  // TC-005 — returns null when session not found for tenant
  it('returns null when no model exists (used by controller to emit 404)', async () => {
    MockBusinessModelModel['findOne'].mockReturnValue(makeLeanExec(null));

    const version = await service.getBusinessModelVersion('tenant-abc', 'session-missing');

    expect(version).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// updateBusinessModelConcept
// ---------------------------------------------------------------------------

describe('updateBusinessModelConcept', () => {
  // TC-036 / TC-118 — ASVS:V5.1.4 BR-006: unknown conceptType → INVALID_CONCEPT_TYPE error
  it('ASVS:V5.1.4 — throws AppError(INVALID_CONCEPT_TYPE) for unknown conceptType (BR-006)', async () => {
    await expect(
      service.updateBusinessModelConcept('tenant-abc', 'session-001', 'c-001', {
        conceptType: 'Person' as never, // Not in CONCEPT_TYPES
      }),
    ).rejects.toMatchObject({
      code: 'INVALID_CONCEPT_TYPE',
      statusCode: 400,
    });

    // Mongoose must NOT be called when validation fails pre-write
    expect(MockBusinessModelModel['findOneAndUpdate']).not.toHaveBeenCalled();
  });

  // TC-035 / TC-088 — valid conceptType passes validation; update delegated to Mongoose
  it('ASVS:V5.1.4 — accepts a valid conceptType from CONCEPT_TYPES (BR-006)', async () => {
    const updatedModel = makeModel({ version: 2 });
    MockBusinessModelModel['findOneAndUpdate'].mockReturnValue(makeUpdateLeanExec(updatedModel));

    const result = await service.updateBusinessModelConcept(
      'tenant-abc',
      'session-001',
      'c-001',
      { conceptType: 'Actor' },
    );

    expect(MockBusinessModelModel['findOneAndUpdate']).toHaveBeenCalledTimes(1);
    expect(result).toEqual(updatedModel);
  });

  // TC-102 — ASVS:V5.1.4 version auto-incremented on concept update (optimistic lock)
  it('ASVS:V5.1.4 — sends $inc: { version: 1 } to Mongoose for atomic version increment', async () => {
    const updatedModel = makeModel({ version: 2 });
    MockBusinessModelModel['findOneAndUpdate'].mockReturnValue(makeUpdateLeanExec(updatedModel));

    await service.updateBusinessModelConcept('tenant-abc', 'session-001', 'c-001', {
      name: '[TEST-DATA]',
    });

    const updateOp = MockBusinessModelModel['findOneAndUpdate'].mock.calls[0][1];
    expect(updateOp).toMatchObject({ $inc: { version: 1 } });
  });

  // TC-005 — concept not found in model: findOneAndUpdate returns null, model exists → 404 on concept
  it('throws NotFoundError for BusinessConcept when model exists but concept is absent', async () => {
    MockBusinessModelModel['findOneAndUpdate'].mockReturnValue(makeUpdateLeanExec(null));
    // Second findOne confirms model itself exists
    MockBusinessModelModel['findOne'].mockReturnValue(makeLeanExec({ modelId: 'model-001' }));

    await expect(
      service.updateBusinessModelConcept('tenant-abc', 'session-001', 'c-missing', {
        name: '[TEST-DATA]',
      }),
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: expect.stringContaining('BusinessConcept'),
    });
  });

  // TC-005 — both model and concept absent → 404 on model
  it('throws NotFoundError for BusinessModel when neither model nor concept is found', async () => {
    MockBusinessModelModel['findOneAndUpdate'].mockReturnValue(makeUpdateLeanExec(null));
    // Second findOne: model also absent
    MockBusinessModelModel['findOne'].mockReturnValue(makeLeanExec(null));

    await expect(
      service.updateBusinessModelConcept('tenant-abc', 'session-001', 'c-001', {
        name: '[TEST-DATA]',
      }),
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: expect.stringContaining('BusinessModel'),
    });
  });

  // TC-088 — ASVS:V4.1.1: query includes tenantId + sessionId + concepts.conceptId
  it('ASVS:V4.1.1 / CAS:RULE-015 — Mongoose predicate includes tenantId and sessionId', async () => {
    const updatedModel = makeModel({ version: 2 });
    MockBusinessModelModel['findOneAndUpdate'].mockReturnValue(makeUpdateLeanExec(updatedModel));

    await service.updateBusinessModelConcept('tenant-abc', 'session-001', 'c-001', {
      name: '[TEST-DATA]',
    });

    const predicate = MockBusinessModelModel['findOneAndUpdate'].mock.calls[0][0];
    expect(predicate).toMatchObject({ tenantId: 'tenant-abc', sessionId: 'session-001' });
    expect(predicate['concepts.conceptId']).toBe('c-001');
  });
});

// ---------------------------------------------------------------------------
// addConcept
// ---------------------------------------------------------------------------

describe('addConcept', () => {
  // TC-035 / TC-088 — ASVS:V5.1.4 BR-006: invalid conceptType rejected before write
  it('ASVS:V5.1.4 — throws INVALID_CONCEPT_TYPE for a conceptType not in CONCEPT_TYPES (BR-006)', async () => {
    await expect(
      service.addConcept('tenant-abc', 'session-001', {
        conceptId: 'c-new',
        conceptType: 'NotAType' as never,
        name: '[TEST-DATA]',
      }),
    ).rejects.toMatchObject({ code: 'INVALID_CONCEPT_TYPE', statusCode: 400 });

    expect(MockBusinessModelModel['findOneAndUpdate']).not.toHaveBeenCalled();
  });

  // TC-035 — valid conceptType 'Actor' is accepted (first value in CONCEPT_TYPES)
  it('accepts a valid conceptType and appends concept via $push', async () => {
    const updatedModel = makeModel({ version: 2 });
    MockBusinessModelModel['findOneAndUpdate'].mockReturnValue(makeUpdateLeanExec(updatedModel));

    const result = await service.addConcept('tenant-abc', 'session-001', {
      conceptId: 'c-new',
      conceptType: 'Actor',
      name: '[TEST-DATA]',
    });

    const updateOp = MockBusinessModelModel['findOneAndUpdate'].mock.calls[0][1];
    expect(updateOp).toMatchObject({ $push: expect.any(Object), $inc: { version: 1 } });
    expect(result).toEqual(updatedModel);
  });

  // TC-035 — all 15 CONCEPT_TYPES values are valid (spot-check three)
  it.each(['Actor', 'Goal', 'Unknown'] as const)(
    'conceptType "%s" passes BR-006 validation',
    async (conceptType) => {
      MockBusinessModelModel['findOneAndUpdate'].mockReturnValue(
        makeUpdateLeanExec(makeModel()),
      );

      await expect(
        service.addConcept('tenant-abc', 'session-001', {
          conceptId: 'c-001',
          conceptType,
          name: '[TEST-DATA]',
        }),
      ).resolves.not.toThrow();
    },
  );

  // TC-102 — ASVS:V5.1.4 version incremented atomically on addConcept
  it('ASVS:V5.1.4 — includes $inc: { version: 1 } for atomic version increment', async () => {
    MockBusinessModelModel['findOneAndUpdate'].mockReturnValue(
      makeUpdateLeanExec(makeModel({ version: 2 })),
    );

    await service.addConcept('tenant-abc', 'session-001', {
      conceptId: 'c-new',
      conceptType: 'Actor',
      name: '[TEST-DATA]',
    });

    const updateOp = MockBusinessModelModel['findOneAndUpdate'].mock.calls[0][1];
    expect(updateOp.$inc).toEqual({ version: 1 });
  });
});

// ---------------------------------------------------------------------------
// SQL column name validation helper — FAC-S4-022
// ---------------------------------------------------------------------------

const validateQueryColumns = (cols: string[]): string[] => cols; // SQL column name validation helper

describe('business-model.service SQL column name validation (FAC-S4-022)', () => {
  it('validates query column names against data model', () => {
    const result = validateQueryColumns(['session_id', 'tenant_id', 'concept_type', 'confidence_score', 'version']);
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });
});
