/**
 * audit.integration.spec.ts — Integration tests for AuditEventService
 *
 * Protected B test data conventions (FAC-S4-027 / CAS:RULE-028):
 *   - tenantId: 'tenant-abc' (Tenant A), 'tenant-xyz' (Tenant B)
 *   - userId:   'user-xyz'
 *   - No real Protected B session content in any fixture or assertion.
 *
 * Tier 1: service-layer mock integration — HMAC chain logic, tenant isolation,
 *         chain verification with tamper detection (jest.spyOn on Mongoose models).
 * Tier 2: Testcontainers MongoDB — real HMAC chain persistence, pagination, append-only.
 *
 * BR-008: every security-relevant operation emits an audit event
 * BR-009: HMAC-SHA256 chain across events; verifyAuditChain detects tampering
 * SYSREQ-020: administrative audit logging with HMAC tamper-evidence
 *
 * ✓ ASVS:V7.3.2 — verifyAuditChain re-computes HMAC chain; reports first failure index
 * ✓ CAS:RULE-028 — audit collection is append-only; no delete or update permitted
 * ✓ ASVS:V4.1.1 — all queries include tenantId; cross-tenant access impossible
 * ✓ ASVS:V7.2.1 — events capture actor, action, resource, outcome
 */

jest.setTimeout(60000);

import { AuditEventService } from '../../src/services/audit.service';
import { AuditEventModel } from '../../src/mongo/schemas/audit-event.schema';
import {
  buildAuditChainHash,
  type AuditEventPayload,
} from '../../src/middleware/audit.middleware';
import type { IAuditEvent } from '../../src/mongo/schemas/audit-event.schema';

// ============================================================================
// Protected B test data constants (FAC-S4-027)
// ============================================================================

const TENANT_A = 'tenant-abc';
const TENANT_B = 'tenant-xyz';
const USER_A = 'user-xyz';
const SIGNING_KEY = 'test-audit-signing-key-for-hmac-chain';

// ============================================================================
// Shared helpers
// ============================================================================

const makeMockLogger = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
});

/** Chainable query stub supporting sort / select / skip / limit / lean */
const makeQueryChain = (result: unknown) => ({
  sort: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(result),
});

/** Chainable stub for Model.find() → sort/skip/limit/select/lean */
const makeFindChain = (results: unknown[]) => ({
  sort: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(results),
});

/** Build a valid mock IAuditEvent with a correctly computed HMAC */
const buildMockEvent = (
  partial: Partial<IAuditEvent> & Pick<IAuditEvent, 'eventId' | 'action' | 'resourceId'>,
  chainAnchorHash: string | null,
  timestamp: Date,
): IAuditEvent => {
  const entryForHmac: AuditEventPayload & { timestamp: string } = {
    actorId: partial.actorId ?? USER_A,
    tenantId: partial.tenantId ?? TENANT_A,
    action: partial.action,
    resourceType: partial.resourceType ?? 'session',
    resourceId: partial.resourceId,
    outcome: partial.outcome ?? 'success',
    timestamp: timestamp.toISOString(),
  };
  const hmac = buildAuditChainHash(entryForHmac, chainAnchorHash, SIGNING_KEY);
  return {
    eventId: partial.eventId,
    actorId: entryForHmac.actorId,
    tenantId: entryForHmac.tenantId,
    action: partial.action,
    resourceType: entryForHmac.resourceType,
    resourceId: partial.resourceId,
    outcome: 'success',
    timestamp,
    hmac,
    previousEventId: null,
    ...partial,
  } as IAuditEvent;
};

// ============================================================================
// Tier 1 — service mocks
// AuditEventService logic with jest.spyOn on AuditEventModel.
// ============================================================================

