import { createLogger } from '@core-services/core-common';

export const WinstonLogger = (req, res, next) => {
  // TODO: add api or http request logger here
  req.logger = createLogger(
    'tenant-management-api',
    process.env.LOG_LEVEL || 'info'
  );

  next();
};

export const logger = createLogger(
  'tenant-management-api',
  process.env.LOG_LEVEL || 'info'
);
