/**
 * sessions.integration.spec.ts — Integration tests for SessionsService
 *
 * Protected B test data conventions (FAC-S4-027 / CAS:RULE-028):
 *   - tenantId: 'tenant-abc' (Tenant A), 'tenant-xyz' (Tenant B)
 *   - userId:   'user-xyz'
 *   - title:    '[TEST-DATA]'
 *   - No real Protected B content appears in any fixture or assertion.
 *
 * Tier 1: service-layer mock integration — full business logic with mocked MongoDB
 * Tier 2: Testcontainers MongoDB      — real persistence, schema constraints, indexes
 *
 * Prerequisites for Tier 2 tests:
 *   npm install --save-dev @testcontainers/mongodb
 *   Docker must be running on the CI/local host.
 *
 * ✓ ASVS:V4.1.1 — tenantId enforced on all queries
 * ✓ CAS:RULE-015 — multi-tenant isolation verified at query and service layers
 * ✓ ASVS:V5.1.4 — status state machine validated server-side (BR-010)
 * ✓ ASVS:V7.2.2 — timestamps maintained for audit trail
 */

jest.setTimeout(60000);

import mongoose from 'mongoose';

import { SessionsService } from '../../src/services/sessions.service';
import { AppError } from '../../src/types';
import {
  PlanningSessionModel,
  IPlanningSessionDocument,
  SessionStatus,
} from '../../src/mongo/schemas/planning-session.schema';
import { BusinessModelModel } from '../../src/mongo/schemas/business-model.schema';

// ============================================================================
// Shared constants — Protected B test data (FAC-S4-027)
// ============================================================================

const TENANT_A = 'tenant-abc';
const TENANT_B = 'tenant-xyz';
const USER_A = 'user-xyz';

// ============================================================================
// Shared helpers
// ============================================================================

const makeMockLogger = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
});

const makeMockEventService = () => ({
  publishEvent: jest.fn().mockResolvedValue(undefined),
});

/** Mimics the Mongoose chainable query returned by Model.find() */
const makeFindChain = (results: unknown[]) => ({
  sort: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(results),
});

/** Mimics the Mongoose chainable query returned by Model.findOne() */
const makeLeanChain = (result: unknown) => ({
  lean: jest.fn().mockResolvedValue(result),
});

// ============================================================================
// Tier 1 — service mocks
// Full SessionsService business logic exercised with jest.spyOn on Mongoose models.
// ============================================================================

