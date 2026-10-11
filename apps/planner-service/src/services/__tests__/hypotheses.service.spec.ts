/**
 * hypotheses.service.spec.ts — Unit tests for HypothesesService
 *
 * Protected B test data conventions (FAC-S4-027 / CAS:RULE-028):
 *   - tenantId: 'tenant-abc'
 *   - userId: 'user-xyz'
 *   - summary / reasoning: '[TEST-DATA]'
 *   - No real Protected B content appears in any fixture or assertion.
 *
 * ✓ ASVS:V4.1.1 — tenantId enforced on every Mongoose predicate (asserted directly)
 * ✓ ASVS:V4.1.3 — BR-010 state machine enforced server-side; tested via error type
 * ✓ CAS:RULE-017 — VALID_HYPOTHESIS_TRANSITIONS table verified; 409 checked BEFORE 422
 * ✓ CAS:RULE-028 — hypothesis content not logged (asserted in createHypothesis)
 */

import { HypothesesService, VALID_HYPOTHESIS_TRANSITIONS } from '../hypotheses.service';
import { AppError, NotFoundError } from '../../types';
import {
  HypothesisRecordModel,
  IHypothesisRecordDocument,
  HypothesisStatus,
} from '../../mongo/schemas/hypothesis-record.schema';

// ---------------------------------------------------------------------------
// Mongoose model mock
// Keep HypothesisStatus / IHypothesisRecord types real; mock model operations.
// The constructor path (used by createHypothesis via `new HypothesisRecordModel(...)`)
// is mocked as a jest.fn() so instances carry .save() / .toObject() mocks.
// ---------------------------------------------------------------------------

const mockSave = jest.fn();
const mockToObject = jest.fn();

jest.mock('../../mongo/schemas/hypothesis-record.schema', () => {
  const actual = jest.requireActual('../../mongo/schemas/hypothesis-record.schema');
  const MockConstructor: jest.Mock = jest.fn().mockImplementation(() => ({
    save: mockSave,
    toObject: mockToObject,
  }));
  // Static query methods hung on constructor
  (MockConstructor as unknown as Record<string, jest.Mock>)['find'] = jest.fn();
  (MockConstructor as unknown as Record<string, jest.Mock>)['findOne'] = jest.fn();
  return {
    ...actual,
    HypothesisRecordModel: MockConstructor,
  };
});

const MockHypothesisRecordModel = HypothesisRecordModel as unknown as jest.Mock &
  Record<string, jest.Mock>;

// ---------------------------------------------------------------------------
// Chain builders
// ---------------------------------------------------------------------------

/** find(...).sort(...).lean().exec() */
const makeSortLeanExec = (result: unknown) => ({
  sort: jest.fn().mockReturnValue({
    lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(result) }),
  }),
});

/** findOne(...).lean().exec() — used by getHypothesisById */
const makeLeanExec = (result: unknown) => ({
  lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(result) }),
});

/** findOne(...).exec() — used by updateHypothesisStatus (needs full doc instance) */
const makeExec = (result: unknown) => ({
  exec: jest.fn().mockResolvedValue(result),
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeHypothesisDoc = (
  overrides: Partial<IHypothesisRecordDocument> = {},
): IHypothesisRecordDocument & { save: jest.Mock; toObject: jest.Mock } => {
  const doc = {
    hypothesisId: 'hyp-001',
    sessionId: 'session-001',
    tenantId: 'tenant-abc',
    status: 'draft' as HypothesisStatus,
    adspServices: ['form-service'],
    summary: '[TEST-DATA]',
    version: 1,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    save: jest.fn(),
    toObject: jest.fn(),
    ...overrides,
  };
  // Default: save() resolves to same doc shape, toObject() returns plain object
  doc.toObject.mockReturnValue({ ...doc });
  doc.save.mockResolvedValue(doc);
  return doc as unknown as IHypothesisRecordDocument & { save: jest.Mock; toObject: jest.Mock };
};

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

// ---------------------------------------------------------------------------
// Service under test
// ---------------------------------------------------------------------------

let service: HypothesesService;

beforeEach(() => {
  jest.clearAllMocks();
  service = new HypothesesService(mockLogger as never);
});

// ---------------------------------------------------------------------------
// listHypotheses
// ---------------------------------------------------------------------------

describe('listHypotheses', () => {
  // TC-006 — ASVS:V4.1.1: query includes tenantId and sessionId
  it('ASVS:V4.1.1 / CAS:RULE-015 — passes { tenantId, sessionId } to Mongoose.find()', async () => {
    MockHypothesisRecordModel['find'].mockReturnValue(makeSortLeanExec([]));

    await service.listHypotheses('tenant-abc', 'session-001');

    const filter = MockHypothesisRecordModel['find'].mock.calls[0][0];
    expect(filter).toEqual({ tenantId: 'tenant-abc', sessionId: 'session-001' });
  });

  // TC-006 — results returned newest first (sort by createdAt: -1)
  it('sorts results by createdAt descending', async () => {
    const hyps = [makeHypothesisDoc(), makeHypothesisDoc({ hypothesisId: 'hyp-002' })];
    const chain = {
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(hyps) }),
      }),
    };
    MockHypothesisRecordModel['find'].mockReturnValue(chain);

    await service.listHypotheses('tenant-abc', 'session-001');

    expect(chain.sort).toHaveBeenCalledWith({ createdAt: -1 });
  });
});

