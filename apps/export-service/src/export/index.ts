import { AdspId, EventService, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import { WorkQueueService } from '@core-services/core-common';
import { FileResult, FileService, JobRepository } from '@core-services/job-common';
import { Application } from 'express';
import { Logger } from 'winston';
import { createExportRouter } from './router';
import { createExportJobs, ExportServiceWorkItem } from './job';

export * from './configuration';
export * from './events';
export * from './fileTypes';
export { ExportServiceWorkItem } from './job';
export * from './roles';

interface MiddlewareProps {
  serviceId: AdspId;
  logger: Logger;
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
  eventService: EventService;
  fileService: FileService;
  repository: JobRepository<FileResult>;
  queueService: WorkQueueService<ExportServiceWorkItem>;
}

export function applyExportMiddleware(
  app: Application,
  { serviceId, logger, directory, tokenProvider, eventService, repository, queueService, fileService }: MiddlewareProps
) {
  const router = createExportRouter({ serviceId, logger, eventService, fileService, repository, queueService });
  app.use('/export/v1', router);

  createExportJobs({ logger, directory, tokenProvider, eventService, queueService, fileService, repository });

  return app;
}
