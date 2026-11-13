import { adspId, User } from '@abgov/adsp-service-sdk';
import { createErrorHandler } from '@core-services/core-common';
import { createDocumentedResponseRecorder } from '@core-services/core-common/testing';
import * as express from 'express';
import { Express } from 'express';
import { join } from 'path';
import * as request from 'supertest';
import { Logger } from 'winston';
import { VerifyUserRoles } from './roles';
import { createVerifyRouter } from './router';
import { createVerifyService } from './service';

// Verifies the roles, request validation, and error responses documented in router.swagger.yml by sending requests
// through the verify router as mounted in the service, with the real service and error handler.
describe('verify router documented behaviour', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/61f2e3a8c9b1d2e3f4a5b6c7`;
  const key = 'email-test.user@gov.ab.ca';
  const documented = createDocumentedResponseRecorder(join(__dirname, 'router.swagger.yml'));

  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;
  const repositoryMock = {
    get: jest.fn(),
    set: jest.fn(),
    failed: jest.fn(),
  };
  const auditServiceMock = {
    record: jest.fn(),
    query: jest.fn(),
    flush: jest.fn(),
    droppedEventCount: 0,
  };

  const tenantUser = (roles: string[]) =>
    ({ id: 'tester', name: 'Test User', tenantId, isCore: false, roles }) as unknown as User;
  const coreUser = (roles: string[]) => ({ id: 'core', name: 'Core User', isCore: true, roles }) as unknown as User;
  const generator = tenantUser([VerifyUserRoles.Generator]);
  const verifier = tenantUser([VerifyUserRoles.Verifier]);

  function createApp(currentUser: User | null): Express {
    const app = express();
    app.use(documented.middleware);
    app.use(express.json({ limit: '1mb' }));
    app.use((req, _res, next) => {
      // Passport sets the user from the core or tenant bearer token.
      req.user = currentUser;
      req.isAuthenticated = (() => !!currentUser) as typeof req.isAuthenticated;
      next();
    });
    app.use(
      '/verify/v1',
      createVerifyRouter({
        service: createVerifyService({
          logger: loggerMock,
          repository: repositoryMock,
          auditService: auditServiceMock,
        }),
      }),
    );
    app.use(createErrorHandler(loggerMock));
    return app;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    repositoryMock.set.mockImplementation((code) => Promise.resolve(code));
  });

  afterEach(async () => {
    await documented.assertDocumented();
  });

  describe('POST /verify/v1/codes/{key}', () => {
    it('generates a code for a user with the code-generator role', async () => {
      const res = await request(createApp(generator)).post(`/verify/v1/codes/${key}`).query({ expireIn: 15 });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ key, code: expect.any(String), expiresAt: expect.any(String) });
      expect(repositoryMock.set).toHaveBeenCalledWith(
        expect.objectContaining({ key: `/tenants/61f2e3a8c9b1d2e3f4a5b6c7:${key}` }),
        expect.any(Date),
      );
    });

    it('generates a code in the core namespace for a core user', async () => {
      const res = await request(createApp(coreUser([VerifyUserRoles.Generator]))).post(`/verify/v1/codes/${key}`);

      expect(res.status).toBe(200);
      expect(repositoryMock.set).toHaveBeenCalledWith(
        expect.objectContaining({ key: `core:${key}` }),
        expect.any(Date),
      );
    });

    it('verifies a code for a user with the code-verifier role', async () => {
      repositoryMock.get.mockResolvedValueOnce({ key, code: 'CF4HKR', failures: 0 });

      const res = await request(createApp(verifier)).post(`/verify/v1/codes/${key}`).send({ code: 'CF4HKR' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ verified: true });
    });

    it('records audit events to the tenantId given by a core user', async () => {
      const res = await request(createApp(coreUser([VerifyUserRoles.Generator])))
        .post(`/verify/v1/codes/${key}`)
        .query({ tenantId: tenantId.toString() });

      expect(res.status).toBe(200);
      expect(repositoryMock.set).toHaveBeenCalledWith(
        expect.objectContaining({ key: `core:${key}` }),
        expect.any(Date),
      );
      expect(auditServiceMock.record).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'code.generated' }),
        expect.objectContaining({ resource: { type: 'verify-code', id: key } }),
      );
      expect(`${auditServiceMock.record.mock.calls[0][1].tenantId}`).toBe(tenantId.toString());
    });

    it('records audit events to the tenant of a tenant user and ignores tenantId', async () => {
      const otherTenantId = 'urn:ads:platform:tenant-service:v2:/tenants/other';
      const res = await request(createApp(generator))
        .post(`/verify/v1/codes/${key}`)
        .query({ tenantId: otherTenantId });

      expect(res.status).toBe(200);
      expect(auditServiceMock.record).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'code.generated' }),
        expect.objectContaining({ tenantId }),
      );
    });

    it('returns 400 for a core user with a tenantId that is not a tenant ID', async () => {
      const res = await request(createApp(coreUser([VerifyUserRoles.Generator])))
        .post(`/verify/v1/codes/${key}`)
        .query({ tenantId: 'not-a-tenant' });

      expect(res.status).toBe(400);
      expect(res.body.errorMessage).toContain('tenantId (query)');
      expect(repositoryMock.set).not.toHaveBeenCalled();
    });

    it('responds verified false when there is no code at the key', async () => {
      repositoryMock.get.mockResolvedValueOnce(null);

      const res = await request(createApp(verifier)).post(`/verify/v1/codes/${key}`).send({ code: 'CF4HKR' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ verified: false });
    });

    it('returns 400 for a key longer than 50 characters', async () => {
      const res = await request(createApp(generator)).post(`/verify/v1/codes/${'k'.repeat(51)}`);

      expect(res.status).toBe(400);
    });

    it('returns 400 for an expireIn that is not a positive integer', async () => {
      const res = await request(createApp(generator)).post(`/verify/v1/codes/${key}`).query({ expireIn: 0 });

      expect(res.status).toBe(400);
      expect(res.body.errorMessage).toContain('expireIn (query)');
    });

    it('returns 400 for a code that is not a string', async () => {
      const res = await request(createApp(verifier)).post(`/verify/v1/codes/${key}`).send({ code: 123456 });

      expect(res.status).toBe(400);
    });

    it('returns 400 for a body that is not valid JSON', async () => {
      const res = await request(createApp(verifier))
        .post(`/verify/v1/codes/${key}`)
        .set('Content-Type', 'application/json')
        .send('{"code":');

      expect(res.status).toBe(400);
    });

    it('returns 401 without an authenticated user', async () => {
      const res = await request(createApp(null)).post(`/verify/v1/codes/${key}`);

      expect(res.status).toBe(401);
    });

    it('returns 403 when generating without the code-generator role', async () => {
      const res = await request(createApp(verifier)).post(`/verify/v1/codes/${key}`);

      expect(res.status).toBe(403);
      expect(repositoryMock.set).not.toHaveBeenCalled();
    });

    it('returns 403 when verifying without the code-verifier role', async () => {
      const res = await request(createApp(generator)).post(`/verify/v1/codes/${key}`).send({ code: 'CF4HKR' });

      expect(res.status).toBe(403);
      expect(repositoryMock.get).not.toHaveBeenCalled();
    });
  });
});