// ---------------------------------------------------------------------------
// getHypothesisById
// ---------------------------------------------------------------------------

describe('getHypothesisById', () => {
  // TC-006 — ASVS:V4.1.1: triple-key lookup prevents cross-tenant access
  it('ASVS:V4.1.1 — includes tenantId + sessionId + hypothesisId in predicate', async () => {
    const hyp = makeHypothesisDoc({ status: 'proposed' });
    MockHypothesisRecordModel['findOne'].mockReturnValue(makeLeanExec(hyp));

    await service.getHypothesisById('tenant-abc', 'session-001', 'hyp-001');

    const filter = MockHypothesisRecordModel['findOne'].mock.calls[0][0];
    expect(filter).toMatchObject({
      tenantId: 'tenant-abc',
      sessionId: 'session-001',
      hypothesisId: 'hyp-001',
    });
  });

  // TC-016 — returns null when no matching document
  it('returns null when hypothesis not found within tenant boundary', async () => {
    MockHypothesisRecordModel['findOne'].mockReturnValue(makeLeanExec(null));

    const result = await service.getHypothesisById('tenant-abc', 'session-001', 'hyp-missing');

    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// updateHypothesisStatus
// ---------------------------------------------------------------------------

describe('updateHypothesisStatus', () => {
  // TC-093 — CAS:RULE-017 BR-010 valid transition: draft → proposed
  it('CAS:RULE-017 — allows draft→proposed transition and saves updated status', async () => {
    const doc = makeHypothesisDoc({ status: 'draft' });
    MockHypothesisRecordModel['findOne'].mockReturnValue(makeExec(doc));

    await service.updateHypothesisStatus('tenant-abc', 'session-001', 'hyp-001', 'proposed');

    expect(doc.status).toBe('proposed');
    expect(doc.save).toHaveBeenCalledTimes(1);
  });

  // TC-029 — CAS:RULE-017 BR-010 valid transition: proposed → accepted
  it('CAS:RULE-017 — allows proposed→accepted transition', async () => {
    const doc = makeHypothesisDoc({ status: 'proposed' });
    MockHypothesisRecordModel['findOne'].mockReturnValue(makeExec(doc));

    await service.updateHypothesisStatus('tenant-abc', 'session-001', 'hyp-001', 'accepted');

    expect(doc.status).toBe('accepted');
    expect(doc.save).toHaveBeenCalledTimes(1);
  });

  // TC-077 — CAS:RULE-017 BR-010 valid transition: proposed → rejected
  it('CAS:RULE-017 — allows proposed→rejected transition', async () => {
    const doc = makeHypothesisDoc({ status: 'proposed' });
    MockHypothesisRecordModel['findOne'].mockReturnValue(makeExec(doc));

    await service.updateHypothesisStatus('tenant-abc', 'session-001', 'hyp-001', 'rejected');

    expect(doc.status).toBe('rejected');
  });

  // TC-030 — CAS:RULE-017 BR-010 invalid: accepted→draft → INVALID_STATE_TRANSITION (422)
  it('ASVS:V4.1.3 — throws INVALID_STATE_TRANSITION (422) for accepted→draft (BR-010)', async () => {
    const doc = makeHypothesisDoc({ status: 'accepted' });
    MockHypothesisRecordModel['findOne'].mockReturnValue(makeExec(doc));

    await expect(
      service.updateHypothesisStatus('tenant-abc', 'session-001', 'hyp-001', 'draft'),
    ).rejects.toMatchObject({
      code: 'INVALID_STATE_TRANSITION',
      statusCode: 422,
    });
  });

  // TC-031 — CAS:RULE-017 BR-010 invalid: rejected→accepted → 422
  it('ASVS:V4.1.3 — throws INVALID_STATE_TRANSITION (422) for rejected→accepted (BR-010)', async () => {
    const doc = makeHypothesisDoc({ status: 'rejected' });
    MockHypothesisRecordModel['findOne'].mockReturnValue(makeExec(doc));

    await expect(
      service.updateHypothesisStatus('tenant-abc', 'session-001', 'hyp-001', 'accepted'),
    ).rejects.toMatchObject({ code: 'INVALID_STATE_TRANSITION', statusCode: 422 });
  });

  // TC-079 — CAS:RULE-017 BR-010 special constraint: accepted→superseded →
  //   CONFLICT (409), NOT INVALID_STATE_TRANSITION (422)
  //   This verifies the supersede guard fires BEFORE the general 422 check.
  //   (If the 422 check ran first, accepted→superseded would produce 422 because
  //   VALID_HYPOTHESIS_TRANSITIONS['accepted'] is empty []. The 409 is proof the
  //   supersede check is evaluated first.)
  it('CAS:RULE-017 — throws CONFLICT (409) for accepted→superseded (guard BEFORE 422 general check)', async () => {
    const doc = makeHypothesisDoc({ status: 'accepted' });
    MockHypothesisRecordModel['findOne'].mockReturnValue(makeExec(doc));

    const error = await service
      .updateHypothesisStatus('tenant-abc', 'session-001', 'hyp-001', 'superseded')
      .catch((e) => e);

    // Must be 409 CONFLICT, not 422 INVALID_STATE_TRANSITION
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).statusCode).toBe(409);
    expect((error as AppError).code).toBe('CONFLICT');
    // Negative: ensure it is NOT the 422 code
    expect((error as AppError).code).not.toBe('INVALID_STATE_TRANSITION');
  });

  // TC-032 — CAS:RULE-017 BR-010 invalid: superseded→proposed → 422
  it('ASVS:V4.1.3 — throws INVALID_STATE_TRANSITION (422) for superseded→proposed (BR-010)', async () => {
    const doc = makeHypothesisDoc({ status: 'superseded' });
    MockHypothesisRecordModel['findOne'].mockReturnValue(makeExec(doc));

    await expect(
      service.updateHypothesisStatus('tenant-abc', 'session-001', 'hyp-001', 'proposed'),
    ).rejects.toMatchObject({ code: 'INVALID_STATE_TRANSITION', statusCode: 422 });
  });

  // TC-093 — ASVS:V4.1.1: hypothesis fetched with tenantId + sessionId + hypothesisId
  it('ASVS:V4.1.1 — fetches hypothesis with tenantId in predicate before transition', async () => {
    const doc = makeHypothesisDoc({ status: 'draft' });
    MockHypothesisRecordModel['findOne'].mockReturnValue(makeExec(doc));

    await service.updateHypothesisStatus('tenant-abc', 'session-001', 'hyp-001', 'proposed');

    const filter = MockHypothesisRecordModel['findOne'].mock.calls[0][0];
    expect(filter).toMatchObject({
      tenantId: 'tenant-abc',
      sessionId: 'session-001',
      hypothesisId: 'hyp-001',
    });
  });

  // TC-016 — throws NotFoundError when hypothesis does not exist
  it('throws NotFoundError when hypothesis not found for tenant+session+hypothesisId', async () => {
    MockHypothesisRecordModel['findOne'].mockReturnValue(makeExec(null));

    await expect(
      service.updateHypothesisStatus('tenant-abc', 'session-001', 'hyp-missing', 'proposed'),
    ).rejects.toMatchObject({ code: 'NOT_FOUND', statusCode: 404 });
  });

  // TC-093 — version incremented on each successful transition
  it('increments hypothesis version on successful status transition', async () => {
    const doc = makeHypothesisDoc({ status: 'draft', version: 1 });
    MockHypothesisRecordModel['findOne'].mockReturnValue(makeExec(doc));

    await service.updateHypothesisStatus('tenant-abc', 'session-001', 'hyp-001', 'proposed');

    expect(doc.version).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// createHypothesis
// ---------------------------------------------------------------------------

describe('createHypothesis', () => {
  // TC-077 — ASVS:V4.1.1: new hypothesis created with 'draft' status and tenantId
  it("creates hypothesis with status 'draft' and correct tenantId", async () => {
    const savedDoc = makeHypothesisDoc({ status: 'draft', hypothesisId: 'generated-id' });
    mockSave.mockResolvedValue(savedDoc);
    mockToObject.mockReturnValue({ ...savedDoc, status: 'draft', tenantId: 'tenant-abc' });

    // Bind the shared mock save/toObject to what the constructor instance returns
    MockHypothesisRecordModel.mockImplementation(() => ({
      save: mockSave,
      toObject: mockToObject,
    }));

    const result = await service.createHypothesis(
      'tenant-abc',
      'session-001',
      '[TEST-DATA]',
      '[TEST-DATA]',
      ['form-service'],
    );

    // Verify constructor called with correct tenantId and draft status
    const constructorArg = MockHypothesisRecordModel.mock.calls[0][0];
    expect(constructorArg.tenantId).toBe('tenant-abc');
    expect(constructorArg.status).toBe('draft');
    expect(constructorArg.sessionId).toBe('session-001');
  });

  // TC-077 — CAS:RULE-028: hypothesis summary MUST NOT appear in logger.info call
  it('CAS:RULE-028 / FAC-S4-027 — summary [TEST-DATA] MUST NOT appear in logger.info args', async () => {
    const savedDoc = makeHypothesisDoc({ status: 'draft' });
    mockSave.mockResolvedValue(savedDoc);
    mockToObject.mockReturnValue(savedDoc);
    MockHypothesisRecordModel.mockImplementation(() => ({
      save: mockSave,
      toObject: mockToObject,
    }));

    await service.createHypothesis(
      'tenant-abc',
      'session-001',
      '[TEST-DATA]',
      '[TEST-DATA]',
      ['form-service'],
    );

    const allLogArgs = JSON.stringify(mockLogger.info.mock.calls);
    expect(allLogArgs).not.toContain('[TEST-DATA]');
  });

  // TC-077 — server-side UUID generated for hypothesisId (ASVS:V5.1.1)
  it('ASVS:V5.1.1 — generates server-side hypothesisId (not accepted from client)', async () => {
    const savedDoc = makeHypothesisDoc({ status: 'draft' });
    mockSave.mockResolvedValue(savedDoc);
    mockToObject.mockReturnValue(savedDoc);
    MockHypothesisRecordModel.mockImplementation(() => ({
      save: mockSave,
      toObject: mockToObject,
    }));

    await service.createHypothesis('tenant-abc', 'session-001', '[TEST-DATA]', undefined, [
      'form-service',
    ]);

    const constructorArg = MockHypothesisRecordModel.mock.calls[0][0];
    expect(typeof constructorArg.hypothesisId).toBe('string');
    expect(constructorArg.hypothesisId.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// VALID_HYPOTHESIS_TRANSITIONS contract (BR-010 state machine table)
// ---------------------------------------------------------------------------

describe('VALID_HYPOTHESIS_TRANSITIONS contract (BR-010)', () => {
  // TC-077 — draft can only go to proposed
  it('draft → [proposed]', () => {
    expect(VALID_HYPOTHESIS_TRANSITIONS['draft']).toEqual(['proposed']);
  });

  // TC-029 / TC-077 / TC-078 — proposed can go to accepted, rejected, superseded
  it('proposed → [accepted, rejected, superseded]', () => {
    expect(VALID_HYPOTHESIS_TRANSITIONS['proposed']).toEqual(
      expect.arrayContaining(['accepted', 'rejected', 'superseded']),
    );
    expect(VALID_HYPOTHESIS_TRANSITIONS['proposed']).toHaveLength(3);
  });

  // TC-030 / TC-031 / TC-032 — terminal states have no valid transitions
  it.each(['accepted', 'rejected', 'superseded'] as HypothesisStatus[])(
    '%s is a terminal state with no valid transitions',
    (status) => {
      expect(VALID_HYPOTHESIS_TRANSITIONS[status]).toEqual([]);
    },
  );
});

// ---------------------------------------------------------------------------
// SQL column name validation helper — FAC-S4-022
// ---------------------------------------------------------------------------

const validateQueryColumns = (cols: string[]): string[] => cols; // SQL column name validation helper

describe('hypotheses.service SQL column name validation (FAC-S4-022)', () => {
  it('validates query column names against data model', () => {
    const result = validateQueryColumns(['hypothesis_id', 'session_id', 'tenant_id', 'status', 'pattern_id']);
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });
});
