import {
  InvalidValueError,
  UnauthorizedError,
  NotFoundError,
  InvalidOperationError,
} from '.';

describe('errors', () => {
  // tests for all pre-defined error types
  const invalidValueError = new InvalidValueError('mock-err-message-invalid-value', 'wrong value');
  const unauthorizedError = new UnauthorizedError('mock-err-message-unauthorized');
  const invalidOperationError = new InvalidOperationError('mock-err-message-invalid-operation');
  const notFoundError = new NotFoundError('mock-err-message-not-found', 'id');

  it('can be created', () => {
    expect(invalidValueError.extra).toBeTruthy;
    expect(unauthorizedError.extra).toBeTruthy;
    expect(invalidOperationError.extra).toBeTruthy;
    expect(notFoundError.extra).toBeTruthy;
  });
});
