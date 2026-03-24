import { resolve } from 'node:path';
import type { Logger } from 'winston';
import { Workspace, LocalFilesystem } from '@mastra/core/workspace';
import { MASTRA_THREAD_ID_KEY } from '@mastra/core/request-context';
import * as hasha from 'hasha';
import { environment } from '../../environments/environment';
import { AdspRequestContext } from '../types';
import { ManagedWorkspace } from './managedWorkspace';

export interface AgentWorkspaceConfiguration {
  enabled: boolean;
}

type WorkspaceProvider = 'agentfs' | 'local';

interface WorkspaceContext {
  tenantId: string;
  userId: string;
  threadId: string;
  workspaceKey: string;
}

function getWorkspaceProviderSetting(): string {
  return process.env.AGENT_WORKSPACE_PROVIDER ?? environment.AGENT_WORKSPACE_PROVIDER;
}

function getWorkspaceRoot(): string {
  return process.env.AGENT_WORKSPACE_ROOT ?? environment.AGENT_WORKSPACE_ROOT;
}

function getWorkspaceProvider(): WorkspaceProvider {
  const provider = getWorkspaceProviderSetting().trim().toLowerCase();

  if (provider !== 'agentfs' && provider !== 'local') {
    throw new Error(`Unsupported AGENT_WORKSPACE_PROVIDER '${getWorkspaceProviderSetting()}'.`);
  }

  return provider;
}

function encodePathSegment(value: string): string {
  return encodeURIComponent(value);
}

function getWorkspaceContext(requestContext: AdspRequestContext): WorkspaceContext | undefined {
  const tenantValue = requestContext.get('tenantId');
  const userId = requestContext.get('user')?.id;
  const threadId = requestContext.get(MASTRA_THREAD_ID_KEY);

  const tenantId = tenantValue?.toString();

  if (!tenantId || !userId || !threadId) {
    return undefined;
  }

  const workspaceKey = `${tenantId}:${userId}:${threadId}`;

  return { tenantId, userId, threadId, workspaceKey };
}

function hashWorkspaceKey(workspaceKey: string): string {
  return hasha(workspaceKey, { algorithm: 'sha256' }).slice(0, 24);
}

function getWorkspaceId(workspaceContext: WorkspaceContext): string {
  const workspaceHash = hashWorkspaceKey(workspaceContext.workspaceKey);
  return `workspace-${workspaceHash}`;
}

async function createAgentFsFilesystem(workspaceId: string, workspaceRoot: string) {
  // Lazily require optional dependency only when agentfs provider is used.
  const { AgentFSFilesystem } = await import('@mastra/agentfs');

  return new AgentFSFilesystem({
    agentId: workspaceId,
    path: resolve(workspaceRoot, 'workspaces.db'),
  });
}

async function createFilesystem(workspaceId: string, provider: WorkspaceProvider, workspaceRoot: string) {
  return provider === 'local'
    ? new LocalFilesystem({
        basePath: resolve(workspaceRoot, 'local', encodePathSegment(workspaceId)),
      })
    : createAgentFsFilesystem(workspaceId, workspaceRoot);
}

async function createWorkspace(
  workspaceId: string,
  provider: WorkspaceProvider,
  workspaceRoot: string,
): Promise<Workspace> {
  const filesystem = await createFilesystem(workspaceId, provider, workspaceRoot);
  const workspace = new Workspace({
    id: workspaceId,
    name: workspaceId,
    filesystem,
  });

  await workspace.init();
  return workspace;
}

export function assertWorkspaceEnvironment(): void {
  const provider = getWorkspaceProvider();
  const workspaceRoot = getWorkspaceRoot();

  if (!workspaceRoot.trim()) {
    throw new Error('AGENT_WORKSPACE_ROOT must not be empty.');
  }

  if (provider === 'local' && process.env.NODE_ENV !== 'development') {
    throw new Error('AGENT_WORKSPACE_PROVIDER=local is only supported when NODE_ENV=development.');
  }
}

export function createWorkspaceResolver(logger: Logger, agentId: string) {
  return async ({
    requestContext,
    mastra: _mastra,
  }: {
    requestContext: AdspRequestContext;
    mastra?: unknown;
  }): Promise<Workspace | undefined> => {
    const workspaceContext = getWorkspaceContext(requestContext);
    if (!workspaceContext) {
      logger.debug(`Skipping workspace resolution for agent ${agentId}; request context is incomplete.`, {
        context: 'AgentWorkspace',
      });
      return undefined;
    }

    const workspaceId = getWorkspaceId(workspaceContext);
    const provider = getWorkspaceProvider();
    const workspaceRoot = getWorkspaceRoot();
    const workspace = await createWorkspace(workspaceId, provider, workspaceRoot);

    logger.debug(`Resolved ${provider} workspace ${workspaceId} for agent ${agentId}.`, {
      context: 'AgentWorkspace',
      provider,
      agentId,
      workspaceId,
      tenantId: workspaceContext.tenantId,
      userId: workspaceContext.userId,
      threadId: workspaceContext.threadId,
    });

    return workspace;
  };
}

export async function clearThreadWorkspace(
  logger: Logger,
  {
    tenantId,
    userId,
    threadId,
  }: {
    tenantId: string;
    userId: string;
    threadId: string;
  },
): Promise<void> {
  const workspaceContext: WorkspaceContext = {
    tenantId,
    userId,
    threadId,
    workspaceKey: `${tenantId}:${userId}:${threadId}`,
  };

  const provider = getWorkspaceProvider();
  const workspaceRoot = getWorkspaceRoot();
  const workspaceId = getWorkspaceId(workspaceContext);
  const workspace = await createWorkspace(workspaceId, provider, workspaceRoot);

  try {
    await ManagedWorkspace.from(workspace).clear();
  } finally {
    await workspace.destroy();
  }

  logger.debug(`Cleared ${provider} workspace ${workspaceId}.`, {
    context: 'AgentWorkspace',
    provider,
    workspaceId,
    tenantId,
    userId,
    threadId,
  });
}

export * from './managedWorkspace';
