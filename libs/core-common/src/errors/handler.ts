import { UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import { ErrorRequestHandler } from 'express';
import { Logger } from 'winston';
import { InvalidOperationError } from './invalidOperation';
import { NotFoundError } from './notFound';
import { UnauthorizedError } from './unauthorized';

export const createErrorHandler = (logger: Logger): ErrorRequestHandler => (err, req, res, _next) => {
  if (err instanceof UnauthorizedError) {
    res.status(401).send(err.message);
  } else if (err instanceof UnauthorizedUserError) {
    res.status(403).send(err.message);
  } else if (err instanceof NotFoundError) {
    res.status(404).send(err.message);
  } else if (err instanceof InvalidOperationError) {
    res.status(400).send(err.message);
  } else {
    logger.warn(`Unexpected error encountered in handler for request ${req.path}. ${err}`);
    res.sendStatus(500);
  }
};
