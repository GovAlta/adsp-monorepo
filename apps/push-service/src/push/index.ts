import { Application } from 'express';
import { Instance as WsApplication } from 'express-ws';
import * as fs from 'fs';
import { Logger } from 'winston';
import { DomainEventSubscriberService } from '@core-services/core-common';
import { createStreamRouter } from './router';

export * from './types';
export * from './model';

interface PushMiddlewareProps {
  logger: Logger;
  eventService: DomainEventSubscriberService;
}

export const applyPushMiddleware = (app: Application, ws: WsApplication, props: PushMiddlewareProps): Application => {
  const streamRouter = createStreamRouter(ws, props);
  app.use('/stream/v1', streamRouter);

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
