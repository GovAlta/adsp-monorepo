import { MASTRA_THREAD_ID_KEY, RequestContext } from '@mastra/core/request-context';
import { Readable } from 'node:stream';
import { clearThreadWorkspace } from '../workspace';
import { AgentBroker } from './broker';

jest.mock('../workspace', () => ({
  ...jest.requireActual('../workspace'),
  clearThreadWorkspace: jest.fn().mockResolvedValue(undefined),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const tarStream = require('tar-stream');

function createTestTar(files: { name: string; content: string }[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const pack = tarStream.pack();
    const chunks: Buffer[] = [];
    pack.on('data', (chunk: Buffer) => chunks.push(chunk));
    pack.on('end', () => resolve(Buffer.concat(chunks)));
    pack.on('error', reject);

    for (const file of files) {
      pack.entry({ name: file.name }, file.content);
    }
    pack.finalize();
  });
}

describe('AgentBroker', () => {
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const tenantId = {
    toString: () => 'urn:ads:platform:tenant-service:v2:/tenants/test',
  };

  const user = {
    id: 'user-123',
    name: 'Test User',
  };

  it('adds workspace identity fields to request context', async () => {
    const generate = jest.fn().mockResolvedValue({ text: 'ok', object: null });
    const agent = {
      name: 'Test agent',
      generate,
      stream: jest.fn(),
    };
    const broker = new AgentBroker(logger as never, tenantId as never, [], agent as never, {});

    await broker.generate(user as never, 'thread-456', {
      role: 'user',
      content: [{ type: 'text', text: 'Hello' }],
    });

    const options = generate.mock.calls[0][1] as {
      requestContext: RequestContext<Record<string, unknown>>;
      abortSignal?: AbortSignal;
      maxSteps?: number;
    };

    expect(options.requestContext.get('tenantId')).toBe(tenantId);
    expect(options.requestContext.get('user')).toBe(user);
    expect(options.requestContext.get(MASTRA_THREAD_ID_KEY)).toBe('thread-456');
    expect(options.abortSignal).toBeDefined();
    expect(options.maxSteps).toBeUndefined();
  });

  it('sets the configured maxSteps and abort controller on request context', async () => {
    const generate = jest.fn().mockResolvedValue({ text: 'ok', object: null });
    const agent = {
      name: 'Form Generation Agent',
      generate,
      stream: jest.fn(),
    };
    const broker = new AgentBroker(
      logger as never,
      tenantId as never,
      [],
      agent as never,
      { maxSteps: 12 },
      undefined,
      undefined,
      'formGenerationAgent',
    );

    await broker.generate(user as never, 'thread-456', {
      role: 'user',
      content: [{ type: 'text', text: 'Hello' }],
    });

    const options = generate.mock.calls[0][1] as {
      maxSteps?: number;
      requestContext: RequestContext<Record<string, unknown>>;
    };
    expect(options.maxSteps).toBe(12);
    expect(options.requestContext.get('abortController')).toBeInstanceOf(AbortController);
    expect(options.requestContext.get('agentId')).toBe('formGenerationAgent');
  });

  describe('step limit', () => {
    async function getOptions(maxSteps: number) {
      const generate = jest.fn().mockResolvedValue({ text: 'ok', object: null });
      const agent = { name: 'Test agent', generate, stream: jest.fn() };
      const broker = new AgentBroker(logger as never, tenantId as never, [], agent as never, { maxSteps });

      await broker.generate(user as never, 'thread-456', {
        role: 'user',
        content: [{ type: 'text', text: 'Hello' }],
      });

      return generate.mock.calls[0][1] as {
        abortSignal: AbortSignal;
        onStepFinish: (step: { finishReason: string; usage?: unknown }) => void;
      };
    }

    it('aborts when the limit is reached while the turn still has tool calls pending', async () => {
      const options = await getOptions(2);

      options.onStepFinish({ finishReason: 'tool-calls' });
      expect(options.abortSignal.aborted).toBe(false);
      options.onStepFinish({ finishReason: 'tool-calls' });
      expect(options.abortSignal.aborted).toBe(true);
    });

    it('does not abort when the reply completes on the final allowed step', async () => {
      const options = await getOptions(2);

      options.onStepFinish({ finishReason: 'tool-calls' });
      options.onStepFinish({ finishReason: 'stop' });
      expect(options.abortSignal.aborted).toBe(false);
    });
  });

  it('creates thread metadata with expiresAt when updating expiry for a new thread', async () => {
    const generate = jest.fn().mockResolvedValue({ text: 'ok', object: null });
    const getThreadById = jest.fn().mockResolvedValue(null);
    const createThread = jest.fn().mockResolvedValue({});
    const saveThread = jest.fn();
    const getMemory = jest.fn().mockResolvedValue({ getThreadById, createThread, saveThread });
    const agent = {
      id: 'test-agent-id',
      name: 'Test agent',
      generate,
      stream: jest.fn(),
      getMemory,
    };
    const broker = new AgentBroker(logger as never, tenantId as never, [], agent as never, {});

    await broker.generate(user as never, 'thread-456', {
      role: 'user',
      content: [{ type: 'text', text: 'Hello' }],
    });

    expect(createThread).toHaveBeenCalledWith(
      expect.objectContaining({
        threadId: 'thread-456',
        resourceId: 'user-123',
        metadata: expect.objectContaining({
          expiresAt: expect.any(Number),
          tenantId: 'urn:ads:platform:tenant-service:v2:/tenants/test',
        }),
      }),
    );
    expect(saveThread).not.toHaveBeenCalled();
  });

  it('updates expiresAt metadata when updating expiry for an existing thread', async () => {
    const generate = jest.fn().mockResolvedValue({ text: 'ok', object: null });
    const getThreadById = jest.fn().mockResolvedValue({ title: 'Existing thread', metadata: { foo: 'bar' } });
    const createThread = jest.fn();
    const saveThread = jest.fn().mockResolvedValue({});
    const getMemory = jest.fn().mockResolvedValue({ getThreadById, createThread, saveThread });
    const agent = {
      id: 'test-agent-id',
      name: 'Test agent',
      generate,
      stream: jest.fn(),
      getMemory,
    };
    const broker = new AgentBroker(logger as never, tenantId as never, [], agent as never, {});

    await broker.generate(user as never, 'thread-456', {
      role: 'user',
      content: [{ type: 'text', text: 'Hello' }],
    });

    expect(saveThread).toHaveBeenCalledWith(
      expect.objectContaining({
        thread: expect.objectContaining({
          title: 'Existing thread',
        }),
      }),
    );
    expect(saveThread).toHaveBeenCalledWith(
      expect.objectContaining({
        thread: expect.objectContaining({
          metadata: expect.objectContaining({
            foo: 'bar',
            expiresAt: expect.any(Number),
            tenantId: 'urn:ads:platform:tenant-service:v2:/tenants/test',
          }),
        }),
      }),
    );
    expect(createThread).not.toHaveBeenCalled();
  });

  describe('initializeWorkspace', () => {
    it('throws if fileServiceClient is not configured', async () => {
      const agent = { name: 'Test agent', generate: jest.fn(), stream: jest.fn() };
      const broker = new AgentBroker(logger as never, tenantId as never, [], agent as never, {});

      await expect(
        broker.initializeWorkspace(user as never, 'thread-1', 'urn:ads:platform:file-service:v1:/files/abc'),
      ).rejects.toThrow('File service client is required');
    });

    it('throws if workspace is not enabled', async () => {
      const agent = {
        name: 'Test agent',
        generate: jest.fn(),
        stream: jest.fn(),
        getWorkspace: jest.fn().mockResolvedValue(null),
      };
      const fileServiceClient = { getFileAndMetadata: jest.fn() };
      const broker = new AgentBroker(
        logger as never,
        tenantId as never,
        [],
        agent as never,
        {},
        fileServiceClient as never,
      );

      await expect(
        broker.initializeWorkspace(user as never, 'thread-1', 'urn:ads:platform:file-service:v1:/files/abc'),
      ).rejects.toThrow('Workspace is not enabled');
    });

    it('clears existing files and extracts tar into workspace', async () => {
      const tarball = await createTestTar([
        { name: 'hello.txt', content: 'Hello World' },
        { name: 'src/app.ts', content: 'export const x = 1;' },
      ]);

      const writeFile = jest.fn().mockResolvedValue(undefined);
      const deleteFile = jest.fn().mockResolvedValue(undefined);
      const mkdir = jest.fn().mockResolvedValue(undefined);
      const readdir = jest.fn().mockResolvedValue([{ name: 'old.txt', type: 'file' }]);
      const filesystem = { writeFile, deleteFile, mkdir, readdir };
      const workspace = { filesystem };

      const agent = {
        name: 'Test agent',
        generate: jest.fn(),
        stream: jest.fn(),
        getWorkspace: jest.fn().mockResolvedValue(workspace),
      };
      const fileServiceClient = {
        getFileStream: jest.fn().mockResolvedValue({
          stream: Readable.from(Buffer.from(tarball)),
          metadata: {},
        }),
      };
      const broker = new AgentBroker(
        logger as never,
        tenantId as never,
        [],
        agent as never,
        {},
        fileServiceClient as never,
      );

      const revision = await broker.initializeWorkspace(
        user as never,
        'thread-1',
        'urn:ads:platform:file-service:v1:/files/abc',
      );

      expect(deleteFile).toHaveBeenCalledWith('old.txt', { recursive: true, force: true });
      expect(writeFile).toHaveBeenCalledWith('hello.txt', expect.any(Buffer), { recursive: true });
      expect(writeFile).toHaveBeenCalledWith('src/app.ts', expect.any(Buffer), { recursive: true });
      expect(writeFile).toHaveBeenCalledWith('.agent/revision.json', expect.any(String), { recursive: true });
      expect(revision.revision).toBe(1);
    });
  });

  describe('updateWorkspace', () => {
    it('throws if workspace is not enabled', async () => {
      const agent = {
        name: 'Test agent',
        generate: jest.fn(),
        stream: jest.fn(),
        getWorkspace: jest.fn().mockResolvedValue(null),
      };
      const broker = new AgentBroker(logger as never, tenantId as never, [], agent as never, {});

      await expect(
        broker.updateWorkspace(user as never, 'thread-1', [{ path: 'a.txt', content: 'x' }]),
      ).rejects.toThrow('Workspace is not enabled');
    });

    it('writes each file to workspace filesystem', async () => {
      const writeFile = jest.fn().mockResolvedValue(undefined);
      const readFile = jest.fn().mockRejectedValue(new Error('ENOENT: not found'));
      const deleteFile = jest.fn().mockResolvedValue(undefined);
      const mkdir = jest.fn().mockResolvedValue(undefined);
      const filesystem = { writeFile, readFile, deleteFile, mkdir };
      const workspace = { filesystem };
      const agent = {
        name: 'Test agent',
        generate: jest.fn(),
        stream: jest.fn(),
        getWorkspace: jest.fn().mockResolvedValue(workspace),
      };
      const broker = new AgentBroker(logger as never, tenantId as never, [], agent as never, {});

      const result = await broker.updateWorkspace(user as never, 'thread-1', [
        { path: 'a.txt', content: 'hello' },
        { path: 'b.txt', content: 'world' },
      ]);

      expect(writeFile).toHaveBeenCalledWith('a.txt', 'hello', { recursive: true });
      expect(writeFile).toHaveBeenCalledWith('b.txt', 'world', { recursive: true });
      expect(writeFile).toHaveBeenCalledWith('.agent/revision.json', expect.any(String), { recursive: true });
      expect(result.writeCount).toBe(2);
      expect(result.deleteCount).toBe(0);
      expect(result.revision.revision).toBe(1);
      expect(deleteFile).not.toHaveBeenCalled();
    });

    it('supports deleting files from the workspace filesystem', async () => {
      const writeFile = jest.fn().mockResolvedValue(undefined);
      const readFile = jest.fn().mockRejectedValue(new Error('ENOENT: not found'));
      const deleteFile = jest.fn().mockResolvedValue(undefined);
      const mkdir = jest.fn().mockResolvedValue(undefined);
      const filesystem = { writeFile, readFile, deleteFile, mkdir };
      const workspace = { filesystem };
      const agent = {
        name: 'Test agent',
        generate: jest.fn(),
        stream: jest.fn(),
        getWorkspace: jest.fn().mockResolvedValue(workspace),
      };
      const broker = new AgentBroker(logger as never, tenantId as never, [], agent as never, {});

      const result = await broker.updateWorkspace(user as never, 'thread-1', {
        writes: [{ path: 'src/app.ts', content: 'export const app = true;' }],
        deletes: ['src/old.ts'],
      });

      expect(writeFile).toHaveBeenCalledWith('src/app.ts', 'export const app = true;', { recursive: true });
      expect(deleteFile).toHaveBeenCalledWith('src/old.ts', { recursive: true, force: true });
      expect(result.writeCount).toBe(1);
      expect(result.deleteCount).toBe(1);
      expect(result.revision.revision).toBe(1);
    });
  });

  describe('readWorkspace', () => {
    it('returns the current workspace snapshot and revision metadata', async () => {
      const readdir = jest
        .fn()
        .mockResolvedValueOnce([
          { name: '.agent', type: 'directory' },
          { name: 'src', type: 'directory' },
          { name: 'README.md', type: 'file' },
        ])
        .mockResolvedValueOnce([{ name: 'app.ts', type: 'file' }]);
      const readFile = jest.fn(async (path: string) => {
        if (path === '.agent/revision.json') {
          return JSON.stringify({ revision: 3, updatedAt: '2026-03-23T00:00:00.000Z' });
        }

        if (path === 'README.md') {
          return '# Prototype';
        }

        if (path === 'src/app.ts') {
          return 'export const app = true;';
        }

        throw new Error(`Unexpected read: ${path}`);
      });
      const filesystem = { readdir, readFile };
      const workspace = { filesystem };
      const agent = {
        name: 'Test agent',
        generate: jest.fn(),
        stream: jest.fn(),
        getWorkspace: jest.fn().mockResolvedValue(workspace),
      };
      const broker = new AgentBroker(logger as never, tenantId as never, [], agent as never, {});

      const result = await broker.readWorkspace(user as never, 'thread-1');

      expect(result.revision.revision).toBe(3);
      expect(result.files).toEqual([
        { path: 'README.md', content: '# Prototype' },
        { path: 'src/app.ts', content: 'export const app = true;' },
      ]);
    });
  });

  describe('createProjector', () => {
    it('returns a workspace-bound projector when workspace is enabled', async () => {
      const readFile = jest.fn().mockResolvedValue('export const x = 2;');
      const filesystem = { readFile };
      const workspace = { filesystem };
      const agent = {
        name: 'Test agent',
        generate: jest.fn(),
        stream: jest.fn(),
        getWorkspace: jest.fn().mockResolvedValue(workspace),
      };
      const broker = new AgentBroker(logger as never, tenantId as never, [], agent as never, {});

      const projector = await broker.createProjector(user as never, 'thread-1');
      projector.onToolCall({
        toolName: 'mastra_workspace_edit_file',
        toolCallId: 'call-1',
        args: { path: 'src/app.ts', old_string: 'x = 1', new_string: 'x = 2' },
      });
      const event = await projector.onToolResult({
        toolName: 'mastra_workspace_edit_file',
        toolCallId: 'call-1',
        result: 'Replaced 1 occurrence in src/app.ts',
      });

      expect(readFile).toHaveBeenCalledWith('src/app.ts');
      expect(event?.writes[0].content).toBe('export const x = 2;');
    });

    it('returns an unbound projector when workspace is disabled', async () => {
      const agent = {
        name: 'Test agent',
        generate: jest.fn(),
        stream: jest.fn(),
        getWorkspace: jest.fn().mockResolvedValue(null),
      };
      const broker = new AgentBroker(logger as never, tenantId as never, [], agent as never, {});

      const projector = await broker.createProjector(user as never, 'thread-1');
      // Unrelated tool — should always return undefined
      const event = await projector.onToolResult({
        toolName: 'mastra_workspace_write_file',
        toolCallId: 'call-orphan',
        result: 'Wrote 0 bytes',
      });

      expect(event).toBeUndefined();
    });
  });

  describe('deleteThread', () => {
    const TENANT_ID = 'urn:ads:platform:tenant-service:v2:/tenants/test';
    const agentUser = { ...user, roles: ['urn:ads:platform:agent-service:agent-user'], tenantId };

    function createBroker(thread: unknown, { userRoles = [] as string[], memory = undefined as unknown } = {}) {
      const threadMemory = memory ?? {
        getThreadById: jest.fn().mockResolvedValue(thread),
        deleteThread: jest.fn().mockResolvedValue(undefined),
      };
      const eventService = { send: jest.fn() };
      const agent = { name: 'Test agent', getMemory: jest.fn().mockResolvedValue(threadMemory) };
      const broker = new AgentBroker(
        logger as never,
        tenantId as never,
        [],
        agent as never,
        { userRoles },
        undefined,
        eventService as never,
        'AccessServiceAgent',
      );
      return { broker, memory: threadMemory as { getThreadById: jest.Mock; deleteThread: jest.Mock }, eventService };
    }

    const ownThread = { id: 'thread-1', resourceId: 'user-123', metadata: { tenantId: TENANT_ID } };

    beforeEach(() => {
      (clearThreadWorkspace as jest.Mock).mockClear();
    });

    it("deletes the user's own thread with its workspace and signals thread-deleted", async () => {
      const { broker, memory, eventService } = createBroker(ownThread);

      await expect(broker.deleteThread(user as never, 'thread-1')).resolves.toBe(true);

      expect(memory.getThreadById).toHaveBeenCalledWith({ threadId: 'thread-1' });
      expect(clearThreadWorkspace).toHaveBeenCalledWith(logger, {
        tenantId: TENANT_ID,
        userId: 'user-123',
        threadId: 'thread-1',
      });
      expect(memory.deleteThread).toHaveBeenCalledWith('thread-1');
      expect(eventService.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'thread-deleted' }));
    });

    it.each([
      ['does not exist', null],
      ['belongs to another user', { ...ownThread, resourceId: 'someone-else' }],
      [
        'belongs to another tenant',
        { ...ownThread, metadata: { tenantId: 'urn:ads:platform:tenant-service:v2:/tenants/other' } },
      ],
      ['has no tenant', { ...ownThread, metadata: {} }],
    ])('resolves to false without deleting anything when the thread %s', async (_case, thread) => {
      const { broker, memory, eventService } = createBroker(thread);

      await expect(broker.deleteThread(user as never, 'thread-1')).resolves.toBe(false);

      expect(memory.deleteThread).not.toHaveBeenCalled();
      expect(clearThreadWorkspace).not.toHaveBeenCalled();
      expect(eventService.send).not.toHaveBeenCalled();
    });

    it('resolves to false when the agent has no thread memory', async () => {
      const { broker } = createBroker(ownThread, { memory: {} });

      await expect(broker.deleteThread(user as never, 'thread-1')).resolves.toBe(false);
      expect(clearThreadWorkspace).not.toHaveBeenCalled();
    });

    it('rejects a user who is not allowed to use the agent', async () => {
      const { broker, memory } = createBroker(ownThread, {
        userRoles: ['urn:ads:platform:agent-service:agent-user'],
      });

      await expect(broker.deleteThread({ ...user, roles: [], tenantId } as never, 'thread-1')).rejects.toThrow();
      expect(memory.getThreadById).not.toHaveBeenCalled();
    });

    it('deletes the thread of a user who is allowed to use the agent', async () => {
      const { broker } = createBroker(ownThread, { userRoles: ['urn:ads:platform:agent-service:agent-user'] });

      await expect(broker.deleteThread(agentUser as never, 'thread-1')).resolves.toBe(true);
    });

    it('rejects when the thread cannot be deleted from storage', async () => {
      const { broker, memory, eventService } = createBroker(ownThread);
      memory.deleteThread.mockRejectedValueOnce(new Error('storage failed'));

      await expect(broker.deleteThread(user as never, 'thread-1')).rejects.toThrow('storage failed');
      expect(eventService.send).not.toHaveBeenCalled();
    });
  });
});
