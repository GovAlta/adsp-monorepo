import { AdspIdFormatError, UnauthorizedUserError, GoAError } from '@abgov/adsp-service-sdk';
import { ErrorRequestHandler } from 'express';
import * as HttpStatusCodes from 'http-status-codes';
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

// body-parser raises a SyntaxError carrying the raw body when it cannot parse the request, and
// tags it with a status (400 for a malformed entity, 413 for one over the size limit). These are
// client errors, so report them as such instead of letting them fall through to a 500.
const isBodyParseError = (err: unknown): err is Error & { status?: number; statusCode?: number } =>
  err instanceof SyntaxError && 'body' in err;

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
    } else if (isBodyParseError(err)) {
      res.status(err.status || err.statusCode || HttpStatusCodes.BAD_REQUEST).json({
        errorMessage: `Malformed request body: ${err.message}`,
      });
    } else {
      logger.warn(
        `Unexpected error encountered in handler for request ${req.path} ${
          res.statusCode ? `(status: ${res.statusCode})` : ''
        }. ${err}`
      );
      if (!res.headersSent) {
        res.sendStatus(500);
      } else {
        res.end();
      }
    }
  };
