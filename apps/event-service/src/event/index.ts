import * as fs from 'fs';
import { Application } from 'express';
import { Logger } from 'winston';
import { DomainEventService } from '@core-services/core-common';
import { Repositories } from './repository';
import { createAdministrationRouter, createEventRouter, createNamespaceRouter } from './router';
import { createJobs, JobProps } from './job';

export * from './model';
export * from './repository';
export * from './types';

interface EventMiddlewareProps extends JobProps, Repositories {
  logger: Logger
  eventService: DomainEventService
}

export const applyEventMiddleware = (
  app: Application, 
  props: EventMiddlewareProps
) => {

  createJobs(props);
  
  const namespaceRouter = createNamespaceRouter(props);
  const adminRouter = createAdministrationRouter(props);
  const eventRouter = createEventRouter(props);

  app.use('/namespace/v1', namespaceRouter);
  app.use('/event-admin/v1', adminRouter);
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
}
