import { AdspIdFormatError, UnauthorizedUserError, GoAError } from '@abgov/adsp-service-sdk';
import { ErrorRequestHandler } from 'express';
import * as HttpStatusCodes from 'http-status-codes';
import { Logger } from 'winston';
import { InvalidValueError } from './invalidValue';
import { InvalidOperationError } from './invalidOperation';
import { NotFoundError } from './notFound';
import { UnauthorizedError } from './unauthorized';

const ErrorResponseHelper = (res, err: GoAError) => {
  const { extra, message } = err
  if (extra?.format === 'json') {
    res.status(extra.statusCode).json({
      errorMessage: message
    })
  } else if (extra?.format === 'text') {
    res.status(extra.statusCode).send(
      message
    )
  }
}

export const createErrorHandler = (logger: Logger): ErrorRequestHandler => (err, req, res, _next) => {
  if (err instanceof UnauthorizedError) {
    err.extra = { statusCode: HttpStatusCodes.UNAUTHORIZED, format: 'json', ...err.extra }
    ErrorResponseHelper(res, err)
  } else if (err instanceof UnauthorizedUserError) {
    err.extra = { statusCode: HttpStatusCodes.FORBIDDEN, format: 'json', ...err.extra }
    ErrorResponseHelper(res, err)
  } else if (err instanceof NotFoundError) {
    err.extra = { statusCode: HttpStatusCodes.NOT_FOUND, format: 'json', ...err.extra }
    ErrorResponseHelper(res, err)
  } else if (err instanceof InvalidOperationError) {
    err.extra = { statusCode: HttpStatusCodes.BAD_REQUEST, format: 'json', ...err.extra }
    ErrorResponseHelper(res, err)
  } else if (err instanceof InvalidValueError) {
    err.extra = { statusCode: HttpStatusCodes.BAD_REQUEST, format: 'json', ...err.extra }
    ErrorResponseHelper(res, err)
  } else if (err instanceof AdspIdFormatError) {
    err.extra = { statusCode: HttpStatusCodes.BAD_REQUEST, format: 'json', ...err.extra }
    ErrorResponseHelper(res, err)
  } else {
    logger.warn(`Unexpected error encountered in handler for request ${req.path}. ${err}`);
    res.sendStatus(500);
  }
};
