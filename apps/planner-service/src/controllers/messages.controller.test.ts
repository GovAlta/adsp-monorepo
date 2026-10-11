import { MessagesController } from './messages.controller';
import { createMockLogger } from '../test-utils/mock-logger';

function makeReq(overrides: any = {}) {
  return {
    user: { tenantId: 'tenant-1', userId: 'user-1', roles: ['planner-user'] },
    params: { sessionId: 'sess-1' },
    query: {},
    body: { content: 'Hello planner' },
    path: '/messages',
    ...overrides,
  } as any;
}

function makeRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

const MOCK_MSG = { messageId: 'msg-1', sessionId: 'sess-1', role: 'user', content: 'Hello planner' };

function makeMessagesService(overrides: any = {}) {
  return {
    saveMessage: jest.fn().mockResolvedValue(MOCK_MSG),
    listMessages: jest.fn().mockResolvedValue({ items: [MOCK_MSG], total: 1, page: 1, pageSize: 50 }),
    ...overrides,
  };
}

function makeLLMService(shouldThrow = true) {
  if (shouldThrow) {
    const err = Object.assign(new Error('LLM unavailable'), { code: 'SERVICE_UNAVAILABLE' });
    return { callLLM: jest.fn().mockRejectedValue(err) };
  }
  return { callLLM: jest.fn().mockResolvedValue({ content: 'AI response' }) };
}

describe('MessagesController', () => {
  describe('sendMessage', () => {
    it('always persists user message before LLM call', async () => {
      const msgSvc = makeMessagesService();
      const ctrl = new MessagesController(msgSvc as any, makeLLMService(true) as any, createMockLogger());
      await ctrl.sendMessage(makeReq(), makeRes(), jest.fn());
      expect(msgSvc.saveMessage).toHaveBeenCalledWith('tenant-1', 'sess-1', 'user', 'Hello planner');
    });

    it('returns 503 RFC 7807 when LLM stub throws (INT-001 deferred)', async () => {
      const ctrl = new MessagesController(makeMessagesService() as any, makeLLMService(true) as any, createMockLogger());
      const res = makeRes();
      await ctrl.sendMessage(makeReq(), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ type: expect.stringContaining('llm-unavailable'), status: 503 }),
      );
    });

    it('returns 201 when LLM call succeeds', async () => {
      const ctrl = new MessagesController(makeMessagesService() as any, makeLLMService(false) as any, createMockLogger());
      const res = makeRes();
      await ctrl.sendMessage(makeReq(), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(MOCK_MSG);
    });

    it('calls next when saveMessage throws', async () => {
      const msgSvc = makeMessagesService({ saveMessage: jest.fn().mockRejectedValue(new Error('db')) });
      const ctrl = new MessagesController(msgSvc as any, makeLLMService(true) as any, createMockLogger());
      const next = jest.fn();
      await ctrl.sendMessage(makeReq(), makeRes(), next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('listMessages', () => {
    it('returns paginated messages with default pageSize 50', async () => {
      const msgSvc = makeMessagesService();
      const ctrl = new MessagesController(msgSvc as any, makeLLMService(true) as any, createMockLogger());
      const res = makeRes();
      await ctrl.listMessages(makeReq({ query: {} }), res, jest.fn());
      expect(msgSvc.listMessages).toHaveBeenCalledWith('tenant-1', 'sess-1', 1, 50);
      expect(res.json).toHaveBeenCalled();
    });

    it('clamps pageSize to 100', async () => {
      const msgSvc = makeMessagesService();
      const ctrl = new MessagesController(msgSvc as any, makeLLMService(true) as any, createMockLogger());
      await ctrl.listMessages(makeReq({ query: { pageSize: '999' } }), makeRes(), jest.fn());
      expect(msgSvc.listMessages).toHaveBeenCalledWith('tenant-1', 'sess-1', 1, 100);
    });
  });
});
