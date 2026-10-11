/**
 * messages.controller.spec.ts — Unit tests for MessagesController
 *
 * Protected B test data conventions (FAC-S4-027 / CAS:RULE-028):
 *   - message content: '[TEST-DATA]'   ← never appears in log assertions
 *   - tenantId: 'tenant-abc'
 *   - userId: 'user-xyz'
 *   - No real Protected B content appears in any fixture.
 *
 * ✓ ASVS:V1.6.1 — LLM stub always throws; message saved BEFORE LLM call
 * ✓ CAS:RULE-028 — content field MUST NOT appear in any logger call (FAC-S4-027)
 * ✓ ASVS:V4.1.1 — tenantId sourced from req.user JWT, not request body
 * ✓ CAS:RULE-015 — tenant-scoped query verified on listMessages
 */

import { Request, Response, NextFunction } from 'express';
import { MessagesController } from '../messages.controller';
import { MessagesService } from '../../services/messages.service';
import { ILLMService } from '../../services/llm.service';
import { ServiceUnavailableError, NotFoundError } from '../../types';
import { IConversationMessageDocument } from '../../mongo/schemas/conversation-message.schema';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('../../services/messages.service');
jest.mock('../../services/llm.service');

const mockMessagesService = {
  saveMessage: jest.fn(),
  listMessages: jest.fn(),
  getLastMessages: jest.fn(),
} as unknown as jest.Mocked<MessagesService>;

const mockLLMService: jest.Mocked<ILLMService> = {
  callLLM: jest.fn(),
};

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

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

const makeReq = (overrides: Partial<Request> = {}): Request =>
  ({
    user: {
      tenantId: 'tenant-abc',
      userId: 'user-xyz',
      roles: ['planner-user'],
    },
    body: { content: '[TEST-DATA]', role: 'user' },
    params: { sessionId: 'session-001' },
    query: {},
    path: '/api/v1/sessions/session-001/messages',
    ...overrides,
  }) as unknown as Request;

const makeRes = (): Response => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  };
  return res as Response;
};

const makeNext = (): NextFunction => jest.fn();

// ---------------------------------------------------------------------------
// Controller under test
// ---------------------------------------------------------------------------

let controller: MessagesController;

beforeEach(() => {
  jest.clearAllMocks();
  controller = new MessagesController(mockMessagesService, mockLLMService, mockLogger as never);
});

// ---------------------------------------------------------------------------
// sendMessage
// ---------------------------------------------------------------------------

describe('sendMessage', () => {
  // TC-004 — message persisted BEFORE LLM call (UC-002 spec: save-then-call order)
  it('calls saveMessage BEFORE callLLM (UC-002: persist-first order)', async () => {
    const callOrder: string[] = [];
    const userMessage = makeMessage();
    mockMessagesService.saveMessage.mockImplementation(async () => {
      callOrder.push('saveMessage');
      return userMessage;
    });
    mockLLMService.callLLM.mockImplementation(async () => {
      callOrder.push('callLLM');
      throw new ServiceUnavailableError('INT-001 fail-closed');
    });

    const req = makeReq({ body: { content: '[TEST-DATA]', role: 'user' } });
    await controller.sendMessage(req, makeRes(), makeNext());

    expect(callOrder[0]).toBe('saveMessage');
    expect(callOrder[1]).toBe('callLLM');
  });

  // TC-004 — ASVS:V1.6.1 LLM stub → 503 RFC 7807
  it('returns HTTP 503 with RFC 7807 body when LLM stub throws (TC-004)', async () => {
    mockMessagesService.saveMessage.mockResolvedValue(makeMessage());
    mockLLMService.callLLM.mockRejectedValue(new ServiceUnavailableError('INT-001 fail-closed'));

    const req = makeReq({ body: { content: '[TEST-DATA]', role: 'user' } });
    const res = makeRes();
    await controller.sendMessage(req, res, makeNext());

    expect(res.status).toHaveBeenCalledWith(503);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.type).toContain('llm-unavailable');
    expect(body.status).toBe(503);
    expect(body.detail).toBeDefined();
  });

  // TC-004 — message IS saved even when LLM throws (UC-002 exception path)
  it('message IS persisted even when LLM call throws (TC-004 / UC-002 exception path)', async () => {
    const userMessage = makeMessage();
    mockMessagesService.saveMessage.mockResolvedValue(userMessage);
    mockLLMService.callLLM.mockRejectedValue(new ServiceUnavailableError('INT-001 fail-closed'));

    const req = makeReq({ body: { content: '[TEST-DATA]', role: 'user' } });
    await controller.sendMessage(req, makeRes(), makeNext());

    // saveMessage was called and succeeded
    expect(mockMessagesService.saveMessage).toHaveBeenCalledTimes(1);
    expect(mockMessagesService.saveMessage).toHaveBeenCalledWith(
      'tenant-abc',
      'session-001',
      'user',
      '[TEST-DATA]',
    );
  });

  // FAC-S4-027 / CAS:RULE-028 — content MUST NOT appear in any logger call
  it('DOES NOT log message content (FAC-S4-027 — CAS:RULE-028 Protected B)', async () => {
    mockMessagesService.saveMessage.mockResolvedValue(makeMessage());
    mockLLMService.callLLM.mockRejectedValue(new ServiceUnavailableError('INT-001 fail-closed'));

    const req = makeReq({ body: { content: '[TEST-DATA]', role: 'user' } });
    await controller.sendMessage(req, makeRes(), makeNext());

    // Verify logger.info was called (messageId should be logged)
    expect(mockLogger.info).toHaveBeenCalled();

    // Collect ALL log arguments across info/warn/error
    const allLogArgs = [
      ...mockLogger.info.mock.calls,
      ...mockLogger.warn.mock.calls,
      ...mockLogger.error.mock.calls,
    ];
    const serialized = JSON.stringify(allLogArgs);
    // The content value '[TEST-DATA]' must never appear in logs
    expect(serialized).not.toContain('[TEST-DATA]');
  });

  // CAS:RULE-028 — contentLength (safe numeric) MAY be logged; content (string) MUST NOT
  it('logs contentLength (safe) but not content string (CAS:RULE-028)', async () => {
    mockMessagesService.saveMessage.mockResolvedValue(makeMessage());
    mockLLMService.callLLM.mockRejectedValue(new ServiceUnavailableError('INT-001 fail-closed'));

    const req = makeReq({ body: { content: '[TEST-DATA]', role: 'user' } });
    await controller.sendMessage(req, makeRes(), makeNext());

    const infoLogArgs = JSON.stringify(mockLogger.info.mock.calls);
    expect(infoLogArgs).toContain('contentLength');
    expect(infoLogArgs).not.toContain('[TEST-DATA]');
  });

  it('propagates saveMessage error to next (session-not-found guard)', async () => {
    mockMessagesService.saveMessage.mockRejectedValue(new NotFoundError('PlanningSession', 'session-001'));

    const req = makeReq({ body: { content: '[TEST-DATA]', role: 'user' } });
    const next = makeNext();
    await controller.sendMessage(req, makeRes(), next);

    expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    // LLM must not be called when session does not exist
    expect(mockLLMService.callLLM).not.toHaveBeenCalled();
  });

  // ASVS:V4.1.1 — tenantId from JWT, not request body
  it('passes tenantId from req.user JWT to saveMessage (ASVS:V4.1.1)', async () => {
    mockMessagesService.saveMessage.mockResolvedValue(makeMessage());
    mockLLMService.callLLM.mockRejectedValue(new ServiceUnavailableError('fail'));

    const req = makeReq({
      user: { tenantId: 'tenant-abc', userId: 'user-xyz', roles: ['planner-user'] },
      body: { content: '[TEST-DATA]', role: 'user', tenantId: 'injected-tenant' }, // must be ignored
    });
    await controller.sendMessage(req, makeRes(), makeNext());

    expect(mockMessagesService.saveMessage).toHaveBeenCalledWith(
      'tenant-abc', // JWT value, not 'injected-tenant'
      'session-001',
      'user',
      '[TEST-DATA]',
    );
  });
});