describe('Tier 1 — service mocks', () => {
  let service: AuditEventService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuditEventService(SIGNING_KEY, makeMockLogger() as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ✓ ASVS:V7.2.2 — HMAC is computed over payload and stored; ensures tamper-evidence (BR-009)
  // ✓ CAS:RULE-028 — append-only create; no modification of existing events
  it('createEvent computes HMAC over payload and stores hmac field (TC-053)', async () => {
    // TC-053
    // First event: no previous hash (first in chain)
    jest.spyOn(AuditEventModel, 'findOne').mockReturnValue(makeQueryChain(null) as any);
    const createSpy = jest
      .spyOn(AuditEventModel, 'create')
      .mockResolvedValue(undefined as any);

    const payload: AuditEventPayload = {
      actorId: USER_A,
      tenantId: TENANT_A,
      action: 'CREATE_SESSION',
      resourceType: 'session',
      resourceId: 'session-001',
      outcome: 'success',
    };

    await service.createEvent(payload);

    expect(createSpy).toHaveBeenCalledTimes(1);
    const createArg = createSpy.mock.calls[0][0] as Record<string, unknown>;

    // Verify hmac is a 64-char hex string (SHA-256 output)
    expect(typeof createArg['hmac']).toBe('string');
    expect((createArg['hmac'] as string).length).toBe(64);

    // Recompute expected HMAC from the persisted timestamp to verify correctness
    const persistedTimestamp = createArg['timestamp'] as Date;
    const entryForHmac: AuditEventPayload & { timestamp: string } = {
      ...payload,
      timestamp: persistedTimestamp.toISOString(),
    };
    const expectedHmac = buildAuditChainHash(entryForHmac, null, SIGNING_KEY);
    expect(createArg['hmac']).toBe(expectedHmac);
  });

  // ✓ ASVS:V7.2.2 — previousEventId links consecutive events to form HMAC chain (BR-009)
  // ✓ CAS:RULE-028 — chain reference ensures append-only ordering
  it('createEvent sets previousEventId to prior event id on second event in chain (TC-123)', async () => {
    // TC-123
    const PREV_HMAC = 'a'.repeat(64); // simulated prior event HMAC
    const PREV_EVENT_ID = 'event-first-id';

    // Two consecutive findOne calls from createEvent:
    // 1st: getLastChainHash → returns { hmac: PREV_HMAC } (previous event exists)
    // 2nd: _getLastEventId  → returns { eventId: PREV_EVENT_ID }
    jest
      .spyOn(AuditEventModel, 'findOne')
      .mockReturnValueOnce(makeQueryChain({ hmac: PREV_HMAC }) as any)
      .mockReturnValueOnce(makeQueryChain({ eventId: PREV_EVENT_ID }) as any);

    const createSpy = jest
      .spyOn(AuditEventModel, 'create')
      .mockResolvedValue(undefined as any);

    await service.createEvent({
      actorId: USER_A,
      tenantId: TENANT_A,
      action: 'EXPORT_SESSION',
      resourceType: 'session_export',
      resourceId: 'export-002',
      outcome: 'success',
    });

    expect(createSpy).toHaveBeenCalledTimes(1);
    const createArg = createSpy.mock.calls[0][0] as Record<string, unknown>;

    // previousEventId must link back to the prior event's id
    expect(createArg['previousEventId']).toBe(PREV_EVENT_ID);
  });

  // ✓ ASVS:V4.1.1 — listAuditEvents scoped to tenantId; Tenant B events not visible to Tenant A query
  it('listAuditEvents with tenantId filter returns only own-tenant events (TC-015)', async () => {
    // TC-015
    const tenantAEvents = [
      {
        eventId: 'evt-a1',
        actorId: USER_A,
        tenantId: TENANT_A,
        action: 'LOGIN',
        resourceType: 'session',
        outcome: 'success',
        timestamp: new Date(),
      },
    ];

    jest.spyOn(AuditEventModel, 'find').mockReturnValue(makeFindChain(tenantAEvents) as any);
    jest.spyOn(AuditEventModel, 'countDocuments').mockResolvedValue(1);

    const result = await service.listAuditEvents(TENANT_A, {
      page: 1,
      pageSize: 20,
    });

    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].tenantId).toBe(TENANT_A);

    // Verify the find call included tenantId filter
    const findCall = (AuditEventModel.find as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
    expect(findCall['tenantId']).toBe(TENANT_A);
  });

  // ✓ ASVS:V7.3.2 — verifyAuditChain returns verified:true for an intact HMAC chain (BR-009)
  it('verifyAuditChain returns { verified: true } for intact chain (TC-053)', async () => {
    // TC-053
    const eventTimestamp = new Date('2024-06-01T10:00:00.000Z');
    const mockEvent = buildMockEvent(
      {
        eventId: 'event-verify-001',
        action: 'CREATE_SESSION',
        resourceId: 'session-999',
        tenantId: TENANT_A,
        outcome: 'success',
      },
      null, // first event — no previous hash
      eventTimestamp,
    );

    // verifyAuditChain calls AuditEventModel.find (for events slice); startIndex=0 so no anchor call
    jest.spyOn(AuditEventModel, 'find').mockReturnValue(makeFindChain([mockEvent]) as any);

    const result = await service.verifyAuditChain(TENANT_A, 0, 0);

    expect(result.verified).toBe(true);
    expect(result.checkedCount).toBe(1);
    expect(result.failedAtIndex).toBeUndefined();
  });

  // ✓ ASVS:V7.3.2 — verifyAuditChain detects tampered hmac at first failed index (BR-009)
  it('verifyAuditChain returns { verified: false, failedAtIndex: 0 } when first event hmac is tampered (TC-053)', async () => {
    // TC-053
    const eventTimestamp = new Date('2024-06-01T10:00:00.000Z');
    // Build a valid event then tamper the hmac to simulate log manipulation
    const validEvent = buildMockEvent(
      {
        eventId: 'event-tampered-001',
        action: 'DELETE_DATA',
        resourceId: 'resource-x',
        tenantId: TENANT_A,
        outcome: 'success',
      },
      null,
      eventTimestamp,
    );
    const tamperedEvent: IAuditEvent = {
      ...validEvent,
      hmac: 'f'.repeat(64), // tampered HMAC — does not match payload
    };

    jest.spyOn(AuditEventModel, 'find').mockReturnValue(makeFindChain([tamperedEvent]) as any);

    const result = await service.verifyAuditChain(TENANT_A, 0, 0);

    expect(result.verified).toBe(false);
    expect(result.failedAtIndex).toBe(0);
    expect(result.failedEventId).toBe('event-tampered-001');
    expect(result.checkedCount).toBe(1);
  });
});

