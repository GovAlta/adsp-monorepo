import { createValidationHandler, InvalidOperationError } from '@core-services/core-common';
import { json, RequestHandler } from 'express';
import { body, checkSchema } from 'express-validator';

export const MAX_BATCH_EVENTS = 500;
export const MAX_REQUEST_BYTES = 20 * 1024 * 1024;

export function createAuditJsonParser(): RequestHandler {
  const parse = json({ limit: MAX_REQUEST_BYTES });
  return (req, res, next) => {
    parse(req, res, (err) => {
      if (err?.type === 'entity.too.large') {
        next(new InvalidOperationError('Audit request exceeds the 20 MB body limit.', { statusCode: 413 }));
      } else if (err?.type === 'entity.parse.failed') {
        next(new InvalidOperationError('Malformed JSON request body.'));
      } else {
        next(err);
      }
    });
  };
}

export const validateWriteRequest = createValidationHandler(
  body()
    .custom(
      (value: unknown) =>
        !!value &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        Object.keys(value).every((key) => key === 'events'),
    )
    .withMessage('The request must be an object containing only events.'),
  ...checkSchema({
    events: {
      in: ['body'],
      isArray: { options: { min: 1, max: MAX_BATCH_EVENTS } },
      errorMessage: 'events must be an array containing 1 to 500 events.',
    },
  }),
);
