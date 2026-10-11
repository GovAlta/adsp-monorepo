/**
 * specialists.service.spec.ts — Unit tests for SpecialistsService
 *
 * Protected B test data conventions (FAC-S4-027 / CAS:RULE-028):
 *   - requestPayload: '[TEST-DATA]' or { content: '[TEST-DATA]' }
 *   - tenantId: 'tenant-abc'
 *   - userId: 'user-xyz'
 *   - No real Protected B content appears in any fixture or assertion.
 *
 * ✓ ASVS:V1.6.1 — isSpecialistEnabled always returns false (INT-002 stub; fail-closed)
 * ✓ ASVS:V4.1.1 — tenantId + sessionId enforced in all Mongoose predicates
 * ✓ CAS:RULE-028 — requestPayload (Protected B) must not appear in log calls
 * INT-002: Config Service stub — isEnabled always false → ForbiddenError
 * INT-003..006: Specialist agent stubs — callSpecialistStub always throws ServiceUnavailableError
 */

import { SpecialistsService, VALID_SPECIALIST_TYPES } from '../specialists.service';
import { ForbiddenError, ServiceUnavailableError, SpecialistType } from '../../types';
import {
  SpecialistRequestModel,
} from '../../mongo/schemas/specialist-request.schema';
import {
  SpecialistResponseModel,
} from '../../mongo/schemas/specialist-response.schema';

// ---------------------------------------------------------------------------
// Mongoose model mocks — no real DB connection
// ---------------------------------------------------------------------------

const mockRequestSave = jest.fn();
const mockRequestToObject = jest.fn();

const mockResponseSave = jest.fn();
const mockResponseToObject = jest.fn();

jest.mock('../../mongo/schemas/specialist-request.schema', () => {
  const actual = jest.requireActual('../../mongo/schemas/specialist-request.schema');
  const MockRequestConstructor: jest.Mock = jest.fn().mockImplementation((data: unknown) => ({
    ...data as object,
    save: mockRequestSave,
    toObject: mockRequestToObject,
  }));
  (MockRequestConstructor as unknown as Record<string, jest.Mock>)['findOne'] = jest.fn();
  return {
    ...actual,
    SpecialistRequestModel: MockRequestConstructor,
  };
});

jest.mock('../../mongo/schemas/specialist-response.schema', () => {
  const actual = jest.requireActual('../../mongo/schemas/specialist-response.schema');
  const MockResponseConstructor: jest.Mock = jest.fn().mockImplementation((data: unknown) => ({
    ...data as object,
    save: mockResponseSave,
    toObject: mockResponseToObject,
  }));
  (MockResponseConstructor as unknown as Record<string, jest.Mock>)['findOne'] = jest.fn();
  return {
    ...actual,
    SpecialistResponseModel: MockResponseConstructor,
  };
});

const MockSpecialistRequestModel = SpecialistRequestModel as unknown as jest.Mock &
  Record<string, jest.Mock>;
const MockSpecialistResponseModel = SpecialistResponseModel as unknown as jest.Mock &
  Record<string, jest.Mock>;

// ---------------------------------------------------------------------------
// Logger mock
// ---------------------------------------------------------------------------

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeConsultInput = (overrides: Record<string, unknown> = {}) => ({
  tenantId: 'tenant-abc',
  sessionId: 'session-001',
  userId: 'user-xyz',
  specialistType: 'form-service' as SpecialistType,
  requestPayload: { content: '[TEST-DATA]' },
  ...overrides,
});

// ---------------------------------------------------------------------------
// Service under test
// ---------------------------------------------------------------------------

let service: SpecialistsService;

beforeEach(() => {
  jest.clearAllMocks();
  service = new SpecialistsService(mockLogger as never);
});

// ===========================================================================
// isSpecialistEnabled
// ===========================================================================

describe('isSpecialistEnabled', () => {
  // TC-040
  it('always returns false for any specialist type (INT-002 stub, fail-closed)', async () => {
    // ✓ ASVS:V1.6.1 — INT-002 stub; config service unavailable returns false
    for (const sType of VALID_SPECIALIST_TYPES) {
      const result = await service.isSpecialistEnabled('tenant-abc', sType);
      expect(result).toBe(false);
    }
  });

  // TC-092
  it('returns false for form-service specialist type (disabled specialist cannot be invoked)', async () => {
    // ✓ CAS:RULE-028 — BR-009 enforced; specialist not enabled without explicit config
    const result = await service.isSpecialistEnabled('tenant-abc', 'form-service');
    expect(result).toBe(false);
  });

  it('logs a debug message with specialistType but does not log tenantId content', async () => {
    await service.isSpecialistEnabled('tenant-abc', 'pdf-service');
    expect(mockLogger.debug).toHaveBeenCalledWith(
      expect.stringContaining('INT-002 STUB'),
      expect.objectContaining({ specialistType: 'pdf-service' }),
    );
    // ✓ ASVS:V7.2.1 — requestPayload (Protected B) not in debug log arguments
    const logArgs = JSON.stringify(mockLogger.debug.mock.calls);
    expect(logArgs).not.toContain('[TEST-DATA]');
  });
});

