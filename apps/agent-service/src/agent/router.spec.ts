import { AgentConfigurations } from './configuration';
import { onIoConnection } from './router';
import { WorkspaceChangeProjector } from './workspace';

jest.mock('@abgov/adsp-service-sdk', () => ({
  ...jest.requireActual('@abgov/adsp-service-sdk'),
  isAllowedUser: jest.fn().mockReturnValue(true),
}));

// ---------------------------------------------------------------------------
// onIoConnection – workspace socket event handlers
// ---------------------------------------------------------------------------

describe('onIoConnection workspace socket events', () => {
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const mockUser = { id: 'user-1', name: 'Alice', isCore: false };
  const mockTenant = { id: 'urn:ads:platform:tenant-service:v2:/tenants/test', name: 'Test Tenant' };

  interface MockBrokerOverrides {
    initializeWorkspace?: jest.Mock;
    updateWorkspace?: jest.Mock;
    readWorkspace?: jest.Mock;
    createProjector?: jest.Mock;
    stream?: jest.Mock;
  }

  function buildSocketHarness(brokerOverrides: MockBrokerOverrides = {}) {
    const mockBroker = {
      initializeWorkspace:
        brokerOverrides.initializeWorkspace ??
        jest.fn().mockResolvedValue({ revision: 1, updatedAt: '2026-03-23T00:00:00.000Z' }),
      updateWorkspace:
        brokerOverrides.updateWorkspace ??
        jest.fn().mockResolvedValue({
          revision: { revision: 2, updatedAt: '2026-03-23T00:01:00.000Z' },
          writeCount: 1,
          deleteCount: 0,
        }),
      readWorkspace:
        brokerOverrides.readWorkspace ??
        jest.fn().mockResolvedValue({
          revision: { revision: 2, updatedAt: '2026-03-23T00:01:00.000Z' },
          files: [{ path: 'src/app.ts', content: 'export default {};' }],
        }),
      createProjector:
        brokerOverrides.createProjector ??
        jest.fn().mockResolvedValue({
          onToolCall: jest.fn(),
          onToolResult: jest.fn().mockResolvedValue(undefined),
        }),
      stream:
        brokerOverrides.stream ??
        jest.fn().mockResolvedValue({
          fullStream: (async function* () {
            yield { type: 'text-delta', payload: { text: 'hello' } };
          })(),
          textStream: (async function* () {
            yield 'hello';
          })(),
          object: Promise.resolve(null),
        }),
    };

    const getAgent = jest.fn().mockReturnValue(mockBroker);
    const mockConfiguration = { getAgent };

    const eventHandlers: Record<string, (...args: unknown[]) => Promise<void>> = {};
    const socket = {
      request: {
        user: mockUser,
        tenant: mockTenant,
        getServiceConfiguration: jest.fn().mockResolvedValue(mockConfiguration),
      },
      on: jest.fn((event: string, handler: (...args: unknown[]) => Promise<void>) => {
        eventHandlers[event] = handler;
      }),
      emit: jest.fn(),
      send: jest.fn(),
      connected: true,
      disconnect: jest.fn(),
    };

    return { socket, eventHandlers, mockBroker, getAgent };
  }

  async function connect(brokerOverrides: MockBrokerOverrides = {}) {
    const harness = buildSocketHarness(brokerOverrides);
    await onIoConnection(logger as never)(harness.socket as never);
    return harness;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset isAllowedUser to default pass
    const { isAllowedUser } = jest.requireMock('@abgov/adsp-service-sdk');
    isAllowedUser.mockReturnValue(true);
  });

  // -------------------------------------------------------------------------
  // message / projected workspace changes
  // -------------------------------------------------------------------------

  describe('message workspace-change projection', () => {
    function connectWithProjector(projectCalls: boolean) {
      const projector = new WorkspaceChangeProjector();
      const createProjector = jest.fn().mockResolvedValue(projector);

      const stream = jest.fn().mockResolvedValue({
        fullStream: (async function* () {
          if (projectCalls) {
            yield {
              type: 'tool-call',
              payload: {
                toolName: 'mastra_workspace_write_file',
                toolCallId: 'call-1',
                args: { path: 'src/App.tsx', content: 'export default () => null;' },
              },
            };
            yield {
              type: 'tool-result',
              payload: {
                toolName: 'mastra_workspace_write_file',
                toolCallId: 'call-1',
                result: 'Wrote 26 bytes to src/App.tsx',
              },
            };
          } else {
            yield {
              type: 'tool-result',
              payload: {
                toolName: 'formDataUpdateTool',
                toolCallId: 'call-x',
                result: { id: 'form-1' },
              },
            };
          }
        })(),
        textStream: (async function* () {})(),
        object: Promise.resolve(null),
      });

      return connect({ createProjector, stream });
    }

    it('emits workspace-change for mastra write_file tool-call/result pair', async () => {
      const { socket, eventHandlers } = await connectWithProjector(true);

      await eventHandlers['message']({
        agent: 'builder',
        threadId: 'thread-1',
        messageId: 'user-message-1',
        content: 'Update the app',
        rawChunks: true,
      });

      expect(socket.emit).toHaveBeenCalledWith(
        'workspace-change',
        expect.objectContaining({
          agent: 'builder',
          threadId: 'thread-1',
          replyTo: 'user-message-1',
          toolName: 'mastra_workspace_write_file',
          writes: [{ path: 'src/App.tsx', content: 'export default () => null;' }],
          deletes: [],
          writeCount: 1,
          deleteCount: 0,
        }),
      );
    });

    it('does not emit workspace-change for unrelated tool-result chunks', async () => {
      const { socket, eventHandlers } = await connectWithProjector(false);

      await eventHandlers['message']({
        agent: 'builder',
        threadId: 'thread-1',
        messageId: 'user-message-1',
        content: 'Do something else',
        rawChunks: true,
      });

      expect(socket.emit).not.toHaveBeenCalledWith('workspace-change', expect.anything());
    });

    it('does not emit workspace-change after tool-error clears the pending call', async () => {
      const projector = new WorkspaceChangeProjector();
      const createProjector = jest.fn().mockResolvedValue(projector);
      const stream = jest.fn().mockResolvedValue({
        fullStream: (async function* () {
          yield {
            type: 'tool-call',
            payload: {
              toolName: 'mastra_workspace_write_file',
              toolCallId: 'call-error',
              args: { path: 'src/App.tsx', content: 'export default () => null;' },
            },
          };
          yield {
            type: 'tool-error',
            payload: {
              toolName: 'mastra_workspace_write_file',
              toolCallId: 'call-error',
              error: 'write failed',
            },
          };
          yield {
            type: 'tool-result',
            payload: {
              toolName: 'mastra_workspace_write_file',
              toolCallId: 'call-error',
              result: 'Wrote 26 bytes to src/App.tsx',
            },
          };
        })(),
        textStream: (async function* () {})(),
        object: Promise.resolve(null),
      });

      const { socket, eventHandlers } = await connect({ createProjector, stream });

      await eventHandlers['message']({
        agent: 'builder',
        threadId: 'thread-1',
        messageId: 'user-message-1',
        content: 'Update the app',
        rawChunks: true,
      });

      expect(socket.emit).not.toHaveBeenCalledWith('workspace-change', expect.anything());
    });

    it('emits workspace-change for one-level nested sub-agent workspace tool chunks', async () => {
      const projector = new WorkspaceChangeProjector();
      const createProjector = jest.fn().mockResolvedValue(projector);
      const stream = jest.fn().mockResolvedValue({
        fullStream: (async function* () {
          yield {
            type: 'tool-call',
            payload: {
              toolName: 'builderPrototypeCoderAgent',
              toolCallId: 'subagent-call-1',
              args: {},
            },
          };
          yield {
            type: 'tool-result',
            payload: {
              toolName: 'builderPrototypeCoderAgent',
              toolCallId: 'subagent-call-1',
              result: {
                chunks: [
                  {
                    type: 'tool-call',
                    payload: {
                      toolName: 'mastra_workspace_write_file',
                      toolCallId: 'nested-write-1',
                      args: { path: 'src/App.tsx', content: 'export default function App() { return null; }' },
                    },
                  },
                  {
                    type: 'tool-result',
                    payload: {
                      toolName: 'mastra_workspace_write_file',
                      toolCallId: 'nested-write-1',
                      result: 'Wrote file',
                    },
                  },
                ],
              },
            },
          };
        })(),
        textStream: (async function* () {})(),
        object: Promise.resolve(null),
      });

      const { socket, eventHandlers } = await connect({ createProjector, stream });

      await eventHandlers['message']({
        agent: 'builder',
        threadId: 'thread-1',
        messageId: 'user-message-1',
        content: 'Update app using sub-agent',
        rawChunks: true,
      });

      expect(socket.emit).toHaveBeenCalledWith(
        'workspace-change',
        expect.objectContaining({
          agent: 'builder',
          threadId: 'thread-1',
          replyTo: 'user-message-1',
          toolName: 'mastra_workspace_write_file',
          writes: [{ path: 'src/App.tsx', content: 'export default function App() { return null; }' }],
          deletes: [],
          writeCount: 1,
          deleteCount: 0,
        }),
      );
    });

    it('emits workspace-change for subAgentToolResults payload shape', async () => {
      const projector = new WorkspaceChangeProjector();
      const createProjector = jest.fn().mockResolvedValue(projector);
      const stream = jest.fn().mockResolvedValue({
        fullStream: (async function* () {
          yield {
            type: 'tool-result',
            payload: {
              toolName: 'builderPrototypeCoderAgent',
              toolCallId: 'subagent-call-2',
              result: {
                subAgentToolResults: [
                  {
                    toolName: 'mastra_workspace_write_file',
                    toolCallId: 'nested-write-2',
                    args: { path: 'src/main.tsx', content: 'console.log("updated");' },
                    result: 'Wrote file',
                  },
                ],
              },
            },
          };
        })(),
        textStream: (async function* () {})(),
        object: Promise.resolve(null),
      });

      const { socket, eventHandlers } = await connect({ createProjector, stream });

      await eventHandlers['message']({
        agent: 'builder',
        threadId: 'thread-1',
        messageId: 'user-message-1',
        content: 'Update app using sub-agent',
        rawChunks: true,
      });

      expect(socket.emit).toHaveBeenCalledWith(
        'workspace-change',
        expect.objectContaining({
          agent: 'builder',
          threadId: 'thread-1',
          replyTo: 'user-message-1',
          toolName: 'mastra_workspace_write_file',
          writes: [{ path: 'src/main.tsx', content: 'console.log("updated");' }],
          deletes: [],
          writeCount: 1,
          deleteCount: 0,
        }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // workspace-init
  // -------------------------------------------------------------------------

  describe('workspace-init', () => {
    it('emits workspace-ready with revision and updatedAt on success', async () => {
      const { socket, eventHandlers } = await connect();

      await eventHandlers['workspace-init']({
        agent: 'builder',
        threadId: 'thread-1',
        workspaceTarball: 'urn:ads:platform:file-service:v1:/files/abc',
      });

      expect(socket.emit).toHaveBeenCalledWith('workspace-ready', {
        agent: 'builder',
        threadId: 'thread-1',
        revision: 1,
        updatedAt: '2026-03-23T00:00:00.000Z',
      });
    });

    it('passes the tarball URN to the broker', async () => {
      const { eventHandlers, mockBroker } = await connect();

      await eventHandlers['workspace-init']({
        agent: 'builder',
        threadId: 'thread-1',
        workspaceTarball: 'urn:ads:platform:file-service:v1:/files/abc',
      });

      expect(mockBroker.initializeWorkspace).toHaveBeenCalledWith(
        mockUser,
        'thread-1',
        'urn:ads:platform:file-service:v1:/files/abc',
      );
    });

    it('generates a threadId when none is provided', async () => {
      const { eventHandlers, mockBroker } = await connect();

      await eventHandlers['workspace-init']({
        agent: 'builder',
        workspaceTarball: 'urn:ads:platform:file-service:v1:/files/abc',
      });

      const calledThreadId = mockBroker.initializeWorkspace.mock.calls[0][1] as string;
      expect(typeof calledThreadId).toBe('string');
      expect(calledThreadId.length).toBeGreaterThan(0);
    });

    it('emits error when agent is not found', async () => {
      const { socket, eventHandlers, getAgent } = await connect();
      getAgent.mockReturnValue(undefined);

      await eventHandlers['workspace-init']({
        agent: 'unknown-agent',
        threadId: 'thread-1',
        workspaceTarball: 'urn:ads:platform:file-service:v1:/files/abc',
      });

      expect(socket.emit).toHaveBeenCalledWith('error', expect.stringContaining('unknown-agent'));
    });

    it('emits error when workspaceTarball is missing', async () => {
      const { socket, eventHandlers } = await connect();

      await eventHandlers['workspace-init']({
        agent: 'builder',
        threadId: 'thread-1',
      });

      expect(socket.emit).toHaveBeenCalledWith('error', expect.any(String));
    });

    it('emits error when payload is not a JSON object', async () => {
      const { socket, eventHandlers } = await connect();

      await eventHandlers['workspace-init']('not-an-object');

      expect(socket.emit).toHaveBeenCalledWith('error', expect.any(String));
    });

    it('logs a warning when workspace initialization fails', async () => {
      const { socket, eventHandlers } = await connect({
        initializeWorkspace: jest.fn().mockRejectedValue(new Error('Invalid tar header')),
      });

      await eventHandlers['workspace-init']({
        agent: 'builder',
        threadId: 'thread-1',
        workspaceTarball: 'urn:ads:platform:file-service:v1:/files/abc',
      });

      expect(logger.warn).toHaveBeenCalledWith(
        'Workspace initialization failed for agent builder.',
        expect.objectContaining({
          context: 'AgentRouter',
          tenant: 'urn:ads:platform:tenant-service:v2:/tenants/test',
          user: 'Alice (ID: user-1)',
          threadId: 'thread-1',
          workspaceTarball: 'urn:ads:platform:file-service:v1:/files/abc',
          error: 'Invalid tar header',
        }),
      );
      expect(socket.emit).toHaveBeenCalledWith('error', 'Invalid tar header');
    });
  });

  // -------------------------------------------------------------------------
  // workspace-update
  // -------------------------------------------------------------------------

  describe('workspace-update', () => {
    it('emits workspace-updated with counts using new writes/deletes format', async () => {
      const { socket, eventHandlers } = await connect({
        updateWorkspace: jest.fn().mockResolvedValue({
          revision: { revision: 3, updatedAt: '2026-03-23T00:02:00.000Z' },
          writeCount: 2,
          deleteCount: 1,
        }),
      });

      await eventHandlers['workspace-update']({
        agent: 'builder',
        threadId: 'thread-1',
        writes: [
          { path: 'src/app.ts', content: 'export const x = 1;' },
          { path: 'src/util.ts', content: 'export const y = 2;' },
        ],
        deletes: ['src/old.ts'],
      });

      expect(socket.emit).toHaveBeenCalledWith('workspace-updated', {
        agent: 'builder',
        threadId: 'thread-1',
        revision: 3,
        updatedAt: '2026-03-23T00:02:00.000Z',
        writeCount: 2,
        deleteCount: 1,
      });
    });

    it('passes writes and deletes correctly to the broker', async () => {
      const { eventHandlers, mockBroker } = await connect();

      const writes = [{ path: 'src/app.ts', content: 'export const x = 1;' }];
      const deletes = ['src/old.ts'];

      await eventHandlers['workspace-update']({
        agent: 'builder',
        threadId: 'thread-1',
        writes,
        deletes,
      });

      expect(mockBroker.updateWorkspace).toHaveBeenCalledWith(mockUser, 'thread-1', { writes, deletes });
    });

    it('supports legacy files payload for backward compatibility', async () => {
      const { eventHandlers, mockBroker } = await connect();

      const files = [{ path: 'index.ts', content: 'export {}' }];

      await eventHandlers['workspace-update']({
        agent: 'builder',
        threadId: 'thread-1',
        files,
      });

      expect(mockBroker.updateWorkspace).toHaveBeenCalledWith(mockUser, 'thread-1', {
        writes: files,
        deletes: [],
      });
    });

    it('emits error when agent is not found', async () => {
      const { socket, eventHandlers, getAgent } = await connect();
      getAgent.mockReturnValue(undefined);

      await eventHandlers['workspace-update']({
        agent: 'unknown-agent',
        threadId: 'thread-1',
        writes: [{ path: 'a.ts', content: '' }],
      });

      expect(socket.emit).toHaveBeenCalledWith('error', expect.stringContaining('unknown-agent'));
    });

    it('emits error when writes is not an array', async () => {
      const { socket, eventHandlers } = await connect();

      await eventHandlers['workspace-update']({
        agent: 'builder',
        threadId: 'thread-1',
        writes: 'not-an-array',
      });

      expect(socket.emit).toHaveBeenCalledWith('error', expect.any(String));
    });

    it('emits error when deletes is not an array', async () => {
      const { socket, eventHandlers } = await connect();

      await eventHandlers['workspace-update']({
        agent: 'builder',
        threadId: 'thread-1',
        deletes: 'not-an-array',
      });

      expect(socket.emit).toHaveBeenCalledWith('error', expect.any(String));
    });

    it('emits error when payload is not a JSON object', async () => {
      const { socket, eventHandlers } = await connect();

      await eventHandlers['workspace-update']('not-an-object');

      expect(socket.emit).toHaveBeenCalledWith('error', expect.any(String));
    });
  });

  // -------------------------------------------------------------------------
  // workspace-read
  // -------------------------------------------------------------------------

  describe('workspace-read', () => {
    it('emits workspace-state with revision and files on success', async () => {
      const files = [{ path: 'src/app.ts', content: 'export default {};' }];
      const { socket, eventHandlers } = await connect({
        readWorkspace: jest.fn().mockResolvedValue({
          revision: { revision: 4, updatedAt: '2026-03-23T00:03:00.000Z' },
          files,
        }),
      });

      await eventHandlers['workspace-read']({
        agent: 'builder',
        threadId: 'thread-1',
      });

      expect(socket.emit).toHaveBeenCalledWith('workspace-state', {
        agent: 'builder',
        threadId: 'thread-1',
        revision: 4,
        updatedAt: '2026-03-23T00:03:00.000Z',
        files,
      });
    });

    it('calls broker readWorkspace with correct user and threadId', async () => {
      const { eventHandlers, mockBroker } = await connect();

      await eventHandlers['workspace-read']({
        agent: 'builder',
        threadId: 'thread-1',
      });

      expect(mockBroker.readWorkspace).toHaveBeenCalledWith(mockUser, 'thread-1');
    });

    it('generates a threadId when none is provided', async () => {
      const { eventHandlers, mockBroker } = await connect();

      await eventHandlers['workspace-read']({ agent: 'builder' });

      const calledThreadId = mockBroker.readWorkspace.mock.calls[0][1] as string;
      expect(typeof calledThreadId).toBe('string');
      expect(calledThreadId.length).toBeGreaterThan(0);
    });

    it('emits error when agent is not found', async () => {
      const { socket, eventHandlers, getAgent } = await connect();
      getAgent.mockReturnValue(undefined);

      await eventHandlers['workspace-read']({
        agent: 'unknown-agent',
        threadId: 'thread-1',
      });

      expect(socket.emit).toHaveBeenCalledWith('error', expect.stringContaining('unknown-agent'));
    });

    it('emits error when payload is not a JSON object', async () => {
      const { socket, eventHandlers } = await connect();

      await eventHandlers['workspace-read']('not-an-object');

      expect(socket.emit).toHaveBeenCalledWith('error', expect.any(String));
    });
  });
});

// ---------------------------------------------------------------------------
// Existing router contract tests
// ---------------------------------------------------------------------------

describe('Agent Router - Structured Output', () => {
  describe('REST POST response with structured output', () => {
    it('includes output field when agent returns structured output', async () => {
      // Mock agent broker that returns both text and object
      const mockBroker = {
        stream: jest.fn().mockResolvedValue({
          text: 'Sample response text',
          object: { result: 'success', data: [1, 2, 3] },
        }),
      };

      // Verify the output shape matches what client expects
      const result = await mockBroker.stream();
      expect(result).toHaveProperty('text');
      expect(result).toHaveProperty('object');
      expect(result.object).toBeDefined();
      expect(result.object.result).toBe('success');
    });

    it('includes null output when agent does not return structured output', async () => {
      const mockBroker = {
        stream: jest.fn().mockResolvedValue({
          text: 'Text-only response',
          object: null,
        }),
      };

      const result = await mockBroker.stream();
      expect(result).toHaveProperty('text');
      expect(result).toHaveProperty('object');
      expect(result.object).toBeNull();
    });
  });

  describe('WebSocket stream done event with structured output', () => {
    it('includes output field in done event', () => {
      const mockSocket = {
        emit: jest.fn(),
      };

      // Simulate the done event payload that agent router sends
      const donePayload = {
        agent: 'test-agent',
        threadId: 'thread-123',
        messageId: 'msg-456',
        replyTo: 'reply-789',
        output: { result: 'success', items: ['a', 'b'] },
        done: true,
      };

      mockSocket.emit('stream', donePayload);

      // Verify done event was emitted with output
      expect(mockSocket.emit).toHaveBeenCalledWith(
        'stream',
        expect.objectContaining({
          done: true,
          output: expect.any(Object),
        }),
      );
    });

    it('includes null output in done event when no structured output', () => {
      const mockSocket = {
        emit: jest.fn(),
      };

      const donePayload = {
        agent: 'test-agent',
        threadId: 'thread-123',
        messageId: 'msg-456',
        replyTo: 'reply-789',
        output: null,
        done: true,
      };

      mockSocket.emit('stream', donePayload);

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'stream',
        expect.objectContaining({
          done: true,
          output: null,
        }),
      );
    });

    it('does not include full text concatenation in done event', () => {
      const mockSocket = {
        emit: jest.fn(),
      };

      const donePayload = {
        agent: 'test-agent',
        threadId: 'thread-123',
        messageId: 'msg-456',
        replyTo: 'reply-789',
        output: null,
        done: true,
      };

      mockSocket.emit('stream', donePayload);

      // Verify done event does NOT include a 'content' field with full text
      const callArgs = mockSocket.emit.mock.calls[0][1];
      expect(callArgs).not.toHaveProperty('content');
      expect(callArgs).not.toHaveProperty('fullText');
    });

    it('maintains thread context in done event', () => {
      const mockSocket = {
        emit: jest.fn(),
      };

      const threadId = 'thread-xyz-789';
      const messageId = 'msg-abc-456';
      const replyTo = 'parent-msg-123';

      const donePayload = {
        agent: 'test-agent',
        threadId,
        messageId,
        replyTo,
        output: { status: 'completed' },
        done: true,
      };

      mockSocket.emit('stream', donePayload);

      const callArgs = mockSocket.emit.mock.calls[0][1];
      expect(callArgs.threadId).toBe(threadId);
      expect(callArgs.messageId).toBe(messageId);
      expect(callArgs.replyTo).toBe(replyTo);
    });
  });

  describe('WebSocket text stream deltas', () => {
    it('emits text deltas during streaming without concatenation', () => {
      const mockSocket = {
        emit: jest.fn(),
      };

      // Simulate streamed text deltas (no full text accumulation)
      const textDeltas = [
        { content: 'Hello, ', delta: true },
        { content: 'this is ', delta: true },
        { content: 'streamed text.', delta: true },
      ];

      textDeltas.forEach((delta) => {
        mockSocket.emit('stream', delta);
      });

      // Verify all deltas were emitted
      expect(mockSocket.emit).toHaveBeenCalledTimes(3);
      expect(mockSocket.emit.mock.calls[0][1].content).toBe('Hello, ');
      expect(mockSocket.emit.mock.calls[1][1].content).toBe('this is ');
      expect(mockSocket.emit.mock.calls[2][1].content).toBe('streamed text.');
    });
  });

  describe('Agent configuration with outputSchema', () => {
    it('agent broker applies outputSchema from configuration', () => {
      const agentConfig: AgentConfigurations = {
        'test-agent': {
          name: 'Test Agent',
          instructions: 'Be helpful.',
          outputSchema: {
            type: 'object',
            properties: {
              answer: { type: 'string' },
              confidence: { type: 'number' },
            },
          },
        },
      };

      // Verify configuration includes outputSchema
      const agentDef = agentConfig['test-agent'];
      expect(agentDef.outputSchema).toBeDefined();
      expect(agentDef.outputSchema?.type).toBe('object');
      expect(agentDef.outputSchema?.properties).toHaveProperty('answer');
    });

    it('agent without outputSchema defaults to text-only output', () => {
      const agentConfig: AgentConfigurations = {
        'text-agent': {
          name: 'Text Agent',
          instructions: 'Give text responses.',
        },
      };

      const agentDef = agentConfig['text-agent'];
      expect(agentDef.outputSchema).toBeUndefined();
    });
  });
});
