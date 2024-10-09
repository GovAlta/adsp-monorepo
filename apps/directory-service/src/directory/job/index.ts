import { AdspId, ConfigurationService, EventService } from '@abgov/adsp-service-sdk';
import { DomainEvent, WorkQueueService } from '@core-services/core-common';
import { Logger } from 'winston';
import { TAGGED_RESOURCE } from '../events';
import { createDeleteJob } from './delete';
import { createResolveJob } from './resolve';

interface DirectoryJobProps {
  serviceId: AdspId;
  logger: Logger;
  configurationService: ConfigurationService;
  eventService: EventService;
  queueService: WorkQueueService<DomainEvent>;
}

export function createDirectoryJobs({
  serviceId,
  logger,
  configurationService,
  eventService,
  queueService,
}: DirectoryJobProps) {
  const resolveJob = createResolveJob({ logger, configurationService, eventService });
  const deleteJob = createDeleteJob({ logger, configurationService });

  queueService.getItems().subscribe(({ item, retryOnError, done }) => {
    try {
      logger.debug(`Processing event '${item.namespace}:${item.name}'...`, {
        context: 'DirectoryJobs',
        tenant: item.tenantId?.toString(),
      });

      if (item.namespace === serviceId.service) {
        if (item.name === TAGGED_RESOURCE) {
          const { urn, isNew } = item.payload.resource as { urn: string; isNew: boolean };
          if (urn && isNew) {
            const resourceId = AdspId.parse(urn);
            resolveJob(item.tenantId, resourceId, retryOnError, done);
            return;
          }
        }
      } else {
        deleteJob(item, done);
        return;
      }

      // Default done call to Ack events not matching any job.
      logger.debug(`Processed event '${item.namespace}:${item.name}' with no associated job.`, {
        context: 'DirectoryJobs',
        tenant: item.tenantId?.toString(),
      });
      done();
    } catch (err) {
      done(err);

      logger.warn(`Error encountered processing event '${item.namespace}:${item.name}' ${err}`, {
        context: 'DirectoryJobs',
        tenant: item.tenantId?.toString(),
      });
    }
  });
}