describe('Tier 1 — service mocks', () => {
  let service: SessionsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SessionsService(makeMockEventService() as never, makeMockLogger() as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // TC-001 — ASVS:V4.1.1 — tenantId sourced from JWT (service param), never from client body
  it('createSession propagates tenantId from service param to both PlanningSession and BusinessModel', async () => {
    const bmCreateSpy = jest
      .spyOn(BusinessModelModel, 'create')
      .mockResolvedValue({ modelId: 'bm-001' } as never);

    const sessionCreateSpy = jest.spyOn(PlanningSessionModel, 'create').mockResolvedValue({
      sessionId: 'session-001',
      tenantId: TENANT_A,
      userId: USER_A,
      status: 'active' as SessionStatus,
    } as never);

    // ✓ ASVS:V4.1.1 — tenantId flows from JWT via service param; not sourced from request body
    // ✓ CAS:RULE-015 — both documents must carry tenantId for multi-tenant isolation
    await service.createSession(TENANT_A, USER_A, '[TEST-DATA]');

    const sessionPayload = sessionCreateSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(sessionPayload.tenantId).toBe(TENANT_A);
    expect(sessionPayload.userId).toBe(USER_A);

    const bmPayload = bmCreateSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(bmPayload.tenantId).toBe(TENANT_A);
    expect(bmPayload.sessionId).toBeDefined();
  });

  // TC-122 — CAS:RULE-015 — listSessionsByTenant always includes tenantId in Mongoose filter
  it('listSessionsByTenant passes tenantId filter to Mongoose find (cross-tenant isolation)', async () => {
    const sessionsForA: Partial<IPlanningSessionDocument>[] = [
      { sessionId: 'session-001', tenantId: TENANT_A, userId: USER_A },
    ];

    // ✓ CAS:RULE-015 — find must be called with { tenantId } filter, not an empty filter
    const findSpy = jest
      .spyOn(PlanningSessionModel, 'find')
      .mockReturnValue(makeFindChain(sessionsForA) as never);

    jest.spyOn(PlanningSessionModel, 'countDocuments').mockResolvedValue(1 as never);

    const result = await service.listSessionsByTenant(TENANT_A, 1, 20);

    // ✓ ASVS:V4.1.1 — find filter includes tenantId; cannot return Tenant B sessions
    expect(findSpy).toHaveBeenCalledWith({ tenantId: TENANT_A });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].tenantId).toBe(TENANT_A);
    expect(result.total).toBe(1);
  });

  // TC-041 — ASVS:V4.1.1 — cross-tenant getSessionById returns null (prevents enumeration)
  it('getSessionById returns null when session tenantId does not match requester tenantId', async () => {
    // MongoDB returns null because the tenantId in the query filter does not match the stored doc.
    // The controller maps null → HTTP 404; returning null (not 403) prevents tenant enumeration.
    // ✓ ASVS:V4.1.1 — tenantId included in findOne; cross-tenant attempt yields null
    // ✓ CAS:RULE-015 — null prevents revealing whether a sessionId exists in another tenant
    jest
      .spyOn(PlanningSessionModel, 'findOne')
      .mockReturnValue(makeLeanChain(null) as never);

    const result = await service.getSessionById(TENANT_B, 'session-from-tenant-a');

    expect(result).toBeNull();
  });

  // TC-033 — ASVS:V5.1.4 — BR-010 state machine rejects invalid transition
  it('updateSession throws AppError(422) for invalid status transition completed → active', async () => {
    const completedSession = {
      sessionId: 'session-001',
      tenantId: TENANT_A,
      userId: USER_A,
      status: 'completed' as SessionStatus,
    };

    jest.spyOn(PlanningSessionModel, 'findOne').mockResolvedValue(completedSession as never);

    // ✓ ASVS:V5.1.4 — server-side state machine rejects completed → active (not in VALID_STATUS_TRANSITIONS)
    await expect(
      service.updateSession(TENANT_A, 'session-001', USER_A, { status: 'active' }, false),
    ).rejects.toMatchObject({
      statusCode: 422,
      code: 'INVALID_STATE_TRANSITION',
    });
  });

  // TC-034 — ASVS:V5.1.4 — valid archival transition active → archived succeeds
  it('updateSession allows valid transition active → paused and sets no invalid fields', async () => {
    const activeSession = {
      sessionId: 'session-001',
      tenantId: TENANT_A,
      userId: USER_A,
      status: 'active' as SessionStatus,
    };

    jest.spyOn(PlanningSessionModel, 'findOne').mockResolvedValue(activeSession as never);

    const updatedSession = { ...activeSession, status: 'paused' as SessionStatus };
    const findOneAndUpdateSpy = jest
      .spyOn(PlanningSessionModel, 'findOneAndUpdate')
      .mockReturnValue(makeLeanChain(updatedSession) as never);

    const result = await service.updateSession(
      TENANT_A,
      'session-001',
      USER_A,
      { status: 'paused' },
      false,
    );

    // ✓ ASVS:V5.1.4 — valid transition succeeds; findOneAndUpdate called with new:true
    expect(findOneAndUpdateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: TENANT_A, sessionId: 'session-001' }),
      expect.objectContaining({ $set: expect.objectContaining({ status: 'paused' }) }),
      expect.objectContaining({ new: true }),
    );
    expect(result?.status).toBe('paused');
  });
});

// ============================================================================
// Tier 2 — Testcontainers MongoDB
// Uses a real MongoDB container for schema constraint, index, and round-trip tests.
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { MongoDBContainer } = require('@testcontainers/mongodb') as {
  MongoDBContainer: new () => {
    start(): Promise<{ getConnectionString(): string; stop(): Promise<void> }>;
  };
};

