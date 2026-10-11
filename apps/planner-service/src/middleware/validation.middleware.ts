import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../types';

// ✓ ASVS:V5.1.1 — server-side input validation on all write endpoints
// ✓ ASVS:V5.1.3 — structured validation with field-level error reporting
// ✓ CAS:RULE-011 — input length and type constraints enforced before any business logic

/**
 * Transforms a ZodError into a flat array of { field, message } objects for
 * RFC 7807-compatible error responses. Nested paths are joined with '.'.
 */
function zodErrorToFieldErrors(err: ZodError): Array<{ field: string; message: string }> {
  return err.errors.map((issue) => ({
    field: issue.path.join('.') || '_root',
    message: issue.message,
  }));
}

/**
 * validateBody — Zod schema validation middleware factory for request body.
 * Returns HTTP 400 with RFC 7807 structure on validation failure.
 *
 * @param schema — Zod schema to validate req.body against
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  // ✓ ASVS:V5.1.1 — validates and sanitises request body against schema
  return function bodyValidation(req: Request, res: Response, next: NextFunction): void {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const fieldErrors = zodErrorToFieldErrors(result.error);
      next(new ValidationError('Request body validation failed', fieldErrors));
      return;
    }
    // Replace req.body with the parsed (sanitised) value
    req.body = result.data;
    next();
  };
}

/**
 * validateQuery — Zod schema validation middleware factory for query string parameters.
 * Returns HTTP 400 with RFC 7807 structure on validation failure.
 *
 * @param schema — Zod schema to validate req.query against
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  // ✓ ASVS:V5.1.2 — query parameter validation prevents injection via URL params
  return function queryValidation(req: Request, res: Response, next: NextFunction): void {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const fieldErrors = zodErrorToFieldErrors(result.error);
      next(new ValidationError('Query parameter validation failed', fieldErrors));
      return;
    }
    // Replace req.query with the parsed (sanitised) value
    (req as Request).query = result.data as typeof req.query;
    next();
  };
}

/**
 * validateParams — Zod schema validation middleware factory for path parameters.
 * Returns HTTP 400 with RFC 7807 structure on validation failure.
 *
 * @param schema — Zod schema to validate req.params against
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  // ✓ ASVS:V5.1.1 — path parameter validation prevents injection via route segments
  return function paramsValidation(req: Request, res: Response, next: NextFunction): void {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      const fieldErrors = zodErrorToFieldErrors(result.error);
      next(new ValidationError('Path parameter validation failed', fieldErrors));
      return;
    }
    (req as Request).params = result.data as typeof req.params;
    next();
  };
}

// ---------------------------------------------------------------------------
// Common reusable Zod schemas
// ---------------------------------------------------------------------------

// ✓ ASVS:V5.1.3 — pagination constraints prevent unbounded queries
export const PaginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 1))
    .pipe(z.number().int().min(1, 'page must be >= 1')),
  pageSize: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 20))
    .pipe(z.number().int().min(1).max(100, 'pageSize must be <= 100')),
});

// MongoDB ObjectId pattern
export const MongoIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid resource ID format'),
});

export const SessionIdParamSchema = z.object({
  sessionId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid sessionId format'),
});
