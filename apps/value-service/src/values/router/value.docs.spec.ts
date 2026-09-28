import { adspId, User } from '@abgov/adsp-service-sdk';
import { assertAuthenticatedHandler, createErrorHandler } from '@core-services/core-common';
import { createDocumentedResponseRecorder } from '@core-services/core-common/testing';
import * as express from 'express';
import { Express } from 'express';
import { join } from 'path';
import * as request from 'supertest';
import { Logger } from 'winston';
import { NamespaceEntity } from '../model';
import { ExportServiceRoles, ServiceUserRoles } from '../types';
import { createValueRouter } from './value';

jest.mock('../jobs/serviceMetricRollup', () => ({
  ...jest.requireActual('../jobs/serviceMetricRollup'),
  createServiceMetricRollupJob: jest.fn(() => jest.fn().mockResolvedValue(42)),
}));

// Verifies the request validation, roles, and error responses documented in value.swagger.yml by sending
// requests through the router as mounted in main.ts (authenticated, then the router, then the error handler).
describe('value router documented behaviour', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const otherTenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/other`;

  const documented = createDocumentedResponseRecorder(join(__dirname, 'value.swagger.yml'));

  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const validationServiceMock = {
    setSchema: jest.fn(),
    validate: jest.fn(),
  };

  const repositoryMock = {
    readValues: jest.fn(),
    countValues: jest.fn(),
    writeValues: jest.fn(),
    readMetrics: jest.fn(),
    readMetric: jest.fn(),
    readPlatformMetrics: jest.fn(),
    writeMetric: jest.fn(),
  };

  const eventServiceMock = { send: jest.fn() };

  const namespace = new NamespaceEntity(
    validationServiceMock,
    repositoryMock,
    {
      name: 'test-service',
      description: null,
      definitions: { 'test-value': { name: 'test-value', description: null, type: null, jsonSchema: {} } },
    },
    tenantId,
  );

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
      req.getConfiguration = jest.fn().mockResolvedValue([{ 'test-service': namespace }]);
      next();
    });
    app.use(assertAuthenticatedHandler);
    app.use(
      '/value/v1',
      createValueRouter({
        logger: loggerMock,
        repository: repositoryMock as never,
        serviceMetricRollupRepository: {} as never,
        serviceMetricRollupTrailingDays: 7,
        eventService: eventServiceMock,
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
    validationServiceMock.validate.mockReset();
    repositoryMock.readValues.mockResolvedValue({ results: [], page: { size: 0 } });
    repositoryMock.countValues.mockResolvedValue(0);
    repositoryMock.readMetrics.mockResolvedValue({});
    repositoryMock.readMetric.mockResolvedValue({ name: 'test', values: [], page: {} });
    repositoryMock.readPlatformMetrics.mockResolvedValue({});
    repositoryMock.writeValues.mockImplementation((_ns, _name, tenantId, values) =>
      Promise.resolve(values.map((value) => ({ ...value, tenantId }))),
    );
  });

  it('responds 401 when there is no authenticated user', async () => {
    const res = await request(createApp(null)).get('/value/v1/test-service/values/test-value');
    expect(res.status).toBe(401);
  });

  describe('GET /:namespace/values', () => {
    it('responds with the latest value keyed by namespace and value name for a value-reader', async () => {
      repositoryMock.readValues.mockResolvedValueOnce({ results: [{ value: 120, tenantId }], page: {} });
      const res = await request(createApp(reader)).get('/value/v1/test-service/values');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ 'test-service': { 'test-value': { value: 120 } } });
    });

    it('responds 403 without the value-reader role', async () => {
      const res = await request(createApp(noRole)).get('/value/v1/test-service/values');
      expect(res.status).toBe(403);
      expect(res.body.errorMessage).toBeTruthy();
    });

    it('responds 404 for an unknown namespace', async () => {
      const res = await request(createApp(reader)).get('/value/v1/unknown/values');
      expect(res.status).toBe(404);
      expect(res.body.errorMessage).toContain('unknown');
    });

    it('responds 404 when none of the requested names have a definition', async () => {
      const res = await request(createApp(reader)).get('/value/v1/test-service/values?names=not-defined');
      expect(res.status).toBe(404);
    });

    it('responds 400 for a namespace longer than 50 characters', async () => {
      const res = await request(createApp(reader)).get(`/value/v1/${'a'.repeat(51)}/values`);
      expect(res.status).toBe(400);
    });
  });

  describe('GET /:namespace/values/:name', () => {
    it('defaults top to 10', async () => {
      const res = await request(createApp(reader)).get('/value/v1/test-service/values/test-value');
      expect(res.status).toBe(200);
      expect(repositoryMock.readValues).toHaveBeenCalledWith(10, undefined, expect.any(Object));
    });

    it.each(['0', '5001', 'abc'])('responds 400 for top=%s', async (top) => {
      const res = await request(createApp(reader)).get(`/value/v1/test-service/values/test-value?top=${top}`);
      expect(res.status).toBe(400);
      expect(res.body.errorMessage).toContain('top');
      expect(repositoryMock.readValues).not.toHaveBeenCalled();
    });

    it.each(['1', '5000'])('accepts top=%s', async (top) => {
      const res = await request(createApp(reader)).get(`/value/v1/test-service/values/test-value?top=${top}`);
      expect(res.status).toBe(200);
      expect(repositoryMock.readValues).toHaveBeenCalledWith(parseInt(top), undefined, expect.any(Object));
    });

    it('responds 400 for a timestampMin that is not ISO 8601', async () => {
      const res = await request(createApp(reader)).get(
        '/value/v1/test-service/values/test-value?timestampMin=yesterday',
      );
      expect(res.status).toBe(400);
    });

    it('responds 400 for a value name longer than 50 characters', async () => {
      const res = await request(createApp(reader)).get(`/value/v1/test-service/values/${'a'.repeat(51)}`);
      expect(res.status).toBe(400);
    });

    it('passes the value and url filters to the repository', async () => {
      await request(createApp(reader)).get('/value/v1/test-service/values/test-value?value=target-1&url=%2Fapi');
      expect(repositoryMock.readValues).toHaveBeenCalledWith(
        10,
        undefined,
        expect.objectContaining({ value: 'target-1', url: '/api' }),
      );
    });

    it('allows the export-service export-job role', async () => {
      const res = await request(createApp(user([ExportServiceRoles.ExportJob]))).get(
        '/value/v1/test-service/values/test-value',
      );
      expect(res.status).toBe(200);
    });

    it('responds 403 without the value-reader or export-job role', async () => {
      const res = await request(createApp(noRole)).get('/value/v1/test-service/values/test-value');
      expect(res.status).toBe(403);
    });

    it('allows a core user to read without a tenant context', async () => {
      const coreReader = user([ServiceUserRoles.Reader], { isCore: true, tenantId: undefined });
      const res = await request(createApp(coreReader, false)).get('/value/v1/test-service/values/test-value');
      expect(res.status).toBe(200);
    });

    it('responds 400 for a tenant user without a tenant context', async () => {
      const res = await request(createApp(reader, false)).get('/value/v1/test-service/values/test-value');
      expect(res.status).toBe(400);
      expect(res.body.errorMessage).toBe('Tenant context is required for operation.');
    });

    it('responds with records keyed by namespace and name, and a page', async () => {
      repositoryMock.readValues.mockResolvedValueOnce({
        results: [{ value: 120, tenantId }],
        page: { after: null, next: 'MTA=', size: 1 },
      });
      const res = await request(createApp(reader)).get('/value/v1/test-service/values/test-value');
      expect(res.body).toEqual({
        'test-service': { 'test-value': [{ value: 120 }] },
        page: { after: null, next: 'MTA=', size: 1 },
      });
    });
  });

  describe('GET /:namespace/values/:name/count', () => {
    it('responds with the count for a value-reader', async () => {
      repositoryMock.countValues.mockResolvedValueOnce(1024);
      const res = await request(createApp(reader)).get('/value/v1/test-service/values/test-value/count');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ namespace: 'test-service', name: 'test-value', count: 1024 });
    });

    it('responds 403 without the value-reader role', async () => {
      const res = await request(createApp(noRole)).get('/value/v1/test-service/values/test-value/count');
      expect(res.status).toBe(403);
    });

    it('responds 400 without a tenant context, even for a core user', async () => {
      const coreReader = user([ServiceUserRoles.Reader], { isCore: true, tenantId: undefined });
      const res = await request(createApp(coreReader, false)).get('/value/v1/test-service/values/test-value/count');
      expect(res.status).toBe(400);
    });

    it('responds 400 for a timestampMax that is not ISO 8601', async () => {
      const res = await request(createApp(reader)).get(
        '/value/v1/test-service/values/test-value/count?timestampMax=tomorrow',
      );
      expect(res.status).toBe(400);
    });
  });

  describe('GET /:namespace/values/:name/metrics', () => {
    it('defaults interval to daily and top to 100', async () => {
      const res = await request(createApp(reader)).get('/value/v1/test-service/values/test-value/metrics');
      expect(res.status).toBe(200);
      expect(repositoryMock.readMetrics).toHaveBeenCalledWith(
        tenantId,
        'test-service',
        'test-value',
        100,
        undefined,
        expect.objectContaining({ interval: 'daily' }),
      );
    });

    it.each(['0', '5001'])('responds 400 for top=%s', async (top) => {
      const res = await request(createApp(reader)).get(`/value/v1/test-service/values/test-value/metrics?top=${top}`);
      expect(res.status).toBe(400);
    });

    it('responds 403 without the value-reader role', async () => {
      const res = await request(createApp(noRole)).get('/value/v1/test-service/values/test-value/metrics');
      expect(res.status).toBe(403);
    });

    it('responds 400 without a tenant context', async () => {
      const res = await request(createApp(reader, false)).get('/value/v1/test-service/values/test-value/metrics');
      expect(res.status).toBe(400);
    });
  });

  describe('GET /:namespace/values/:name/metrics/:metric', () => {
    it('defaults interval to daily and top to 100', async () => {
      const res = await request(createApp(reader)).get('/value/v1/test-service/values/test-value/metrics/count');
      expect(res.status).toBe(200);
      expect(repositoryMock.readMetric).toHaveBeenCalledWith(
        tenantId,
        'test-service',
        'test-value',
        'count',
        100,
        undefined,
        expect.objectContaining({ interval: 'daily' }),
      );
    });

    it.each(['0', '5001'])('responds 400 for top=%s', async (top) => {
      const res = await request(createApp(reader)).get(
        `/value/v1/test-service/values/test-value/metrics/count?top=${top}`,
      );
      expect(res.status).toBe(400);
    });

    it('responds 403 without the value-reader role', async () => {
      const res = await request(createApp(noRole)).get('/value/v1/test-service/values/test-value/metrics/count');
      expect(res.status).toBe(403);
    });

    it('responds 400 without a tenant context', async () => {
      const res = await request(createApp(reader, false)).get('/value/v1/test-service/values/test-value/metrics/count');
      expect(res.status).toBe(400);
    });
  });

  describe('GET /:namespace/values/:name/platform-metrics', () => {
    it('allows a core user with the value-platform-metrics-reader role', async () => {
      const coreUser = user([ServiceUserRoles.PlatformMetricsReader], { isCore: true, tenantId: undefined });
      const res = await request(createApp(coreUser, false)).get(
        '/value/v1/test-service/values/test-value/platform-metrics',
      );
      expect(res.status).toBe(200);
    });

    it('responds 403 for a tenant user with the value-platform-metrics-reader role', async () => {
      const res = await request(createApp(user([ServiceUserRoles.PlatformMetricsReader]))).get(
        '/value/v1/test-service/values/test-value/platform-metrics',
      );
      expect(res.status).toBe(403);
      expect(res.body.errorMessage).toBeTruthy();
    });

    it('responds 403 for a core user with only the value-reader role', async () => {
      const coreReader = user([ServiceUserRoles.Reader], { isCore: true, tenantId: undefined });
      const res = await request(createApp(coreReader, false)).get(
        '/value/v1/test-service/values/test-value/platform-metrics',
      );
      expect(res.status).toBe(403);
    });
  });

  describe('POST /:namespace/values/:name', () => {
    it('writes a value envelope and responds with the written record', async () => {
      const res = await request(createApp(writer))
        .post('/value/v1/test-service/values/test-value')
        .send({
          correlationId: 'request-1',
          context: { endpoint: '/api' },
          timestamp: '2026-09-24T17:00:00.000Z',
          value: 120,
        });
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ correlationId: 'request-1', value: 120 });
      expect(res.body.tenantId).toBeUndefined();
    });

    it('writes a bare JSON object as the value', async () => {
      const res = await request(createApp(writer))
        .post('/value/v1/test-service/values/test-value')
        .send({ responseTime: 120 });
      expect(res.status).toBe(200);
      expect(res.body.value).toEqual({ responseTime: 120 });
    });

    it('responds with an array when the body is an array', async () => {
      const res = await request(createApp(writer))
        .post('/value/v1/test-service/values/test-value')
        .send([{ value: 120 }, { value: 95 }]);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it('skips records that fail the definition schema', async () => {
      validationServiceMock.validate.mockImplementation((_ctx, _key, value) => {
        if (value === 'bad') throw new Error('invalid');
      });
      const res = await request(createApp(writer))
        .post('/value/v1/test-service/values/test-value')
        .send([{ value: 120 }, { value: 'bad' }]);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].value).toBe(120);
    });

    it('responds 403 without the value-writer role', async () => {
      const res = await request(createApp(reader)).post('/value/v1/test-service/values/test-value').send({ value: 1 });
      expect(res.status).toBe(403);
      expect(repositoryMock.writeValues).not.toHaveBeenCalled();
    });

    it('responds 403 for a tenant user writing to another tenant', async () => {
      const res = await request(createApp(writer))
        .post('/value/v1/test-service/values/test-value')
        .send({ value: 1, tenantId: otherTenantId.toString() });
      expect(res.status).toBe(403);
    });

    it('allows a core user to write to a tenant specified by tenantId in the body', async () => {
      const coreWriter = user([ServiceUserRoles.Writer], { isCore: true, tenantId: undefined });
      const res = await request(createApp(coreWriter, false))
        .post('/value/v1/test-service/values/test-value')
        .send({ value: 1, tenantId: otherTenantId.toString() });
      expect(res.status).toBe(200);
      expect(repositoryMock.writeValues.mock.calls[0][2].toString()).toBe(otherTenantId.toString());
    });

    it('responds 400 for a timestamp that is not ISO 8601', async () => {
      const res = await request(createApp(writer))
        .post('/value/v1/test-service/values/test-value')
        .send({ value: 1, timestamp: 'now' });
      expect(res.status).toBe(400);
      expect(res.body.errorMessage).toContain('timestamp');
    });

    it('responds 400 for a context that is not an object', async () => {
      const res = await request(createApp(writer))
        .post('/value/v1/test-service/values/test-value')
        .send({ value: 1, context: 'not-an-object' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /service-metric-rollups/run', () => {
    const yesterday = () => new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const today = () => new Date().toISOString().slice(0, 10);

    it('rolls up the requested range for a value-writer', async () => {
      const res = await request(createApp(writer))
        .post('/value/v1/service-metric-rollups/run')
        .send({ start: '2026-09-01', end: '2026-09-07' });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ start: '2026-09-01', end: '2026-09-07', tenant: tenantId.toString(), rollups: 42 });
    });

    it('restricts a tenant user to their own tenant, ignoring tenantId', async () => {
      const res = await request(createApp(writer))
        .post('/value/v1/service-metric-rollups/run')
        .send({ start: yesterday(), tenantId: otherTenantId.toString() });
      expect(res.status).toBe(200);
      expect(res.body.tenant).toBe(tenantId.toString());
    });

    it('allows a core user to roll up a specific tenant', async () => {
      const coreWriter = user([ServiceUserRoles.Writer], { isCore: true, tenantId: undefined });
      const res = await request(createApp(coreWriter, false))
        .post('/value/v1/service-metric-rollups/run')
        .send({ start: yesterday(), tenantId: otherTenantId.toString() });
      expect(res.status).toBe(200);
      expect(res.body.tenant).toBe(otherTenantId.toString());
    });

    it('rolls up all tenants for a core user without tenantId', async () => {
      const coreWriter = user([ServiceUserRoles.Writer], { isCore: true, tenantId: undefined });
      const res = await request(createApp(coreWriter, false))
        .post('/value/v1/service-metric-rollups/run')
        .send({ start: yesterday() });
      expect(res.status).toBe(200);
      expect(res.body.tenant).toBeNull();
    });

    it('responds 400 for the current partial day', async () => {
      const res = await request(createApp(writer)).post('/value/v1/service-metric-rollups/run').send({ end: today() });
      expect(res.status).toBe(400);
    });

    it('responds 400 when start is after end', async () => {
      const res = await request(createApp(writer))
        .post('/value/v1/service-metric-rollups/run')
        .send({ start: '2026-09-07', end: '2026-09-01' });
      expect(res.status).toBe(400);
    });

    it('responds 400 for a start that is not ISO 8601', async () => {
      const res = await request(createApp(writer))
        .post('/value/v1/service-metric-rollups/run')
        .send({ start: 'last week' });
      expect(res.status).toBe(400);
    });

    it('responds 403 without the value-writer role', async () => {
      const res = await request(createApp(reader)).post('/value/v1/service-metric-rollups/run').send({});
      expect(res.status).toBe(403);
    });
  });
});
