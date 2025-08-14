import { AdspId, ConfigurationService, EventService, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import { WorkQueueService } from '@core-services/core-common';
import { FileResult, FileService, JobRepository } from '@core-services/job-common';
import { Application } from 'express';
import { Logger } from 'winston';
import { createPdfJobs, PdfServiceWorkItem } from './job';
import { createPdfRouter } from './router';

export * from './configuration';
export * from './events';
export * from './fileTypes';
export * from './roles';
export * from './types';
export * from './job';
export * from './model';

interface MiddlewareProps {
  isJobPod: boolean;
  logger: Logger;
  serviceId: AdspId;
  tokenProvider: TokenProvider;
  configurationService: ConfigurationService;
  repository: JobRepository<FileResult>;
  fileService: FileService;
  eventService: EventService;
  queueService: WorkQueueService<PdfServiceWorkItem>;
  directory: ServiceDirectory;
}

export function applyPdfMiddleware(app: Application, { isJobPod, ...props }: MiddlewareProps): Application {
  if (isJobPod) {
    createPdfJobs(props);
  }

  const router = createPdfRouter(props);
  app.use('/pdf/v1', router);

  return app;
}