// ---------------------------------------------------------------------------
// listMessages
// ---------------------------------------------------------------------------

describe('listMessages', () => {
  const paginatedResult = { items: [], total: 0, page: 1, pageSize: 50 };

  // UC-006 — default pageSize 50 (last 50 messages)
  it('uses default pageSize of 50 when not specified (UC-006)', async () => {
    mockMessagesService.listMessages.mockResolvedValue(paginatedResult);
    const req = makeReq({
      params: { sessionId: 'session-001' },
      query: {}, // no pageSize provided
    });
    const res = makeRes();
    await controller.listMessages(req, res, makeNext());

    expect(mockMessagesService.listMessages).toHaveBeenCalledWith(
      'tenant-abc',
      'session-001',
      1,
      50,
    );
  });

  // BR-011 — max pageSize capped at 100
  it('caps pageSize at 100 even if request asks for more (BR-011)', async () => {
    mockMessagesService.listMessages.mockResolvedValue(paginatedResult);
    const req = makeReq({
      params: { sessionId: 'session-001' },
      query: { page: '1', pageSize: '500' },
    });
    await controller.listMessages(req, makeRes(), makeNext());

    expect(mockMessagesService.listMessages).toHaveBeenCalledWith(
      'tenant-abc',
      'session-001',
      1,
      100, // capped
    );
  });

  // CAS:RULE-015 — tenant isolation enforced via tenantId from JWT
  it('passes tenantId from req.user JWT to listMessages (CAS:RULE-015)', async () => {
    mockMessagesService.listMessages.mockResolvedValue(paginatedResult);
    const req = makeReq({
      user: { tenantId: 'tenant-abc', userId: 'user-xyz', roles: ['planner-user'] },
      params: { sessionId: 'session-001' },
      query: {},
    });
    await controller.listMessages(req, makeRes(), makeNext());

    expect(mockMessagesService.listMessages).toHaveBeenCalledWith(
      'tenant-abc', // always from JWT
      'session-001',
      expect.any(Number),
      expect.any(Number),
    );
  });

  it('returns paginated result from service as JSON response', async () => {
    const result = { items: [makeMessage()], total: 1, page: 1, pageSize: 50 };
    mockMessagesService.listMessages.mockResolvedValue(result);
    const req = makeReq({ params: { sessionId: 'session-001' }, query: {} });
    const res = makeRes();
    await controller.listMessages(req, res, makeNext());

    expect((res.json as jest.Mock)).toHaveBeenCalledWith(result);
  });

  it('propagates service error to next', async () => {
    mockMessagesService.listMessages.mockRejectedValue(new Error('DB failure'));
    const req = makeReq({ params: { sessionId: 'session-001' }, query: {} });
    const next = makeNext();
    await controller.listMessages(req, makeRes(), next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

// ---------------------------------------------------------------------------
// SECURITY — ASVS:V4.1.1 auth dependency
// ---------------------------------------------------------------------------

describe('Security — auth dependency (ASVS:V4.1.1)', () => {
  it('calls next(error) when req.user is not set (auth enforced by requireAuth middleware)', async () => {
    const reqNoUser = {
      body: { content: '[TEST-DATA]', role: 'user' },
      params: { sessionId: 'session-001' },
      path: '/api/v1/sessions/session-001/messages',
    } as unknown as Request;
    const next = makeNext();
    await controller.sendMessage(reqNoUser, makeRes(), next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
