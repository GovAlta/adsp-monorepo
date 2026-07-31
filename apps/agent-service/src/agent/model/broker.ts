import { isAllowedUser, UnauthorizedUserError, AdspId, type User, EventService } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, InvalidValueError, NotFoundError } from '@core-services/core-common';
import type { Agent, AgentExecutionOptions, ToolsInput } from '@mastra/core/agent';
import type { CoreUserMessage } from '@mastra/core/llm';
import { MASTRA_RESOURCE_ID_KEY, MASTRA_THREAD_ID_KEY, RequestContext } from '@mastra/core/request-context';
import { Logger } from 'winston';
import { environment } from '../../environments/environment';
import type { IFileServiceClient } from '../clients';
import { AgentConfiguration } from '../configuration';
import { BrokerInputProcessor } from '../types';
import { threadCreated, workspaceCreated, workspaceCreationFailed } from '../events';
import {
  ManagedWorkspace,
  WorkspaceChangeProjector,
  WorkspaceFileUpdate,
  WorkspaceReadResult,
  WorkspaceRevisionMetadata,
  WorkspaceUpdateRequest,
  WorkspaceUpdateResult,
} from '../workspace';
import { clearMockHashCache } from '../tools/mockDocument';

type ThreadMetadataRecord = {
  id: string;
  resourceId: string;
  title?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  metadata?: Record<string, unknown>;
};

type ThreadListResult = {
  threads: ThreadMetadataRecord[];
  hasMore?: boolean;
  total?: number;
};

export type ThreadSummary = {
  id: string;
  title?: string;
  resourceId: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  metadata?: Record<string, unknown>;
};

export type UserThreadsResult = {
  threads: ThreadSummary[];
  total: number;
};

export type ThreadMessageRecord = {
  id: string;
  role: string;
  content: unknown;
  createdAt?: Date | string;
  threadId?: string;
  resourceId?: string;
  [key: string]: unknown;
};

export type ThreadMessagesResult = {
  threadId: string;
  messages: ThreadMessageRecord[];
  total: number;
  /** Max recent messages Mastra includes in the next LLM turn (AGENT_LAST_MESSAGES). */
  contextWindow: {
    lastMessages: number;
  };
};

export type ThreadRollbackResult = ThreadMessagesResult & {
  keepThroughMessageId: string;
  deletedIds: string[];
  /** Message ids whose tool-call/tool-result parts were stripped from kept history. */
  scrubbedMessageIds: string[];
  scrubToolResults: boolean;
};

export type ThreadRollbackOptions = {
  scrubToolResults?: boolean;
  /** When scrubbing, only remove these tool names. Empty/omitted = all tools. */
  toolNames?: string[];
};

type ThreadMemoryAccessor = {
  getThreadById?: (args: { threadId: string }) => Promise<ThreadMetadataRecord | null>;
  listThreads?: (args: {
    page?: number;
    perPage?: number | false;
    filter?: { resourceId?: string };
    orderBy?: { field?: 'createdAt' | 'updatedAt'; direction?: 'ASC' | 'DESC' };
  }) => Promise<ThreadListResult>;
  deleteThread?: (threadId: string) => Promise<void>;
  createThread?: (args: {
    threadId: string;
    resourceId: string;
    metadata: Record<string, unknown>;
  }) => Promise<unknown>;
  saveThread?: (args: { thread: ThreadMetadataRecord }) => Promise<unknown>;
  recall?: (args: {
    threadId: string;
    perPage?: number | false;
  }) => Promise<{ messages: ThreadMessageRecord[]; total?: number }>;
  deleteMessages?: (messageIds: string[] | { id: string }[]) => Promise<void>;
  updateMessages?: (args: {
    messages: Array<Partial<ThreadMessageRecord> & { id: string }>;
  }) => Promise<ThreadMessageRecord[]>;
};

type AgentWithOptionalMemory<TAgentId extends string = string, TTools extends ToolsInput = ToolsInput> = Agent<
  TAgentId,
  TTools
> & {
  getMemory?: () => Promise<ThreadMemoryAccessor | undefined>;
};

export class AgentBroker<TAgentId extends string = string, TTools extends ToolsInput = ToolsInput> {
  private userRoles: string[];
  private readonly threadTtlMs = Math.max(environment.AGENT_THREAD_TTL_MINUTES, 1) * 60 * 1000;
  public get Agent() {
    return this.agent;
  }

  constructor(
    private logger: Logger,
    private tenantId: AdspId,
    private inputProcessors: BrokerInputProcessor[],
    private agent: AgentWithOptionalMemory<TAgentId, TTools>,
    { userRoles }: Partial<AgentConfiguration>,
    private fileServiceClient?: IFileServiceClient,
    private eventService?: EventService,
    private agentId?: string,
  ) {
    this.userRoles = userRoles || [];
  }

