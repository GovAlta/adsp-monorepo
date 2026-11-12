import {
  AdspId,
  AuditAction,
  AuditCategories,
  AuditRecordDetails,
  AuditService,
  AuditSeverities,
  BuiltInRetentionClasses,
  toAuditActor,
  User,
} from '@abgov/adsp-service-sdk';
import type { DelegationConfig, DelegationStartContext, DelegationStartResult } from '@mastra/core/agent';
import type { CoreUserMessage } from '@mastra/core/llm';
import { THREAD_ID_KEY } from './types';

const AGENT_RESOURCE_TYPE = 'agent';
const THREAD_RESOURCE_TYPE = 'thread';

export const AgentMessageSentAuditAction: AuditAction = {
  name: 'agent.message-sent',
  version: 1,
  category: AuditCategories.DataAccess,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: AGENT_RESOURCE_TYPE,
  description: 'A user sends a message to an agent, over the REST API or socket.io.',
};

export const AgentResponseCompletedAuditAction: AuditAction = {
  name: 'agent.response-completed',
  version: 1,
  category: AuditCategories.Runtime,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: AGENT_RESOURCE_TYPE,
  description: 'An agent completes a response to a message, including any structured output.',
};

export const AgentToolInvokedAuditAction: AuditAction = {
  name: 'agent.tool-invoked',
  version: 1,
  category: AuditCategories.Runtime,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: AGENT_RESOURCE_TYPE,
  description: 'An agent calls a built-in, API, or MCP tool and the call completes.',
};

export const AgentToolFailedAuditAction: AuditAction = {
  name: 'agent.tool-failed',
  version: 1,
  category: AuditCategories.Runtime,
  severity: AuditSeverities.Warning,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: AGENT_RESOURCE_TYPE,
  description: 'An agent calls a built-in, API, or MCP tool and the call fails.',
};

export const AgentDelegatedAuditAction: AuditAction = {
  name: 'agent.delegate-to-agent',
  version: 1,
  category: AuditCategories.Runtime,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: AGENT_RESOURCE_TYPE,
  description: 'An agent delegates a subtask to another agent.',
};

export const ThreadDeletedAuditAction: AuditAction = {
  name: 'thread.deleted',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Standard,
  resourceType: THREAD_RESOURCE_TYPE,
  description: 'A user deletes one of their own conversation threads.',
};

export const AgentAuditActions: AuditAction[] = [
  AgentMessageSentAuditAction,
  AgentResponseCompletedAuditAction,
  AgentToolInvokedAuditAction,
  AgentToolFailedAuditAction,
  AgentDelegatedAuditAction,
  ThreadDeletedAuditAction,
];

export type AgentToolType = 'builtin' | 'api' | 'mcp';

interface AuditedAgent {
  id: string;
  name?: string;
}

/**
 * Builds the details of an audit event about an agent interaction. Events are recorded to the tenant of the agent
 * configuration, with the agent as the resource and the thread as the correlation ID. Message and response content must
 * never be included in the metadata.
 */
export function toAgentAuditDetails(
  tenantId: AdspId,
  user: User,
  agent: AuditedAgent,
  threadId: string | undefined,
  metadata: Record<string, unknown> = {},
): AuditRecordDetails {
  return {
    tenantId,
    actor: toAuditActor(user),
    resource: { type: AGENT_RESOURCE_TYPE, id: agent.id, name: agent.name || undefined },
    correlationId: threadId || undefined,
    metadata: { agentId: agent.id, ...(threadId ? { threadId } : {}), ...metadata },
  };
}

/** Builds the details of an audit event about a conversation thread of an agent. */
export function toThreadAuditDetails(
  tenantId: AdspId,
  user: User,
  agentId: string | undefined,
  threadId: string,
): AuditRecordDetails {
  return {
    tenantId,
    actor: toAuditActor(user),
    resource: { type: THREAD_RESOURCE_TYPE, id: threadId },
    correlationId: threadId,
    metadata: { ...(agentId ? { agentId } : {}), threadId },
  };
}

/** Describes the size of a user message for audit without including its content. */
export function describeMessage(input: CoreUserMessage | CoreUserMessage[]): {
  messageLength: number;
  attachmentCount: number;
} {
  let messageLength = 0;
  let attachmentCount = 0;
  for (const { content } of Array.isArray(input) ? input : [input]) {
    if (typeof content === 'string') {
      messageLength += content.length;
    } else if (Array.isArray(content)) {
      for (const part of content) {
        if (part?.type === 'text') {
          messageLength += typeof part.text === 'string' ? part.text.length : 0;
        } else {
          attachmentCount += 1;
        }
      }
    }
  }

  return { messageLength, attachmentCount };
}

