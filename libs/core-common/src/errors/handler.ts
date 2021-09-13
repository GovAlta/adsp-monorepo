import { AdspIdFormatError, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import { ErrorRequestHandler } from 'express';
import * as HttpStatusCodes from 'http-status-codes';
import { Logger } from 'winston';
import { InvalidValueError } from './invalidValue';
import { InvalidOperationError } from './invalidOperation';
import { NotFoundError } from './notFound';
import { UnauthorizedError } from './unauthorized';

export const createErrorHandler = (logger: Logger): ErrorRequestHandler => (err, req, res, _next) => {
  if (err instanceof UnauthorizedError) {
    res.status(HttpStatusCodes.UNAUTHORIZED).send(err.message);
  } else if (err instanceof UnauthorizedUserError) {
    res.status(HttpStatusCodes.FORBIDDEN).send(err.message);
  } else if (err instanceof NotFoundError) {
    res.status(HttpStatusCodes.NOT_FOUND).send(err.message);
  } else if (err instanceof InvalidOperationError) {
    res.status(HttpStatusCodes.BAD_REQUEST).send(err.message);
  } else if (err instanceof InvalidValueError) {
    res.status(HttpStatusCodes.BAD_REQUEST).send(err.message);
  } else if (err instanceof AdspIdFormatError) {
    res.status(HttpStatusCodes.BAD_REQUEST).send(err.message);
  } else {
    logger.warn(`Unexpected error encountered in handler for request ${req.path}. ${err}`);
    res.sendStatus(500);
  }
};
