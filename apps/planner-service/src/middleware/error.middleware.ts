import { Request, Response, NextFunction } from 'express';
import { Logger } from 'winston';
import { AppError, ProblemDetails } from '../types';

// ✓ CAS:RULE-017 — structured RFC 7807 error responses without data leakage
// ✓ ASVS:V7.4.1 — error messages do not expose stack traces or internal details in production
// ✓ ASVS:V7.1.1 — errors logged server-side; sanitised detail returned to client

// Protected B fields that must be redacted from error detail strings
// ✓ CAS:RULE-028 — no Protected B content in error responses
const PROTECTED_B_PATTERNS = [
  /AUDIT_SIGNING_KEY[^\s]*/gi,
  /MONGO_URI[^\s]*/gi,
  /CLIENT_SECRET[^\s]*/gi,
  /ANTHROPIC_API_KEY[^\s]*/gi,
  /mongodb(\+srv)?:\/\/[^\s]*/gi,
  /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi,
];

function sanitizeForClient(text: string | undefined): string | undefined {
  if (!text) return text;
  let sanitized = text;
  for (const pattern of PROTECTED_B_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }
  return sanitized;
}

/**
 * errorHandler — centralized RFC 7807 Problem Details error handler.
 * Must be registered as the LAST middleware in Express (after all routes).
 *
 * Maps AppError subclasses to appropriate HTTP status codes and Problem Details body.
 * Unhandled errors result in HTTP 500 with a generic message.
 */
export function createErrorHandler(logger: Logger) {
  // ✓ ASVS:V7.4.1 — centralized error handler prevents ad-hoc error leakage
  return function errorHandler(
    err: Error,
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: NextFunction,
  ): void {
    const requestId = req.headers['x-request-id'] || 'unknown';
    const method = req.method;
    const path = req.path;

    let status = 500;
    let problemDetails: ProblemDetails;

    if (err instanceof AppError) {
      status = err.statusCode;

      // ✓ CAS:RULE-017 — client receives sanitised detail; never raw error internals
      const sanitizedDetail = sanitizeForClient(err.message);

      problemDetails = {
        type: `https://planner-service.adsp.alberta.ca/errors/${err.code || 'APPLICATION_ERROR'}`,
        title: err.name,
        status,
        detail: sanitizedDetail,
        instance: `${method} ${path}`,
        ...(err.name === 'ValidationError' && (err as AppError & { errors?: unknown[] }).errors
          ? { errors: (err as AppError & { errors?: unknown[] }).errors }
          : {}),
      };

      // Log 4xx at warn, 5xx at error
      if (status >= 500) {
        // ✓ ASVS:V7.1.2 — internal server errors logged with full context for investigation
        logger.error(`[${requestId}] ${method} ${path} → ${status} ${err.name}`, {
          message: err.message,
          stack: err.stack,
        });
      } else {
        logger.warn(`[${requestId}] ${method} ${path} → ${status} ${err.name}: ${err.message}`);
      }
    } else {
      // Unexpected / unhandled error — log fully, return generic 500
      // ✓ ASVS:V7.4.1 — unhandled errors never expose internals to client
      logger.error(`[${requestId}] ${method} ${path} → 500 UnhandledError`, {
        message: err.message,
        stack: err.stack,
      });

      problemDetails = {
        type: 'https://planner-service.adsp.alberta.ca/errors/INTERNAL_SERVER_ERROR',
        title: 'Internal Server Error',
        status: 500,
        detail: 'An unexpected error occurred. Please try again later.',
        instance: `${method} ${path}`,
      };
    }

    // ✓ CAS:RULE-017 — Content-Type: application/problem+json per RFC 7807
    res.status(status).contentType('application/problem+json').json(problemDetails);
  };
}
