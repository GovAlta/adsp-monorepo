import { startBenchmark } from '@abgov/adsp-service-sdk';
import { RequestHandler } from 'express';
import { ValidationChain, validationResult } from 'express-validator';
import { ValidationFailedError } from './validationFailed';

const END_BENCHMARK_KEY = 'endBenchmark';
export function createValidationHandler(...chain: (ValidationChain | RequestHandler)[]): RequestHandler[] {
  return [
    (req, _res, next) => {
      req[END_BENCHMARK_KEY] = startBenchmark(req, 'validation-time');
      next();
    },
    ...chain,
    (req, _res, next) => {
      const result = validationResult(req);
      const end = req[END_BENCHMARK_KEY];
      end();

      if (!result?.isEmpty()) {
        next(new ValidationFailedError(result));
      } else {
        next();
      }
    },
  ];
}
