import * as fs from 'fs';
import type { Application } from 'express';
import type { Logger } from 'winston';
import { createEventRouter } from './router';
import type { DomainEventService } from './service';
import { createJobs, JobProps } from './job';

export type { EventDefinition, Namespace } from './types';
export { NamespaceEntity } from './model';
export type { DomainEventService } from './service';
export { EventServiceRoles } from './role';

interface EventMiddlewareProps extends Omit<JobProps, 'events'> {
  logger: Logger;
  eventService: DomainEventService;
}

export const applyEventMiddleware = (
  app: Application,
  { eventService, directory, tokenProvider, logger }: EventMiddlewareProps
): Application => {
  const eventRouter = createEventRouter({ eventService, logger });

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
    logger,
    directory,
    tokenProvider,
    events: eventService.getItems(),
  });

  return app;
};
