import { UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import { Request, Response } from 'express';
import { Logger } from 'winston';
import { assertStatusAdmin, getAllApplicationEntries } from './serviceStatus';
import { EndpointStatusEntryRepository } from '../repository/endpointStatusEntry';

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

describe('getAllApplicationEntries', () => {
  const logger = { info: jest.fn(), error: jest.fn() } as unknown as Logger;

  it('returns recent entries for the caller tenant only', async () => {
    const tenantId = 'urn:ads:platform:tenant-service:v2:/tenants/a';
    const repository = {
      findRecent: jest.fn().mockResolvedValue([
        { applicationId: 'portal', tenantId, ok: true, url: 'u', status: 200, timestamp: 1, responseTime: 1 },
      ]),
    } as unknown as EndpointStatusEntryRepository;
    const req = { user: { tenantId: { toString: () => tenantId } }, query: { ageInMinutes: '10' } } as unknown as Request;
    const res = { send: jest.fn() } as unknown as Response;

    await getAllApplicationEntries(logger, repository)(req, res, jest.fn());

    expect(repository.findRecent).toHaveBeenCalledWith(tenantId, 10);
    expect(res.send).toHaveBeenCalledWith([expect.objectContaining({ applicationId: 'portal' })]);
  });
});
