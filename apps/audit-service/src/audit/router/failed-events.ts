import { createValidationHandler, decodeAfter, InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { RequestHandler } from 'express';
import { param, query } from 'express-validator';
import { SERVICE_UNAVAILABLE } from 'http-status-codes';
import type { Logger } from 'winston';
import { FailedEventService } from '../model';

const MAX_PAGE_SIZE = 100;
export const validateFailedEventPage = createValidationHandler(
  query('top').optional().isString().bail().isInt({ min: 1, max: MAX_PAGE_SIZE }),
  query('after')
    .optional()
    .isString()
    .bail()
    .isLength({ min: 1, max: 32 })
    .bail()
    .custom((value: string) => {
      const skip = decodeAfter(value);
      return (
        Number.isSafeInteger(skip) &&
        skip >= 0 &&
        skip <= Number.MAX_SAFE_INTEGER - MAX_PAGE_SIZE &&
        Buffer.from(`${skip}`).toString('base64') === value
      );
    }),
);
export const validateFailedEventId = createValidationHandler(param('id').isUUID());

export function failedEventHandler(
  service: FailedEventService | undefined,
  logger: Logger,
  operation: 'list' | 'replay',
): RequestHandler {
  return async (req, res, next) => {
    try {
      if (!req.tenant?.id) throw new InvalidOperationError('Tenant context is required to administer failed events.');
      if (!service) {
        throw new InvalidOperationError('Failed-event administration is not configured.', {
          statusCode: SERVICE_UNAVAILABLE,
        });
      }
      const tenantId = req.tenant.id.toString();
      const result =
        operation === 'list'
          ? await service.list(
              tenantId,
              req.query.top ? Number(req.query.top) : 20,
              req.query.after as string | undefined,
            )
          : await service.replay(tenantId, req.params.id, req.user);
      res.send(result);
    } catch (err) {
      logger.warn(`Unable to ${operation} failed audit events.`, { context: 'AuditFailedEvents', error: String(err) });
      const error =
        err instanceof InvalidOperationError || err instanceof NotFoundError
          ? err
          : new InvalidOperationError('Failed-event storage is temporarily unavailable.', {
              statusCode: SERVICE_UNAVAILABLE,
            });
      if (error instanceof InvalidOperationError && error.extra?.statusCode === SERVICE_UNAVAILABLE) {
        res.setHeader('Retry-After', '1');
      }
      next(error);
    }
  };
}
