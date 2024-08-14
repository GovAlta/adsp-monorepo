import { AdspId, ConfigurationService } from '@abgov/adsp-service-sdk';
import { DomainEvent, WorkQueueService } from '@core-services/core-common';
import { Logger } from 'winston';
import { createResolveJob } from './resolve';
import { TAG_OPERATION_TAG } from '../router/types';
import { createDeleteJob } from './delete';

interface DirectoryJobProps {
  serviceId: AdspId;
  logger: Logger;
  configurationService: ConfigurationService;
  queueService: WorkQueueService<DomainEvent>;
}

export function createDirectoryJobs({ serviceId, logger, configurationService, queueService }: DirectoryJobProps) {
  const resolveJob = createResolveJob({ logger, configurationService });
  const deleteJob = createDeleteJob({ logger, configurationService });

  queueService.getItems().subscribe(({ item, done }) => {
    try {
      logger.debug(`Processing event '${item.namespace}:${item.name}'...`, {
        context: 'DirectoryJobs',
        tenant: item.tenantId?.toString(),
      });

      if (item.namespace === serviceId.service) {
        if (item.name === TAG_OPERATION_TAG) {
          const { urn, isNew } = item.payload.resource as { urn: string; isNew: boolean };
          if (urn && isNew) {
            const resourceId = AdspId.parse(urn);
            resolveJob(item.tenantId, resourceId, done);
          }
        } else {
          done();
        }
      } else {
        deleteJob(item, done);
      }
    } catch (err) {
      done(err);

      logger.warn(`Error encountered processing event '${item.namespace}:${item.name}' ${err}`, {
        context: 'DirectoryJobs',
        tenant: item.tenantId?.toString(),
      });
    }
  });
}
