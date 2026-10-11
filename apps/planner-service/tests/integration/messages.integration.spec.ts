/**
 * messages.integration.spec.ts — Integration tests for MessagesService
 *
 * Protected B test data conventions (FAC-S4-027 / CAS:RULE-028):
 *   - tenantId:  'tenant-abc'
 *   - userId:    'user-xyz'
 *   - content:   '[TEST-DATA]'
 *   - No real Protected B content appears in any fixture or assertion.
 *
 * Tier 1: service-layer mock integration — business logic verified with mocked MongoDB
 * Tier 2: Testcontainers MongoDB      — real persistence, schema constraints, indexes
 *
 * Prerequisites for Tier 2 tests:
 *   npm install --save-dev @testcontainers/mongodb
 *   Docker must be running on the CI/local host.
 *
 * ✓ ASVS:V4.1.1 — tenantId enforced on all message queries and writes
 * ✓ CAS:RULE-028 — content is Protected B (ATIA s.23); stored but never logged
 * ✓ ASVS:V7.2.2 — append-only message collection (SYSREQ-005); no update/delete methods
 * ✓ ASVS:V5.1.1 — messageId generated server-side
 */

jest.setTimeout(60000);

import * as crypto from 'crypto';
import mongoose from 'mongoose';

import { MessagesService } from '../../src/services/messages.service';
import { SessionsService } from '../../src/services/sessions.service';
import { NotFoundError } from '../../src/types';
import {
  ConversationMessageModel,
  IConversationMessageDocument,
  MessageRole,
} from '../../src/mongo/schemas/conversation-message.schema';
import {
  PlanningSessionModel,
  SessionStatus,
} from '../../src/mongo/schemas/planning-session.schema';
import { BusinessModelModel } from '../../src/mongo/schemas/business-model.schema';

// ============================================================================
// Shared constants — Protected B test data (FAC-S4-027)
// ============================================================================

const TENANT_A = 'tenant-abc';
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

/** Mimics Mongoose chainable query for Model.find() */
const makeFindChain = (results: unknown[]) => ({
  sort: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(results),
});

