import { RequestHandler } from 'express';
import { ValidationChain, validationResult } from 'express-validator';
import { ValidationFailedError } from './validationFailed';

export function createValidationHandler(chain: ValidationChain | ValidationChain[]): RequestHandler[] {
  return [
    ...(Array.isArray(chain) ? chain : [chain]),
    (req, _res, next) => {
      const result = validationResult(req);
      if (!result?.isEmpty()) {
        next(new ValidationFailedError(result));
      } else {
        next();
      }
    },
  ];
}
