import { adspId, User } from '@abgov/adsp-service-sdk';
import { createErrorHandler, InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { createDocumentedResponseRecorder } from '@core-services/core-common/testing';
import * as express from 'express';
import { Express } from 'express';
import * as HttpStatusCodes from 'http-status-codes';
import { join } from 'path';
import * as request from 'supertest';
import { Logger } from 'winston';
import { DataRegisterClient } from '../dataRegisterClient';
import { ConfigurationServiceRoles, FormServiceRoles } from '../roles';
import { createRegisterRouter } from './register';

// Verifies the request validation, roles, and error responses documented in register.swagger.yml by sending requests
// through the register router, as mounted in the service, with the real error handler. The data register client is
// the data access layer over configuration service, so it is mocked like a repository.
describe('register router documented behaviour', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const documented = createDocumentedResponseRecorder(join(__dirname, 'register.swagger.yml'));

  const loggerMock = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() } as unknown as Logger;
  const clientMock = { find: jest.fn(), get: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() };
  const auditServiceMock = {
    record: jest.fn().mockResolvedValue({ status: 'recorded', eventId: 'event' }),
    query: jest.fn(),
    flush: jest.fn(),
    droppedEventCount: 0,
  };

  const register = {
    namespace: 'data-register',
    name: 'weekdays',
    description: 'Days of the week',
    entries: ['Monday'],
  };

  const user = (id: string, roles: string[], overrides: Partial<User> = {}) =>
    ({ id, name: id, tenantId, isCore: false, roles, ...overrides }) as User;
  const formAdmin = user('form-admin', [FormServiceRoles.Admin]);
  const configurationAdmin = user('configuration-admin', [ConfigurationServiceRoles.ConfigurationAdmin]);
  const assessor = user('assessor', ['test-assessor']);
  const coreAdmin = user('core-admin', [FormServiceRoles.Admin], { tenantId: undefined, isCore: true });

  function createApp(currentUser: User | null, withTenant = true): Express {
    const app = express();
    app.use(documented.middleware);
    app.use(express.json());
    app.use((req, _res, next) => {
      req.user = currentUser;
      req.isAuthenticated = (() => !!currentUser) as typeof req.isAuthenticated;
      req.tenant = withTenant ? ({ id: tenantId } as typeof req.tenant) : undefined;
      next();
    });
    app.use(
      '/form/v1',
      createRegisterRouter({
        client: clientMock as unknown as DataRegisterClient,
        logger: loggerMock,
        auditService: auditServiceMock,
      }),
    );
    app.use(createErrorHandler(loggerMock));
    return app;
  }

  const badGateway = () =>
    new InvalidOperationError('Configuration service failed.', { statusCode: HttpStatusCodes.BAD_GATEWAY });

  afterEach(async () => {
    await documented.assertDocumented();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset drops the rejections queued for operations a test did not call.
    Object.values(clientMock).forEach((mock) => mock.mockReset());
    clientMock.find.mockResolvedValue([register]);
    clientMock.get.mockImplementation((_tenantId, name: string) =>
      name === register.name ? Promise.resolve(register) : Promise.reject(new NotFoundError('data register', name)),
    );
    clientMock.create.mockResolvedValue(register);
    clientMock.update.mockResolvedValue(register);
    clientMock.delete.mockResolvedValue(undefined);
  });

  // Every operation needs a signed-in user with the form-service admin or configuration-admin role in a tenant.
  describe.each([
    ['get', '/form/v1/registers', 200],
    ['post', '/form/v1/registers', 201],
    ['get', '/form/v1/registers/weekdays', 200],
    ['patch', '/form/v1/registers/weekdays', 200],
    ['delete', '/form/v1/registers/weekdays', 204],
  ])('%s %s', (method: 'get' | 'post' | 'patch' | 'delete', url: string, successStatus: number) => {
    const body = method === 'post' ? { name: 'weekdays', entries: ['Monday'] } : { entries: ['Monday'] };

    it.each([
      ['form-service admin', formAdmin],
      ['configuration-admin', configurationAdmin],
    ])('allows the %s role', async (_role, currentUser) => {
      const res = await request(createApp(currentUser))[method](url).send(body);
      expect(res.status).toBe(successStatus);
    });

    it('allows a core user with the role and a tenant context', async () => {
      const res = await request(createApp(coreAdmin))[method](url).send(body);
      expect(res.status).toBe(successStatus);
    });

    it('responds 400 without a tenant context', async () => {
      const res = await request(createApp(coreAdmin, false))[method](url).send(body);
      expect(res.status).toBe(400);
    });

    it('responds 401 without an authenticated user', async () => {
      const res = await request(createApp(null))[method](url).send(body);
      expect(res.status).toBe(401);
    });

    it('responds 403 without the form-service admin or configuration-admin role', async () => {
      const res = await request(createApp(assessor))[method](url).send(body);
      expect(res.status).toBe(403);
    });

    it('responds 502 when configuration service fails', async () => {
      clientMock.find.mockRejectedValueOnce(badGateway());
      clientMock.get.mockRejectedValueOnce(badGateway());
      clientMock.create.mockRejectedValueOnce(badGateway());
      clientMock.update.mockRejectedValueOnce(badGateway());
      clientMock.delete.mockRejectedValueOnce(badGateway());
      const res = await request(createApp(formAdmin))[method](url).send(body);
      expect(res.status).toBe(502);
    });
  });

  describe.each(['get', 'patch', 'delete'] as const)('%s /registers/:name', (method) => {
    it('responds 400 for a name that starts with a space', async () => {
      const res = await request(createApp(formAdmin))[method]('/form/v1/registers/%20weekdays').send({});
      expect(res.status).toBe(400);
    });

    it('responds 404 for a register that does not exist', async () => {
      clientMock.get.mockRejectedValueOnce(new NotFoundError('data register', 'unknown'));
      clientMock.update.mockRejectedValueOnce(new NotFoundError('data register', 'unknown'));
      clientMock.delete.mockRejectedValueOnce(new NotFoundError('data register', 'unknown'));
      const res = await request(createApp(formAdmin))[method]('/form/v1/registers/unknown').send({});
      expect(res.status).toBe(404);
    });
  });

  describe('POST /registers', () => {
    it.each([
      ['name is missing', { entries: [] }],
      ['name is longer than 50 characters', { name: 'a'.repeat(51) }],
      ['entries is not an array', { name: 'weekdays', entries: 'Monday' }],
      ['an entry is not a string or object', { name: 'weekdays', entries: [1] }],
    ])('responds 400 when %s', async (_case, body) => {
      const res = await request(createApp(formAdmin)).post('/form/v1/registers').send(body);
      expect(res.status).toBe(400);
      expect(clientMock.create).not.toHaveBeenCalled();
    });

    it('responds 400 when configuration service rejects the register', async () => {
      clientMock.create.mockRejectedValueOnce(new InvalidOperationError('Configuration is not valid.'));
      const res = await request(createApp(formAdmin)).post('/form/v1/registers').send({ name: 'weekdays' });
      expect(res.status).toBe(400);
    });

    it('responds 409 when a register with the name exists', async () => {
      clientMock.create.mockRejectedValueOnce(
        new InvalidOperationError("Data register 'weekdays' already exists.", { statusCode: HttpStatusCodes.CONFLICT }),
      );
      const res = await request(createApp(formAdmin)).post('/form/v1/registers').send({ name: 'weekdays' });
      expect(res.status).toBe(409);
    });
  });

  describe('PATCH /registers/:name', () => {
    it('responds 400 when description is not a string', async () => {
      const res = await request(createApp(formAdmin)).patch('/form/v1/registers/weekdays').send({ description: 1 });
      expect(res.status).toBe(400);
    });

    it('responds 400 when configuration service rejects the entries', async () => {
      clientMock.update.mockRejectedValueOnce(new InvalidOperationError('Configuration is not valid.'));
      const res = await request(createApp(formAdmin))
        .patch('/form/v1/registers/weekdays')
        .send({ entries: [{ label: 'Monday' }] });
      expect(res.status).toBe(400);
    });
  });
});
