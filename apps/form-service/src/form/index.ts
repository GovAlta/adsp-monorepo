// clean-code-ignore: RULE-19 — barrel and middleware wiring; the routers and jobs it assembles are covered by their own specs.
import {
  AdspId,
  AuditService,
  EventService,
  ServiceDirectory,
  TenantService,
  TokenProvider,
  adspId,
} from '@abgov/adsp-service-sdk';
import { Application } from 'express';
import { Logger } from 'winston';
import { FileService } from '../file';
import { NotificationService } from '../notification';
import { DataRegisterClient } from './dataRegisterClient';
import { scheduleFormJobs } from './jobs';
import { FormSubmissionRepository, Repositories } from './repository';
import { createFormRouter, createFormDefinitionRouter, createRegisterRouter } from './router';
import { QueueTaskService } from '../task';
import { CommentService } from './comment';
import { PdfService } from './pdf';
import { CalendarService } from './calendar';

export * from './roles';
export * from './audit';
export * from './comment';
export * from './configuration';
export * from './model';
export * from './types';
export * from './repository';
export * from './events';
export * from './notifications';
export * from './pdf';
export * from './calendar';
export * from './jobs/messageNotification';

interface FormMiddlewareProps extends Repositories {
  serviceId: AdspId;
  logger: Logger;
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
  eventService: EventService;
  auditService: AuditService;
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
    auditService,
    tenantService,
    notificationService,
    fileService,
    commentService,
    queueTaskService,
    formSubmissionRepository: submissionRepository,
    formRegistrationRepository,
    pdfService,
    calendarService,
  }: FormMiddlewareProps,
): Application => {
  const apiId = adspId`${serviceId}:v1`;
  scheduleFormJobs({ apiId, logger, repository, eventService, auditService, fileService, notificationService });

  const definitionRouter = createFormDefinitionRouter({
    directory,
    tokenProvider,
    tenantService,
    calendarService,
    logger,
    registrationRepository: formRegistrationRepository,
    eventService,
    auditService,
  });
  app.use('/form/v1', definitionRouter);

  const router = createFormRouter({
    apiId,
    logger,
    repository,
    directory,
    tokenProvider,
    eventService,
    auditService,
    queueTaskService,
    notificationService,
    fileService,
    commentService,
    submissionRepository,
    pdfService,
  });
  app.use('/form/v1', router);

  const registerRouter = createRegisterRouter({
    client: new DataRegisterClient(directory, tokenProvider),
    logger,
    auditService,
  });
  app.use('/form/v1', registerRouter);

  return app;
};
