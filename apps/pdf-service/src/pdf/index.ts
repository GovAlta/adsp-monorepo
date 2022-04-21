import { AdspId, ConfigurationService, EventService, TokenProvider } from '@abgov/adsp-service-sdk';
import { WorkQueueService } from '@core-services/core-common';
import { Application } from 'express';
import { Logger } from 'winston';
import { createPdfJobs, PdfServiceWorkItem } from './job';
import { PdfJobRepository } from './repository';
import { createPdfRouter } from './router';
import { FileService } from './types';

export * from './configuration';
export * from './events';
export * from './fileTypes';
export * from './roles';
export * from './types';
export * from './job';
export * from './repository';
export * from './model';

interface MiddlewareProps {
  logger: Logger;
  serviceId: AdspId;
  tokenProvider: TokenProvider;
  configurationService: ConfigurationService;
  repository: PdfJobRepository;
  fileService: FileService;
  eventService: EventService;
  queueService: WorkQueueService<PdfServiceWorkItem>;
}

export function applyPdfMiddleware(app: Application, props: MiddlewareProps): Application {
  createPdfJobs(props);

  const router = createPdfRouter(props);
  app.use('/pdf/v1', router);

  return app;
}
