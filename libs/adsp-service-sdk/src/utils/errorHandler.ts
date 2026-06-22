import { ErrorRequestHandler, Request } from 'express';
import { Logger } from 'winston';
import { GoAError } from './errors';

function getCorrelationId(req: Request): string | undefined {
  const value = req.headers['x-correlation-id'];
  return Array.isArray(value) ? value[0] : value;
}

/**
 * createErrorHandler
 * Returns an Express error-handling middleware that normalizes error responses
 * across GoA services. Recognizes GoAError.extra.statusCode for HTTP status
 * mapping, sanitizes internal error details in production, and logs errors with
 * request context when a Winston logger is provided.
 *
 * Mount last in the Express middleware chain:
 *   app.use(createErrorHandler(logger));
 *
 * @param logger Optional Winston logger. When provided, errors are logged with
 *               statusCode, path, method, and correlation ID.
 */
export function createErrorHandler(logger?: Logger): ErrorRequestHandler {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return (err, req, res, _next) => {
    const statusCode: number =
      (err instanceof GoAError ? err.extra?.statusCode : undefined) ?? err?.statusCode ?? 500;

    const isProd = process.env.NODE_ENV === 'production';
    const message = isProd && statusCode >= 500 ? 'Internal server error' : err?.message ?? 'An error occurred';

    if (logger) {
      logger.error(err?.message ?? 'Request error', {
        statusCode,
        path: req.path,
        method: req.method,
        correlationId: getCorrelationId(req),
      });
    }

    res.status(statusCode).json({ error: message });
  };
}
