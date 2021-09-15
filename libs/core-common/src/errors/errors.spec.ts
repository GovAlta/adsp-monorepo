import {
  InvalidValueError,
  UnauthorizedError,
  NotFoundError,
  InvalidOperationError,
} from '.';
import * as HttpStatusCodes from 'http-status-codes';

describe('errors', () => {
  // tests for all pre-defined error types
  const invalidValueError = new InvalidValueError('mock-err-message-invalid-value', 'wrong value');
  const unauthorizedError = new UnauthorizedError('mock-err-message-unauthorized');
  const invalidOperationError = new InvalidOperationError('mock-err-message-invalid-operation');
  const notFoundError = new NotFoundError('mock-err-message-not-found', 'id');

  it('can be created', () => {
    expect(invalidValueError.extra.statusCode).toEqual(HttpStatusCodes.BAD_REQUEST);
    expect(unauthorizedError.extra.statusCode).toEqual(HttpStatusCodes.UNAUTHORIZED);
    expect(invalidOperationError.extra.statusCode).toEqual(HttpStatusCodes.BAD_REQUEST);
    expect(notFoundError.extra.statusCode).toEqual(HttpStatusCodes.NOT_FOUND);
  });
});