  private getExecutionOptions(requestContext: RequestContext<Record<string, unknown>>, user: User, threadId: string) {
    const options: AgentExecutionOptions = {
      requestContext,
      memory: { thread: threadId, resource: user.id },
      onStepFinish: ({ finishReason, usage }) => {
        this.logger.debug(
          `Agent ${this.agent.name} finished step for reason '${finishReason}' and used ${usage?.totalTokens ?? 0} tokens.`,
          { context: 'AgentBroker', tenant: this.tenantId?.toString() },
        );
      },
      structuredOutput: undefined,
    };

    return options;
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
    requestContext.set(MASTRA_THREAD_ID_KEY, threadId);
    requestContext.set(MASTRA_RESOURCE_ID_KEY, user.id);

    return requestContext;
  }

  private async prepareAgentRequest(
    user: User,
    threadId: string,
    input: CoreUserMessage | CoreUserMessage[],
    context: Record<string, unknown> = {},
  ): Promise<RequestContext<Record<string, unknown>>> {
    if (this.userRoles.length > 0 && !isAllowedUser(user, this.tenantId, this.userRoles)) {
      throw new UnauthorizedUserError('use agent', user);
    }

    const requestContext = this.buildRequestContext(user, threadId, context);
    await this.updateThreadExpiry(user, threadId);

    // This is necessarily because normal Mastra input processors run after message normalization.
    // For example, assets already downloaded, so we cannot use an input processor to download files with a credential.
    for (const inputProcessor of this.inputProcessors) {
      await inputProcessor.processInput(requestContext, input);
    }

    return requestContext;
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
      const agentId = this.agentId || '';
      const existingThread = await memory.getThreadById?.({ threadId });

      if (!existingThread) {
        await memory.createThread?.({
          threadId,
          resourceId: user.id,
          metadata: { expiresAt, tenantId, agentId },
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
            agentId,
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

  public async stream(
    user: User,
    threadId: string,
    input: CoreUserMessage | CoreUserMessage[],
    context: Record<string, unknown> = {},
  ) {
    const requestContext = await this.prepareAgentRequest(user, threadId, input, context);

    return this.agent.stream(input, this.getExecutionOptions(requestContext, user, threadId));
  }

  public async generate(
    user: User,
    threadId: string,
    input: CoreUserMessage | CoreUserMessage[],
    context: Record<string, unknown> = {},
  ) {
    const requestContext = await this.prepareAgentRequest(user, threadId, input, context);

    return this.agent.generate(input, this.getExecutionOptions(requestContext, user, threadId));
  }

  /**
   * Lists Mastra threads owned by the authenticated user (resourceId === user.id).
   */
  public async listThreads(user: User): Promise<UserThreadsResult> {
    if (this.userRoles.length > 0 && !isAllowedUser(user, this.tenantId, this.userRoles)) {
      throw new UnauthorizedUserError('use agent', user);
    }

    const memory = await this.getMemoryOrThrow();
    if (!memory.listThreads) {
      throw new InvalidOperationError('Agent memory does not support listing threads.');
    }

    const listed = await memory.listThreads({
      page: 0,
      perPage: false,
      filter: { resourceId: user.id },
      orderBy: { field: 'updatedAt', direction: 'DESC' },
    });

    // Memory is shared across agents; keep this agent's threads only.
    // Untagged legacy threads are included until they are next updated.
    const agentId = this.agentId || '';
    const seen = new Set<string>();
    const threads = (listed.threads || [])
      .filter((thread) => {
        const threadAgentId = thread.metadata?.agentId;
        if (typeof threadAgentId === 'string' && threadAgentId.length > 0) {
          return threadAgentId === agentId;
        }
        return true;
      })
      .filter((thread) => {
        if (!thread.id || seen.has(thread.id)) {
          return false;
        }
        seen.add(thread.id);
        return true;
      })
      .map((thread) => ({
        id: thread.id,
        title: thread.title,
        resourceId: thread.resourceId,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
        metadata: thread.metadata,
      }));

    return {
      threads,
      total: threads.length,
    };
  }

  /**
   * Lists persisted Mastra memory messages for a thread owned by the user.
   * This is the stored thread history; the next LLM turn typically uses only the
   * most recent `contextWindow.lastMessages` of these.
   */
  public async listMessages(user: User, threadId: string): Promise<ThreadMessagesResult> {
    if (this.userRoles.length > 0 && !isAllowedUser(user, this.tenantId, this.userRoles)) {
      throw new UnauthorizedUserError('use agent', user);
    }

    const memory = await this.getMemoryOrThrow();
    await this.assertThreadOwned(user, threadId, memory);

    if (!memory.recall) {
      throw new InvalidOperationError('Agent memory does not support recalling messages.');
    }

    const recalled = await memory.recall({ threadId, perPage: false });
    const messages = recalled.messages || [];

    return {
      threadId,
      messages,
      total: typeof recalled.total === 'number' ? recalled.total : messages.length,
      contextWindow: {
        lastMessages: environment.AGENT_LAST_MESSAGES,
      },
    };
  }

  /**
   * Deletes every message in the thread (including tool-call / tool-result parts in content).
   * The thread record remains so the same threadId can be reused.
   */
  public async clearMessages(user: User, threadId: string): Promise<ThreadMessagesResult> {
    if (this.userRoles.length > 0 && !isAllowedUser(user, this.tenantId, this.userRoles)) {
      throw new UnauthorizedUserError('use agent', user);
    }

    const memory = await this.getMemoryOrThrow();
    await this.assertThreadOwned(user, threadId, memory);

    if (!memory.recall) {
      throw new InvalidOperationError('Agent memory does not support recalling messages.');
    }
    if (!memory.deleteMessages) {
      throw new InvalidOperationError('Agent memory does not support deleting messages.');
    }

    const recalled = await memory.recall({ threadId, perPage: false });
    const deletedIds = (recalled.messages || []).map((message) => message.id).filter(Boolean);

    if (deletedIds.length > 0) {
      await memory.deleteMessages(deletedIds);
    }

    clearMockHashCache(threadId);

    this.logger.info(`Cleared ${deletedIds.length} message(s) from thread ${threadId}.`, {
      context: 'AgentBroker',
      tenant: this.tenantId?.toString(),
      user: `${user.name} (ID: ${user.id})`,
    });

    return {
      threadId,
      messages: [],
      total: 0,
      contextWindow: {
        lastMessages: environment.AGENT_LAST_MESSAGES,
      },
    };
  }

  /**
   * Keeps messages through keepThroughMessageId (inclusive) and deletes everything after.
   * Optionally strips tool-call/tool-result parts from the kept messages (generic for any agent).
   * Next generate/stream uses the truncated (and optionally scrubbed) Mastra history.
   */
  public async rollbackToMessage(
    user: User,
    threadId: string,
    keepThroughMessageId: string,
    options: ThreadRollbackOptions = {},
  ): Promise<ThreadRollbackResult> {
    if (this.userRoles.length > 0 && !isAllowedUser(user, this.tenantId, this.userRoles)) {
      throw new UnauthorizedUserError('use agent', user);
    }

    if (!keepThroughMessageId?.trim()) {
      throw new InvalidValueError('keepThroughMessageId', 'keepThroughMessageId is required.');
    }

    const scrubToolResults = options.scrubToolResults === true;
    const toolNames = normalizeToolNames(options.toolNames);

    const memory = await this.getMemoryOrThrow();
    await this.assertThreadOwned(user, threadId, memory);

    if (!memory.recall) {
      throw new InvalidOperationError('Agent memory does not support recalling messages.');
    }
    if (!memory.deleteMessages) {
      throw new InvalidOperationError('Agent memory does not support deleting messages.');
    }

    const recalled = await memory.recall({ threadId, perPage: false });
    const ordered = sortMessagesByCreatedAt(recalled.messages || []);
    const checkpointIndex = ordered.findIndex((message) => message.id === keepThroughMessageId);

    if (checkpointIndex < 0) {
      throw new NotFoundError('message', keepThroughMessageId);
    }

    let remaining = ordered.slice(0, checkpointIndex + 1);
    const toDelete = ordered.slice(checkpointIndex + 1);
    const deletedIds = toDelete.map((message) => message.id).filter(Boolean);

    if (deletedIds.length > 0) {
      await memory.deleteMessages(deletedIds);
    }

    let scrubbedMessageIds: string[] = [];
    if (scrubToolResults) {
      if (!memory.updateMessages) {
        throw new InvalidOperationError('Agent memory does not support updating messages.');
      }

      const scrubbed = scrubToolPartsFromMessages(remaining, toolNames);
      scrubbedMessageIds = scrubbed.updates.map((message) => message.id);

      if (scrubbed.updates.length > 0) {
        await memory.updateMessages({ messages: scrubbed.updates });
      }
      remaining = scrubbed.messages;
    }

    // Match Clear memory: drop cached mock tool results so the next call cannot reuse them.
    clearMockHashCache(threadId);

    this.logger.info(
      `Rolled back thread ${threadId} to message ${keepThroughMessageId}; deleted ${deletedIds.length} message(s)` +
        (scrubToolResults ? `; scrubbed tools from ${scrubbedMessageIds.length} message(s)` : '') +
        '.',
      {
        context: 'AgentBroker',
        tenant: this.tenantId?.toString(),
        user: `${user.name} (ID: ${user.id})`,
      },
    );

    return {
      threadId,
      keepThroughMessageId,
      deletedIds,
      scrubbedMessageIds,
      scrubToolResults,
      messages: remaining,
      total: remaining.length,
      contextWindow: {
        lastMessages: environment.AGENT_LAST_MESSAGES,
      },
    };
  }

  private async getMemoryOrThrow(): Promise<ThreadMemoryAccessor> {
    if (!this.agent.getMemory) {
      throw new InvalidOperationError('Agent memory is not configured.');
    }

    const memory = await this.agent.getMemory();
    if (!memory) {
      throw new InvalidOperationError('Agent memory is not configured.');
    }

    return memory;
  }

  private async assertThreadOwned(user: User, threadId: string, memory: ThreadMemoryAccessor): Promise<void> {
    const thread = await memory.getThreadById?.({ threadId });
    if (!thread) {
      throw new NotFoundError('thread', threadId);
    }

    if (thread.resourceId !== user.id) {
      throw new UnauthorizedUserError('access thread', user);
    }
  }
}

function normalizeToolNames(toolNames?: string[]): string[] | null {
  if (!toolNames?.length) {
    return null;
  }
  const normalized = toolNames.map((name) => name.trim()).filter(Boolean);
  return normalized.length > 0 ? normalized : null;
}

function scrubToolPartsFromMessages(
  messages: ThreadMessageRecord[],
  toolNames: string[] | null,
): {
  messages: ThreadMessageRecord[];
  updates: Array<Partial<ThreadMessageRecord> & { id: string }>;
} {
  const updates: Array<Partial<ThreadMessageRecord> & { id: string }> = [];
  const nextMessages = messages.map((message) => {
    const scrubbedContent = scrubToolPartsFromContent(message.content, toolNames);
    if (!scrubbedContent.changed) {
      return message;
    }

    const updated: ThreadMessageRecord = {
      ...message,
      content: scrubbedContent.content,
    };
    updates.push({ id: message.id, content: scrubbedContent.content });
    return updated;
  });

  return { messages: nextMessages, updates };
}

function scrubToolPartsFromContent(
  content: unknown,
  toolNames: string[] | null,
): { content: unknown; changed: boolean } {
  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    return { content, changed: false };
  }

  const record = content as Record<string, unknown>;
  if (!Array.isArray(record.parts)) {
    return { content, changed: false };
  }

  const nextParts: unknown[] = [];
  let removed = 0;
  for (const part of record.parts) {
    if (isScrubTargetToolPart(part, toolNames)) {
      removed += 1;
      continue;
    }
    nextParts.push(part);
  }

  if (removed === 0) {
    return { content, changed: false };
  }

  if (nextParts.length === 0) {
    nextParts.push({ type: 'text', text: '(tool output removed)' });
  }

  const textParts = nextParts
    .map((part) => {
      if (!part || typeof part !== 'object') {
        return '';
      }
      const typed = part as Record<string, unknown>;
      return typed.type === 'text' && typeof typed.text === 'string' ? typed.text : '';
    })
    .filter(Boolean);

  return {
    changed: true,
    content: {
      ...record,
      parts: nextParts,
      // Avoid leaving a stale full HTML/JSON string that duplicated tool payloads.
      content: textParts.length > 0 ? textParts.join('\n') : '(tool output removed)',
    },
  };
}

function isScrubTargetToolPart(part: unknown, toolNames: string[] | null): boolean {
  if (!part || typeof part !== 'object') {
    return false;
  }

  const record = part as Record<string, unknown>;
  const type = typeof record.type === 'string' ? record.type : '';

  if (type === 'tool-call' || type === 'tool-result') {
    return matchesToolName(typeof record.toolName === 'string' ? record.toolName : '', toolNames);
  }

  if (type === 'tool-invocation' && record.toolInvocation && typeof record.toolInvocation === 'object') {
    const invocation = record.toolInvocation as Record<string, unknown>;
    return matchesToolName(typeof invocation.toolName === 'string' ? invocation.toolName : '', toolNames);
  }

  return false;
}

function matchesToolName(toolName: string, toolNames: string[] | null): boolean {
  if (!toolName) {
    // Unknown tool part shape — only scrub when scrubbing all tools.
    return toolNames === null;
  }
  if (toolNames === null) {
    return true;
  }
  return toolNames.includes(toolName);
}

function sortMessagesByCreatedAt(messages: ThreadMessageRecord[]): ThreadMessageRecord[] {
  return [...messages].sort((left, right) => {
    const leftTime = toTimestamp(left.createdAt);
    const rightTime = toTimestamp(right.createdAt);
    if (leftTime !== rightTime) {
      return leftTime - rightTime;
    }
    return String(left.id).localeCompare(String(right.id));
  });
}

function toTimestamp(value: Date | string | undefined): number {
  if (!value) {
    return 0;
  }
  const time = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
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
