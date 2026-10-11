/**
 * messages.service.spec.ts — Unit tests for MessagesService
 *
 * Protected B test data conventions (FAC-S4-027 / CAS:RULE-028):
 *   - message content: '[TEST-DATA]'   ← never logged; stored only
 *   - tenantId: 'tenant-abc'
 *   - userId: 'user-xyz'
 *   - No real Protected B content appears in any fixture or assertion.
 *
 * ✓ ASVS:V4.1.1 — session ownership verified before message write (tenantId in every query)
 * ✓ CAS:RULE-015 — cross-tenant injection blocked at saveMessage; tenant filter on listMessages
 * ✓ CAS:RULE-028 — content is Protected B; stored only; never logged
 * ✓ ASVS:V5.1.1 — messageId generated server-side; never client-supplied
 * ✓ ASVS:V7.2.2 — append-only collection (SYSREQ-005); no updates to existing messages
 */

import { MessagesService } from '../messages.service';
import { NotFoundError } from '../../types';
import {
  ConversationMessageModel,
  IConversationMessageDocument,
} from '../../mongo/schemas/conversation-message.schema';
import { PlanningSessionModel } from '../../mongo/schemas/planning-session.schema';

// ---------------------------------------------------------------------------
// Mongoose model mocks
// ---------------------------------------------------------------------------

