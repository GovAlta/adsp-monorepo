import * as fs from 'fs';
import { Application } from 'express';
import { Logger } from 'winston';
import { createEventRouter } from './router';
import { DomainEventSubscriberService } from './service';
import { createJobs, JobProps } from './job';

export type { DomainEvent, EventDefinition, Namespace } from './types';
export { NamespaceEntity } from './model';
export type { DomainEventService, DomainEventSubscriberService, DomainEventWorkItem } from './service';
export { EventServiceRoles } from './role';

interface EventMiddlewareProps extends Omit<JobProps, 'events'> {
  logger: Logger;
  eventService: DomainEventSubscriberService;
}

export const applyEventMiddleware = (
  app: Application,
  { eventService, directory, tokenProvider, ...props }: EventMiddlewareProps
): Application => {
  const eventRouter = createEventRouter(props);

  app.use('/event/v1', eventRouter);

  let swagger = null;
  app.use('/swagger/docs/v1', (req, res) => {
    if (swagger) {
      res.json(swagger);
    } else {
      fs.readFile(`${__dirname}/swagger.json`, 'utf8', (err, data) => {
        if (err) {
          res.sendStatus(404);
        } else {
          swagger = JSON.parse(data);
          res.json(swagger);
        }
      });
    }
  });

  createJobs({
    logger: props.logger,
    directory,
    tokenProvider,
    events: eventService.getEvents(),
  });

  return app;
};
