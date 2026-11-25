import { adspId, AuditService, EventService, TenantService, User } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { Request, Response } from 'express';
import { Logger } from 'winston';
import { NoticeRepository } from '../repository/notice';
import { ServiceUserRoles } from '../types';
import { createNotice, deleteNotice, getNoticeById, getNotices, updateNotice } from './notice';

describe('notice router handlers', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/61e9adcc9423490012a9ae46`;
  const noticeId = '6730c4f1a2b3c4d5e6f70812';
  const logger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() } as unknown as Logger;
  const tenantService = {
    getTenant: jest.fn(),
    getTenants: jest.fn(),
    getTenantByName: jest.fn(),
    getTenantByRealm: jest.fn(),
  };
  const repository = { find: jest.fn(), get: jest.fn(), save: jest.fn(), delete: jest.fn() };
  const auditService = { record: jest.fn(), flush: jest.fn() } as unknown as AuditService;
  const eventService = { send: jest.fn() } as unknown as EventService;

  const admin = { id: 'admin', tenantId, isCore: false, roles: [ServiceUserRoles.StatusAdmin] } as unknown as User;
  const coreUser = { id: 'core', isCore: true, roles: [ServiceUserRoles.StatusAdmin] } as unknown as User;
  const body = {
    message: 'Maintenance',
    tennantServRef: [],
    isAllApplications: true,
    startDate: '2026-12-01T00:00:00.000Z',
    endDate: '2026-12-01T02:00:00.000Z',
  };

  function call(handler, req: Partial<Request>) {
    const res = { json: jest.fn(), status: jest.fn() };
    res.status.mockReturnValue(res);
    const next = jest.fn();
    return handler(
      { method: 'GET', url: '/', params: {}, query: {}, body: {}, ...req } as Request,
      res as unknown as Response,
      next,
    ).then(() => ({ res, next }));
  }

  beforeEach(() => {
    jest.clearAllMocks();
    tenantService.getTenants.mockResolvedValue([{ id: tenantId, name: 'My-Tenant' }]);
    tenantService.getTenant.mockResolvedValue({ id: tenantId, name: 'My Tenant' });
    repository.find.mockResolvedValue({ results: [], page: { after: 0, next: null, size: 0, total: 0 } });
    repository.save.mockImplementation((entity) => Promise.resolve(entity));
  });

  describe('getNotices', () => {
    const handler = () =>
      getNotices(logger, tenantService as unknown as TenantService, repository as unknown as NoticeRepository);

    it('filters an anonymous request by the tenant matching the name', async () => {
      const { res } = await call(handler(), { query: { name: 'my-tenant' } });

      expect(repository.find).toHaveBeenCalledWith(50, 0, { mode: 'published', tenantId: tenantId.toString() });
      expect(res.json).toHaveBeenCalled();
    });

    it('passes NotFoundError for an unknown tenant name', async () => {
      const { next } = await call(handler(), { query: { name: 'unknown' } });

      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
      expect(repository.find).not.toHaveBeenCalled();
    });

    it('ignores a name that is not a single string', async () => {
      await call(handler(), { query: { name: ['a', 'b'] } });

      expect(tenantService.getTenants).not.toHaveBeenCalled();
      expect(repository.find).toHaveBeenCalledWith(50, 0, { mode: 'published' });
    });

    it('passes InvalidOperationError for a user without a tenant', async () => {
      const { next } = await call(handler(), { user: coreUser });

      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });
  });

  describe('createNotice', () => {
    const handler = () =>
      createNotice(
        logger,
        tenantService as unknown as TenantService,
        repository as unknown as NoticeRepository,
        auditService,
      );

    it('creates a notice with valid fields', async () => {
      const { res, next } = await call(handler(), { user: admin, body });

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('passes InvalidOperationError listing each invalid field', async () => {
      const { next } = await call(handler(), { user: admin, body: { tennantServRef: 'x', startDate: 'soon' } });

      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(InvalidOperationError);
      expect(err.message).toBe(
        'Notice is not valid: message is required, tennantServRef must be an array, startDate must be a valid date, endDate must be a valid date.',
      );
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('passes InvalidOperationError for a user without a tenant', async () => {
      const { next } = await call(handler(), { user: coreUser, body });

      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
      expect(tenantService.getTenant).not.toHaveBeenCalled();
    });
  });

  describe('updateNotice', () => {
    const handler = () => updateNotice(logger, eventService, repository as unknown as NoticeRepository, auditService);

    it('passes InvalidOperationError for a start date that is not valid', async () => {
      const { next } = await call(handler(), { user: admin, params: { id: noticeId }, body: { startDate: 'soon' } });

      expect(next.mock.calls[0][0].message).toBe('Notice is not valid: startDate must be a valid date.');
      expect(repository.get).not.toHaveBeenCalled();
    });

    it('accepts an update without dates', async () => {
      repository.get.mockResolvedValueOnce(null);

      const { next } = await call(handler(), { user: admin, params: { id: noticeId }, body: { mode: 'published' } });

      expect(repository.get).toHaveBeenCalledWith(noticeId, tenantId.toString());
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });

  describe.each([
    ['getNoticeById', () => getNoticeById(logger, repository as unknown as NoticeRepository)],
    ['deleteNotice', () => deleteNotice(logger, repository as unknown as NoticeRepository, auditService)],
    ['updateNotice', () => updateNotice(logger, eventService, repository as unknown as NoticeRepository, auditService)],
  ])('%s', (_name, handler) => {
    it('passes InvalidOperationError for a user without a tenant', async () => {
      const { next } = await call(handler(), { user: coreUser, params: { id: noticeId } });

      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
      expect(repository.get).not.toHaveBeenCalled();
    });
  });
});
