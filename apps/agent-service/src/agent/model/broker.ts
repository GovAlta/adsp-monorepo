import {
  isAllowedUser,
  UnauthorizedUserError,
  AdspId,
  type AuditAction,
  type AuditEventStatus,
  type AuditService,
  type User,
  EventService,
} from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import type { Agent, AgentExecutionOptions, ToolsInput } from '@mastra/core/agent';
import type { CoreUserMessage } from '@mastra/core/llm';
import { MASTRA_RESOURCE_ID_KEY, MASTRA_THREAD_ID_KEY, RequestContext } from '@mastra/core/request-context';
import { Logger } from 'winston';
import { environment } from '../../environments/environment';
import type { IFileServiceClient } from '../clients';
import { AgentConfiguration } from '../configuration';
import { BrokerInputProcessor, THREAD_ID_KEY } from '../types';
import { threadCreated, workspaceCreated, workspaceCreationFailed } from '../events';
import {
  AgentMessageSentAuditAction,
  AgentResponseCompletedAuditAction,
  type AgentResponseResult,
  describeMessage,
  ThreadDeletedAuditAction,
  toAgentAuditDetails,
  toResponseAuditOutcome,
  toThreadAuditDetails,
} from '../audit';
import {
  clearThreadWorkspace,
  ManagedWorkspace,
  WorkspaceChangeProjector,
  WorkspaceFileUpdate,
  WorkspaceReadResult,
  WorkspaceRevisionMetadata,
  WorkspaceUpdateRequest,
  WorkspaceUpdateResult,
} from '../workspace';
import { getAgentExecutionLimits } from './executionLimits';
import { AgentModelConfiguration, getAgentProviderOptions } from './modelConfiguration';
import { abortExecution, STREAM_ERROR_CODES } from './streamAbort';
import {
  ConversationStatus,
  getConversationStatus,
  MemoryStatus,
  MessageHistory,
  USAGE_RECORDER_KEY,
  UsageRecorder,
  usesObservationalMemory,
} from './conversationUsage';
import { deleteThreadAndWorkspace } from './threadDeletion';

type ThreadMetadataRecord = {
  id: string;
  resourceId: string;
  title?: string;
  metadata?: Record<string, unknown>;
};

type ThreadListResult = {
  threads: ThreadMetadataRecord[];
  hasMore: boolean;
};

type ThreadMemoryAccessor = {
  getThreadById?: (args: { threadId: string }) => Promise<ThreadMetadataRecord | null>;
  listThreads?: (args: { page: number; perPage: number }) => Promise<ThreadListResult>;
  deleteThread?: (threadId: string) => Promise<void>;
  createThread?: (args: {
    threadId: string;
    resourceId: string;
    metadata: Record<string, unknown>;
  }) => Promise<unknown>;
  saveThread?: (args: { thread: ThreadMetadataRecord }) => Promise<unknown>;
  getMergedThreadConfig?: () => { lastMessages?: number | false; observationalMemory?: unknown };
  recall?: (args: { threadId: string; resourceId?: string; perPage?: number }) => Promise<{ total: number }>;
};

type AgentWithOptionalMemory<TAgentId extends string = string, TTools extends ToolsInput = ToolsInput> = Agent<
  TAgentId,
  TTools
> & {
  getMemory?: () => Promise<ThreadMemoryAccessor | undefined>;
};

export class AgentBroker<TAgentId extends string = string, TTools extends ToolsInput = ToolsInput> {
  private userRoles: string[];
  private limits: { timeoutMs?: number; maxSteps?: number };
  private readonly threadTtlMs = Math.max(environment.AGENT_THREAD_TTL_MINUTES, 1) * 60 * 1000;
  // Abort signals of streamed replies, so the code of an abort can be recorded once the stream is consumed.
  private readonly responseAbortSignals = new WeakMap<object, AbortSignal>();
  public get Agent() {
    return this.agent;
  }

