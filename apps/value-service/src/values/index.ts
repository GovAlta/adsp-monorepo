import * as fs from 'fs';
import { Application } from 'express';
import { ValuesRepository } from './repository';
import { 
  createNamespaceRouter, 
  createAdministrationRouter,
  createValueRouter
} from './router';

export * from './types';
export * from './model';
export * from './repository';
export * from './validation';

interface ValuesMiddlewareProps {
  valueRepository: ValuesRepository
}

export const applyValuesMiddleware = (
  app: Application, 
  props: ValuesMiddlewareProps
) => {
  const namespaceRouter = createNamespaceRouter(props)
  app.use('/namespace/v1/', namespaceRouter);

  const administrationRouter = createAdministrationRouter(props)
  app.use('/value-admin/v1/', administrationRouter);

  const valueRouter = createValueRouter(props)
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
}