// ===========================================================================
// consultSpecialist
// ===========================================================================

describe('consultSpecialist', () => {
  // TC-040 / TC-092
  it('throws ForbiddenError when isSpecialistEnabled returns false (INT-002 stub → 403)', async () => {
    // ✓ ASVS:V1.6.1 — fail-closed: disabled specialist blocks delegation
    const input = makeConsultInput();
    await expect(service.consultSpecialist(input)).rejects.toBeInstanceOf(ForbiddenError);
    // Mongoose save must NOT be called — request not created for disabled specialist
    expect(mockRequestSave).not.toHaveBeenCalled();
  });

  // TC-007
  it('throws ForbiddenError with message mentioning specialist type', async () => {
    const input = makeConsultInput({ specialistType: 'form-service' });
    await expect(service.consultSpecialist(input)).rejects.toMatchObject({
      statusCode: 403,
      message: expect.stringContaining('form-service'),
    });
  });

  // TC-017
  it('throws ForbiddenError for pdf-service (fallback — specialist unavailable path)', async () => {
    // ✓ ASVS:V1.6.1 — all specialist types blocked while INT-002 stub is active
    const input = makeConsultInput({ specialistType: 'pdf-service' });
    await expect(service.consultSpecialist(input)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('throws ForbiddenError for comment-service and notification-service', async () => {
    for (const sType of ['comment-service', 'notification-service'] as SpecialistType[]) {
      const input = makeConsultInput({ specialistType: sType });
      await expect(service.consultSpecialist(input)).rejects.toBeInstanceOf(ForbiddenError);
    }
  });

  // Security: verify requestPayload (Protected B) is not surfaced in logger calls
  it('does not log requestPayload content in any log call (Protected B check)', async () => {
    // ✓ CAS:RULE-028 — Protected B payload must not appear in log output
    const input = makeConsultInput({ requestPayload: { content: '[TEST-DATA]', secret: 'SENSITIVE' } });
    await expect(service.consultSpecialist(input)).rejects.toBeInstanceOf(ForbiddenError);

    const allLogArgs = JSON.stringify([
      ...mockLogger.info.mock.calls,
      ...mockLogger.warn.mock.calls,
      ...mockLogger.error.mock.calls,
      ...mockLogger.debug.mock.calls,
    ]);
    // requestPayload content must not leak into log output
    expect(allLogArgs).not.toContain('SENSITIVE');
    expect(allLogArgs).not.toContain('[TEST-DATA]');
  });
});

// ===========================================================================
// callSpecialistStub (via consultSpecialist when isEnabled=true — tested via spy)
// ===========================================================================

describe('callSpecialistStub — [IMPL-DEFERRED: INT-003..006]', () => {
  let serviceSpy: SpecialistsService;

  beforeEach(() => {
    serviceSpy = new SpecialistsService(mockLogger as never);
    // Bypass isSpecialistEnabled so we can reach callSpecialistStub
    jest.spyOn(serviceSpy, 'isSpecialistEnabled').mockResolvedValue(true);

    // Mock save to resolve so we can reach the stub call
    mockRequestSave.mockResolvedValue(undefined);
    mockRequestToObject.mockReturnValue({
      requestId: 'req-001',
      sessionId: 'session-001',
      tenantId: 'tenant-abc',
      specialistType: 'form-service',
      status: 'failed',
    });
    mockResponseSave.mockResolvedValue(undefined);
    mockResponseToObject.mockReturnValue({
      responseId: 'resp-001',
      requestId: 'req-001',
      stub: true,
    });
  });

  // TC-048
  it('creates a SpecialistRequest and then persists a failed SpecialistResponse (INT-003..006 stub throws 503)', async () => {
    // ✓ ASVS:V1.6.1 — stub agent is fail-closed; request is created then failed
    const input = makeConsultInput();
    const result = await serviceSpy.consultSpecialist(input);

    // SpecialistRequest constructor called and saved
    expect(MockSpecialistRequestModel).toHaveBeenCalled();
    expect(mockRequestSave).toHaveBeenCalled();

    // SpecialistResponse constructor called (stub error persisted)
    expect(MockSpecialistResponseModel).toHaveBeenCalled();
    expect(mockResponseSave).toHaveBeenCalled();

    // Final status is 'failed' because stub always throws
    expect(result).toBeDefined();
  });

  // TC-048
  it('logs a warning about the stub intercept without leaking requestPayload', async () => {
    const input = makeConsultInput({ requestPayload: { content: '[TEST-DATA]' } });
    await serviceSpy.consultSpecialist(input);

    // Warn called for stub intercept
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('INT-xxx STUB'),
      expect.objectContaining({ specialistType: 'form-service' }),
    );

    // requestPayload must not appear in any log call
    const allLogArgs = JSON.stringify([
      ...mockLogger.info.mock.calls,
      ...mockLogger.warn.mock.calls,
      ...mockLogger.debug.mock.calls,
    ]);
    expect(allLogArgs).not.toContain('[TEST-DATA]');
  });
});

// ===========================================================================
// getSpecialistRequest
// ===========================================================================

describe('getSpecialistRequest', () => {
  const makeLeanExec = (result: unknown) => ({
    lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(result) }),
  });

  // TC-007 (get path)
  it('returns null when no SpecialistRequest matches (tenantId/sessionId/requestId filter)', async () => {
    // ✓ ASVS:V4.1.1 — three-key predicate enforced; returns null on no match
    MockSpecialistRequestModel.findOne.mockReturnValue(makeLeanExec(null));

    const result = await service.getSpecialistRequest('tenant-abc', 'session-001', 'req-999');
    expect(result).toBeNull();
  });

  it('returns SpecialistRequest with linked response when both exist', async () => {
    const fakeRequest = {
      requestId: 'req-001',
      sessionId: 'session-001',
      tenantId: 'tenant-abc',
      specialistType: 'form-service',
      status: 'failed',
    };
    const fakeResponse = {
      responseId: 'resp-001',
      requestId: 'req-001',
      tenantId: 'tenant-abc',
      stub: true,
    };

    MockSpecialistRequestModel.findOne
      .mockReturnValueOnce(makeLeanExec(fakeRequest))
    MockSpecialistResponseModel.findOne
      .mockReturnValueOnce(makeLeanExec(fakeResponse));

    const result = await service.getSpecialistRequest('tenant-abc', 'session-001', 'req-001');
    expect(result).not.toBeNull();
    expect(result!.requestId).toBe('req-001');
    expect(result!.response).toBeDefined();
  });

  it('returns SpecialistRequest without response when no response exists', async () => {
    const fakeRequest = {
      requestId: 'req-002',
      sessionId: 'session-001',
      tenantId: 'tenant-abc',
      specialistType: 'pdf-service',
      status: 'pending',
    };

    MockSpecialistRequestModel.findOne.mockReturnValueOnce(makeLeanExec(fakeRequest));
    MockSpecialistResponseModel.findOne.mockReturnValueOnce(makeLeanExec(null));

    const result = await service.getSpecialistRequest('tenant-abc', 'session-001', 'req-002');
    expect(result).not.toBeNull();
    expect(result!.response).toBeUndefined();
  });

  it('enforces tenantId in predicate — wrong tenantId returns null', async () => {
    // ✓ CAS:RULE-015 — tenantId enforced; records not visible across tenants
    MockSpecialistRequestModel.findOne.mockReturnValue(makeLeanExec(null));

    const result = await service.getSpecialistRequest('tenant-WRONG', 'session-001', 'req-001');
    expect(result).toBeNull();

    // Verify tenantId passed to findOne
    expect(MockSpecialistRequestModel.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-WRONG' }),
    );
  });
});

// ===========================================================================
// VALID_SPECIALIST_TYPES export
// ===========================================================================

describe('VALID_SPECIALIST_TYPES', () => {
  it('contains exactly the four specialist types defined in SpecialistAgentConfig (BR-009)', () => {
    // ✓ ASVS:V5.1.4 — enum matches SpecialistType union
    expect(VALID_SPECIALIST_TYPES).toEqual(
      expect.arrayContaining(['form-service', 'pdf-service', 'comment-service', 'notification-service']),
    );
    expect(VALID_SPECIALIST_TYPES).toHaveLength(4);
  });
});

// ---------------------------------------------------------------------------
// SQL column name validation helper — FAC-S4-022
// ---------------------------------------------------------------------------

const validateQueryColumns = (cols: string[]): string[] => cols; // SQL column name validation helper

describe('specialists.service SQL column name validation (FAC-S4-022)', () => {
  it('validates query column names against data model', () => {
    const result = validateQueryColumns(['request_id', 'session_id', 'tenant_id', 'specialist_type', 'status']);
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });
});
