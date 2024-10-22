import { ConfigurationService } from '@abgov/adsp-service-sdk';
import { DomainEvent, WorkQueueService } from '@core-services/core-common';
import { Logger } from 'winston';
import { createInvalidateJob } from './invalidate';

interface CacheJobProps {
  logger: Logger;
  configurationService: ConfigurationService;
  queueService: WorkQueueService<DomainEvent>;
}

export function createCacheJobs({ logger, configurationService, queueService }: CacheJobProps) {
  const invalidateJob = createInvalidateJob({ logger, configurationService });

  queueService.getItems().subscribe(({ item, done }) => {
    try {
      logger.debug(`Processing event '${item.namespace}:${item.name}'...`, {
        context: 'CacheJobs',
        tenant: item.tenantId?.toString(),
      });

      invalidateJob(item);

      // Default done call to Ack events not matching any job.
      logger.debug(`Processed event '${item.namespace}:${item.name}'.`, {
        context: 'CacheJobs',
        tenant: item.tenantId?.toString(),
      });
      done();
    } catch (err) {
      done(err);

      logger.warn(`Error encountered processing event '${item.namespace}:${item.name}' ${err}`, {
        context: 'CacheJobs',
        tenant: item.tenantId?.toString(),
      });
    }
  });
}
