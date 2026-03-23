import { isAllowedUser, UnauthorizedUserError, AdspId, type User } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import type { Agent, AgentExecutionOptions, ToolsInput } from '@mastra/core/agent';
import type { CoreUserMessage } from '@mastra/core/llm';
import { MASTRA_THREAD_ID_KEY, RequestContext } from '@mastra/core/request-context';
import { Readable } from 'node:stream';
import { Logger } from 'winston';
import { environment } from '../../environments/environment';
import type { IFileServiceClient } from '../clients';
import { AgentConfiguration } from '../configuration';
import { BrokerInputProcessor } from '../types';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const tarStream = require('tar-stream');

export interface WorkspaceFileUpdate {
  path: string;
  content: string;
}

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

type AgentWithOptionalMemory<
  TAgentId extends string = string,
  TTools extends ToolsInput = ToolsInput
> = Agent<TAgentId, TTools> & {
  getMemory?: () => Promise<ThreadMemoryAccessor | undefined>;
};

export class AgentBroker<
  TAgentId extends string = string,
  TTools extends ToolsInput = ToolsInput
> {
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
    private fileServiceClient?: IFileServiceClient
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
          { context: 'AgentBroker', tenant: this.tenantId?.toString() }
        );
      },
      structuredOutput: undefined,
    };

    return options;
  }

  private buildRequestContext(
    user: User,
    threadId: string,
    context: Record<string, unknown> = {}
  ): RequestContext<Record<string, unknown>> {
    const requestContext = new RequestContext<Record<string, unknown>>();

    for (const [key, value] of Object.entries(context || {})) {
      requestContext.set(key, value);
    }

    // Reserve identity fields so client-supplied context cannot override workspace selection.
    requestContext.set('tenantId', this.tenantId);
    requestContext.set('user', user);
    requestContext.set(MASTRA_THREAD_ID_KEY, threadId);

    return requestContext;
  }

  private async prepareAgentRequest(
    user: User,
    threadId: string,
    input: CoreUserMessage | CoreUserMessage[],
    context: Record<string, unknown> = {}
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
      const agentId = this.agent.id;
      const existingThread = await memory.getThreadById?.({ threadId });

      if (!existingThread) {
        await memory.createThread?.({
          threadId,
          resourceId: user.id,
          metadata: { expiresAt, tenantId, agentId },
        });
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

  public async clearThreadWorkspace(tenantId: string, userId: string, threadId: string): Promise<void> {
    const requestContext = new RequestContext<Record<string, unknown>>();
    requestContext.set('tenantId', tenantId);
    requestContext.set('user', { id: userId });
    requestContext.set(MASTRA_THREAD_ID_KEY, threadId);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const workspace = await this.agent.getWorkspace({ requestContext: requestContext as any });
    if (!workspace?.filesystem) {
      return;
    }

    const existing = await workspace.filesystem.readdir('/');
    for (const entry of existing) {
      await workspace.filesystem.deleteFile(entry.name, { recursive: true, force: true });
    }

    await workspace.destroy();
  }


  public async initializeWorkspace(user: User, threadId: string, tarballUrn: string): Promise<void> {
    if (!this.fileServiceClient) {
      throw new InvalidOperationError('File service client is required to initialize workspace.');
    }

    const requestContext = this.buildRequestContext(user, threadId);
    await this.updateThreadExpiry(user, threadId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const workspace = await this.agent.getWorkspace({ requestContext: requestContext as any });
    if (!workspace?.filesystem) {
      throw new InvalidOperationError('Workspace is not enabled for this agent.');
    }

    const tarballId = AdspId.parse(tarballUrn);
    const { data } = await this.fileServiceClient.getFileAndMetadata(this.tenantId, tarballId);

    // Clear all existing files before extracting.
    const existing = await workspace.filesystem.readdir('/');
    for (const entry of existing) {
      await workspace.filesystem.deleteFile(entry.name, { recursive: true, force: true });
    }

    // Extract tar archive into workspace filesystem.
    await new Promise<void>((resolve, reject) => {
      const extract = tarStream.extract();

      extract.on('entry', async (header: { name: string; type: string }, stream: NodeJS.ReadableStream, next: (err?: Error) => void) => {
        try {
          const chunks: Buffer[] = [];
          for await (const chunk of stream as AsyncIterable<Buffer>) {
            chunks.push(chunk);
          }

          if (header.type === 'directory') {
            await workspace.filesystem.mkdir(header.name, { recursive: true });
          } else if (header.type === 'file') {
            await workspace.filesystem.writeFile(header.name, Buffer.concat(chunks), { recursive: true });
          }

          next();
        } catch (err) {
          next(err instanceof Error ? err : new Error(String(err)));
        }
      });

      extract.on('finish', resolve);
      extract.on('error', reject);

      Readable.from(Buffer.from(data)).pipe(extract);
    });

    this.logger.info(`Workspace initialized for thread ${threadId} from tarball ${tarballUrn}.`, {
      context: 'AgentBroker',
      tenant: this.tenantId?.toString(),
    });
  }

  public async updateWorkspace(user: User, threadId: string, files: WorkspaceFileUpdate[]): Promise<void> {
    const requestContext = this.buildRequestContext(user, threadId);
    await this.updateThreadExpiry(user, threadId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const workspace = await this.agent.getWorkspace({ requestContext: requestContext as any });
    if (!workspace?.filesystem) {
      throw new InvalidOperationError('Workspace is not enabled for this agent.');
    }

    for (const { path, content } of files) {
      await workspace.filesystem.writeFile(path, content, { recursive: true });
    }

    this.logger.debug(`Workspace updated for thread ${threadId}: ${files.length} file(s) written.`, {
      context: 'AgentBroker',
      tenant: this.tenantId?.toString(),
    });
  }

  public async stream(
    user: User,
    threadId: string,
    input: CoreUserMessage | CoreUserMessage[],
    context: Record<string, unknown> = {}
  ) {
    const requestContext = await this.prepareAgentRequest(user, threadId, input, context);

    return this.agent.stream(input, this.getExecutionOptions(requestContext, user, threadId));
  }

  public async generate(
    user: User,
    threadId: string,
    input: CoreUserMessage | CoreUserMessage[],
    context: Record<string, unknown> = {}
  ) {
    const requestContext = await this.prepareAgentRequest(user, threadId, input, context);

    return this.agent.generate(input, this.getExecutionOptions(requestContext, user, threadId));
  }
}
