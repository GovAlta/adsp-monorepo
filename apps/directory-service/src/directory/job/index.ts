import { ConfigurationService } from '@abgov/adsp-service-sdk';
import { WorkQueueService } from '@core-services/core-common';
import { Logger } from 'winston';
import { DirectoryWorkItem } from './types';
import { createResolveJob } from './resolve';

export * from './types';

interface DirectoryJobProps {
  logger: Logger;
  configurationService: ConfigurationService;
  queueService: WorkQueueService<DirectoryWorkItem>;
}

export function createDirectoryJobs({ logger, configurationService, queueService }: DirectoryJobProps) {
  const resolveJob = createResolveJob({ logger, configurationService });

  queueService.getItems().subscribe(({ item, done }) => {
    switch (item.work) {
      case 'resolve':
        resolveJob(item.tenantId, item.urn, done);
        break;
      default:
        logger.debug(`Received unrecognized directory job '${item.work}' for resource ${item.urn}).`, {
          context: 'DirectoryJobs',
          tenant: item.tenantId?.toString(),
        });
        done();
        break;
    }
  });
}
