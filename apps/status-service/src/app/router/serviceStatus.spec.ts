import { UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import { Request, Response } from 'express';
import { assertStatusAdmin } from './serviceStatus';

describe('assertStatusAdmin', () => {
  const res = {} as Response;

  it('calls next without an error for a user with the status-admin role', () => {
    const next = jest.fn();
    assertStatusAdmin({ user: { roles: ['status-admin'] } } as unknown as Request, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('passes a 403 UnauthorizedUserError for a user without the role', () => {
    const next = jest.fn();
    assertStatusAdmin(
      { user: { name: 'Reader', id: 'reader', roles: ['other-role'] } } as unknown as Request,
      res,
      next,
    );
    const [error] = next.mock.calls[0];
    expect(error).toBeInstanceOf(UnauthorizedUserError);
    expect(error.extra.statusCode).toBe(403);
  });

  it('passes UnauthorizedUserError when there is no user', () => {
    const next = jest.fn();
    assertStatusAdmin({} as Request, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
  });
});
