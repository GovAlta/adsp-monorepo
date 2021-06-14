import * as fs from 'fs';
import { Application } from 'express';
import { Logger } from 'winston';
import { EventService } from '@abgov/adsp-service-sdk';
import { ValuesRepository } from './repository';
import { createValueRouter } from './router';

export * from './types';
export * from './model';
export * from './repository';
export * from './events';

interface ValuesMiddlewareProps {
  logger: Logger;
  repository: ValuesRepository;
  eventService: EventService;
}

export const applyValuesMiddleware = (app: Application, props: ValuesMiddlewareProps): Application => {
  const valueRouter = createValueRouter(props);
  app.use('/value/v1/', valueRouter);

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
