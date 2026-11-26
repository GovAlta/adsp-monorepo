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

type BodyParseError = Error & { type?: string; status?: number; statusCode?: number };

// body-parser rejects a request body it cannot accept with an http-errors error tagged with its
// own `type` and a 4xx status: 400 for a malformed entity, 413 for one over the size limit. Only
// the malformed case is a SyntaxError carrying the raw body -- the oversized one is a plain
// PayloadTooLargeError with no body -- so match the type and status as well, or every oversized
// body falls through to the 500 branch. The status is required so that an unrelated error that
// happens to carry a `type` is not mistaken for one of these.
const isBodyParseError = (err: unknown): err is BodyParseError => {
  if (err instanceof SyntaxError && 'body' in err) {
    return true;
  }

  const { type, status, statusCode } = (err ?? {}) as BodyParseError;
  const code = status ?? statusCode;
  return typeof type === 'string' && typeof code === 'number' && code >= 400 && code < 500;
};

// A body over the limit is not malformed, so say what actually happened. The client can only act
// on the difference: shrink the payload, or fix the JSON.
const bodyParseMessage = (err: BodyParseError) =>
  err.type === 'entity.too.large'
    ? `Request body exceeds the size limit: ${err.message}`
    : `Malformed request body: ${err.message}`;

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
        errorMessage: bodyParseMessage(err),
      });
    } else {
      // Log the status the client actually receives. res.statusCode alone is misleading: for a
      // plain throw it is still the default 200, which reads as a success, and sendStatus below
      // overrides whatever it holds anyway.
      const sent = res.headersSent ? res.statusCode : HttpStatusCodes.INTERNAL_SERVER_ERROR;

      // A handler may have called res.status(...) and then failed -- res.status sets the code
      // without sending headers. That intent does not survive into the response, but it says
      // something about how far the request got, so keep it alongside rather than discarding it.
      const preset =
        !res.headersSent && res.statusCode !== HttpStatusCodes.OK ? ` (handler had set ${res.statusCode})` : '';

      logger.warn(
        `Unexpected error encountered in handler for request ${req.path} (status: ${sent})${preset}. ${err}`
      );

      if (!res.headersSent) {
        res.sendStatus(HttpStatusCodes.INTERNAL_SERVER_ERROR);
      } else {
        res.end();
      }
    }
  };
