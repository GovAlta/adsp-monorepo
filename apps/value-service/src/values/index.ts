import * as fs from 'fs';
import { Application } from 'express';
import { ValuesRepository } from './repository';
import { createValueRouter } from './router';
import { Logger } from 'winston';

export * from './types';
export * from './model';
export * from './repository';

interface ValuesMiddlewareProps {
  logger: Logger;
  repository: ValuesRepository;
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
