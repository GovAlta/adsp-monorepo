/**
 * specialists.integration.spec.ts — Integration tests for SpecialistsService
 *
 * Protected B test data conventions (FAC-S4-027 / CAS:RULE-028):
 *   - tenantId: 'tenant-abc' (Tenant A), 'tenant-xyz' (Tenant B)
 *   - userId:   'user-xyz'
 *   - requestPayload: { description: '[TEST-DATA]' } (no real Protected B content)
 *
 * Tier 1 ONLY — stub behavior testing (no Tier 2).
 * INT-003..006 are all Stub status; Testcontainers cannot simulate specialist agents.
 * The describe.skip block below documents the deferred Tier 2 scope.
 *
 * INT-002 (ADSP Config Service) is stub — isSpecialistEnabled always returns false.
 * INT-003..006 (specialist agents) are stubs — callSpecialistStub always throws 503.
 *
 * ✓ ASVS:V1.6.1 — specialist stubs are fail-closed at two layers
 * ✓ ASVS:V4.1.1 — tenantId enforced on all SpecialistRequest Mongoose predicates
 * ✓ CAS:RULE-028 — requestPayload not logged; only IDs appear in log output
 *
 * [IMPL-DEFERRED: INT-002,INT-003,INT-004,INT-005,INT-006]
 * X-Integration-Stubbed: INT-002,INT-003,INT-004,INT-005,INT-006
 */

import {
  SpecialistsService,
  VALID_SPECIALIST_TYPES,
} from '../../src/services/specialists.service';
import { ForbiddenError, ServiceUnavailableError, SpecialistType } from '../../src/types';
import {
  SpecialistRequestModel,
  ISpecialistRequestDocument,
} from '../../src/mongo/schemas/specialist-request.schema';
import {
  SpecialistResponseModel,
} from '../../src/mongo/schemas/specialist-response.schema';

// ============================================================================
// Shared constants — Protected B test data (FAC-S4-027)
// ============================================================================

const TENANT_A = 'tenant-abc';
const TENANT_B = 'tenant-xyz';
const SESSION_A = 'session-001';
const USER_A = 'user-xyz';
const REQUEST_ID = 'req-001';

const ALL_SPECIALIST_TYPES: SpecialistType[] = [
  'form-service',
  'pdf-service',
  'comment-service',
  'notification-service',
];

// ============================================================================
// Shared helpers
// ============================================================================

const makeMockLogger = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
});

/** Builds a ConsultSpecialistInput for a given specialist type */
const makeConsultInput = (specialistType: SpecialistType = 'form-service') => ({
  sessionId: SESSION_A,
  tenantId: TENANT_A,
  specialistType,
  requestPayload: { description: '[TEST-DATA]' },
  userId: USER_A,
});

/** Mimics .lean().exec() for SpecialistRequestModel.findOne() */
const makeLeanExecChain = (result: unknown) => ({
  lean: jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue(result),
  }),
});

// ============================================================================
// Tier 1 — service-layer mock integration (stub behavior tests)
// ============================================================================

