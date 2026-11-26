import {
  adspId,
  AuditService,
  EventService,
  TenantService,
  UnauthorizedUserError,
  User,
} from '@abgov/adsp-service-sdk';
import { UnauthorizedError } from '@core-services/core-common';
import { Request, Response } from 'express';
import { Logger } from 'winston';
import { EndpointStatusEntryRepository } from '../repository/endpointStatusEntry';
import { ApplicationRepo } from './ApplicationRepo';
import {
  assertStatusAdmin,
  createNewApplication,
  deleteApplication,
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

describe('status application handlers', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const logger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() } as unknown as Logger;
  const auditService = { record: jest.fn(), flush: jest.fn() } as unknown as AuditService;
  const eventService = { send: jest.fn() } as unknown as EventService;
  const tenantService = { getTenant: jest.fn() };
  const applicationRepo = {
    getTenantApps: jest.fn(),
    createApp: jest.fn(),
    getApp: jest.fn(),
    findStatus: jest.fn(),
    deleteApp: jest.fn(),
  };
  const entryRepository = { findRecent: jest.fn(), findRecentByUrlAndApplicationId: jest.fn() };

  const admin = { id: 'admin', name: 'admin', tenantId, roles: ['status-admin'] } as unknown as User;
  const noTenantUser = { id: 'core', name: 'core', roles: ['status-admin'] } as unknown as User;
  const app = { appKey: 'my-app', name: 'My app', url: 'https://my-app.test' };

  function run(handler, req: Partial<Request>) {
    const res = { json: jest.fn(), send: jest.fn(), sendStatus: jest.fn(), status: jest.fn() };
    res.status.mockReturnValue(res);
    const next = jest.fn();
    const done = handler({ params: {}, query: {}, body: {}, ...req } as Request, res as unknown as Response, next);
    return { res, next, done };
  }

  const settle = () => new Promise((resolve) => setImmediate(resolve));

  beforeEach(() => {
    jest.clearAllMocks();
    applicationRepo.getApp.mockResolvedValue(app);
    applicationRepo.findStatus.mockResolvedValue(null);
    applicationRepo.deleteApp.mockResolvedValue(undefined);
  });

  describe('createNewApplication', () => {
    const handler = () =>
      createNewApplication(
        logger,
        applicationRepo as unknown as ApplicationRepo,
        tenantService as unknown as TenantService,
        auditService,
      );

    it('passes a tenant lookup failure to next', async () => {
      const error = new Error('Tenant service unavailable.');
      tenantService.getTenant.mockRejectedValueOnce(error);

      const { res, next, done } = run(handler(), {
        user: admin,
        body: { name: 'My app', endpoint: { url: 'https://my-app.test' } },
      });
      await done;

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(applicationRepo.createApp).not.toHaveBeenCalled();
    });
  });

  describe('getApplicationEntries', () => {
    const handler = () =>
      getApplicationEntries(
        logger,
        applicationRepo as unknown as ApplicationRepo,
        entryRepository as unknown as EndpointStatusEntryRepository,
      );

    it('passes UnauthorizedError to next for a user without a tenant', async () => {
      const { next, done } = run(handler(), { user: noTenantUser, params: { appKey: 'my-app' } });
      await done;

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(applicationRepo.getApp).not.toHaveBeenCalled();
    });

    it('passes an error to next for a request without a user', async () => {
      const { next, done } = run(handler(), { params: { appKey: 'my-app' } });
      await done;

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getAllApplicationEntries', () => {
    const handler = () => getAllApplicationEntries(logger, entryRepository as unknown as EndpointStatusEntryRepository);

    it('passes UnauthorizedError to next for a user without a tenant', async () => {
      const { next, done } = run(handler(), { user: noTenantUser });
      await done;

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(entryRepository.findRecent).not.toHaveBeenCalled();
    });

    it('passes an error to next for a request without a user', async () => {
      const { next, done } = run(handler(), {});
      await done;

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('deleteApplication', () => {
    const handler = () =>
      deleteApplication(logger, applicationRepo as unknown as ApplicationRepo, eventService, auditService);

    it('responds only after the delete completes', async () => {
      let finishDelete: () => void;
      applicationRepo.deleteApp.mockReturnValueOnce(new Promise<void>((resolve) => (finishDelete = resolve)));

      const { res, next, done } = run(handler(), { user: admin, params: { appKey: 'my-app' } });
      await settle();
      expect(res.sendStatus).not.toHaveBeenCalled();

      finishDelete();
      await done;

      expect(res.sendStatus).toHaveBeenCalledWith(204);
      expect(next).not.toHaveBeenCalled();
    });

    it('passes a failed delete to next without responding', async () => {
      const error = new Error('Delete failed.');
      applicationRepo.deleteApp.mockRejectedValueOnce(error);

      const { res, next, done } = run(handler(), { user: admin, params: { appKey: 'my-app' } });
      await done;

      expect(next).toHaveBeenCalledWith(error);
      expect(res.sendStatus).not.toHaveBeenCalled();
    });
  });
});
