import { GoAError } from '@abgov/adsp-service-sdk';
import { Result, ValidationError } from 'express-validator';
import * as HttpStatusCodes from 'http-status-codes';

export class ValidationFailedError extends GoAError {
  constructor(result: Result<ValidationError>) {
    super(
      `Validation failed with error(s): ${result
        .array()
        .map(({ param, msg, location }) => `${param} (${location}) - ${msg}`)
        .join(', ')}`,
      { statusCode: HttpStatusCodes.BAD_REQUEST }
    );

    Object.setPrototypeOf(this, ValidationFailedError.prototype);
  }
}