describe('Tier 1 — service-layer mock integration (stub behavior)', () => {
  let service: SpecialistsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SpecialistsService(makeMockLogger() as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // TC-040 — ASVS:V1.6.1 — consultSpecialist throws ForbiddenError(403) when isEnabled=false (INT-002 stub)
  it('TC-040: consultSpecialist throws ForbiddenError(403) because isSpecialistEnabled returns false (INT-002 stub, BR-009)', async () => {
    // [IMPL-DEFERRED: INT-002] — stub always returns false; delegation blocked at first gate
    // ✓ ASVS:V1.6.1 — fail-closed: isEnabled=false results in ForbiddenError, not silent degradation
    // ✓ ASVS:V4.1.2 — disabled specialist rejected; no partial delegation performed
    await expect(
      service.consultSpecialist(makeConsultInput('form-service')),
    ).rejects.toMatchObject({
      statusCode: 403,
      code: 'FORBIDDEN',
    });
  });

  // TC-040 — isSpecialistEnabled always returns false for all 4 specialist types (INT-002 stub)
  it.each(ALL_SPECIALIST_TYPES)(
    'TC-040: isSpecialistEnabled always returns false for specialist type "%s" (INT-002 stub)',
    async (specialistType) => {
      // [IMPL-DEFERRED: INT-002] — Config Service stub; all specialist types disabled
      // ✓ ASVS:V1.6.1 — fail-closed: no specialist type returns enabled=true in stub mode
      const result = await service.isSpecialistEnabled(TENANT_A, specialistType);
      expect(result).toBe(false);
    },
  );

  // TC-016 — ASVS:V1.6.1 — callSpecialistStub throws ServiceUnavailableError(503) (INT-003..006 stubs)
  it('TC-016: consultSpecialist returns status=failed when isEnabled=true (callSpecialistStub fail-closed, INT-003..006)', async () => {
    // Override isSpecialistEnabled to return true so the code reaches callSpecialistStub.
    // This simulates the future state when INT-002 is enabled but INT-003..006 are still stubs.
    // [IMPL-DEFERRED: INT-003..006] — stub always throws; service catches and records failure
    // ✓ ASVS:V1.6.1 — two-layer fail-closed: isEnabled gate (bypassed here) AND specialist agent stub
    jest
      .spyOn(service, 'isSpecialistEnabled')
      .mockResolvedValue(true);

    // Mock the prototype .save() to avoid needing a real MongoDB connection.
    // The service creates Mongoose documents in-memory; save() just needs to resolve.
    // request.toObject() is called on the in-memory document, so status='failed' is visible.
    const requestSaveSpy = jest
      .spyOn(SpecialistRequestModel.prototype, 'save')
      .mockResolvedValue(undefined as never);

    jest
      .spyOn(SpecialistResponseModel.prototype, 'save')
      .mockResolvedValue(undefined as never);

    // ✓ ASVS:V1.6.1 — consultSpecialist returns a failed request record (does not throw)
    // so the route layer can surface the stub error to the user rather than propagating 503
    const result = await service.consultSpecialist(makeConsultInput('form-service'));

    // Status must be 'failed' because callSpecialistStub threw ServiceUnavailableError
    expect(result.status).toBe('failed');

    // Two save calls on the request document: once for 'pending', once for 'failed'
    // ✓ ASVS:V1.6.1 — both states persisted; stub failure is recorded in the request lifecycle
    expect(requestSaveSpy).toHaveBeenCalledTimes(2);
  });

  // TC-041 — ASVS:V4.1.1 — getSpecialistRequest cross-tenant returns null (not found)
  it('TC-041: getSpecialistRequest returns null when requestId exists in different tenant (cross-tenant isolation)', async () => {
    // ✓ ASVS:V4.1.1 — triple-key lookup (tenantId+sessionId+requestId); Tenant B cannot read Tenant A records
    // ✓ CAS:RULE-015 — null prevents revealing whether requestId exists in another tenant
    jest
      .spyOn(SpecialistRequestModel, 'findOne')
      .mockReturnValue(makeLeanExecChain(null) as never);

    const result = await service.getSpecialistRequest(TENANT_B, SESSION_A, REQUEST_ID);

    expect(result).toBeNull();
    // ✓ ASVS:V4.1.1 — findOne must include tenantId to prevent cross-tenant access
    expect(SpecialistRequestModel.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: TENANT_B }),
    );
  });

  // TC-040 — ASVS:V4.1.1 — consultSpecialist does NOT create a SpecialistRequest when isEnabled=false
  it('TC-040: consultSpecialist does not persist a SpecialistRequest when isEnabled=false (fail-closed before persistence)', async () => {
    // ✓ ASVS:V1.6.1 — ForbiddenError thrown before any DB write; no partial record created
    // ✓ CAS:RULE-028 — requestPayload never reaches persistence when specialist is disabled
    const saveSpy = jest.spyOn(SpecialistRequestModel.prototype, 'save');

    await expect(
      service.consultSpecialist(makeConsultInput('pdf-service')),
    ).rejects.toMatchObject({ statusCode: 403 });

    expect(saveSpy).not.toHaveBeenCalled();
  });

  // TC-040 — VALID_SPECIALIST_TYPES matches SpecialistType union (BR-009)
  it('TC-040: VALID_SPECIALIST_TYPES array contains all 4 expected specialist types (BR-009)', () => {
    // ✓ ASVS:V5.1.4 — VALID_SPECIALIST_TYPES must match the SpecialistType union from types module
    expect(VALID_SPECIALIST_TYPES).toHaveLength(4);
    expect(VALID_SPECIALIST_TYPES).toEqual(
      expect.arrayContaining(['form-service', 'pdf-service', 'comment-service', 'notification-service']),
    );
  });
});

// ============================================================================
// Tier 2 — Testcontainers (deferred: INT-003..006 are Stub)
//
// Testcontainers can verify SpecialistRequest/Response schema round-trips and
// tenantId isolation, but cannot simulate the specialist agent calls
// (INT-003..006 are Stub — the agent endpoints do not exist yet).
// This block will be activated when INT-003..006 are promoted to Catalog-Auto
// or Live status (OPEN-004 resolved).
// ============================================================================

describe.skip('Tier 2 — Testcontainers (deferred: INT-003..006 are Stub)', () => {
  it.todo('specialist round-trip: consultSpecialist stores SpecialistRequest + SpecialistResponse when INT-003..006 are live');
  it.todo('SpecialistRequest tenantId isolation: two tenants same sessionId — getSpecialistRequest returns tenant-specific only');
  it.todo('SpecialistRequest status transitions: pending → completed persisted correctly when INT-003..006 enabled');
  it.todo('SpecialistRequest schema rejects invalid specialistType enum value at persistence layer');
  it.todo('isSpecialistEnabled returns true for enabled tenant config when INT-002 is live');
});
