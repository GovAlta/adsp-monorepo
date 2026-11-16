import { AuditService } from '@abgov/adsp-service-sdk';
import { Application } from 'express';
import { Logger } from 'winston';
import { CodeRepository } from './repository';
import { createVerifyRouter } from './router';
import { createVerifyService } from './service';

export * from './audit';
export * from './types';
export * from './repository';

interface MiddlewareProps {
  logger: Logger;
  repository: CodeRepository;
  auditService: AuditService;
}

export const applyVerifyMiddleware = (app: Application, props: MiddlewareProps): Application => {
  const service = createVerifyService(props);
  const router = createVerifyRouter({ service });
  app.use('/verify/v1', router);

  return app;
};