function getErrorType(err: unknown): string {
  return err instanceof Error ? err.name : typeof err;
}

/**
 * Works out whether a tool call that returned a result failed. Mastra returns input and output validation failures as
 * results with error true, and MCP servers report tool errors with isError true.
 */
function getToolResultErrorType(result: unknown): string | undefined {
  if (typeof result !== 'object' || result === null) {
    return undefined;
  }

  if ((result as Record<string, unknown>).error === true) {
    return 'ValidationError';
  }

  if ((result as Record<string, unknown>).isError === true) {
    return 'ToolError';
  }

  return undefined;
}

interface AuditedToolProps {
  auditService?: AuditService;
  tenantId: AdspId;
  agentId: string;
  agentName?: string;
  toolId: string;
  toolType: AgentToolType;
}

interface ToolExecutionContextLike {
  requestContext?: { get(key: string): unknown };
}

/**
 * Returns a copy of a tool that records agent.tool-invoked when a call completes and agent.tool-failed when it fails.
 * The actor is the user in the request context, so calls by delegated agents are attributed to the same user. The tool
 * input and output are not recorded.
 */
export function withToolAudit<T>(
  { auditService, tenantId, agentId, agentName, toolId, toolType }: AuditedToolProps,
  tool: T,
): T {
  const execute = (tool as { execute?: unknown })?.execute;
  if (!auditService || typeof execute !== 'function') {
    return tool;
  }

  const record = (context: ToolExecutionContextLike | undefined, errorType?: string) => {
    const user = context?.requestContext?.get('user') as User | undefined;
    if (!user) {
      return;
    }

    const threadId = context.requestContext.get(THREAD_ID_KEY) as string | undefined;
    const details = toAgentAuditDetails(tenantId, user, { id: agentId, name: agentName }, threadId, {
      toolId,
      toolType,
      ...(errorType ? { errorType } : {}),
    });
    void auditService.record(
      errorType ? AgentToolFailedAuditAction : AgentToolInvokedAuditAction,
      errorType ? { ...details, status: 'failure' } : details,
    );
  };

  return Object.assign(Object.create(Object.getPrototypeOf(tool)), tool, {
    execute: async (inputData: unknown, context?: ToolExecutionContextLike) => {
      let result: unknown;
      try {
        result = await execute.call(tool, inputData, context);
      } catch (err) {
        record(context, getErrorType(err));
        throw err;
      }

      record(context, getToolResultErrorType(result));
      return result;
    },
  });
}

/**
 * Adds recording of agent.delegate-to-agent to the delegation hooks of a supervisor agent, keeping any existing hooks.
 * A delegation that an existing start hook rejects or blocks is not recorded.
 */
export function withDelegationAudit(
  auditService: AuditService | undefined,
  tenantId: AdspId,
  delegation: DelegationConfig = {},
): DelegationConfig {
  if (!auditService) {
    return delegation;
  }

  const record = ({ parentAgentId, parentAgentName, primitiveId, requestContext }: DelegationStartContext) => {
    const context = requestContext as unknown as ToolExecutionContextLike['requestContext'];
    const user = context?.get('user') as User | undefined;
    if (!user) {
      return;
    }

    const threadId = context.get(THREAD_ID_KEY) as string | undefined;
    void auditService.record(
      AgentDelegatedAuditAction,
      toAgentAuditDetails(tenantId, user, { id: parentAgentId, name: parentAgentName }, threadId, {
        delegateAgentId: primitiveId,
      }),
    );
  };

  const { onDelegationStart } = delegation;
  return {
    ...delegation,
    onDelegationStart: async (context) => {
      let result: DelegationStartResult | void;
      try {
        result = await onDelegationStart?.(context);
      } catch (err) {
        // With the default 'warn' strategy, Mastra continues the delegation after a hook error.
        if (delegation.hookErrorStrategy !== 'throw') {
          record(context);
        }
        throw err;
      }

      if ((result as DelegationStartResult | undefined)?.proceed !== false) {
        record(context);
      }
      return result;
    },
  };
}
