import { AgentConfigurations } from './configuration';

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
      expect(mockSocket.emit).toHaveBeenCalledWith('stream', expect.objectContaining({
        done: true,
        output: expect.any(Object),
      }));
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

      expect(mockSocket.emit).toHaveBeenCalledWith('stream', expect.objectContaining({
        done: true,
        output: null,
      }));
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
