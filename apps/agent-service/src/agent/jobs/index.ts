import { AdspId } from '@abgov/adsp-service-sdk';
import * as schedule from 'node-schedule';
import { Memory } from '@mastra/memory';
import { Logger } from 'winston';
import { createThreadCleanupJob } from './cleanup';

const THREAD_CLEANUP_CRON = '0 * * * *';

interface AgentJobProps {
  logger: Logger;
  tenantId: AdspId;
  memory: Memory;
  clearWorkspace: (tenantId: string, userId: string, threadId: string) => Promise<void>;
}

function getJobName(tenantId: AdspId): string {
  return `agent-thread-cleanup-${encodeURIComponent(tenantId.toString())}`;
}

export function scheduleAgentJobs({ logger, tenantId, memory, clearWorkspace }: AgentJobProps): void {
  const jobName = getJobName(tenantId);
  const existing = schedule.scheduledJobs[jobName];
  if (existing) {
    existing.cancel();
  }

  const cleanupJob = createThreadCleanupJob({ logger, tenantId, memory, clearWorkspace });
  schedule.scheduleJob(jobName, THREAD_CLEANUP_CRON, cleanupJob);

  logger.info(`Scheduled thread cleanup job (${THREAD_CLEANUP_CRON}).`, {
    context: 'ThreadCleanupJob',
    tenant: tenantId.toString(),
  });
}
