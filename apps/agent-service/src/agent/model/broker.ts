import { isAllowedUser, UnauthorizedUserError, AdspId, type User } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import type { Agent, AgentExecutionOptions, ToolsInput } from '@mastra/core/agent';
import type { CoreUserMessage } from '@mastra/core/llm';
import { MASTRA_RESOURCE_ID_KEY, MASTRA_THREAD_ID_KEY, RequestContext } from '@mastra/core/request-context';
import { Logger } from 'winston';
import * as fs from 'fs';
import * as path from 'path';
import { environment } from '../../environments/environment';
import type { IFileServiceClient } from '../clients';
import { AgentConfiguration } from '../configuration';
import { BrokerInputProcessor } from '../types';
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

    const workspace = await this.getManagedWorkspace(user, threadId);

    const tarballId = AdspId.parse(tarballUrn);
    const { stream, metadata } = await this.fileServiceClient.getFileStream(this.tenantId, tarballId);
    const compressed = isCompressedTarball(metadata?.filename, metadata?.mimeType);
    const revision = await workspace.initializeFromTarball(stream, compressed);

    this.logger.info(`Workspace initialized for thread ${threadId} from tarball ${tarballUrn}.`, {
      context: 'AgentBroker',
      tenant: this.tenantId?.toString(),
    });

    return revision;
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

  // DEBUG: Write token size diagnostics to a file for investigating token limit errors
  private async writeTokenDebug(threadId: string, input: CoreUserMessage | CoreUserMessage[]): Promise<void> {
    try {
      const debugDir = path.resolve('agent-debug');
      fs.mkdirSync(debugDir, { recursive: true });
      const debugPath = path.join(debugDir, `token-debug-${threadId}.log`);

      const lines: string[] = [];
      lines.push(`\n${'='.repeat(80)}`);
      lines.push(`[${new Date().toISOString()}] Token Debug for thread: ${threadId}`);
      lines.push(`Agent: ${this.agent.name}`);

      // 1. Measure user input (current message)
      const messages = Array.isArray(input) ? input : [input];
      let totalInputChars = 0;
      for (const msg of messages) {
        if (typeof msg.content === 'string') {
          totalInputChars += msg.content.length;
          lines.push(
            `  User message (string): ${msg.content.length} chars (~${Math.round(msg.content.length / 4)} tokens)`,
          );
        } else if (Array.isArray(msg.content)) {
          for (const part of msg.content) {
            if (part.type === 'text') {
              totalInputChars += part.text.length;
              lines.push(
                `  User part [text]: ${part.text.length} chars (~${Math.round(part.text.length / 4)} tokens) — preview: "${part.text.substring(0, 100)}..."`,
              );
            } else if (part.type === 'image') {
              const imgData = typeof part.image === 'string' ? part.image : '[binary]';
              const imgLen = imgData.length;
              totalInputChars += imgLen;
              lines.push(
                `  User part [image]: ${imgLen} chars (~${Math.round(imgLen / 4)} tokens) — mediaType: ${(part as any).mediaType || 'unknown'}`,
              );
              if (typeof part.image === 'string' && part.image.startsWith('data:')) {
                const base64Start = part.image.indexOf(',');
                if (base64Start > 0) {
                  const base64Len = part.image.length - base64Start - 1;
                  const rawBytes = Math.round((base64Len * 3) / 4);
                  lines.push(
                    `    Base64 payload: ${base64Len} chars, decoded ~${rawBytes} bytes (~${Math.round(rawBytes / 1024)} KB)`,
                  );
                }
              }
            } else if (part.type === 'file') {
              const fileData = typeof part.data === 'string' ? part.data : '[binary]';
              const fileLen = fileData.length;
              totalInputChars += fileLen;
              lines.push(
                `  User part [file]: ${fileLen} chars (~${Math.round(fileLen / 4)} tokens) — filename: ${(part as any).filename || 'unknown'}, mediaType: ${(part as any).mediaType || 'unknown'}`,
              );
            }
          }
        }
      }
      lines.push(`  TOTAL current input: ${totalInputChars} chars (~${Math.round(totalInputChars / 4)} tokens)`);

      // 2. Measure system instructions
      try {
        // Access agent instructions - may be a string or function
        const agentAny = this.agent as any;
        let instructionsText = '';
        if (typeof agentAny.instructions === 'string') {
          instructionsText = agentAny.instructions;
        } else if (typeof agentAny.instructions === 'function') {
          instructionsText = '[dynamic function — measured at call time]';
        }
        // Check config-level instructions
        if (agentAny.config?.instructions) {
          if (typeof agentAny.config.instructions === 'string') {
            instructionsText = agentAny.config.instructions;
          }
        }
        // Also check _instructions or other internal fields
        for (const field of ['_instructions', '__instructions', 'systemPrompt', '_systemPrompt']) {
          if (typeof agentAny[field] === 'string' && agentAny[field].length > instructionsText.length) {
            instructionsText = agentAny[field];
          }
        }
        lines.push(
          `  System instructions: ${instructionsText.length} chars (~${Math.round(instructionsText.length / 4)} tokens)`,
        );

        // Log all enumerable keys on agent for debugging
        const agentKeys = Object.keys(agentAny).filter(
          (k) => typeof agentAny[k] === 'string' || typeof agentAny[k] === 'number' || typeof agentAny[k] === 'boolean',
        );
        lines.push(`  Agent scalar keys: ${JSON.stringify(agentKeys)}`);

        // Try to count tool definitions
        if (agentAny.tools) {
          const toolNames = Object.keys(agentAny.tools);
          let toolDefChars = 0;
          for (const toolName of toolNames) {
            const toolDef = JSON.stringify(agentAny.tools[toolName] || '');
            toolDefChars += toolDef.length;
          }
          lines.push(
            `  Tools: ${toolNames.length} tools, total definition: ${toolDefChars} chars (~${Math.round(toolDefChars / 4)} tokens)`,
          );
          lines.push(`  Tool names: ${toolNames.join(', ')}`);
        }
      } catch (instrErr) {
        lines.push(
          `  Instructions measurement error: ${instrErr instanceof Error ? instrErr.message : String(instrErr)}`,
        );
      }

      // 3. Measure conversation history from memory
      try {
        if (this.agent.getMemory) {
          const memory = await this.agent.getMemory();
          if (memory && typeof memory.recall === 'function') {
            const recalled = await memory.recall({ threadId });
            const historyMessages = recalled?.messages || [];
            let totalHistoryChars = 0;
            lines.push(`  Thread history: ${historyMessages.length} messages`);
            for (const hMsg of historyMessages) {
              const msgStr = JSON.stringify(hMsg.content || '');
              totalHistoryChars += msgStr.length;
              const role = hMsg.role || 'unknown';
              const preview = msgStr.substring(0, 120).replace(/\n/g, '\\n');
              lines.push(`    [${role}] ${msgStr.length} chars — ${preview}...`);
            }
            lines.push(`  TOTAL history: ${totalHistoryChars} chars (~${Math.round(totalHistoryChars / 4)} tokens)`);
            lines.push(
              `  COMBINED (input + history): ${totalInputChars + totalHistoryChars} chars (~${Math.round((totalInputChars + totalHistoryChars) / 4)} tokens)`,
            );
          } else {
            lines.push(`  Memory: no recall method available`);
          }
        } else {
          lines.push(`  Memory: not configured`);
        }
      } catch (memErr) {
        lines.push(`  Memory recall error: ${memErr instanceof Error ? memErr.message : String(memErr)}`);
      }

      fs.appendFileSync(debugPath, lines.join('\n') + '\n', 'utf-8');
      this.logger.info(`Token debug written to ${debugPath}`, { context: 'AgentBroker' });
    } catch (err) {
      // Don't let debug logging break the flow
      this.logger.warn(`Failed to write token debug: ${err instanceof Error ? err.message : String(err)}`, {
        context: 'AgentBroker',
      });
    }
  }

  public async stream(
    user: User,
    threadId: string,
    input: CoreUserMessage | CoreUserMessage[],
    context: Record<string, unknown> = {},
  ) {
    const requestContext = await this.prepareAgentRequest(user, threadId, input, context);

    // DEBUG: Log token sizes before sending to LLM
    await this.writeTokenDebug(threadId, input);

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
