import { AdspIdFormatError, UnauthorizedUserError, GoAError } from '@abgov/adsp-service-sdk';
import { ErrorRequestHandler } from 'express';
import { Logger } from 'winston';
import { InvalidValueError } from './invalidValue';
import { InvalidOperationError } from './invalidOperation';
import { NotFoundError } from './notFound';
import { UnauthorizedError } from './unauthorized';
import { ValidationFailedError } from './validationFailed';

const ErrorResponseHelper = (res, err: GoAError) => {
  const { extra, message } = err;
  res.status(extra.statusCode).json({
    errorMessage: message,
  });
};

export const createErrorHandler =
  (logger: Logger): ErrorRequestHandler =>
  (err, req, res, _next) => {
    if (
      err instanceof UnauthorizedError ||
      err instanceof UnauthorizedUserError ||
      err instanceof NotFoundError ||
      err instanceof InvalidOperationError ||
      err instanceof InvalidValueError ||
      err instanceof AdspIdFormatError ||
      err instanceof ValidationFailedError
    ) {
      ErrorResponseHelper(res, err);
    } else {
      logger.warn(`Unexpected error encountered in handler for request ${req.path}. ${err}`);
      res.sendStatus(500);
    }
  };
