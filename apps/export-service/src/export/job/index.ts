import { EventService, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import { WorkQueueService } from '@core-services/core-common';
import { FileResult, FileService, JobRepository } from '@core-services/job-common';
import { Logger } from 'winston';
import { ExportServiceWorkItem } from './types';
import { createExportJob } from './export';

export * from './types';

interface ExportJobProps {
  logger: Logger;
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
  eventService: EventService;
  queueService: WorkQueueService<ExportServiceWorkItem>;
  fileService: FileService;
  repository: JobRepository<FileResult>;
}

export function createExportJobs({
  logger,
  directory,
  tokenProvider,
  eventService,
  queueService,
  fileService,
  repository,
}: ExportJobProps) {
  const exportJob = createExportJob({ logger, directory, tokenProvider, eventService, repository, fileService });
  queueService.getItems().subscribe(async ({ item, done }) => {
    try {
      await exportJob(item);

      // Default done call to Ack events not matching any job.
      done();
    } catch (err) {
      done(err);

      logger.warn(`Error encountered processing work item' ${err}`, {
        context: 'ExportJobs',
        tenant: item.tenantId?.toString(),
      });
    }
  });
}