// ============================================================================
// Tier 2 — Testcontainers MongoDB (real persistence)
// HMAC chain round-trips, pagination, append-only verification.
// ============================================================================

describe('Tier 2 — Testcontainers MongoDB', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let container: any;
  let mongooseLib: typeof import('mongoose');
  let service: AuditEventService;

  beforeAll(async () => {
    const { MongoDBContainer } = await import('@testcontainers/mongodb');
    mongooseLib = (await import('mongoose')).default;

    container = await new MongoDBContainer('mongo:6').start();
    const mongoUri = container.getConnectionString();
    await mongooseLib.connect(mongoUri, { directConnection: true });

    // Ensure schema is registered on this connection
    await import('../../src/mongo/schemas/audit-event.schema');

    service = new AuditEventService(SIGNING_KEY, makeMockLogger() as any);
  }, 90000);

  afterAll(async () => {
    await mongooseLib.disconnect();
    if (container) {
      await container.stop();
    }
  });

  beforeEach(async () => {
    await AuditEventModel.deleteMany({});
  });

  // ✓ ASVS:V7.2.2 — 3 consecutive events persist with correct HMAC chain links (BR-009)
  // ✓ CAS:RULE-028 — previousEventId forms an auditable chain of custody
  it('3 audit events persist with correct previousEventId chain links (TC-123)', async () => {
    // TC-123
    const basePayload: Omit<AuditEventPayload, 'action' | 'resourceId'> = {
      actorId: USER_A,
      tenantId: TENANT_A,
      resourceType: 'session',
      outcome: 'success',
    };

    await service.createEvent({ ...basePayload, action: 'EVENT_1', resourceId: 'res-001' });
    // Small delay to ensure distinct timestamps for ordering
    await new Promise((r) => setTimeout(r, 10));
    await service.createEvent({ ...basePayload, action: 'EVENT_2', resourceId: 'res-002' });
    await new Promise((r) => setTimeout(r, 10));
    await service.createEvent({ ...basePayload, action: 'EVENT_3', resourceId: 'res-003' });

    // Retrieve in chronological order to verify chain
    const events = await AuditEventModel.find({ tenantId: TENANT_A })
      .sort({ timestamp: 1 })
      .lean() as unknown as IAuditEvent[];

    expect(events).toHaveLength(3);

    // First event: chain anchor — no previous event
    expect(events[0].previousEventId).toBeNull();
    expect(events[0].action).toBe('EVENT_1');

    // Second event: previousEventId points to first event
    expect(events[1].previousEventId).toBe(events[0].eventId);
    expect(events[1].action).toBe('EVENT_2');

    // Third event: previousEventId points to second event
    expect(events[2].previousEventId).toBe(events[1].eventId);
    expect(events[2].action).toBe('EVENT_3');

    // All events have an HMAC field (64-char hex)
    for (const ev of events) {
      expect(typeof ev.hmac).toBe('string');
      expect(ev.hmac.length).toBe(64);
    }
  });

  // ✓ ASVS:V4.1.1 — listAuditEvents pagination covers all events across pages
  it('listAuditEvents paginated: two pages together cover all 3 events (TC-053)', async () => {
    // TC-053
    const basePayload: Omit<AuditEventPayload, 'action' | 'resourceId'> = {
      actorId: USER_A,
      tenantId: TENANT_A,
      resourceType: 'session',
      outcome: 'success',
    };

    await service.createEvent({ ...basePayload, action: 'PAGE_EVENT_1', resourceId: 'r1' });
    await new Promise((r) => setTimeout(r, 10));
    await service.createEvent({ ...basePayload, action: 'PAGE_EVENT_2', resourceId: 'r2' });
    await new Promise((r) => setTimeout(r, 10));
    await service.createEvent({ ...basePayload, action: 'PAGE_EVENT_3', resourceId: 'r3' });

    const page1 = await service.listAuditEvents(TENANT_A, { page: 1, pageSize: 2 });
    const page2 = await service.listAuditEvents(TENANT_A, { page: 2, pageSize: 2 });

    // Total count
    expect(page1.total).toBe(3);
    expect(page2.total).toBe(3);

    // Page sizes
    expect(page1.items).toHaveLength(2);
    expect(page2.items).toHaveLength(1);

    // All 3 events covered across both pages (no duplicates, no gaps)
    const allIds = [...page1.items, ...page2.items].map((e) => e.eventId);
    const uniqueIds = new Set(allIds);
    expect(uniqueIds.size).toBe(3);
  });

  // ✓ CAS:RULE-028 — AuditEventService is append-only: no update or delete methods
  // ✓ ASVS:V7.2.2 — immutability of audit log enforced at service layer
  it('AuditEventService exposes no updateEvent or deleteEvent methods (TC-121)', () => {
    // TC-121
    // The service class must not expose any mutation methods beyond createEvent
    expect(typeof (service as unknown as Record<string, unknown>)['updateEvent']).not.toBe(
      'function',
    );
    expect(typeof (service as unknown as Record<string, unknown>)['deleteEvent']).not.toBe(
      'function',
    );
    expect(typeof (service as unknown as Record<string, unknown>)['patchEvent']).not.toBe(
      'function',
    );
    // createEvent IS expected (append-only create)
    expect(typeof service.createEvent).toBe('function');
  });

  // ✓ ASVS:V7.3.2 — verifyAuditChain on real persisted events returns verified:true (BR-009)
  it('verifyAuditChain on real persisted chain returns { verified: true } (TC-053)', async () => {
    // TC-053
    const basePayload: Omit<AuditEventPayload, 'action' | 'resourceId'> = {
      actorId: USER_A,
      tenantId: TENANT_A,
      resourceType: 'session',
      outcome: 'success',
    };

    await service.createEvent({ ...basePayload, action: 'VERIFY_EVENT_1', resourceId: 'rv1' });
    await new Promise((r) => setTimeout(r, 10));
    await service.createEvent({ ...basePayload, action: 'VERIFY_EVENT_2', resourceId: 'rv2' });
    await new Promise((r) => setTimeout(r, 10));
    await service.createEvent({ ...basePayload, action: 'VERIFY_EVENT_3', resourceId: 'rv3' });

    // Verify all 3 events in the chain (0-based: indices 0, 1, 2)
    const result = await service.verifyAuditChain(TENANT_A, 0, 2);

    expect(result.verified).toBe(true);
    expect(result.checkedCount).toBe(3);
    expect(result.failedAtIndex).toBeUndefined();
  });
});
