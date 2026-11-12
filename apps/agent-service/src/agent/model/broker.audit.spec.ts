import { adspId } from '@abgov/adsp-service-sdk';
import { RequestContext } from '@mastra/core/request-context';
import { AgentMessageSentAuditAction, AgentResponseCompletedAuditAction, ThreadDeletedAuditAction } from '../audit';
import { THREAD_ID_KEY } from '../types';
import { AgentBroker } from './broker';

jest.mock('../workspace', () => ({
  ...jest.requireActual('../workspace'),
  clearThreadWorkspace: jest.fn().mockResolvedValue(undefined),
}));

describe('AgentBroker audit', () => {
  const logger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() };
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const user = { id: 'user-1', name: 'Alice', roles: [], tenantId };
  const auditService = { record: jest.fn(), query: jest.fn(), flush: jest.fn(), droppedEventCount: 0 };

  beforeEach(() => {
    auditService.record.mockReset();
  });

  function createBroker(
    agent: Record<string, unknown>,
    { userRoles = [] as string[], inputProcessors = [] as unknown[] } = {},
  ) {
    return new AgentBroker(
      logger as never,
      tenantId,
      inputProcessors as never,
      { name: 'Builder', ...agent } as never,
      { userRoles },
      undefined,
      undefined,
      'builder',
      undefined,
      auditService,
    );
  }

  const message = {
    role: 'user' as const,
    content: [
      { type: 'text' as const, text: 'Build a confidential form' },
      { type: 'file' as const, data: 'urn:ads:platform:file-service:v1:/files/1', mimeType: 'application/pdf' },
    ],
  };

  it.each([
    ['generate', { generate: jest.fn().mockResolvedValue({ text: 'ok' }) }],
    ['stream', { stream: jest.fn().mockResolvedValue({}) }],
  ])('records the message sent with %s by size only', async (method, agent) => {
    // Arrange
    const broker = createBroker(agent);

    // Act
    await (broker[method as 'generate'] as AgentBroker['generate']).call(broker, user as never, 'thread-1', message);

    // Assert
    expect(auditService.record).toHaveBeenCalledTimes(1);
    expect(auditService.record).toHaveBeenCalledWith(AgentMessageSentAuditAction, {
      tenantId,
      actor: expect.objectContaining({ id: 'user-1', type: 'user' }),
      resource: { type: 'agent', id: 'builder', name: 'Builder' },
      correlationId: 'thread-1',
      metadata: { agentId: 'builder', threadId: 'thread-1', messageLength: 25, attachmentCount: 1 },
    });
    expect(JSON.stringify(auditService.record.mock.calls)).not.toContain('confidential');
  });

  it('keeps the thread in the request context for delegated agents', async () => {
    const generate = jest.fn().mockResolvedValue({ text: 'ok' });
    const broker = createBroker({ generate });

    await broker.generate(user as never, 'thread-1', message, { threadId: 'spoofed' });

    const { requestContext } = generate.mock.calls[0][1] as { requestContext: RequestContext };
    expect(requestContext.get(THREAD_ID_KEY as never)).toBe('thread-1');
  });

  it('does not record a message from a user who is not allowed to use the agent', async () => {
    const broker = createBroker({ generate: jest.fn() }, { userRoles: ['urn:ads:platform:agent-service:agent-user'] });

    await expect(broker.generate(user as never, 'thread-1', message)).rejects.toThrow();

    expect(auditService.record).not.toHaveBeenCalled();
  });

  it('does not record a message that the input processors reject', async () => {
    const inputProcessor = { processInput: jest.fn().mockRejectedValue(new Error('attachment not found')) };
    const broker = createBroker({ generate: jest.fn() }, { inputProcessors: [inputProcessor] });

    await expect(broker.generate(user as never, 'thread-1', message)).rejects.toThrow('attachment not found');

    expect(auditService.record).not.toHaveBeenCalled();
  });

  it.each([
    [
      { text: 'Done.', output: { status: 'ok' } },
      { responseLength: 5, hasStructuredOutput: true },
    ],
    [
      { text: 'Done!', output: null },
      { responseLength: 5, hasStructuredOutput: false },
    ],
    [
      { text: undefined, output: undefined },
      { responseLength: 0, hasStructuredOutput: false },
    ],
  ])('records the completed response %p without its content', (response, metadata) => {
    const broker = createBroker({});

    broker.recordResponseCompleted(user as never, 'thread-1', response);

    expect(auditService.record).toHaveBeenCalledWith(
      AgentResponseCompletedAuditAction,
      expect.objectContaining({
        resource: { type: 'agent', id: 'builder', name: 'Builder' },
        correlationId: 'thread-1',
        metadata: { agentId: 'builder', threadId: 'thread-1', ...metadata },
      }),
    );
    expect(JSON.stringify(auditService.record.mock.calls)).not.toMatch(/Done|status/);
  });

  describe('deleteThread', () => {
    function createDeletingBroker(thread: unknown) {
      const memory = {
        getThreadById: jest.fn().mockResolvedValue(thread),
        deleteThread: jest.fn().mockResolvedValue(undefined),
      };
      return { broker: createBroker({ getMemory: jest.fn().mockResolvedValue(memory) }), memory };
    }

    const ownThread = { id: 'thread-1', resourceId: 'user-1', metadata: { tenantId: tenantId.toString() } };

    it("records the deletion of the user's own thread", async () => {
      const { broker } = createDeletingBroker(ownThread);

      await expect(broker.deleteThread(user as never, 'thread-1')).resolves.toBe(true);

      expect(auditService.record).toHaveBeenCalledWith(ThreadDeletedAuditAction, {
        tenantId,
        actor: expect.objectContaining({ id: 'user-1' }),
        resource: { type: 'thread', id: 'thread-1' },
        correlationId: 'thread-1',
        metadata: { agentId: 'builder', threadId: 'thread-1' },
      });
    });

    it('does not record when the user has no such thread', async () => {
      const { broker } = createDeletingBroker({ ...ownThread, resourceId: 'someone-else' });

      await expect(broker.deleteThread(user as never, 'thread-1')).resolves.toBe(false);

      expect(auditService.record).not.toHaveBeenCalled();
    });

    it('does not record when the thread cannot be deleted', async () => {
      const { broker, memory } = createDeletingBroker(ownThread);
      memory.deleteThread.mockRejectedValueOnce(new Error('storage failed'));

      await expect(broker.deleteThread(user as never, 'thread-1')).rejects.toThrow('storage failed');

      expect(auditService.record).not.toHaveBeenCalled();
    });
  });
});