/** Builds a minimal PlanningSession document stub for Tier 1 mocking */
const makeSessionStub = (overrides: Record<string, unknown> = {}) => ({
  sessionId: 'session-001',
  tenantId: TENANT_A,
  userId: USER_A,
  status: 'active' as SessionStatus,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// ============================================================================
// Tier 1 — service mocks
// Full MessagesService business logic exercised with jest.spyOn on Mongoose models.
// ============================================================================

describe('Tier 1 — service mocks', () => {
  let service: MessagesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MessagesService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // TC-DI-001 — ASVS:V4.1.1 — saveMessage throws NotFoundError if session not in tenant
  it('TC-DI-001: saveMessage throws NotFoundError when session does not exist for tenantId', async () => {
    // ✓ ASVS:V4.1.1 — session ownership verified before write; null means cross-tenant or missing
    // ✓ CAS:RULE-015 — prevents injecting messages into another tenant's session
    jest
      .spyOn(PlanningSessionModel, 'findOne')
      .mockReturnValue({ lean: jest.fn().mockResolvedValue(null) } as never);

    await expect(
      service.saveMessage(TENANT_A, 'nonexistent-session', 'user', '[TEST-DATA]'),
    ).rejects.toThrow(NotFoundError);
  });

  // TC-DI-001b — ASVS:V4.1.1 — saveMessage cross-tenant session lookup returns NotFoundError
  it('TC-DI-001b: saveMessage throws NotFoundError when sessionId belongs to a different tenant', async () => {
    // MongoDB returns null when tenantId does not match the stored session's tenantId.
    // ✓ CAS:RULE-015 — cross-tenant injection blocked; session ownership verified
    jest
      .spyOn(PlanningSessionModel, 'findOne')
      .mockReturnValue({ lean: jest.fn().mockResolvedValue(null) } as never);

    await expect(
      service.saveMessage('tenant-attacker', 'session-owned-by-tenant-abc', 'user', '[TEST-DATA]'),
    ).rejects.toMatchObject({
      name: 'NotFoundError',
      code: 'NOT_FOUND',
    });
  });

  // TC-DI-002 — CAS:RULE-028 — saveMessage passes content through without transformation
  // BR-002 / SYSREQ-024: content length enforced at Mongoose schema layer (maxlength: 10000).
  // Service layer passes content to create unchanged; this test verifies no truncation occurs.
  it('TC-DI-002: saveMessage stores content exactly as provided (no truncation or transformation)', async () => {
    jest
      .spyOn(PlanningSessionModel, 'findOne')
      .mockReturnValue({ lean: jest.fn().mockResolvedValue(makeSessionStub()) } as never);

    const expectedContent = '[TEST-DATA]';
    const createSpy = jest.spyOn(ConversationMessageModel, 'create').mockResolvedValue({
      messageId: 'msg-001',
      sessionId: 'session-001',
      tenantId: TENANT_A,
      role: 'user',
      content: expectedContent,
      timestamp: new Date(),
    } as never);

    await service.saveMessage(TENANT_A, 'session-001', 'user', expectedContent);

    // ✓ CAS:RULE-028 — content passed to create as-is; service must not alter Protected B content
    const createPayload = createSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(createPayload.content).toBe(expectedContent);
    expect(createPayload.tenantId).toBe(TENANT_A);
    expect(createPayload.sessionId).toBe('session-001');
    // ✓ ASVS:V5.1.1 — messageId generated server-side (is a UUID)
    expect(typeof createPayload.messageId).toBe('string');
    expect((createPayload.messageId as string).length).toBeGreaterThan(0);
  });

  // TC-120 — ASVS:V5.1.4 — invalid message role rejected (Mongoose enum validation propagated)
  it('TC-120: saveMessage propagates Mongoose ValidationError when role is not a valid enum value', async () => {
    jest
      .spyOn(PlanningSessionModel, 'findOne')
      .mockReturnValue({ lean: jest.fn().mockResolvedValue(makeSessionStub()) } as never);

    // Simulate Mongoose enum validation error (role: 'bot' is not in ['user','assistant','system'])
    // ✓ ASVS:V5.1.4 — Mongoose enum enforces MessageRole; service must not swallow the error
    jest.spyOn(ConversationMessageModel, 'create').mockRejectedValue(
      Object.assign(new Error('ConversationMessage validation failed: role: `bot` is not a valid enum value'), {
        name: 'ValidationError',
      }),
    );

    await expect(
      service.saveMessage(TENANT_A, 'session-001', 'bot' as MessageRole, '[TEST-DATA]'),
    ).rejects.toMatchObject({ name: 'ValidationError' });
  });

  // TC-DI-003 — ASVS:V7.2.2 — listMessages verifies session ownership before querying
  it('TC-DI-003: listMessages throws NotFoundError when session does not exist for tenantId', async () => {
    // ✓ ASVS:V4.1.1 — session existence verified with tenantId before message query
    jest
      .spyOn(PlanningSessionModel, 'exists')
      .mockResolvedValue(null as never);

    await expect(
      service.listMessages(TENANT_A, 'nonexistent-session', 1, 50),
    ).rejects.toThrow(NotFoundError);
  });

  // TC-DI-004 — ASVS:V7.2.2 — MessagesService has no update or delete methods (append-only)
  it('TC-DI-004: MessagesService exposes no update or delete message methods (SYSREQ-005)', () => {
    // ✓ ASVS:V7.2.2 — SYSREQ-005 append-only: conversation history is immutable once written
    // ✓ CAS:RULE-028 — no pathway to alter stored Protected B content after persistence
    const serviceProto = Object.getOwnPropertyNames(MessagesService.prototype);
    expect(serviceProto).not.toContain('updateMessage');
    expect(serviceProto).not.toContain('deleteMessage');
    expect(serviceProto).not.toContain('patchMessage');
    expect(serviceProto).not.toContain('editMessage');
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
  let messagesService: MessagesService;
  let sessionsService: SessionsService;

  beforeAll(async () => {
    // ✓ ASVS:V7.2.2 — real MongoDB provides accurate timestamp and index behaviour
    container = await new MongoDBContainer().start();
    await mongoose.connect(container.getConnectionString(), { directConnection: true });
    messagesService = new MessagesService();
    sessionsService = new SessionsService(makeMockEventService() as never, makeMockLogger() as never);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await container.stop();
  });

  afterEach(async () => {
    // Isolate each test — clear without dropping indexes
    await ConversationMessageModel.deleteMany({});
    await PlanningSessionModel.deleteMany({});
    await BusinessModelModel.deleteMany({});
  });

  // ============================================================================
  // Helpers — Tier 2
  // ============================================================================

  /** Creates a minimal PlanningSession document directly (bypasses business model creation). */
  const createSessionDirect = async (
    sessionId: string,
    tenantId: string = TENANT_A,
    userId: string = USER_A,
  ) => {
    // Also create a stub BusinessModel since the service requires it in createSession
    await BusinessModelModel.create({
      modelId: crypto.randomUUID(),
      sessionId,
      tenantId,
      concepts: [],
      confidenceScore: 0,
      version: 1,
    });
    return PlanningSessionModel.create({
      sessionId,
      tenantId,
      userId,
      status: 'active' as SessionStatus,
    });
  };

  // TC-DI-005 — chronological message ordering verified against real MongoDB sort
  it('TC-DI-005: listMessages returns messages in chronological (timestamp ASC) order', async () => {
    const sessionId = crypto.randomUUID();
    await createSessionDirect(sessionId);

    // ✓ CAS:RULE-028 — content stored as '[TEST-DATA]'; not logged
    await messagesService.saveMessage(TENANT_A, sessionId, 'user', '[TEST-DATA]');
    // Small delay to ensure distinct timestamps
    await new Promise((r) => setTimeout(r, 5));
    await messagesService.saveMessage(TENANT_A, sessionId, 'assistant', '[TEST-DATA]');
    await new Promise((r) => setTimeout(r, 5));
    await messagesService.saveMessage(TENANT_A, sessionId, 'user', '[TEST-DATA]');

    const result = await messagesService.listMessages(TENANT_A, sessionId, 1, 50);

    // ✓ ASVS:V7.2.2 — UC-006 requires chronological order for conversation history
    expect(result.items).toHaveLength(3);
    expect(result.items[0].role).toBe('user');
    expect(result.items[1].role).toBe('assistant');
    expect(result.items[2].role).toBe('user');
    const timestamps = result.items.map((m) => m.timestamp.getTime());
    expect(timestamps[0]).toBeLessThanOrEqual(timestamps[1]);
    expect(timestamps[1]).toBeLessThanOrEqual(timestamps[2]);
  });

  // TC-DI-006 — pagination: page 1 and page 2 return disjoint message sets
  it('TC-DI-006: listMessages pagination returns disjoint sets on page 1 and page 2', async () => {
    const sessionId = crypto.randomUUID();
    await createSessionDirect(sessionId);

    // Create 5 messages
    for (let i = 0; i < 5; i++) {
      await messagesService.saveMessage(TENANT_A, sessionId, 'user', '[TEST-DATA]');
      await new Promise((r) => setTimeout(r, 2));
    }

    // ✓ ASVS:V4.1.1 — pagination scoped to tenantId + sessionId
    const page1 = await messagesService.listMessages(TENANT_A, sessionId, 1, 3);
    const page2 = await messagesService.listMessages(TENANT_A, sessionId, 2, 3);

    expect(page1.items).toHaveLength(3);
    expect(page2.items).toHaveLength(2);
    expect(page1.total).toBe(5);
    expect(page2.total).toBe(5);

    // Pages must be disjoint — no messageId appears in both pages
    const page1Ids = new Set(page1.items.map((m) => m.messageId));
    const page2Ids = page2.items.map((m) => m.messageId);
    expect(page2Ids.every((id) => !page1Ids.has(id))).toBe(true);
  });

  // TC-DI-007 — sessionId index: listMessages only returns messages for the specific session
  it('TC-DI-007: listMessages for session A does not include messages from session B', async () => {
    const sessionIdA = crypto.randomUUID();
    const sessionIdB = crypto.randomUUID();
    await createSessionDirect(sessionIdA);
    await createSessionDirect(sessionIdB);

    // ✓ ASVS:V4.1.1 — tenantId + sessionId compound index used for message queries
    // ✓ CAS:RULE-015 — no cross-session message contamination
    await messagesService.saveMessage(TENANT_A, sessionIdA, 'user', '[TEST-DATA]');
    await messagesService.saveMessage(TENANT_A, sessionIdB, 'user', '[TEST-DATA]');

    const resultA = await messagesService.listMessages(TENANT_A, sessionIdA, 1, 50);
    const resultB = await messagesService.listMessages(TENANT_A, sessionIdB, 1, 50);

    expect(resultA.total).toBe(1);
    expect(resultB.total).toBe(1);
    expect(resultA.items[0].sessionId).toBe(sessionIdA);
    expect(resultB.items[0].sessionId).toBe(sessionIdB);
    // Verify no cross-contamination
    expect(resultA.items.every((m) => m.sessionId === sessionIdA)).toBe(true);
    expect(resultB.items.every((m) => m.sessionId === sessionIdB)).toBe(true);
  });

  // TC-DI-008 — CAS:RULE-028 — content stored exactly as provided (no transformation)
  it('TC-DI-008: message content field stored and retrieved exactly as provided (CAS:RULE-028)', async () => {
    const sessionId = crypto.randomUUID();
    await createSessionDirect(sessionId);

    // ✓ CAS:RULE-028 — Protected B content must not be altered by the persistence layer
    const testContent = '[TEST-DATA]';
    await messagesService.saveMessage(TENANT_A, sessionId, 'user', testContent);

    const result = await messagesService.listMessages(TENANT_A, sessionId, 1, 50);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].content).toBe(testContent);
    expect(result.items[0].role).toBe('user');
    expect(result.items[0].tenantId).toBe(TENANT_A);
    expect(result.items[0].sessionId).toBe(sessionId);
  });

  // TC-120 / TC-DI-009 — schema enum constraint rejects invalid role at persistence layer
  it('TC-DI-009: ConversationMessage schema rejects invalid role enum value at persistence layer', async () => {
    // ✓ ASVS:V5.1.4 — Mongoose enum constraint enforces valid MessageRole values (TC-120)
    await expect(
      ConversationMessageModel.create({
        messageId: crypto.randomUUID(),
        sessionId: 'session-test',
        tenantId: TENANT_A,
        role: 'bot', // not in ['user','assistant','system']
        content: '[TEST-DATA]',
        timestamp: new Date(),
      }),
    ).rejects.toThrow();
  });

  // TC-DI-010 — getLastMessages returns messages in chronological order (most recent last)
  it('TC-DI-010: getLastMessages returns N most recent messages in chronological order', async () => {
    const sessionId = crypto.randomUUID();
    await createSessionDirect(sessionId);

    for (let i = 0; i < 5; i++) {
      await messagesService.saveMessage(TENANT_A, sessionId, 'user', '[TEST-DATA]');
      await new Promise((r) => setTimeout(r, 2));
    }

    // ✓ ASVS:V4.1.1 — tenant-scoped; getLastMessages for LLM context assembly
    const last3 = await messagesService.getLastMessages(TENANT_A, sessionId, 3);

    expect(last3).toHaveLength(3);
    // Must be in chronological order (oldest first, newest last) for LLM context
    const ts = last3.map((m: IConversationMessageDocument) => m.timestamp.getTime());
    expect(ts[0]).toBeLessThanOrEqual(ts[1]);
    expect(ts[1]).toBeLessThanOrEqual(ts[2]);
  });
});
