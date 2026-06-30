import { Request, RequestHandler } from 'express';
import { ZodSchema } from 'zod';
import * as HttpStatusCodes from 'http-status-codes';
import { startBenchmark } from '../metrics';
import { GoAError } from './errors';

export class ValidationFailedError extends GoAError {
  constructor(message: string) {
    super(message, { statusCode: HttpStatusCodes.BAD_REQUEST });
    Object.setPrototypeOf(this, ValidationFailedError.prototype);
  }
}

/**
 * createValidationHandler
 * Returns Express middleware that parses a request property against a Zod schema.
 * On failure, passes a ValidationFailedError (HTTP 400) to next() so that
 * createErrorHandler maps it to a structured error response.
 *
 * Defaults to validating req.body. Pass a custom source function to validate
 * query params, route params, or a combination.
 *
 *   router.post('/resource', createValidationHandler(MySchema), handler);
 *   router.get('/search', createValidationHandler(QuerySchema, req => req.query), handler);
 */
export function createValidationHandler<T>(
  schema: ZodSchema<T>,
  source: (req: Request) => unknown = (req) => req.body
): RequestHandler {
  return (req, _res, next) => {
    const end = startBenchmark(req, 'validation-time');
    const result = schema.safeParse(source(req));
    end();
    if (!result.success) {
      const isProd = process.env.NODE_ENV === 'production';
      const message = isProd
        ? 'Validation failed'
        : `Validation failed: ${result.error.errors.map((e) => `${e.path.join('.') || '(root)'} - ${e.message}`).join('; ')}`;
      next(new ValidationFailedError(message));
    } else {
      next();
    }
  };
}
