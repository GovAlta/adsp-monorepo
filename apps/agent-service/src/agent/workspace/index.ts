import { resolve } from 'node:path';
import type { Logger } from 'winston';
import { Workspace, LocalFilesystem } from '@mastra/core/workspace';
import type { RequestContext } from '@mastra/core/request-context';
import type { AdspId } from '@abgov/adsp-service-sdk';
import hasha = require('hasha');
import { environment } from '../../environments/environment';

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

function getWorkspaceContext(
  requestContext: RequestContext<any>,
): WorkspaceContext | undefined {
  const tenantValue = requestContext.get('tenantId') as AdspId | string | undefined;
  const userId = requestContext.get('userId') as string | undefined;
  const threadId = requestContext.get('threadId') as string | undefined;

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

async function createAgentFsFilesystem(workspaceId: string, workspaceRoot: string) {
  const { AgentFSFilesystem } = await import('@mastra/agentfs');

  return new AgentFSFilesystem({
    agentId: workspaceId,
    path: resolve(workspaceRoot, 'workspaces.db'),
  });
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
    requestContext: RequestContext<any>;
    mastra?: unknown;
  }): Promise<Workspace | undefined> => {
    const workspaceContext = getWorkspaceContext(requestContext);
    if (!workspaceContext) {
      logger.debug(`Skipping workspace resolution for agent ${agentId}; request context is incomplete.`, {
        context: 'AgentWorkspace',
      });
      return undefined;
    }

    const workspaceHash = hashWorkspaceKey(workspaceContext.workspaceKey);
    const workspaceId = `workspace-${workspaceHash}`;
    const provider = getWorkspaceProvider();
    const workspaceRoot = getWorkspaceRoot();

    const filesystem =
      provider === 'local'
        ? new LocalFilesystem({
            basePath: resolve(
              workspaceRoot,
              'local',
              encodePathSegment(workspaceId),
            ),
          })
        : await createAgentFsFilesystem(workspaceId, workspaceRoot);

    const workspace = new Workspace({
      id: workspaceId,
      name: workspaceId,
      filesystem,
    });

    await workspace.init();

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