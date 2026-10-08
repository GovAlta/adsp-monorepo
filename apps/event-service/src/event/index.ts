import { AjvValidationService, ConfigurationClient } from '@core-services/core-common';
import type { Application } from 'express';
import { createDefinitionRouter, createEventRouter } from './router';
import type { EventConfiguration } from './router';
import type { DomainEventService } from './service';
import { createJobs, JobProps } from './job';
import { ValueServiceEventLogRepository } from './repository';

export { configurationSchema } from './configuration';
export type { EventDefinition, Namespace } from './types';
export { NamespaceEntity } from './model';
export type { DomainEventService } from './service';
export { EventServiceRoles } from './role';

interface EventMiddlewareProps extends Omit<JobProps, 'events'> {
  eventService: DomainEventService;
}

export const applyEventMiddleware = (
  app: Application,
  { serviceId, logger, eventService, directory, tokenProvider, configurationService }: EventMiddlewareProps,
): Application => {
  const eventLogRepository = new ValueServiceEventLogRepository(directory, tokenProvider);
  const eventRouter = createEventRouter({ eventService, logger, eventLogRepository });
  const definitionRouter = createDefinitionRouter({
    client: new ConfigurationClient<EventConfiguration>(directory, tokenProvider, 'platform', 'event-service'),
    validationService: new AjvValidationService(logger),
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