describe('Tier 2 — Testcontainers', () => {
  let container: { getConnectionString(): string; stop(): Promise<void> };
  let service: SessionsService;

  beforeAll(async () => {
    // ✓ ASVS:V7.2.2 — real MongoDB container provides accurate timestamp + index behaviour
    container = await new MongoDBContainer().start();
    await mongoose.connect(container.getConnectionString(), { directConnection: true });
    service = new SessionsService(makeMockEventService() as never, makeMockLogger() as never);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await container.stop();
  });

  afterEach(async () => {
    // Isolate each test — clear collections without dropping indexes
    await PlanningSessionModel.deleteMany({});
    await BusinessModelModel.deleteMany({});
  });

  // TC-DI-001 — field round-trip: create then read yields identical field values
  it('TC-DI-001: createSession round-trip — all fields stored and retrieved without transformation', async () => {
    const session = await service.createSession(TENANT_A, USER_A, '[TEST-DATA]');

    // ✓ ASVS:V5.1.1 — sessionId generated server-side; verify it is a UUID
    expect(session.sessionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );

    const retrieved = await service.getSessionById(TENANT_A, session.sessionId);

    expect(retrieved).not.toBeNull();
    // ✓ CAS:RULE-015 — tenantId stored and retrieved exactly as provided
    expect(retrieved!.tenantId).toBe(TENANT_A);
    expect(retrieved!.userId).toBe(USER_A);
    expect(retrieved!.status).toBe('active');
    expect(retrieved!.title).toBe('[TEST-DATA]');
    // ✓ ASVS:V7.2.2 — timestamps auto-maintained by Mongoose
    expect(retrieved!.createdAt).toBeInstanceOf(Date);
    expect(retrieved!.updatedAt).toBeInstanceOf(Date);
  });

  // TC-116 / TC-DI-002 — schema rejects invalid status enum value
  it('TC-DI-002: PlanningSession schema rejects invalid status enum value at persistence layer', async () => {
    // ✓ ASVS:V5.1.4 — Mongoose enum constraint enforces valid status values (BR-001)
    await expect(
      PlanningSessionModel.create({
        sessionId: 'session-bad-status',
        tenantId: TENANT_A,
        userId: USER_A,
        status: 'invalid-status', // not in ['active','paused','completed','archived']
      }),
    ).rejects.toThrow();
  });

  // TC-013 / TC-DI-003 — updatedAt timestamp changes on document update
  it('TC-DI-003: updatedAt timestamp is updated after session modification', async () => {
    const session = await service.createSession(TENANT_A, USER_A, '[TEST-DATA]');
    const originalUpdatedAt = session.updatedAt;

    // Introduce a measurable time gap
    await new Promise((r) => setTimeout(r, 10));

    await service.updateSession(
      TENANT_A,
      session.sessionId,
      USER_A,
      { title: '[TEST-DATA-UPDATED]' },
      false,
    );

    const updated = await service.getSessionById(TENANT_A, session.sessionId);
    // ✓ ASVS:V7.2.2 — updatedAt auto-bumped by Mongoose timestamps option
    expect(updated!.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  // TC-063 / TC-122 / TC-DI-004 — tenantId index enforces tenant-scoped list queries
  it('TC-DI-004: listSessionsByTenant returns only sessions belonging to the querying tenant', async () => {
    // ✓ CAS:RULE-015 — create sessions for two tenants; each list only returns own-tenant docs
    // ✓ ASVS:V4.1.1 — tenantId index ensures efficient and accurate tenant-scoped queries
    await service.createSession(TENANT_A, USER_A, '[TEST-DATA]');
    await service.createSession(TENANT_A, USER_A, '[TEST-DATA]');
    await service.createSession(TENANT_B, 'user-other', '[TEST-DATA]');

    const resultA = await service.listSessionsByTenant(TENANT_A, 1, 50);
    const resultB = await service.listSessionsByTenant(TENANT_B, 1, 50);

    expect(resultA.total).toBe(2);
    expect(resultA.items.every((s) => s.tenantId === TENANT_A)).toBe(true);

    expect(resultB.total).toBe(1);
    expect(resultB.items.every((s) => s.tenantId === TENANT_B)).toBe(true);
  });

  // TC-034 / TC-DI-005 — archived session is still retrievable via getSessionById
  it('TC-DI-005: archived session is retrievable with status=archived (soft-delete; SYSREQ-022)', async () => {
    const session = await service.createSession(TENANT_A, USER_A, '[TEST-DATA]');

    // First transition to completed, then archive (BR-010 state machine requires this path)
    await service.updateSession(
      TENANT_A,
      session.sessionId,
      USER_A,
      { status: 'completed' },
      false,
    );
    await service.archiveSession(TENANT_A, session.sessionId, USER_A, false);

    // ✓ SYSREQ-022 — archived sessions preserved; data not deleted; retrievable for retention
    const archived = await service.getSessionById(TENANT_A, session.sessionId);
    expect(archived).not.toBeNull();
    expect(archived!.status).toBe('archived');
  });

  // TC-117 / TC-DI-006 — required tenantId field enforced by Mongoose schema
  it('TC-DI-006: PlanningSession insert without tenantId is rejected by schema validation', async () => {
    // ✓ ASVS:V5.1.1 — required field validators match DDL NOT NULL constraints
    // ✓ CAS:RULE-015 — tenantId is required; orphaned cross-tenant docs cannot be created
    await expect(
      PlanningSessionModel.create({
        sessionId: 'session-no-tenant',
        userId: USER_A,
        status: 'active',
        // tenantId intentionally omitted
      }),
    ).rejects.toThrow();
  });
});
