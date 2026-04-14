import { AdspId, EventService } from '@abgov/adsp-service-sdk';
import * as schedule from 'node-schedule';
import { Memory } from '@mastra/memory';
import { Logger } from 'winston';
import { createThreadCleanupJob } from './cleanup';
import { environment } from '../../environments/environment';

const THREAD_CLEANUP_CRON = environment.AGENT_THREAD_CLEANUP_CRON;

interface AgentJobProps {
  logger: Logger;
  tenantId: AdspId;
  memory: Memory;
  clearWorkspace: (tenantId: string, userId: string, threadId: string) => Promise<void>;
  eventService?: EventService;
}

function getJobName(tenantId: AdspId): string {
  return `agent-thread-cleanup-${encodeURIComponent(tenantId.toString())}`;
}

export function scheduleAgentJobs({ logger, tenantId, memory, clearWorkspace, eventService }: AgentJobProps): void {
  const jobName = getJobName(tenantId);
  const existing = schedule.scheduledJobs[jobName];
  if (existing) {
    existing.cancel();
  }

  const cleanupJob = createThreadCleanupJob({ logger, tenantId, memory, clearWorkspace, eventService });
  schedule.scheduleJob(jobName, THREAD_CLEANUP_CRON, cleanupJob);

  logger.info(`Scheduled thread cleanup job (${THREAD_CLEANUP_CRON}).`, {
    context: 'ThreadCleanupJob',
    tenant: tenantId.toString(),
  });
}
