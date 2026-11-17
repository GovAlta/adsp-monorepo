import { UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import { UnauthorizedError } from '@core-services/core-common';
import { Request, Response } from 'express';
import { Logger } from 'winston';
import {
  assertStatusAdmin,
  createNewApplication,
  getAllApplicationEntries,
  getApplicationEntries,
} from './serviceStatus';

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

describe('error paths reach next instead of hanging', () => {
  const logger = { info: jest.fn(), error: jest.fn() } as unknown as Logger;
  const res = {} as Response;

  it.each([
    ['getApplicationEntries', getApplicationEntries(logger, {} as never, {} as never)],
    ['getAllApplicationEntries', getAllApplicationEntries(logger, {} as never)],
  ])('%s passes UnauthorizedError when the user has no tenant', async (_name, handler) => {
    for (const req of [{}, { user: { id: 'core' } }]) {
      const next = jest.fn();
      await handler({ params: {}, query: {}, ...req } as unknown as Request, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    }
  });

  it('createNewApplication passes a tenant lookup failure to next', async () => {
    const failure = new Error('tenant not found');
    const tenantService = { getTenant: jest.fn().mockRejectedValue(failure) };
    const handler = createNewApplication(logger, {} as never, tenantService as never, {} as never);
    const next = jest.fn();
    await handler({ user: { id: 'core' }, body: {} } as unknown as Request, res, next);
    expect(next).toHaveBeenCalledWith(failure);
  });
});
