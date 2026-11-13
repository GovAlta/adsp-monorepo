import {
  AdspId,
  AuditAction,
  AuditCategories,
  AuditEventStatus,
  AuditRecordDetails,
  AuditService,
  AuditSeverities,
  BuiltInRetentionClasses,
  toAuditActor,
  User,
} from '@abgov/adsp-service-sdk';
import type { DelegationConfig, DelegationStartContext, DelegationStartResult } from '@mastra/core/agent';
import type { CoreUserMessage } from '@mastra/core/llm';
import { mapAgentStreamError } from './model/streamAbort';
import { THREAD_ID_KEY } from './types';

const AGENT_RESOURCE_TYPE = 'agent';
const THREAD_RESOURCE_TYPE = 'thread';

export const AgentMessageSentAuditAction: AuditAction = {
  name: 'agent.message.sent',
  version: 1,
  category: AuditCategories.DataAccess,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: AGENT_RESOURCE_TYPE,
  description: 'A user sends a message to an agent, over the REST API or socket.io.',
};

export const AgentResponseCompletedAuditAction: AuditAction = {
  name: 'agent.response.completed',
  version: 1,
  category: AuditCategories.Runtime,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: AGENT_RESOURCE_TYPE,
  description:
    'An agent finishes its response to a message. The status is failure when the response stops with an error, and blocked when a guardrail stops it.',
};

export const AgentToolInvokedAuditAction: AuditAction = {
  name: 'agent.tool.invoked',
  version: 1,
  category: AuditCategories.Runtime,
  severity: AuditSeverities.Info,
  retentionClass: BuiltInRetentionClasses.Compliance,
  resourceType: AGENT_RESOURCE_TYPE,
  description: 'An agent calls a built-in, API, or MCP tool. The status is failure when the call fails.',
};

export const AgentDelegationStartedAuditAction: AuditAction = {
  name: 'agent.delegation.started',
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
  AgentDelegationStartedAuditAction,
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

/** Code of an error for audit metadata: its own code when it has one, otherwise its name. The message is not used. */
function getErrorCode(err: unknown): string {
  const code = (err as { code?: unknown })?.code;
  if (typeof code === 'string' && code) {
    return code;
  }

  return err instanceof Error ? err.name : typeof err;
}

/**
 * Works out whether a tool call that returned a result failed. Mastra returns input and output validation failures as
 * results with error true, and MCP servers report tool errors with isError true.
 */
function getToolResultErrorCode(result: unknown): string | undefined {
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

/** Outcome of an agent response as reported by Mastra once the response has finished. */
export interface AgentResponseResult {
  text?: unknown;
  error?: unknown;
  tripwire?: { processorId?: string };
}

/**
 * Works out the audit status of a finished agent response. A guardrail processor that stops the response leaves a
 * tripwire with its processor ID. Mastra reports an abort, such as the time or step limit, as a tripwire without a
 * processor, so the reason of the abort signal gives its code.
 */
export function toResponseAuditOutcome(
  { error, tripwire }: Pick<AgentResponseResult, 'error' | 'tripwire'>,
  abortReason?: unknown,
): { status: AuditEventStatus; metadata: Record<string, unknown> } {
  if (error) {
    // An abort surfaces as a generic error from the model call, so the reason of the abort signal is the better code.
    const errorCode = mapAgentStreamError(abortReason)?.code ?? mapAgentStreamError(error)?.code ?? getErrorCode(error);
    return { status: 'failure', metadata: { errorCode } };
  }

  if (tripwire?.processorId) {
    return { status: 'blocked', metadata: { errorCode: 'TRIPWIRE', processorId: tripwire.processorId } };
  }

  if (tripwire) {
    return { status: 'failure', metadata: { errorCode: mapAgentStreamError(abortReason)?.code ?? 'ABORTED' } };
  }

  return { status: 'success', metadata: {} };
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
 * Returns a copy of a tool that records agent.tool.invoked for each call, with status failure when the call fails. The
 * actor is the user in the request context, so calls by delegated agents are attributed to the same user. The tool
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

  const record = (context: ToolExecutionContextLike | undefined, errorCode?: string) => {
    const user = context?.requestContext?.get('user') as User | undefined;
    if (!user) {
      return;
    }

    const threadId = context.requestContext.get(THREAD_ID_KEY) as string | undefined;
    void auditService.record(AgentToolInvokedAuditAction, {
      ...toAgentAuditDetails(tenantId, user, { id: agentId, name: agentName }, threadId, {
        toolId,
        toolType,
        ...(errorCode ? { errorCode } : {}),
      }),
      status: errorCode ? 'failure' : 'success',
    });
  };

  return Object.assign(Object.create(Object.getPrototypeOf(tool)), tool, {
    execute: async (inputData: unknown, context?: ToolExecutionContextLike) => {
      let result: unknown;
      try {
        result = await execute.call(tool, inputData, context);
      } catch (err) {
        record(context, getErrorCode(err));
        throw err;
      }

      record(context, getToolResultErrorCode(result));
      return result;
    },
  });
}

/**
 * Adds recording of agent.delegation.started to the delegation hooks of a supervisor agent, keeping any existing hooks.
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
      AgentDelegationStartedAuditAction,
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