  constructor(
    private logger: Logger,
    private tenantId: AdspId,
    private inputProcessors: BrokerInputProcessor[],
    private agent: AgentWithOptionalMemory<TAgentId, TTools>,
    { userRoles, maxSteps, timeoutMs }: Partial<AgentConfiguration>,
    private fileServiceClient?: IFileServiceClient,
    private eventService?: EventService,
    private agentId?: string,
    private modelConfig?: AgentModelConfiguration,
    private auditService?: AuditService,
  ) {
    this.userRoles = userRoles || [];
    this.limits = { maxSteps, timeoutMs };
  }

  private getExecutionOptions(requestContext: RequestContext<Record<string, unknown>>, user: User, threadId: string, streaming = false) {
    const limits = getAgentExecutionLimits(this.limits);
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      abortExecution(
        controller,
        STREAM_ERROR_CODES.GENERATION_DEADLINE,
        'Generation exceeded the time limit. Anything already saved is in the editor.',
      );
    }, limits.timeoutMs);
    timeout.unref?.();
    const clearAbortTimeout = () => clearTimeout(timeout);

    requestContext.set('agentId', this.agentId);
    requestContext.set('abortController', controller);

    const providerOptions = getAgentProviderOptions(this.agentId, this.modelConfig);
    let stepCount = 0;
    const baseOptions = {
      requestContext,
      memory: { thread: threadId, resource: user.id },
      abortSignal: controller.signal,
      ...(limits.maxSteps !== undefined ? { maxSteps: limits.maxSteps } : {}),
      ...(providerOptions != null ? { providerOptions } : {}),
      onStepFinish: ({ finishReason, usage }: Parameters<NonNullable<AgentExecutionOptions['onStepFinish']>>[0]) => {
        stepCount += 1;
        this.logger.debug(
          `Agent ${this.agent.name} finished step for reason '${finishReason}' and used ${usage?.totalTokens ?? 0} tokens.`,
          { context: 'AgentBroker', tenant: this.tenantId?.toString() },
        );
        // Only abort when the turn would have continued (pending tool calls); a reply that completes on the
        // final allowed step is a normal finish.
        if (limits.maxSteps !== undefined && stepCount >= limits.maxSteps && finishReason === 'tool-calls') {
          abortExecution(
            controller,
            STREAM_ERROR_CODES.MAX_STEPS,
            `Reached the ${limits.maxSteps}-step limit. Anything already saved is in the editor.`,
          );
        }
      },
      onFinish: clearAbortTimeout,
      onAbort: clearAbortTimeout,
    };

    // Streaming suppresses structuredOutput so defaultOptions on the Agent don't apply;
    // generate() leaves it unset so a configured outputSchema takes effect via defaultOptions.
    return (streaming ? { ...baseOptions, structuredOutput: undefined } : baseOptions) as AgentExecutionOptions;
  }

  private buildRequestContext(
    user: User,
    threadId: string,
    context: Record<string, unknown> = {},
  ): RequestContext<Record<string, unknown>> {
    const requestContext = new RequestContext<Record<string, unknown>>();

    for (const [key, value] of Object.entries(context || {})) {
      requestContext.set(key, value);
    }

    // Reserve identity fields so client-supplied context cannot override workspace selection.
    // Setting MASTRA_THREAD_ID_KEY and MASTRA_RESOURCE_ID_KEY in requestContext ensures Mastra
    // propagates the authenticated values to sub-agents (requestContext takes priority over
    // the LLM-authored memory.thread/resource values that Mastra otherwise derives).
    requestContext.set('tenantId', this.tenantId);
    requestContext.set('user', user);
    requestContext.set('agentId', this.agentId);
    requestContext.set(MASTRA_THREAD_ID_KEY, threadId);
    requestContext.set(MASTRA_RESOURCE_ID_KEY, user.id);
    requestContext.set(THREAD_ID_KEY, threadId);

    return requestContext;
  }

  private assertAllowedUser(user: User): void {
    if (this.userRoles.length > 0 && !isAllowedUser(user, this.tenantId, this.userRoles)) {
      throw new UnauthorizedUserError('use agent', user);
    }
  }

  private async prepareAgentRequest(
    user: User,
    threadId: string,
    input: CoreUserMessage | CoreUserMessage[],
    context: Record<string, unknown> = {},
  ): Promise<RequestContext<Record<string, unknown>>> {
    this.assertAllowedUser(user);

    const requestContext = this.buildRequestContext(user, threadId, context);
    await this.updateThreadExpiry(user, threadId);

    // Described before the input processors, which can replace attachment parts in place.
    const message = describeMessage(input);

    // This is necessarily because normal Mastra input processors run after message normalization.
    // For example, assets already downloaded, so we cannot use an input processor to download files with a credential.
    for (const inputProcessor of this.inputProcessors) {
      await inputProcessor.processInput(requestContext, input);
    }

    this.recordAgentAudit(AgentMessageSentAuditAction, user, threadId, message);

    return requestContext;
  }

  private recordAgentAudit(
    action: AuditAction,
    user: User,
    threadId: string,
    metadata: Record<string, unknown>,
    status: AuditEventStatus = 'success',
  ): void {
    if (this.auditService && this.agentId) {
      void this.auditService.record(action, {
        ...toAgentAuditDetails(this.tenantId, user, { id: this.agentId, name: this.agent.name }, threadId, metadata),
        status,
      });
    }
  }

  private recordResponse(
    user: User,
    threadId: string,
    { text, output, error, tripwire, abortReason }: AgentResponseResult & { output?: unknown; abortReason?: unknown },
  ): void {
    const { status, metadata } = toResponseAuditOutcome({ error, tripwire }, abortReason);
    this.recordAgentAudit(
      AgentResponseCompletedAuditAction,
      user,
      threadId,
      {
        responseLength: typeof text === 'string' ? text.length : 0,
        hasStructuredOutput: output !== undefined && output !== null,
        ...metadata,
      },
      status,
    );
  }

  /**
   * Records that a streamed reply to the user finished, once its stream is consumed, or that it failed with an error.
   * Only the length of the reply and whether it has structured output are recorded, never their content.
   */
  public async recordResponseCompleted(
    user: User,
    threadId: string,
    result: AgentResponseResult | undefined,
    { output, error }: { output?: unknown; error?: unknown } = {},
  ): Promise<void> {
    let text: unknown;
    try {
      text = await result?.text;
    } catch {
      text = undefined;
    }

    this.recordResponse(user, threadId, {
      text,
      output,
      error: error ?? result?.error,
      tripwire: result?.tripwire,
      abortReason: result ? this.responseAbortSignals.get(result)?.reason : undefined,
    });
  }

  private async updateThreadExpiry(user: User, threadId: string): Promise<void> {
    try {
      if (!this.agent.getMemory) {
        return;
      }

      const memory = await this.agent.getMemory();
      if (!memory) {
        return;
      }

      const expiresAt = Date.now() + this.threadTtlMs;
      const tenantId = this.tenantId?.toString();
      const existingThread = await memory.getThreadById?.({ threadId });

      if (!existingThread) {
        await memory.createThread?.({
          threadId,
          resourceId: user.id,
          metadata: { expiresAt, tenantId },
        });

        // Signal thread-created event for new threads
        try {
          if (this.eventService) {
            const event = threadCreated(this.tenantId, threadId, this.agentId || '', user);
            this.eventService.send(event);
          }
        } catch (err) {
          this.logger.warn(`Failed to signal thread-created event for thread ${threadId}.`, {
            context: 'AgentBroker',
            tenant: this.tenantId?.toString(),
            error: err instanceof Error ? err.message : String(err),
          });
        }

        return;
      }

      await memory.saveThread?.({
        thread: {
          ...existingThread,
          title: existingThread.title || `Thread ${threadId}`,
          metadata: {
            ...(existingThread.metadata || {}),
            expiresAt,
            tenantId,
          },
        },
      });
    } catch (err) {
      this.logger.warn(`Unable to update expiresAt metadata for thread ${threadId}.`, {
        context: 'AgentBroker',
        tenant: this.tenantId?.toString(),
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  private async getManagedWorkspace(user: User, threadId: string): Promise<ManagedWorkspace> {
    const requestContext = this.buildRequestContext(user, threadId);
    await this.updateThreadExpiry(user, threadId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const workspace = await this.agent.getWorkspace({ requestContext: requestContext as any });

    return ManagedWorkspace.from(workspace as never);
  }

  public async initializeWorkspace(
    user: User,
    threadId: string,
    tarballUrn: string,
  ): Promise<WorkspaceRevisionMetadata> {
    if (!this.fileServiceClient) {
      throw new InvalidOperationError('File service client is required to initialize workspace.');
    }

    let sourceFilename = tarballUrn;

    try {
      const workspace = await this.getManagedWorkspace(user, threadId);

      const tarballId = AdspId.parse(tarballUrn);
      const { stream, metadata } = await this.fileServiceClient.getFileStream(this.tenantId, tarballId);
      sourceFilename = metadata?.filename ?? tarballUrn;
      const compressed = isCompressedTarball(metadata?.filename, metadata?.mimeType);
      const revision = await workspace.initializeFromTarball(stream, compressed);

      this.logger.info(`Workspace initialized for thread ${threadId} from tarball ${tarballUrn}.`, {
        context: 'AgentBroker',
        tenant: this.tenantId?.toString(),
      });

      if (this.eventService) {
        const sourceFile: { filename: string; uploadedAt: Date; size?: number } = {
          filename: sourceFilename,
          uploadedAt: new Date(),
        };
        if (isRecordWithNumericSize(metadata)) {
          sourceFile.size = metadata.size;
        }
        this.eventService.send(
          workspaceCreated(this.tenantId, threadId, this.agentId || '', tarballUrn, user, sourceFile),
        );
      }

      return revision;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));

      if (this.eventService) {
        try {
          this.eventService.send(
            workspaceCreationFailed(
              this.tenantId,
              threadId,
              this.agentId || '',
              tarballUrn,
              user,
              sourceFilename,
              error.name,
              error.message,
            ),
          );
        } catch (eventErr) {
          this.logger.warn(`Failed to signal workspace-creation-failed event for thread ${threadId}.`, {
            context: 'AgentBroker',
            tenant: this.tenantId?.toString(),
            error: eventErr instanceof Error ? eventErr.message : String(eventErr),
          });
        }
      }

      throw err;
    }
  }

  public async updateWorkspace(
    user: User,
    threadId: string,
    update: WorkspaceFileUpdate[] | WorkspaceUpdateRequest,
  ): Promise<WorkspaceUpdateResult> {
    const workspace = await this.getManagedWorkspace(user, threadId);

    const writes = Array.isArray(update) ? update : update.writes || [];
    const deletes = Array.isArray(update) ? [] : update.deletes || [];
    const result = await workspace.applyUpdate({ writes, deletes });

    this.logger.debug(
      `Workspace updated for thread ${threadId}: ${writes.length} file(s) written, ${deletes.length} file(s) deleted.`,
      {
        context: 'AgentBroker',
        tenant: this.tenantId?.toString(),
      },
    );

    return result;
  }

  /**
   * Deletes one of the user's own threads with its stored messages, observations and workspace, so a new chat starts
   * without any of its context. Resolves to false when the user has no thread with this ID in this tenant; a thread
   * that belongs to another user or tenant gets the same answer, so its existence is not revealed.
   */
  public async deleteThread(user: User, threadId: string): Promise<boolean> {
    this.assertAllowedUser(user);

    const memory = await this.agent.getMemory?.();
    if (!memory?.getThreadById || !memory.deleteThread) {
      return false;
    }

    const tenantId = this.tenantId?.toString();
    const thread = await memory.getThreadById({ threadId });
    if (!thread || thread.resourceId !== user.id || thread.metadata?.tenantId !== tenantId) {
      return false;
    }

    await deleteThreadAndWorkspace(
      {
        logger: this.logger,
        deleteThread: (id) => memory.deleteThread(id),
        clearWorkspace: (workspaceTenantId, userId, workspaceThreadId) =>
          clearThreadWorkspace(this.logger, { tenantId: workspaceTenantId, userId, threadId: workspaceThreadId }),
        eventService: this.eventService,
      },
      { tenantId, userId: user.id, threadId },
    );

    if (this.auditService) {
      void this.auditService.record(
        ThreadDeletedAuditAction,
        toThreadAuditDetails(this.tenantId, user, this.agentId, threadId),
      );
    }

    return true;
  }

  public async readWorkspace(user: User, threadId: string): Promise<WorkspaceReadResult> {
    const workspace = await this.getManagedWorkspace(user, threadId);
    return workspace.readSnapshot();
  }

  public async createProjector(user: User, threadId: string): Promise<WorkspaceChangeProjector> {
    try {
      const workspace = await this.getManagedWorkspace(user, threadId);
      return workspace.createProjector();
    } catch {
      // Workspace not enabled for this agent — return an unbound projector.
      // It will never match mutating tool calls, so it safely returns undefined for everything.
      return new WorkspaceChangeProjector();
    }
  }

  /**
   * Streams the agent's reply. A usage recorder, when given, collects model calls that tools make outside the agent's
   * own usage; it is set after the client context so a client cannot supply its own.
   */
  public async stream(
    user: User,
    threadId: string,
    input: CoreUserMessage | CoreUserMessage[],
    context: Record<string, unknown> = {},
    usageRecorder?: UsageRecorder,
  ) {
    const requestContext = await this.prepareAgentRequest(user, threadId, input, context);
    if (usageRecorder) {
      requestContext.set(USAGE_RECORDER_KEY, usageRecorder);
    }

    const options = this.getExecutionOptions(requestContext, user, threadId, true);
    try {
      const result = await this.agent.stream(input, options);
      if (typeof result === 'object' && result !== null && options.abortSignal) {
        this.responseAbortSignals.set(result, options.abortSignal);
      }
      return result;
    } catch (err) {
      this.recordResponse(user, threadId, { error: err, abortReason: options.abortSignal?.reason });
      throw err;
    }
  }

  /**
   * Whether the user's conversation has grown long enough that the agent may miss earlier details, after a reply that
   * took up contextTokens of the model's context window.
   */
  public async getConversationStatus(
    user: User,
    threadId: string,
    { contextTokens, memoryStatus }: { contextTokens: number; memoryStatus?: MemoryStatus },
  ): Promise<ConversationStatus> {
    return getConversationStatus({
      contextTokens,
      contextWindowTokens: environment.AGENT_MODEL_CONTEXT_TOKENS,
      memoryStatus,
      history: await this.getMessageHistory(user, threadId),
    });
  }

  // Observational memory reports on itself in the stream. Without it, the agent reads only the most recent
  // lastMessages, so older messages drop out once the thread holds more than that.
  private async getMessageHistory(user: User, threadId: string): Promise<MessageHistory | undefined> {
    const memory = await this.agent.getMemory?.();
    const config = memory?.getMergedThreadConfig?.();
    if (
      !memory?.recall ||
      typeof config?.lastMessages !== 'number' ||
      usesObservationalMemory(config.observationalMemory)
    ) {
      return undefined;
    }

    const { total } = await memory.recall({ threadId, resourceId: user.id, perPage: 1 });
    return { storedMessages: total, lastMessages: config.lastMessages };
  }

  public async generate(
    user: User,
    threadId: string,
    input: CoreUserMessage | CoreUserMessage[],
    context: Record<string, unknown> = {},
  ) {
    const requestContext = await this.prepareAgentRequest(user, threadId, input, context);

    const options = this.getExecutionOptions(requestContext, user, threadId);
    try {
      const result = await this.agent.generate(input, options);
      this.recordResponse(user, threadId, {
        text: result?.text,
        output: result?.object,
        error: result?.error,
        tripwire: result?.tripwire,
        abortReason: options.abortSignal?.reason,
      });
      return result;
    } catch (err) {
      this.recordResponse(user, threadId, { error: err, abortReason: options.abortSignal?.reason });
      throw err;
    }
  }
}

function isRecordWithNumericSize(value: unknown): value is { size: number } {
  return typeof value === 'object' && value !== null && 'size' in value && typeof value.size === 'number';
}

function isCompressedTarball(filename?: string, mimeType?: string): boolean {
  const normalizedName = filename?.toLowerCase() ?? '';
  const normalizedType = mimeType?.toLowerCase() ?? '';

  return (
    normalizedName.endsWith('.tar.gz') ||
    normalizedName.endsWith('.tgz') ||
    normalizedName.endsWith('.gz') ||
    normalizedType.includes('gzip') ||
    normalizedType === 'application/x-tar+gzip'
  );
}
