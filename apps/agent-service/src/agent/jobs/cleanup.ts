import { AdspId } from '@abgov/adsp-service-sdk';
import { Memory } from '@mastra/memory';
import { Logger } from 'winston';

interface ThreadCleanupJobProps {
  logger: Logger;
  tenantId: AdspId;
  memory: Memory;
  clearWorkspace: (tenantId: string, agentId: string, userId: string, threadId: string) => Promise<void>;
}

export function createThreadCleanupJob({
  logger,
  tenantId,
  memory,
  clearWorkspace,
}: ThreadCleanupJobProps) {
  return async (): Promise<void> => {
    try {
      logger.debug('Starting thread cleanup job...', {
        context: 'ThreadCleanupJob',
        tenant: tenantId.toString(),
      });

      const result = await runCleanup();

      logger.info(
        `Completed thread cleanup job. Expired: ${result.expired}, cleaned: ${result.cleaned}, failed: ${result.failed}.`,
        {
          context: 'ThreadCleanupJob',
          tenant: tenantId.toString(),
        },
      );
    } catch (err) {
      logger.error('Error encountered in thread cleanup job.', {
        context: 'ThreadCleanupJob',
        tenant: tenantId.toString(),
        error: err instanceof Error ? err.message : String(err),
      });
    }
  };

  async function runCleanup(): Promise<{ expired: number; cleaned: number; failed: number }> {
    const result = { expired: 0, cleaned: 0, failed: 0 };

    if (!memory?.listThreads || !memory.deleteThread) {
      return result;
    }

    let page = 0;
    const perPage = 100;
    const now = Date.now();

    while (true) {
      const threads = await memory.listThreads({ page, perPage });

      for (const thread of threads.threads || []) {
        const expiresAtRaw = thread.metadata?.expiresAt;
        const expiresAt = typeof expiresAtRaw === 'number' ? expiresAtRaw : Number(expiresAtRaw);
        if (!Number.isFinite(expiresAt) || expiresAt > now) {
          continue;
        }

        result.expired++;
        const threadTenantId =
          typeof thread.metadata?.tenantId === 'string' && thread.metadata.tenantId
            ? thread.metadata.tenantId
            : tenantId?.toString();
        const threadAgentId =
          typeof thread.metadata?.agentId === 'string' && thread.metadata.agentId
            ? thread.metadata.agentId
            : undefined;

        if (!threadTenantId || !thread.resourceId || !threadAgentId) {
          result.failed++;
          logger.warn(`Cannot cleanup expired thread ${thread.id}; missing tenantId, agentId, or resourceId.`, {
            context: 'ThreadCleanupJob',
            tenant: tenantId.toString(),
          });
          continue;
        }

        try {
          await clearWorkspace(threadTenantId, threadAgentId, thread.resourceId, thread.id);
          await memory.deleteThread(thread.id);
          result.cleaned++;
        } catch (err) {
          result.failed++;
          logger.warn(`Failed cleanup for expired thread ${thread.id}.`, {
            context: 'ThreadCleanupJob',
            tenant: tenantId.toString(),
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      if (!threads.hasMore) {
        break;
      }

      page++;
    }

    return result;
  }
}
