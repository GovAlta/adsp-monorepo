import { adspId, User } from '@abgov/adsp-service-sdk';
import { createErrorHandler } from '@core-services/core-common';
import { createDocumentedResponseRecorder } from '@core-services/core-common/testing';
import * as express from 'express';
import { Express } from 'express';
import { join } from 'path';
import * as request from 'supertest';
import { Logger } from 'winston';
import { NoticeApplicationEntity } from '../../model/notice';
import { NoticeRepository } from '../../repository/notice';
import { NoticeModeType, ServiceUserRoles } from '../../types';
import { createNoticeRouter } from '../notice';

// Verifies the responses documented in notice.swagger.yml. The real router is mounted at the main.ts path, with the
// service error handler last; only the repository and SDK services are mocked.
describe('notice router documented behaviour', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/61e9adcc9423490012a9ae46`;
  const documented = createDocumentedResponseRecorder(join(__dirname, '..', 'notice.swagger.yml'));

  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;
  const tenantServiceMock = {
    getTenant: jest.fn(),
    getTenants: jest.fn(),
    getTenantByName: jest.fn(),
    getTenantByRealm: jest.fn(),
  };
  const eventServiceMock = { send: jest.fn() };
  const noticeRepositoryMock = {
    find: jest.fn(),
    get: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const admin = {
    id: 'admin',
    name: 'Status Admin',
    tenantId,
    isCore: false,
    roles: [ServiceUserRoles.StatusAdmin],
  } as unknown as User;
  const user = { id: 'tester', name: 'Test User', tenantId, isCore: false, roles: [] } as unknown as User;
  const noticeId = '6730c4f1a2b3c4d5e6f70812';
  const body = {
    message: 'My Application will be down for weekly maintenance during the following hours.',
    tennantServRef: [{ id: 'my-application', name: 'My Application' }],
    isAllApplications: false,
    startDate: '2026-11-15T02:00:00.000Z',
    endDate: '2026-11-15T04:00:00.000Z',
  };

  function createNotice(mode: NoticeModeType) {
    return new NoticeApplicationEntity(noticeRepositoryMock as unknown as NoticeRepository, {
      id: noticeId,
      message: body.message,
      tennantServRef: JSON.stringify(body.tennantServRef),
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      mode,
      created: new Date('2026-11-10T16:00:00.000Z'),
      tenantId: tenantId.toString(),
      isAllApplications: false,
      tenantName: 'My Tenant',
    });
  }

  function createApp(currentUser: User | null): Express {
    const expressApp = express();
    expressApp.use(documented.middleware);
    expressApp.use(express.json());
    expressApp.use((req, _res, next) => {
      req.user = currentUser;
      req.isAuthenticated = (() => !!currentUser) as typeof req.isAuthenticated;
      next();
    });
    expressApp.use(
      '/notice/v1',
      createNoticeRouter({
        logger: loggerMock,
        tenantService: tenantServiceMock,
        noticeRepository: noticeRepositoryMock as unknown as NoticeRepository,
        eventService: eventServiceMock,
      }),
    );
    expressApp.use(createErrorHandler(loggerMock));
    return expressApp;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    tenantServiceMock.getTenant.mockResolvedValue({ id: tenantId, name: 'My Tenant' });
    tenantServiceMock.getTenants.mockResolvedValue([{ id: tenantId, name: 'My-Tenant' }]);
    noticeRepositoryMock.find.mockResolvedValue({
      results: [createNotice('published')],
      page: { after: 0, next: null, size: 1, total: 1 },
    });
    noticeRepositoryMock.save.mockImplementation((entity) => Promise.resolve(entity));
    noticeRepositoryMock.delete.mockResolvedValue(true);
  });

  afterEach(async () => {
    await documented.assertDocumented();
  });

  describe('GET /notice/v1/notices', () => {
    it('retrieves published notices of a tenant for an anonymous request', async () => {
      const res = await request(createApp(null)).get('/notice/v1/notices?name=my-tenant');

      expect(res.status).toBe(200);
      expect(res.body.results).toHaveLength(1);
      expect(noticeRepositoryMock.find).toHaveBeenCalledWith(50, 0, {
        mode: 'published',
        tenantId: tenantId.toString(),
      });
    });

    it('retrieves notices in a mode for a status-admin', async () => {
      const res = await request(createApp(admin)).get('/notice/v1/notices?mode=draft&top=10&after=10');

      expect(res.status).toBe(200);
      expect(noticeRepositoryMock.find).toHaveBeenCalledWith(10, 10, { mode: 'draft', tenantId: tenantId.toString() });
    });
  });

  describe('POST /notice/v1/notices', () => {
    it('creates a draft notice', async () => {
      const res = await request(createApp(admin)).post('/notice/v1/notices').send(body);

      expect(res.status).toBe(201);
      expect(res.body).toEqual(
        expect.objectContaining({ mode: 'draft', tennantServRef: body.tennantServRef, tenantName: 'My Tenant' }),
      );
    });

    it('returns 401 for a user without the status-admin role', async () => {
      const res = await request(createApp(user)).post('/notice/v1/notices').send(body);

      expect(res.status).toBe(401);
      expect(noticeRepositoryMock.save).not.toHaveBeenCalled();
    });

    it('returns 401 for an anonymous request', async () => {
      const res = await request(createApp(null)).post('/notice/v1/notices').send(body);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /notice/v1/notices/{id}', () => {
    it('retrieves a published notice', async () => {
      noticeRepositoryMock.get.mockResolvedValueOnce(createNotice('published'));

      const res = await request(createApp(user)).get(`/notice/v1/notices/${noticeId}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(noticeId);
    });

    it('returns 401 for a draft notice and a user without the status-admin role', async () => {
      noticeRepositoryMock.get.mockResolvedValueOnce(createNotice('draft'));

      const res = await request(createApp(user)).get(`/notice/v1/notices/${noticeId}`);

      expect(res.status).toBe(401);
    });

    it('returns 404 when the notice is not found', async () => {
      noticeRepositoryMock.get.mockResolvedValueOnce(null);

      const res = await request(createApp(user)).get(`/notice/v1/notices/${noticeId}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /notice/v1/notices/{id}', () => {
    it('publishes a draft notice and sends the notice published event', async () => {
      noticeRepositoryMock.get.mockResolvedValueOnce(createNotice('draft'));

      const res = await request(createApp(admin)).patch(`/notice/v1/notices/${noticeId}`).send({ mode: 'published' });

      expect(res.status).toBe(200);
      expect(res.body.mode).toBe('published');
      expect(eventServiceMock.send).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'application-notice-published' }),
      );
    });

    it('returns 400 when archiving a draft notice', async () => {
      noticeRepositoryMock.get.mockResolvedValueOnce(createNotice('draft'));

      const res = await request(createApp(admin)).patch(`/notice/v1/notices/${noticeId}`).send({ mode: 'archived' });

      expect(res.status).toBe(400);
    });

    it('returns 401 for a user without the status-admin role', async () => {
      noticeRepositoryMock.get.mockResolvedValueOnce(createNotice('draft'));

      const res = await request(createApp(user)).patch(`/notice/v1/notices/${noticeId}`).send({ mode: 'published' });

      expect(res.status).toBe(401);
    });

    it('returns 404 when the notice is not found', async () => {
      noticeRepositoryMock.get.mockResolvedValueOnce(null);

      const res = await request(createApp(admin)).patch(`/notice/v1/notices/${noticeId}`).send({ mode: 'published' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /notice/v1/notices/{id}', () => {
    it('deletes a draft notice', async () => {
      noticeRepositoryMock.get.mockResolvedValueOnce(createNotice('draft'));

      const res = await request(createApp(admin)).delete(`/notice/v1/notices/${noticeId}`);

      expect(res.status).toBe(200);
      expect(noticeRepositoryMock.delete).toHaveBeenCalled();
    });

    it('returns 401 for a published notice', async () => {
      noticeRepositoryMock.get.mockResolvedValueOnce(createNotice('published'));

      const res = await request(createApp(admin)).delete(`/notice/v1/notices/${noticeId}`);

      expect(res.status).toBe(401);
    });

    it('returns 404 when the notice is not found', async () => {
      noticeRepositoryMock.get.mockResolvedValueOnce(null);

      const res = await request(createApp(admin)).delete(`/notice/v1/notices/${noticeId}`);

      expect(res.status).toBe(404);
    });
  });
});