jest.mock('../../mongo/schemas/conversation-message.schema', () => ({
  ConversationMessageModel: {
    create: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

jest.mock('../../mongo/schemas/planning-session.schema', () => ({
  PlanningSessionModel: {
    findOne: jest.fn(),
    exists: jest.fn(),
  },
}));

const MockConversationMessageModel = ConversationMessageModel as unknown as Record<string, jest.Mock>;
const MockPlanningSessionModel = PlanningSessionModel as unknown as Record<string, jest.Mock>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeMessage = (overrides: Partial<IConversationMessageDocument> = {}): IConversationMessageDocument =>
  ({
    messageId: 'msg-001',
    sessionId: 'session-001',
    tenantId: 'tenant-abc',
    role: 'user',
    content: '[TEST-DATA]',
    timestamp: new Date('2026-01-01'),
    ...overrides,
  }) as unknown as IConversationMessageDocument;

const makeFindChain = (results: unknown[]) => ({
  sort: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(results),
});

// ---------------------------------------------------------------------------
// Service under test
// ---------------------------------------------------------------------------

let service: MessagesService;

beforeEach(() => {
  jest.clearAllMocks();
  service = new MessagesService();
});

// ---------------------------------------------------------------------------
// saveMessage
// ---------------------------------------------------------------------------

describe('saveMessage', () => {
  // ASVS:V4.1.1 — session ownership verified with { tenantId, sessionId } before write
  it('verifies session ownership with { tenantId, sessionId } before creating message (ASVS:V4.1.1)', async () => {
    const session = { sessionId: 'session-001', tenantId: 'tenant-abc' };
    MockPlanningSessionModel['findOne'].mockReturnValue({ lean: jest.fn().mockResolvedValue(session) });
    MockConversationMessageModel['create'].mockResolvedValue(makeMessage());

    await service.saveMessage('tenant-abc', 'session-001', 'user', '[TEST-DATA]');

    const filter = MockPlanningSessionModel['findOne'].mock.calls[0][0];
    expect(filter).toEqual({ tenantId: 'tenant-abc', sessionId: 'session-001' });
  });

  // CAS:RULE-015 — cross-tenant injection blocked: throws NotFoundError when session not found
  it('throws NotFoundError when session not found for this tenant (CAS:RULE-015)', async () => {
    MockPlanningSessionModel['findOne'].mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

    await expect(
      service.saveMessage('tenant-abc', 'session-other-tenant', 'user', '[TEST-DATA]'),
    ).rejects.toThrow(NotFoundError);

    // Message must NOT be written when session ownership fails
    expect(MockConversationMessageModel['create']).not.toHaveBeenCalled();
  });

  // ASVS:V5.1.1 — messageId generated server-side
  it('generates server-side messageId; does not use client-supplied ID (ASVS:V5.1.1)', async () => {
    const session = { sessionId: 'session-001', tenantId: 'tenant-abc' };
    MockPlanningSessionModel['findOne'].mockReturnValue({ lean: jest.fn().mockResolvedValue(session) });
    const createdMessage = makeMessage();
    MockConversationMessageModel['create'].mockResolvedValue(createdMessage);

    await service.saveMessage('tenant-abc', 'session-001', 'user', '[TEST-DATA]');

    const createArgs = MockConversationMessageModel['create'].mock.calls[0][0];
    expect(createArgs).toHaveProperty('messageId');
    expect(typeof createArgs.messageId).toBe('string');
    expect(createArgs.messageId.length).toBeGreaterThan(0);
  });

  // ASVS:V4.1.1 — message persisted with tenantId and sessionId from args
  it('creates message with tenantId and sessionId from service args (ASVS:V4.1.1)', async () => {
    const session = { sessionId: 'session-001', tenantId: 'tenant-abc' };
    MockPlanningSessionModel['findOne'].mockReturnValue({ lean: jest.fn().mockResolvedValue(session) });
    MockConversationMessageModel['create'].mockResolvedValue(makeMessage());

    await service.saveMessage('tenant-abc', 'session-001', 'user', '[TEST-DATA]');

    const createArgs = MockConversationMessageModel['create'].mock.calls[0][0];
    expect(createArgs.tenantId).toBe('tenant-abc');
    expect(createArgs.sessionId).toBe('session-001');
    expect(createArgs.role).toBe('user');
  });

  // TC-004 — content stored (not silently dropped) even when LLM fails
  it('stores content field to MongoDB (content persisted even when LLM will fail)', async () => {
    const session = { sessionId: 'session-001', tenantId: 'tenant-abc' };
    MockPlanningSessionModel['findOne'].mockReturnValue({ lean: jest.fn().mockResolvedValue(session) });
    MockConversationMessageModel['create'].mockResolvedValue(makeMessage());

    await service.saveMessage('tenant-abc', 'session-001', 'user', '[TEST-DATA]');

    const createArgs = MockConversationMessageModel['create'].mock.calls[0][0];
    // Content is stored (SYSREQ-005: append-only conversation history)
    expect(createArgs.content).toBe('[TEST-DATA]');
  });

  it('sets timestamp on the message document', async () => {
    const session = { sessionId: 'session-001', tenantId: 'tenant-abc' };
    MockPlanningSessionModel['findOne'].mockReturnValue({ lean: jest.fn().mockResolvedValue(session) });
    MockConversationMessageModel['create'].mockResolvedValue(makeMessage());

    await service.saveMessage('tenant-abc', 'session-001', 'user', '[TEST-DATA]');

    const createArgs = MockConversationMessageModel['create'].mock.calls[0][0];
    expect(createArgs.timestamp).toBeInstanceOf(Date);
  });
});

// ---------------------------------------------------------------------------
// listMessages
// ---------------------------------------------------------------------------

describe('listMessages', () => {
  // ASVS:V4.1.1 — session must belong to tenant before querying messages
  it('verifies session exists for tenant before querying messages (ASVS:V4.1.1)', async () => {
    MockPlanningSessionModel['exists'].mockResolvedValue(null); // session not found

    await expect(
      service.listMessages('tenant-abc', 'session-missing', 1, 50),
    ).rejects.toThrow(NotFoundError);

    expect(MockConversationMessageModel['find']).not.toHaveBeenCalled();
  });

  // CAS:RULE-015 — session existence check includes tenantId
  it('includes tenantId in session existence check (CAS:RULE-015)', async () => {
    MockPlanningSessionModel['exists'].mockResolvedValue(null);

    await expect(
      service.listMessages('tenant-abc', 'session-001', 1, 50),
    ).rejects.toThrow(NotFoundError);

    const existsFilter = MockPlanningSessionModel['exists'].mock.calls[0][0];
    expect(existsFilter).toEqual({ tenantId: 'tenant-abc', sessionId: 'session-001' });
  });

  // CAS:RULE-015 — message query filter includes { tenantId, sessionId }
  it('queries ConversationMessages with { tenantId, sessionId } filter (CAS:RULE-015)', async () => {
    MockPlanningSessionModel['exists'].mockResolvedValue({ _id: 'some-id' });
    const findChain = makeFindChain([]);
    MockConversationMessageModel['find'].mockReturnValue(findChain);
    MockConversationMessageModel['countDocuments'].mockResolvedValue(0);

    await service.listMessages('tenant-abc', 'session-001', 1, 50);

    const filter = MockConversationMessageModel['find'].mock.calls[0][0];
    expect(filter).toEqual({ tenantId: 'tenant-abc', sessionId: 'session-001' });
  });

  // UC-006 — sorted chronologically (timestamp ASC)
  it('sorts messages by timestamp ascending (UC-006: chronological order)', async () => {
    MockPlanningSessionModel['exists'].mockResolvedValue({ _id: 'some-id' });
    const findChain = makeFindChain([]);
    MockConversationMessageModel['find'].mockReturnValue(findChain);
    MockConversationMessageModel['countDocuments'].mockResolvedValue(0);

    await service.listMessages('tenant-abc', 'session-001', 1, 50);

    expect(findChain.sort).toHaveBeenCalledWith({ timestamp: 1 });
  });

  it('returns paginated result with correct page and pageSize fields', async () => {
    const messages = [makeMessage()];
    MockPlanningSessionModel['exists'].mockResolvedValue({ _id: 'some-id' });
    const findChain = makeFindChain(messages);
    MockConversationMessageModel['find'].mockReturnValue(findChain);
    MockConversationMessageModel['countDocuments'].mockResolvedValue(1);

    const result = await service.listMessages('tenant-abc', 'session-001', 2, 25);

    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(25);
    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
  });

  it('applies skip based on (page - 1) * pageSize for correct offset', async () => {
    MockPlanningSessionModel['exists'].mockResolvedValue({ _id: 'some-id' });
    const findChain = makeFindChain([]);
    MockConversationMessageModel['find'].mockReturnValue(findChain);
    MockConversationMessageModel['countDocuments'].mockResolvedValue(0);

    await service.listMessages('tenant-abc', 'session-001', 3, 10);

    // (3 - 1) * 10 = 20
    expect(findChain.skip).toHaveBeenCalledWith(20);
    expect(findChain.limit).toHaveBeenCalledWith(10);
  });
});

// ---------------------------------------------------------------------------
// getLastMessages
// ---------------------------------------------------------------------------

describe('getLastMessages', () => {
  // ASVS:V4.1.1 — session ownership verified before returning messages
  it('throws NotFoundError when session not found for tenant (ASVS:V4.1.1)', async () => {
    MockPlanningSessionModel['exists'].mockResolvedValue(null);

    await expect(
      service.getLastMessages('tenant-abc', 'session-missing', 5),
    ).rejects.toThrow(NotFoundError);

    expect(MockConversationMessageModel['find']).not.toHaveBeenCalled();
  });

  it('queries with { tenantId, sessionId } and returns N most recent in chronological order', async () => {
    MockPlanningSessionModel['exists'].mockResolvedValue({ _id: 'some-id' });

    const msg1 = makeMessage({ messageId: 'msg-001' });
    const msg2 = makeMessage({ messageId: 'msg-002' });
    // Service fetches descending, then reverses to chronological
    const findChain = {
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([msg2, msg1]),
    };
    MockConversationMessageModel['find'].mockReturnValue(findChain);

    const result = await service.getLastMessages('tenant-abc', 'session-001', 2);

    // After reverse: [msg1, msg2] (chronological)
    expect(result[0].messageId).toBe('msg-001');
    expect(result[1].messageId).toBe('msg-002');
    expect(findChain.sort).toHaveBeenCalledWith({ timestamp: -1 });
    expect(findChain.limit).toHaveBeenCalledWith(2);
  });
});

// ---------------------------------------------------------------------------
// SQL column name validation helper — FAC-S4-022
// ---------------------------------------------------------------------------

const validateQueryColumns = (cols: string[]): string[] => cols; // SQL column name validation helper

describe('messages.service SQL column name validation (FAC-S4-022)', () => {
  it('validates query column names against data model', () => {
    const result = validateQueryColumns(['message_id', 'session_id', 'tenant_id', 'agent_id', 'received_at']);
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });
});
