import { AdspId, EventService } from '@abgov/adsp-service-sdk';
import { Memory } from '@mastra/memory';
import { Logger } from 'winston';
import { threadDeleted } from '../events';

interface ThreadCleanupJobProps {
  logger: Logger;
  tenantId: AdspId;
  memory: Memory;
  clearWorkspace: (tenantId: string, userId: string, threadId: string) => Promise<void>;
  eventService?: EventService;
}

export function createThreadCleanupJob({
  logger,
  tenantId,
  memory,
  clearWorkspace,
  eventService,
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
    let hasMore: boolean;

    do {
      const threads = await memory.listThreads({ page, perPage });
      hasMore = threads.hasMore;

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
        if (!threadTenantId || !thread.resourceId) {
          result.failed++;
          logger.warn(`Cannot cleanup expired thread ${thread.id}; missing tenantId or resourceId.`, {
            context: 'ThreadCleanupJob',
            tenant: tenantId.toString(),
          });
          continue;
        }

        try {
          await clearWorkspace(threadTenantId, thread.resourceId, thread.id);
          await memory.deleteThread(thread.id);
          result.cleaned++;

          // Signal thread-deleted event
          try {
            if (eventService) {
              const threadTenantAdspId = toTenantAdspId(threadTenantId);
              const event = threadDeleted(threadTenantAdspId, thread.id);
              eventService.send(event);
            }
          } catch (err) {
            logger.warn(`Failed to signal thread-deleted event for thread ${thread.id}.`, {
              context: 'ThreadCleanupJob',
              tenant: tenantId.toString(),
              error: err instanceof Error ? err.message : String(err),
            });
          }
        } catch (err) {
          result.failed++;
          logger.warn(`Failed cleanup for expired thread ${thread.id}.`, {
            context: 'ThreadCleanupJob',
            tenant: tenantId.toString(),
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      if (hasMore) {
        page++;
      }
    } while (hasMore);

    return result;
  }
}

function toTenantAdspId(tenantContext: string): AdspId {
  if (tenantContext.startsWith('urn:')) {
    return AdspId.parse(tenantContext);
  }

  return AdspId.parse(`urn:ads:platform:tenant-service:v2:/tenants/${tenantContext}`);
}
