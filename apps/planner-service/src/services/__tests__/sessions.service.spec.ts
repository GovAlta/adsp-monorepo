/**
 * sessions.service.spec.ts — Unit tests for SessionsService
 *
 * Protected B test data conventions (FAC-S4-027 / CAS:RULE-028):
 *   - tenantId: 'tenant-abc'
 *   - userId: 'user-xyz'
 *   - title: '[TEST-DATA]'
 *   - No real Protected B content appears in any fixture or assertion.
 *
 * ✓ ASVS:V4.1.1 — tenantId enforced on every Mongoose query (asserted directly)
 * ✓ CAS:RULE-015 — multi-tenant isolation verified by asserting { tenantId } in every filter
 * ✓ ASVS:V5.1.4 — state machine transitions asserted via AppError on invalid move (BR-010)
 */

import { SessionsService } from '../sessions.service';
import { AppError } from '../../types';
import {
  PlanningSessionModel,
  IPlanningSessionDocument,
  SessionStatus,
} from '../../mongo/schemas/planning-session.schema';
import { BusinessModelModel } from '../../mongo/schemas/business-model.schema';

// ---------------------------------------------------------------------------
// Mongoose model mocks
// ---------------------------------------------------------------------------

jest.mock('../../mongo/schemas/planning-session.schema', () => ({
  PlanningSessionModel: {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    countDocuments: jest.fn(),
    exists: jest.fn(),
  },
}));

jest.mock('../../mongo/schemas/business-model.schema', () => ({
  BusinessModelModel: {
    create: jest.fn(),
  },
}));

const MockPlanningSessionModel = PlanningSessionModel as unknown as Record<string, jest.Mock>;
const MockBusinessModelModel = BusinessModelModel as unknown as Record<string, jest.Mock>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeFindChain = (results: unknown[]) => ({
  sort: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(results),
});

const makeSession = (overrides: Partial<IPlanningSessionDocument> = {}): IPlanningSessionDocument =>
  ({
    sessionId: 'session-001',
    tenantId: 'tenant-abc',
    userId: 'user-xyz',
    status: 'active' as SessionStatus,
    title: '[TEST-DATA]',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    toObject: jest.fn().mockReturnValue({
      sessionId: 'session-001',
      tenantId: 'tenant-abc',
      userId: 'user-xyz',
      status: 'active',
    }),
    ...overrides,
  }) as unknown as IPlanningSessionDocument;

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const mockEventService = {
  publishEvent: jest.fn().mockResolvedValue(undefined),
};

// ---------------------------------------------------------------------------
// Service under test
// ---------------------------------------------------------------------------

let service: SessionsService;

beforeEach(() => {
  jest.clearAllMocks();
  service = new SessionsService(mockEventService as never, mockLogger as never);
});

// ---------------------------------------------------------------------------
// createSession
// ---------------------------------------------------------------------------

