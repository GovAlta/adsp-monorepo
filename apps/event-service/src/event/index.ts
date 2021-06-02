import * as fs from 'fs';
import { Application } from 'express';
import { Logger } from 'winston';
import { createEventRouter } from './router';
import { DomainEventService, ValidationService } from './service';

export type { DomainEvent, EventDefinition, Namespace } from './types';
export type {
  DomainEventService,
  DomainEventSubscriberService,
  DomainEventWorkItem,
  ValidationService,
} from './service';

export { EventServiceRoles } from './role';

interface EventMiddlewareProps {
  logger: Logger;
  eventService: DomainEventService;
  validationService: ValidationService;
}

export const applyEventMiddleware = (app: Application, props: EventMiddlewareProps): Application => {
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

  return app;
};
