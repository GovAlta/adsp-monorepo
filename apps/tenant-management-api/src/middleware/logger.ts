import type { RequestHandler } from 'express';
import { createLogger } from '@core-services/core-common';
import { environment } from '../environments/environment';

export const WinstonLogger: RequestHandler = (req, _res, next): void => {
  // TODO: add api or http request logger here
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (req as any).logger = createLogger('tenant-management-api', environment.LOG_LEVEL || 'debug');

  next();
};

export const logger = createLogger('tenant-management-api', environment.LOG_LEVEL || 'debug');

export const loggerApi: RequestHandler = (req, _resp, _next): void => {
  logger.info(`${req.method}  ${req.path}`);
};