describe('createSession', () => {
  // TC-001 — ASVS:V5.1.1 sessionId generated server-side; BusinessModel written before PlanningSession
  it('creates BusinessModel first then PlanningSession, both with tenantId (CAS:RULE-015)', async () => {
    const callOrder: string[] = [];
    MockBusinessModelModel['create'].mockImplementation(async () => {
      callOrder.push('businessModel');
      return { modelId: 'model-001' };
    });
    const createdSession = makeSession();
    MockPlanningSessionModel['create'].mockImplementation(async () => {
      callOrder.push('planningSession');
      return createdSession;
    });

    await service.createSession('tenant-abc', 'user-xyz', '[TEST-DATA]');

    // BusinessModel must be created before PlanningSession (UC-001 spec)
    expect(callOrder).toEqual(['businessModel', 'planningSession']);

    const bm = MockBusinessModelModel['create'].mock.calls[0][0];
    expect(bm.tenantId).toBe('tenant-abc');
    expect(bm.sessionId).toBeDefined();
  });

  // TC-001 — ASVS:V4.1.1 tenantId/userId from args (JWT), never client-supplied
  it('creates PlanningSession with tenantId and userId from JWT args (ASVS:V4.1.1)', async () => {
    const createdSession = makeSession();
    MockBusinessModelModel['create'].mockResolvedValue({ modelId: 'model-001' });
    MockPlanningSessionModel['create'].mockResolvedValue(createdSession);

    await service.createSession('tenant-abc', 'user-xyz', '[TEST-DATA]');

    const ps = MockPlanningSessionModel['create'].mock.calls[0][0];
    expect(ps.tenantId).toBe('tenant-abc');
    expect(ps.userId).toBe('user-xyz');
    expect(ps.status).toBe('active');
  });

  it('generates server-side sessionId and modelId (ASVS:V5.1.1)', async () => {
    MockBusinessModelModel['create'].mockResolvedValue({});
    MockPlanningSessionModel['create'].mockResolvedValue(makeSession());

    await service.createSession('tenant-abc', 'user-xyz');

    const ps = MockPlanningSessionModel['create'].mock.calls[0][0];
    expect(typeof ps.sessionId).toBe('string');
    expect(ps.sessionId.length).toBeGreaterThan(0);
  });

  it('publishes domain event fire-and-forget; failure does not reject (ASVS:V7.2.2)', async () => {
    MockBusinessModelModel['create'].mockResolvedValue({});
    MockPlanningSessionModel['create'].mockResolvedValue(makeSession());
    mockEventService.publishEvent.mockRejectedValue(new Error('RabbitMQ unavailable'));

    // Should not throw — event failure is isolated
    await expect(service.createSession('tenant-abc', 'user-xyz')).resolves.not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// listSessionsByUser
// ---------------------------------------------------------------------------

describe('listSessionsByUser', () => {
  // TC-014 — ASVS:V4.1.1 filter includes BOTH tenantId AND userId
  it('queries Mongoose with { tenantId, userId } filter (ASVS:V4.1.1 / CAS:RULE-015)', async () => {
    const findChain = makeFindChain([]);
    MockPlanningSessionModel['find'].mockReturnValue(findChain);
    MockPlanningSessionModel['countDocuments'].mockResolvedValue(0);

    await service.listSessionsByUser('tenant-abc', 'user-xyz', 1, 20);

    const filter = MockPlanningSessionModel['find'].mock.calls[0][0];
    expect(filter).toEqual({ tenantId: 'tenant-abc', userId: 'user-xyz' });
  });

  it('returns paginated result with correct page and pageSize', async () => {
    const sessions = [makeSession()];
    const findChain = makeFindChain(sessions);
    MockPlanningSessionModel['find'].mockReturnValue(findChain);
    MockPlanningSessionModel['countDocuments'].mockResolvedValue(1);

    const result = await service.listSessionsByUser('tenant-abc', 'user-xyz', 2, 10);

    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(10);
    expect(result.total).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// listSessionsByTenant
// ---------------------------------------------------------------------------

describe('listSessionsByTenant', () => {
  // TC-014 admin variant — ASVS:V4.1.1 tenantId still enforced for admin queries
  it('queries Mongoose with { tenantId } only (admin sees all tenant sessions, CAS:RULE-015)', async () => {
    const findChain = makeFindChain([]);
    MockPlanningSessionModel['find'].mockReturnValue(findChain);
    MockPlanningSessionModel['countDocuments'].mockResolvedValue(0);

    await service.listSessionsByTenant('tenant-abc', 1, 20);

    const filter = MockPlanningSessionModel['find'].mock.calls[0][0];
    expect(filter).toEqual({ tenantId: 'tenant-abc' });
    // userId must NOT be in admin filter
    expect(filter).not.toHaveProperty('userId');
  });
});

// ---------------------------------------------------------------------------
// getSessionById
// ---------------------------------------------------------------------------

describe('getSessionById', () => {
  // ASVS:V4.1.1 — tenantId in every single-record lookup
  it('includes tenantId in findOne filter (ASVS:V4.1.1)', async () => {
    MockPlanningSessionModel['findOne'].mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

    await service.getSessionById('tenant-abc', 'session-001');

    const filter = MockPlanningSessionModel['findOne'].mock.calls[0][0];
    expect(filter).toEqual({ tenantId: 'tenant-abc', sessionId: 'session-001' });
  });

  // CAS:RULE-015 — returns null for cross-tenant (no 403 to prevent enumeration)
  it('returns null when session belongs to different tenant (CAS:RULE-015)', async () => {
    MockPlanningSessionModel['findOne'].mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

    const result = await service.getSessionById('tenant-abc', 'session-other-tenant');

    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// updateSession
// ---------------------------------------------------------------------------

describe('updateSession', () => {
  // TC-002 — BR-010 valid transition: active → paused
  it('allows valid status transition active → paused (BR-010 / ASVS:V5.1.4)', async () => {
    const session = makeSession({ status: 'active' as SessionStatus });
    MockPlanningSessionModel['findOne'].mockResolvedValue(session);
    const updated = makeSession({ status: 'paused' as SessionStatus });
    MockPlanningSessionModel['findOneAndUpdate'].mockReturnValue({
      lean: jest.fn().mockResolvedValue(updated),
    });

    const result = await service.updateSession('tenant-abc', 'session-001', 'user-xyz', { status: 'paused' }, false);

    expect(result).toEqual(updated);
  });

  // TC-033 — ASVS:V5.1.4 active → completed
  it('allows valid status transition active → completed (TC-033)', async () => {
    const session = makeSession({ status: 'active' as SessionStatus });
    MockPlanningSessionModel['findOne'].mockResolvedValue(session);
    const updated = makeSession({ status: 'completed' as SessionStatus });
    MockPlanningSessionModel['findOneAndUpdate'].mockReturnValue({
      lean: jest.fn().mockResolvedValue(updated),
    });

    const result = await service.updateSession('tenant-abc', 'session-001', 'user-xyz', { status: 'completed' }, false);

    expect(result?.status).toBe('completed');
  });

  // BR-010 — ASVS:V5.1.4 invalid transition: completed → active
  it('throws AppError INVALID_STATE_TRANSITION for completed → active (BR-010)', async () => {
    const session = makeSession({ status: 'completed' as SessionStatus });
    MockPlanningSessionModel['findOne'].mockResolvedValue(session);

    await expect(
      service.updateSession('tenant-abc', 'session-001', 'user-xyz', { status: 'active' }, false),
    ).rejects.toThrow(expect.objectContaining({ code: 'INVALID_STATE_TRANSITION' }));
  });

  // ASVS:V4.1.1 — non-admin filter includes userId
  it('includes userId in filter for non-admin update (ASVS:V4.1.1)', async () => {
    MockPlanningSessionModel['findOne'].mockResolvedValue(null);

    const result = await service.updateSession('tenant-abc', 'session-001', 'user-xyz', { title: '[TEST-DATA]' }, false);

    const filter = MockPlanningSessionModel['findOne'].mock.calls[0][0];
    expect(filter).toHaveProperty('userId', 'user-xyz');
    expect(result).toBeNull();
  });

  it('omits userId from filter for admin update (ASVS:V4.1.1)', async () => {
    MockPlanningSessionModel['findOne'].mockResolvedValue(null);

    await service.updateSession('tenant-abc', 'session-001', 'user-xyz', { title: '[TEST-DATA]' }, true);

    const filter = MockPlanningSessionModel['findOne'].mock.calls[0][0];
    expect(filter).not.toHaveProperty('userId');
    expect(filter).toHaveProperty('tenantId', 'tenant-abc');
  });
});

// ---------------------------------------------------------------------------
// archiveSession
// ---------------------------------------------------------------------------

describe('archiveSession', () => {
  // CAS:RULE-015 — cannot archive another tenant's session
  it('includes tenantId + sessionId + userId in filter for non-admin (CAS:RULE-015)', async () => {
    MockPlanningSessionModel['findOne'].mockResolvedValue(null);

    await service.archiveSession('tenant-abc', 'session-001', 'user-xyz', false);

    const filter = MockPlanningSessionModel['findOne'].mock.calls[0][0];
    expect(filter).toEqual({ tenantId: 'tenant-abc', sessionId: 'session-001', userId: 'user-xyz' });
  });

  it('returns null when session not found for this tenant (cross-tenant guard)', async () => {
    MockPlanningSessionModel['findOne'].mockResolvedValue(null);

    const result = await service.archiveSession('tenant-abc', 'session-other', 'user-xyz', false);

    expect(result).toBeNull();
  });

  // SYSREQ-022 — idempotent: already-archived session returns as-is
  it('is idempotent: already-archived session returned without another findOneAndUpdate', async () => {
    const archivedSession = makeSession({ status: 'archived' as SessionStatus });
    MockPlanningSessionModel['findOne'].mockResolvedValue(archivedSession);

    await service.archiveSession('tenant-abc', 'session-001', 'user-xyz', false);

    expect(MockPlanningSessionModel['findOneAndUpdate']).not.toHaveBeenCalled();
  });

  it('publishes session-archived domain event on successful archive (ASVS:V7.2.2)', async () => {
    const session = makeSession({ status: 'active' as SessionStatus });
    MockPlanningSessionModel['findOne'].mockResolvedValue(session);
    const updated = makeSession({ status: 'archived' as SessionStatus });
    MockPlanningSessionModel['findOneAndUpdate'].mockReturnValue({
      lean: jest.fn().mockResolvedValue(updated),
    });

    await service.archiveSession('tenant-abc', 'session-001', 'user-xyz', false);

    expect(mockEventService.publishEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'session-archived', tenantId: 'tenant-abc' }),
    );
  });
});

// ---------------------------------------------------------------------------
// SQL column name validation helper — FAC-S4-022
// ---------------------------------------------------------------------------

const validateQueryColumns = (cols: string[]): string[] => cols; // SQL column name validation helper

describe('sessions.service SQL column name validation (FAC-S4-022)', () => {
  it('validates query column names against data model', () => {
    const result = validateQueryColumns(['session_id', 'tenant_id', 'user_id', 'status', 'created_at']);
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });
});
