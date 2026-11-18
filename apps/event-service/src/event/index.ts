import type { AuditService } from '@abgov/adsp-service-sdk';
import { AjvValidationService, ConfigurationClient } from '@core-services/core-common';
import type { Application } from 'express';
import { createEventDefinitionAuditRecorder } from './audit';
import { createDefinitionRouter, createEventRouter } from './router';
import type { EventConfiguration } from './router';
import type { DomainEventService } from './service';
import { createJobs, JobProps } from './job';

export * from './audit';
export { configurationSchema } from './configuration';
export type { EventDefinition, Namespace } from './types';
export { NamespaceEntity } from './model';
export type { DomainEventService } from './service';
export { EventServiceRoles } from './role';

interface EventMiddlewareProps extends Omit<JobProps, 'events'> {
  eventService: DomainEventService;
  auditService: AuditService;
}

export const applyEventMiddleware = (
  app: Application,
  {
    serviceId,
    logger,
    eventService,
    directory,
    tokenProvider,
    configurationService,
    auditService,
  }: EventMiddlewareProps,
): Application => {
  const eventRouter = createEventRouter({ eventService, logger, directory, tokenProvider });
  const definitionRouter = createDefinitionRouter({
    client: new ConfigurationClient<EventConfiguration>(directory, tokenProvider, 'platform', 'event-service'),
    validationService: new AjvValidationService(logger),
    recordAudit: createEventDefinitionAuditRecorder(auditService, logger),
  });

  app.use('/event/v1', eventRouter);
  app.use('/event/v1', definitionRouter);

  createJobs({
    serviceId,
    logger,
    directory,
    tokenProvider,
    configurationService,
    events: eventService.getItems(),
  });

  return app;
};
