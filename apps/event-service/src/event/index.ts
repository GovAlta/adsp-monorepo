import type { Application } from 'express';
import { createEventRouter } from './router';
import type { DomainEventService } from './service';
import { createJobs, JobProps } from './job';

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
  { serviceId, logger, eventService, directory, tokenProvider, configurationService }: EventMiddlewareProps
): Application => {
  const eventRouter = createEventRouter({ eventService, logger });

  app.use('/event/v1', eventRouter);

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
