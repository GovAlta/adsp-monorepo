import { AdspId, EventService } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import { threadDeleted } from '../events';

export interface ThreadDeletionTarget {
  tenantId: string;
  userId: string;
  threadId: string;
}

export interface ThreadDeletionProps {
  logger: Logger;
  deleteThread: (threadId: string) => Promise<void>;
  clearWorkspace: (tenantId: string, userId: string, threadId: string) => Promise<void>;
  eventService?: EventService;
}

export function toTenantAdspId(tenantContext: string): AdspId {
  if (tenantContext.startsWith('urn:')) {
    return AdspId.parse(tenantContext);
  }

  return AdspId.parse(`urn:ads:platform:tenant-service:v2:/tenants/${tenantContext}`);
}

/**
 * Deletes a conversation thread: its workspace, then its stored messages and observations, then signals
 * thread-deleted. Used both when a thread expires and when the user discards it to start a new chat.
 * A failure to signal the event is logged rather than thrown, since the thread is already gone.
 */
export async function deleteThreadAndWorkspace(
  { logger, deleteThread, clearWorkspace, eventService }: ThreadDeletionProps,
  { tenantId, userId, threadId }: ThreadDeletionTarget,
): Promise<void> {
  await clearWorkspace(tenantId, userId, threadId);
  await deleteThread(threadId);

  try {
    eventService?.send(threadDeleted(toTenantAdspId(tenantId), threadId));
  } catch (err) {
    logger.warn(`Failed to signal thread-deleted event for thread ${threadId}.`, {
      context: 'AgentThreadDeletion',
      tenant: tenantId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
