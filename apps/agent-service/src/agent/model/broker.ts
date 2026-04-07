import { isAllowedUser, UnauthorizedUserError, AdspId, type User, EventService } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
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
