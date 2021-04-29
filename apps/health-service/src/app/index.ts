import * as fs from 'fs';
import { Application } from 'express';
import { Logger } from 'winston';
import { Repositories } from './repository';
import { createServiceStatusRouter } from './router/serviceStatus';

export * from './model';
export * from './repository';
export * from './types';

interface HealthMiddlewareProps extends Repositories {
  logger: Logger;
}

export const applyMiddleware = (app: Application, props: HealthMiddlewareProps) => {
  const serviceStatusRouter = createServiceStatusRouter(props);

  app.use('/health/v1', serviceStatusRouter);

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
};
