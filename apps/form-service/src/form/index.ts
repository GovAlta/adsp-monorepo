import { AdspId, EventService, ServiceDirectory, TenantService, TokenProvider, adspId } from '@abgov/adsp-service-sdk';
import { Application } from 'express';
import { Logger } from 'winston';
import { FileService } from '../file';
import { NotificationService } from '../notification';
import { scheduleFormJobs } from './jobs';
import { FormSubmissionRepository, Repositories } from './repository';
import { createFormRouter } from './router';
import { QueueTaskService } from '../task';
import { CommentService } from './comment';
import { PdfService } from './pdf';
import { CalendarService } from './calendar';

export * from './roles';
export * from './comment';
export * from './configuration';
export * from './model';
export * from './types';
export * from './repository';
export * from './events';
export * from './notifications';
export * from './pdf';
export * from './calendar';

interface FormMiddlewareProps extends Repositories {
  serviceId: AdspId;
  logger: Logger;
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
  eventService: EventService;
  tenantService: TenantService;
  notificationService: NotificationService;
  fileService: FileService;
  commentService: CommentService;
  queueTaskService: QueueTaskService;
  formSubmissionRepository: FormSubmissionRepository;
  pdfService: PdfService;
  calendarService: CalendarService;
}

export const applyFormMiddleware = (
  app: Application,
  {
    serviceId,
    logger,
    formRepository: repository,
    directory,
    tokenProvider,
    eventService,
    tenantService,
    notificationService,
    fileService,
    commentService,
    queueTaskService,
    formSubmissionRepository: submissionRepository,
    pdfService,
    calendarService,
  }: FormMiddlewareProps
): Application => {
  const apiId = adspId`${serviceId}:v1`;
  scheduleFormJobs({ apiId, logger, repository, eventService, fileService, notificationService });

  const router = createFormRouter({
    apiId,
    logger,
    repository,
    directory,
    tokenProvider,
    eventService,
    tenantService,
    queueTaskService,
    notificationService,
    fileService,
    commentService,
    submissionRepository,
    pdfService,
    calendarService,
  });
  app.use('/form/v1', router);

  return app;
};
