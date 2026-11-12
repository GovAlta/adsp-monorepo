import { adspId } from '@abgov/adsp-service-sdk';
import { RequestContext } from '@mastra/core/request-context';
import { AgentMessageSentAuditAction, AgentResponseCompletedAuditAction, ThreadDeletedAuditAction } from '../audit';
import { THREAD_ID_KEY } from '../types';
import { AgentBroker } from './broker';
import { AgentStreamAbortError } from './streamAbort';

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
    expect(auditService.record).toHaveBeenNthCalledWith(1, AgentMessageSentAuditAction, {
      tenantId,
      actor: expect.objectContaining({ id: 'user-1', type: 'user' }),
      resource: { type: 'agent', id: 'builder', name: 'Builder' },
      correlationId: 'thread-1',
      metadata: { agentId: 'builder', threadId: 'thread-1', messageLength: 25, attachmentCount: 1 },
      status: 'success',
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

  function getResponseRecord() {
    const call = auditService.record.mock.calls.find(([action]) => action === AgentResponseCompletedAuditAction);
    return call?.[1];
  }

  /** An agent method that aborts the request, as the broker does at the step limit, then settles. */
  function abortingWith(settle: (reason: unknown) => Promise<unknown>) {
    return jest.fn(async (_input, { requestContext }) => {
      const reason = new AgentStreamAbortError('MAX_STEPS', 'Reached the step limit.');
      (requestContext.get('abortController') as AbortController).abort(reason);
      return settle(reason);
    });
  }

  describe('REST responses', () => {
    it.each([
      [
        { text: 'Done.', object: { status: 'ok' } },
        { responseLength: 5, hasStructuredOutput: true },
      ],
      [
        { text: 'Done!', object: null },
        { responseLength: 5, hasStructuredOutput: false },
      ],
    ])('records the completed response %p without its content', async (result, metadata) => {
      // Arrange
      const broker = createBroker({ generate: jest.fn().mockResolvedValue(result) });

      // Act
      await broker.generate(user as never, 'thread-1', message);

      // Assert
      expect(getResponseRecord()).toEqual(
        expect.objectContaining({
          status: 'success',
          resource: { type: 'agent', id: 'builder', name: 'Builder' },
          correlationId: 'thread-1',
          metadata: { agentId: 'builder', threadId: 'thread-1', ...metadata },
        }),
      );
      expect(JSON.stringify(auditService.record.mock.calls)).not.toMatch(/Done|"ok"/);
    });

    it('records a response that a guardrail blocks', async () => {
      const result = { text: '', tripwire: { reason: 'Prompt injection detected', processorId: 'pii-guardrail' } };
      const broker = createBroker({ generate: jest.fn().mockResolvedValue(result) });

      await broker.generate(user as never, 'thread-1', message);

      expect(getResponseRecord()).toEqual(
        expect.objectContaining({
          status: 'blocked',
          metadata: expect.objectContaining({ errorCode: 'TRIPWIRE', processorId: 'pii-guardrail' }),
        }),
      );
      expect(JSON.stringify(getResponseRecord())).not.toContain('Prompt injection detected');
    });

    it('records a failed response and rethrows its error', async () => {
      const broker = createBroker({ generate: jest.fn().mockRejectedValue(new TypeError('model unavailable')) });

      await expect(broker.generate(user as never, 'thread-1', message)).rejects.toThrow('model unavailable');

      expect(getResponseRecord()).toEqual(
        expect.objectContaining({
          status: 'failure',
          metadata: expect.objectContaining({ errorCode: 'TypeError', responseLength: 0 }),
        }),
      );
    });

    it('records the code of an abort', async () => {
      const generate = abortingWith(() => Promise.reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
      const broker = createBroker({ generate });

      await expect(broker.generate(user as never, 'thread-1', message)).rejects.toThrow('aborted');

      expect(getResponseRecord()).toEqual(
        expect.objectContaining({ status: 'failure', metadata: expect.objectContaining({ errorCode: 'MAX_STEPS' }) }),
      );
    });
  });

  describe('streamed responses', () => {
    it('records a streamed response once its stream is consumed', async () => {
      // Arrange
      const result = { text: Promise.resolve('Done.') };
      const broker = createBroker({ stream: jest.fn().mockResolvedValue(result) });
      const streamed = await broker.stream(user as never, 'thread-1', message);
      expect(getResponseRecord()).toBeUndefined();

      // Act
      await broker.recordResponseCompleted(user as never, 'thread-1', streamed, { output: undefined });

      // Assert
      expect(getResponseRecord()).toEqual(
        expect.objectContaining({
          status: 'success',
          metadata: { agentId: 'builder', threadId: 'thread-1', responseLength: 5, hasStructuredOutput: false },
        }),
      );
    });

    it('records the code of a stream that was aborted', async () => {
      const broker = createBroker({ stream: abortingWith(async () => ({ text: Promise.resolve(''), tripwire: {} })) });
      const streamed = await broker.stream(user as never, 'thread-1', message);

      await broker.recordResponseCompleted(user as never, 'thread-1', streamed);

      expect(getResponseRecord()).toEqual(
        expect.objectContaining({ status: 'failure', metadata: expect.objectContaining({ errorCode: 'MAX_STEPS' }) }),
      );
    });

    it.each([
      [
        'an error in the result',
        () => ({ text: Promise.reject(new Error('no text')), error: new Error('provider failed') }),
        {},
      ],
      [
        'an error while streaming',
        () => ({ text: Promise.resolve('Part') }),
        { error: new RangeError('socket failed') },
      ],
    ])('records a streamed response that failed with %s', async (_case, createResult, options) => {
      const broker = createBroker({ stream: jest.fn().mockImplementation(async () => createResult()) });
      const streamed = await broker.stream(user as never, 'thread-1', message);

      await broker.recordResponseCompleted(user as never, 'thread-1', streamed, options);

      expect(getResponseRecord()).toEqual(expect.objectContaining({ status: 'failure' }));
      expect(getResponseRecord().metadata.errorCode).toBe('error' in options ? 'RangeError' : 'Error');
    });

    it('records a failed response when the stream cannot start', async () => {
      const broker = createBroker({ stream: jest.fn().mockRejectedValue(new Error('model unavailable')) });

      await expect(broker.stream(user as never, 'thread-1', message)).rejects.toThrow('model unavailable');

      expect(getResponseRecord()).toEqual(
        expect.objectContaining({ status: 'failure', metadata: expect.objectContaining({ errorCode: 'Error' }) }),
      );
    });
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
