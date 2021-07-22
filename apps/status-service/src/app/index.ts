import * as fs from 'fs';
import { Application, RequestHandler } from 'express';
import { Logger } from 'winston';
import { Repositories } from './repository';
import { createServiceStatusRouter } from './router/serviceStatus';
import { createPublicServiceStatusRouter } from './router/publicServiceStatus';
import { createNoticeRouter } from './router/notice';

export * from './model';
export * from './repository';
export * from './types';

interface HealthMiddlewareProps extends Repositories {
  logger: Logger;
  authenticate: RequestHandler;
}

export const bindEndpoints = (app: Application, props: HealthMiddlewareProps): void => {
  // bind all service endpoints
  app.use('/status/v1', props.authenticate, createServiceStatusRouter(props));
  app.use('/public_status/v1', createPublicServiceStatusRouter(props));
  app.use('/notices/v1', props.authenticate, createNoticeRouter(props));

  // api docs
  let swagger = null;
  app.use('/swagger/docs/v1', (req, res) => {
    if (swagger) {
      res.json(swagger);
      return;
    }

    fs.readFile(`${__dirname}/swagger.json`, 'utf8', (err, data) => {
      if (err) {
        res.sendStatus(404);
        return;
      }
      swagger = JSON.parse(data);
      res.json(swagger);
    });
  });
};
