import { adspId, auditDefinitions } from '@abgov/adsp-service-sdk';
import { createTool } from '@mastra/core/tools';
import { RequestContext } from '@mastra/core/request-context';
import { z } from 'zod';
import {
  AgentAuditActions,
  AgentDelegatedAuditAction,
  AgentToolFailedAuditAction,
  AgentToolInvokedAuditAction,
  describeMessage,
  toAgentAuditDetails,
  toThreadAuditDetails,
  withDelegationAudit,
  withToolAudit,
} from './audit';
import { THREAD_ID_KEY } from './types';

describe('audit', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const user = { id: 'user-1', name: 'Alice', email: 'alice@test.co', roles: ['agent-user'] };
  const auditService = { record: jest.fn(), query: jest.fn(), flush: jest.fn(), droppedEventCount: 0 };

  beforeEach(() => {
    auditService.record.mockReset();
  });

  function createRequestContext(values: Record<string, unknown>) {
    const requestContext = new RequestContext<Record<string, unknown>>();
    for (const [key, value] of Object.entries(values)) {
      requestContext.set(key, value);
    }
    return requestContext;
  }

  it('defines the agent service audit catalog', () => {
    expect(auditDefinitions(AgentAuditActions)).toEqual({
      'agent.message-sent': expect.objectContaining({
        version: 1,
        category: 'data-access',
        severity: 'info',
        retentionClass: 'compliance',
        resourceType: 'agent',
      }),
      'agent.response-completed': expect.objectContaining({
        category: 'runtime',
        severity: 'info',
        retentionClass: 'compliance',
        resourceType: 'agent',
      }),
      'agent.tool-invoked': expect.objectContaining({
        category: 'runtime',
        severity: 'info',
        retentionClass: 'compliance',
        resourceType: 'agent',
      }),
      'agent.tool-failed': expect.objectContaining({
        category: 'runtime',
        severity: 'warning',
        retentionClass: 'compliance',
        resourceType: 'agent',
      }),
      'agent.delegate-to-agent': expect.objectContaining({
        category: 'runtime',
        severity: 'info',
        retentionClass: 'compliance',
        resourceType: 'agent',
      }),
      'thread.deleted': expect.objectContaining({
        category: 'administrative',
        severity: 'info',
        retentionClass: 'standard',
        resourceType: 'thread',
      }),
    });
  });

  it('builds agent audit details with the user as actor and the thread as correlation ID', () => {
    const details = toAgentAuditDetails(tenantId, user as never, { id: 'builder', name: 'Builder' }, 'thread-1', {
      messageLength: 5,
    });

    expect(details).toEqual({
      tenantId,
      actor: { id: 'user-1', type: 'user', name: 'Alice', email: 'alice@test.co', roles: ['agent-user'] },
      resource: { type: 'agent', id: 'builder', name: 'Builder' },
      correlationId: 'thread-1',
      metadata: { agentId: 'builder', threadId: 'thread-1', messageLength: 5 },
    });
  });

  it('builds thread audit details with the thread as resource', () => {
    const details = toThreadAuditDetails(tenantId, { id: 'sa', name: 'service-account-x' } as never, 'builder', 't-1');

    expect(details).toMatchObject({
      tenantId,
      actor: { id: 'sa', type: 'service' },
      resource: { type: 'thread', id: 't-1' },
      correlationId: 't-1',
      metadata: { agentId: 'builder', threadId: 't-1' },
    });
  });

  it.each([
    ['a string message', { role: 'user', content: 'Hello there' }, { messageLength: 11, attachmentCount: 0 }],
    [
      'text and file parts',
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Read ' },
          { type: 'file', data: 'urn:ads:platform:file-service:v1:/files/1', mimeType: 'application/pdf' },
          { type: 'text', text: 'this' },
        ],
      },
      { messageLength: 9, attachmentCount: 1 },
    ],
    [
      'several messages',
      [
        { role: 'user', content: 'One' },
        { role: 'user', content: [{ type: 'image', image: 'data:...' }] },
      ],
      { messageLength: 3, attachmentCount: 1 },
    ],
  ])('describes %s by size only', (_case, input, expected) => {
    expect(describeMessage(input as never)).toEqual(expected);
  });

  describe('withToolAudit', () => {
    const target = { tenantId, agentId: 'builder', agentName: 'Builder', toolId: 'formDataUpdateTool' };

    function createContext(threadId = 'thread-1') {
      return { requestContext: createRequestContext({ user, [THREAD_ID_KEY]: threadId }) };
    }

    it('records a completed call without its input or output', async () => {
      // Arrange
      const tool = createTool({
        id: 'formDataUpdateTool',
        description: 'Updates form data.',
        execute: async () => ({ secret: 'output value' }),
      });
      const audited = withToolAudit({ ...target, auditService, toolType: 'builtin' }, tool);

      // Act
      const result = await audited.execute({ value: 'input value' } as never, createContext() as never);

      // Assert
      expect(result).toEqual({ secret: 'output value' });
      expect(auditService.record).toHaveBeenCalledTimes(1);
      expect(auditService.record).toHaveBeenCalledWith(
        AgentToolInvokedAuditAction,
        expect.objectContaining({
          tenantId,
          actor: expect.objectContaining({ id: 'user-1', type: 'user' }),
          resource: { type: 'agent', id: 'builder', name: 'Builder' },
          correlationId: 'thread-1',
          metadata: { agentId: 'builder', threadId: 'thread-1', toolId: 'formDataUpdateTool', toolType: 'builtin' },
        }),
      );
      expect(JSON.stringify(auditService.record.mock.calls)).not.toMatch(/input value|output value/);
    });

    it('keeps the tool definition and leaves the original tool unchanged', () => {
      const tool = createTool({ id: 'formDataUpdateTool', description: 'Updates form data.', execute: async () => 1 });
      const audited = withToolAudit({ ...target, auditService, toolType: 'builtin' }, tool);

      expect(audited).not.toBe(tool);
      expect(Object.getPrototypeOf(audited)).toBe(Object.getPrototypeOf(tool));
      expect(audited.id).toBe('formDataUpdateTool');
      expect(audited.description).toBe('Updates form data.');
      expect(audited.execute).not.toBe(tool.execute);
    });

    it('records a failed call and rethrows the error', async () => {
      // Arrange
      const tool = createTool({
        id: 'formDataUpdateTool',
        description: 'Updates form data.',
        execute: async () => {
          throw new TypeError('Request failed for user input');
        },
      });
      const audited = withToolAudit({ ...target, auditService, toolType: 'api' }, tool);

      // Act
      await expect(audited.execute({} as never, createContext() as never)).rejects.toThrow(TypeError);

      // Assert
      expect(auditService.record).toHaveBeenCalledTimes(1);
      expect(auditService.record).toHaveBeenCalledWith(
        AgentToolFailedAuditAction,
        expect.objectContaining({
          status: 'failure',
          metadata: expect.objectContaining({ toolType: 'api', errorType: 'TypeError' }),
        }),
      );
      expect(JSON.stringify(auditService.record.mock.calls)).not.toContain('user input');
    });

    it('records a call with invalid input as failed', async () => {
      // Arrange
      const tool = createTool({
        id: 'formDataUpdateTool',
        description: 'Updates form data.',
        inputSchema: z.object({ formId: z.string() }),
        execute: async () => 'ok',
      });
      const audited = withToolAudit({ ...target, auditService, toolType: 'builtin' }, tool);

      // Act
      await audited.execute({ formId: 1 } as never, createContext() as never);

      // Assert
      expect(auditService.record).toHaveBeenCalledWith(
        AgentToolFailedAuditAction,
        expect.objectContaining({ metadata: expect.objectContaining({ errorType: 'ValidationError' }) }),
      );
    });

    it('records an MCP tool error result as failed', async () => {
      // Arrange
      const tool = createTool({
        id: 'server_search',
        description: 'Searches.',
        execute: async () => ({ isError: true, content: [{ type: 'text', text: 'not found' }] }),
      });
      const audited = withToolAudit({ ...target, auditService, toolId: 'server_search', toolType: 'mcp' }, tool);

      // Act
      await audited.execute({} as never, createContext() as never);

      // Assert
      expect(auditService.record).toHaveBeenCalledWith(
        AgentToolFailedAuditAction,
        expect.objectContaining({
          metadata: expect.objectContaining({ toolId: 'server_search', toolType: 'mcp', errorType: 'ToolError' }),
        }),
      );
    });

    it('does not record a call without a user in the request context', async () => {
      const tool = createTool({ id: 'formDataUpdateTool', description: 'Updates form data.', execute: async () => 1 });
      const audited = withToolAudit({ ...target, auditService, toolType: 'builtin' }, tool);

      await audited.execute({} as never, { requestContext: createRequestContext({}) } as never);

      expect(auditService.record).not.toHaveBeenCalled();
    });

    it('returns the tool as is without an audit service', () => {
      const tool = createTool({ id: 'formDataUpdateTool', description: 'Updates form data.', execute: async () => 1 });

      expect(withToolAudit({ ...target, toolType: 'builtin' }, tool)).toBe(tool);
    });
  });

  describe('withDelegationAudit', () => {
    function createStartContext() {
      return {
        primitiveId: 'clientAgent',
        primitiveType: 'agent',
        prompt: 'List the clients of the realm.',
        parentAgentId: 'AccessServiceAgent',
        parentAgentName: 'Access Service Agent',
        requestContext: createRequestContext({ user, [THREAD_ID_KEY]: 'thread-1' }),
      } as never;
    }

    it('records the delegation without the prompt', async () => {
      // Arrange
      const delegation = withDelegationAudit(auditService, tenantId);

      // Act
      await delegation.onDelegationStart(createStartContext());

      // Assert
      expect(auditService.record).toHaveBeenCalledWith(
        AgentDelegatedAuditAction,
        expect.objectContaining({
          tenantId,
          actor: expect.objectContaining({ id: 'user-1' }),
          resource: { type: 'agent', id: 'AccessServiceAgent', name: 'Access Service Agent' },
          correlationId: 'thread-1',
          metadata: { agentId: 'AccessServiceAgent', threadId: 'thread-1', delegateAgentId: 'clientAgent' },
        }),
      );
      expect(JSON.stringify(auditService.record.mock.calls)).not.toContain('List the clients');
    });

    it('keeps the existing delegation hooks and their results', async () => {
      // Arrange
      const onDelegationStart = jest.fn().mockResolvedValue({ modifiedMaxSteps: 3 });
      const onDelegationComplete = jest.fn();
      const delegation = withDelegationAudit(auditService, tenantId, {
        hookErrorStrategy: 'warn',
        onDelegationStart,
        onDelegationComplete,
      });

      // Act
      const result = await delegation.onDelegationStart(createStartContext());

      // Assert
      expect(result).toEqual({ modifiedMaxSteps: 3 });
      expect(onDelegationStart).toHaveBeenCalledTimes(1);
      expect(delegation.onDelegationComplete).toBe(onDelegationComplete);
      expect(delegation.hookErrorStrategy).toBe('warn');
      expect(auditService.record).toHaveBeenCalledTimes(1);
    });

    it('does not record a delegation that the existing hook rejects', async () => {
      const delegation = withDelegationAudit(auditService, tenantId, {
        onDelegationStart: () => ({ proceed: false, rejectionReason: 'No.' }),
      });

      await delegation.onDelegationStart(createStartContext());

      expect(auditService.record).not.toHaveBeenCalled();
    });

    it('records a delegation that continues after the existing hook throws', async () => {
      const delegation = withDelegationAudit(auditService, tenantId, {
        onDelegationStart: () => {
          throw new Error('hook failed');
        },
      });

      await expect(delegation.onDelegationStart(createStartContext())).rejects.toThrow('hook failed');

      expect(auditService.record).toHaveBeenCalledTimes(1);
    });

    it('does not record a delegation that a throwing hook blocks', async () => {
      const delegation = withDelegationAudit(auditService, tenantId, {
        hookErrorStrategy: 'throw',
        onDelegationStart: () => {
          throw new Error('hook failed');
        },
      });

      await expect(delegation.onDelegationStart(createStartContext())).rejects.toThrow('hook failed');

      expect(auditService.record).not.toHaveBeenCalled();
    });
  });
});
