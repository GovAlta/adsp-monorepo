import { adspId, AuditService, User } from '@abgov/adsp-service-sdk';
import { assertAuthenticatedHandler, ConfigurationClient, createErrorHandler } from '@core-services/core-common';
import { createDocumentedResponseRecorder } from '@core-services/core-common/testing';
import * as express from 'express';
import { Express } from 'express';
import { join } from 'path';
import * as request from 'supertest';
import { Logger } from 'winston';
import { ServiceUserRoles, ValueConfiguration } from '../types';
import { createDefinitionRouter } from './definition';

// Verifies the request validation, roles, and error responses documented in definition.swagger.yml by sending
// requests through the router as mounted in main.ts (authenticated, then the router, then the error handler).
describe('definition router documented behaviour', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

  const documented = createDocumentedResponseRecorder(join(__dirname, 'definition.swagger.yml'));

  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const validationServiceMock = { setSchema: jest.fn(), validate: jest.fn() };
  const auditServiceMock = { record: jest.fn().mockResolvedValue({}), flush: jest.fn() } as unknown as AuditService;

  const clientMock = {
    getTenantConfiguration: jest.fn(),
    getCoreConfiguration: jest.fn(),
    updateEntry: jest.fn(),
    deleteEntry: jest.fn(),
  };

  const definition = { name: 'response-time', description: 'Response time.', jsonSchema: { type: 'number' } };
  const tenantConfiguration = {
    'test-service': { name: 'test-service', definitions: { 'response-time': definition } },
  } as unknown as ValueConfiguration;
  const coreConfiguration = {
    platform: { name: 'platform', definitions: { uptime: { ...definition, name: 'uptime' } } },
  } as unknown as ValueConfiguration;

  const user = (roles: string[], overrides: Partial<User> = {}) =>
    ({ id: 'tester', name: 'Tester', tenantId, isCore: false, roles, ...overrides }) as User;
  const reader = user([ServiceUserRoles.Reader]);
  const writer = user([ServiceUserRoles.Writer]);
  const noRole = user([]);

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
    app.use(assertAuthenticatedHandler);
    app.use(
      '/value/v1/',
      createDefinitionRouter({
        client: clientMock as unknown as ConfigurationClient<ValueConfiguration>,
        validationService: validationServiceMock,
        logger: loggerMock,
        auditService: auditServiceMock,
      }),
    );
    app.use(createErrorHandler(loggerMock));
    return app;
  }

  afterEach(async () => {
    await documented.assertDocumented();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    validationServiceMock.setSchema.mockReset();
    clientMock.getTenantConfiguration.mockResolvedValue(tenantConfiguration);
    clientMock.getCoreConfiguration.mockResolvedValue(coreConfiguration);
    clientMock.updateEntry.mockImplementation((_tenantId, namespace, entry) => Promise.resolve({ [namespace]: entry }));
    clientMock.deleteEntry.mockResolvedValue({});
  });

  it('responds 401 when there is no authenticated user', async () => {
    const res = await request(createApp(null)).get('/value/v1/definitions');
    expect(res.status).toBe(401);
  });

  describe('GET /definitions', () => {
    it('responds with tenant and core definitions for a value-reader', async () => {
      const res = await request(createApp(reader)).get('/value/v1/definitions');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ tenant: tenantConfiguration, core: coreConfiguration });
    });

    it('responds with only core definitions for a core user without a tenant context', async () => {
      const coreReader = user([ServiceUserRoles.Reader], { isCore: true, tenantId: undefined });
      const res = await request(createApp(coreReader, false)).get('/value/v1/definitions');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ tenant: {}, core: coreConfiguration });
      expect(clientMock.getTenantConfiguration).not.toHaveBeenCalled();
    });

    it('responds 403 without the value-reader or value-writer role', async () => {
      const res = await request(createApp(noRole)).get('/value/v1/definitions');
      expect(res.status).toBe(403);
      expect(res.body.errorMessage).toContain('not permitted');
    });
  });

  describe('POST /definitions', () => {
    const body = { namespace: 'test-service', name: 'error-count', jsonSchema: { type: 'number' } };

    it('creates the definition for a value-writer', async () => {
      const res = await request(createApp(writer)).post('/value/v1/definitions').send(body);
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ namespace: 'test-service', name: 'error-count', isCore: false });
    });

    it('responds 400 without a tenant context', async () => {
      const coreWriter = user([ServiceUserRoles.Writer], { isCore: true, tenantId: undefined });
      const res = await request(createApp(coreWriter, false)).post('/value/v1/definitions').send(body);
      expect(res.status).toBe(400);
      expect(res.body.errorMessage).toBe('Tenant context is required for operation.');
    });

    it('responds 400 for a name that does not match the pattern', async () => {
      const res = await request(createApp(writer))
        .post('/value/v1/definitions')
        .send({ ...body, name: 'error:count' });
      expect(res.status).toBe(400);
    });

    it('responds 400 without a jsonSchema', async () => {
      const res = await request(createApp(writer))
        .post('/value/v1/definitions')
        .send({ namespace: 'test-service', name: 'error-count' });
      expect(res.status).toBe(400);
    });

    it('responds 400 for an invalid JSON schema', async () => {
      validationServiceMock.setSchema.mockImplementation(() => {
        throw new Error('schema is invalid');
      });
      const res = await request(createApp(writer)).post('/value/v1/definitions').send(body);
      expect(res.status).toBe(400);
      expect(res.body.errorMessage).toContain('invalid JSON schema');
    });

    it('responds 403 without the value-writer role', async () => {
      const res = await request(createApp(reader)).post('/value/v1/definitions').send(body);
      expect(res.status).toBe(403);
    });

    it('responds 409 when a tenant definition already exists', async () => {
      const res = await request(createApp(writer))
        .post('/value/v1/definitions')
        .send({ ...body, name: 'response-time' });
      expect(res.status).toBe(409);
      expect(res.body.errorMessage).toContain('already exists');
    });

    it('responds 409 when a core definition already exists', async () => {
      const res = await request(createApp(writer))
        .post('/value/v1/definitions')
        .send({ ...body, namespace: 'platform', name: 'uptime' });
      expect(res.status).toBe(409);
    });
  });

  describe('GET /definitions/:namespace/:name', () => {
    it('responds with the tenant definition', async () => {
      const res = await request(createApp(reader)).get('/value/v1/definitions/test-service/response-time');
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ namespace: 'test-service', name: 'response-time', isCore: false });
    });

    it('responds with the core definition when there is no tenant definition', async () => {
      const res = await request(createApp(reader)).get('/value/v1/definitions/platform/uptime');
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ namespace: 'platform', name: 'uptime', isCore: true });
    });

    it('responds 400 for a name that does not match the pattern', async () => {
      const res = await request(createApp(reader)).get('/value/v1/definitions/test-service/response:time');
      expect(res.status).toBe(400);
    });

    it('responds 403 without the value-reader or value-writer role', async () => {
      const res = await request(createApp(noRole)).get('/value/v1/definitions/test-service/response-time');
      expect(res.status).toBe(403);
    });

    it('responds 404 for an unknown definition', async () => {
      const res = await request(createApp(reader)).get('/value/v1/definitions/test-service/unknown');
      expect(res.status).toBe(404);
      expect(res.body.errorMessage).toBe("value definition with ID 'test-service:unknown' could not be found.");
    });
  });

  describe('PATCH /definitions/:namespace/:name', () => {
    it('updates the tenant definition for a value-writer', async () => {
      const res = await request(createApp(writer))
        .patch('/value/v1/definitions/test-service/response-time')
        .send({ description: 'Updated.' });
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ name: 'response-time', description: 'Updated.', isCore: false });
    });

    it('responds 400 for a jsonSchema that is not an object', async () => {
      const res = await request(createApp(writer))
        .patch('/value/v1/definitions/test-service/response-time')
        .send({ jsonSchema: 'number' });
      expect(res.status).toBe(400);
    });

    it('responds 400 without a tenant context', async () => {
      const coreWriter = user([ServiceUserRoles.Writer], { isCore: true, tenantId: undefined });
      const res = await request(createApp(coreWriter, false))
        .patch('/value/v1/definitions/test-service/response-time')
        .send({ description: 'Updated.' });
      expect(res.status).toBe(400);
    });

    it('responds 403 without the value-writer role', async () => {
      const res = await request(createApp(reader))
        .patch('/value/v1/definitions/test-service/response-time')
        .send({ description: 'Updated.' });
      expect(res.status).toBe(403);
    });

    it('responds 404 for a core definition', async () => {
      const res = await request(createApp(writer))
        .patch('/value/v1/definitions/platform/uptime')
        .send({ description: 'Updated.' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /definitions/:namespace/:name', () => {
    it('deletes the tenant definition for a value-writer', async () => {
      const res = await request(createApp(writer)).delete('/value/v1/definitions/test-service/response-time');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ deleted: true });
      expect(clientMock.deleteEntry).toHaveBeenCalledWith(tenantId, 'test-service');
    });

    it('responds 400 for a namespace that does not match the pattern', async () => {
      const res = await request(createApp(writer)).delete('/value/v1/definitions/test:service/response-time');
      expect(res.status).toBe(400);
    });

    it('responds 400 without a tenant context', async () => {
      const coreWriter = user([ServiceUserRoles.Writer], { isCore: true, tenantId: undefined });
      const res = await request(createApp(coreWriter, false)).delete(
        '/value/v1/definitions/test-service/response-time',
      );
      expect(res.status).toBe(400);
    });

    it('responds 403 without the value-writer role', async () => {
      const res = await request(createApp(reader)).delete('/value/v1/definitions/test-service/response-time');
      expect(res.status).toBe(403);
    });

    it('responds 404 for an unknown definition', async () => {
      const res = await request(createApp(writer)).delete('/value/v1/definitions/test-service/unknown');
      expect(res.status).toBe(404);
    });
  });
});
