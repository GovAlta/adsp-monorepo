import { benchmark } from '@abgov/adsp-service-sdk';
import { RequestHandler } from 'express';
import { ValidationChain, validationResult } from 'express-validator';
import { ValidationFailedError } from './validationFailed';

export function createValidationHandler(...chain: (ValidationChain | RequestHandler)[]): RequestHandler[] {
  return [
    (req, _res, next) => {
      benchmark(req, 'validation-time');
      next();
    },
    ...chain,
    (req, _res, next) => {
      const result = validationResult(req);
      benchmark(req, 'validation-time');
      if (!result?.isEmpty()) {
        next(new ValidationFailedError(result));
      } else {
        next();
      }
    },
  ];
}
