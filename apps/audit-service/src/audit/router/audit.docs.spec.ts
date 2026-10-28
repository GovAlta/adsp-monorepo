import { adspId, ConfigurationService, User } from '@abgov/adsp-service-sdk';
import { assertAuthenticatedHandler, createErrorHandler } from '@core-services/core-common';
import { createDocumentedResponseRecorder } from '@core-services/core-common/testing';
import * as express from 'express';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import * as request from 'supertest';
import { createLogger, transports } from 'winston';
import { CatalogService, RetentionService } from '../model';
import { AuditServiceRoles } from '../roles';
import { EventReader, EventSubmitter } from '../types';
import { MAX_JSON_FIELD_BYTES } from '../utils/event-validation';
import { createAuditJsonParser, MAX_BATCH_EVENTS } from '../utils/request-validation';
import { assertTenantContext, createAuditRouter, validateTenantContext } from './index';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const swaggerJSDoc = require('swagger-jsdoc');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const SwaggerParser = require('swagger-parser');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const swaggerDefinition = require('../../../swagger.config');

// Compiles the same sources as the webpack build, so that the documentation is checked as it is served.
function compileSpecification() {
  return swaggerJSDoc({ swaggerDefinition, apis: [join(__dirname, '*.swagger.yml')] });
}

describe('audit service API documentation', () => {
  const logger = createLogger({ transports: [new transports.Console({ silent: true })] });
  const tenant = adspId`urn:ads:platform:tenant-service:v2:/tenants/case-team`;
  const configuration: jest.Mocked<ConfigurationService> = {
    getConfiguration: jest.fn(),
    getServiceConfiguration: jest.fn(),
    getServiceConfigurationRevision: jest.fn(),
  };
  const submitter: jest.Mocked<EventSubmitter> = { submit: jest.fn() };
  const reader: jest.Mocked<EventReader> = { find: jest.fn(), get: jest.fn() };

  const router = createAuditRouter({
    catalogs: new CatalogService(configuration, logger),
    retention: new RetentionService(configuration, logger),
    logger,
    submitter,
    reader,
  });

  describe('specification', () => {
    it('is a valid OpenAPI document', async () => {
      await expect(SwaggerParser.validate(JSON.parse(JSON.stringify(compileSpecification())))).resolves.toBeDefined();
    });

    it('documents exactly the routes the router serves', () => {
      const served = router.stack
        .filter((layer) => layer.route)
        .flatMap((layer) =>
          Object.keys((layer.route as unknown as { methods: Record<string, boolean> }).methods).map(
            (method) => `${method} /audit/v1${layer.route.path.replace(/:(\w+)/g, '{$1}')}`,
          ),
        )
        .sort();
      const documented = Object.entries(compileSpecification().paths)
        .flatMap(([path, operations]) => Object.keys(operations as object).map((method) => `${method} ${path}`))
        .sort();

      expect(served).toHaveLength(8);
      expect(documented).toEqual(served);
    });

    it('documents the write limits that the implementation enforces', () => {
      const specification = compileSpecification();
      const write = specification.paths['/audit/v1/{namespace}/events'].post;
      const eventsSchema = write.requestBody.content['application/json'].schema.properties.events;

      expect(eventsSchema.maxItems).toBe(MAX_BATCH_EVENTS);
      expect(MAX_JSON_FIELD_BYTES).toBe(16 * 1024);
      expect(write.description).toContain('16 KiB');
      expect(write.description).toContain('does not mean every event was stored');
    });

    it('documents every error status for each operation', () => {
      const specification = compileSpecification();
      const missing = Object.entries(specification.paths).flatMap(([path, operations]) =>
        Object.entries(operations as Record<string, { responses: Record<string, unknown> }>)
          .filter(([, operation]) => !['401', '403', '503'].every((status) => status in operation.responses))
          .map(([method]) => `${method} ${path}`),
      );

      expect(missing).toEqual([]);
    });
  });

  describe('responses', () => {
    let directory: string;
    let documented: ReturnType<typeof createDocumentedResponseRecorder>;

    const writer: User = {
      id: 'case-writer',
      name: 'Case writer',
      email: '',
      isCore: false,
      roles: [AuditServiceRoles.Writer, AuditServiceRoles.Reader],
      tenantId: tenant,
      token: {
        azp: 'urn:ads:case-team:case-service',
        aud: 'urn:ads:platform:audit-service',
        iss: 'tenant-issuer',
        bearer: 'test',
        email_verified: false,
      },
    };

    function createApp(caller: User | null = writer) {
      const app = express();
      app.use(documented.middleware);
      app.use(createAuditJsonParser());
      app.use((req, _res, next) => {
        req.user = caller;
        req.isAuthenticated = (): this is Express.AuthenticatedRequest => !!caller;
        next();
      });
      app.use(assertAuthenticatedHandler, validateTenantContext, assertTenantContext);
      app.use((req, _res, next) => {
        if (caller?.tenantId) req.tenant = { id: caller.tenantId, name: 'Audit tenant', realm: 'audit-tenant' };
        next();
      });
      app.use('/audit/v1', router);
      app.use(createErrorHandler(logger));
      return app;
    }

    beforeAll(() => {
      directory = mkdtempSync(join(tmpdir(), 'audit-docs-'));
      const file = join(directory, 'swagger.json');
      writeFileSync(file, JSON.stringify(compileSpecification()));
      documented = createDocumentedResponseRecorder(file);
    });

    afterAll(() => {
      rmSync(directory, { recursive: true, force: true });
    });

    beforeEach(() => {
      jest.resetAllMocks();
      configuration.getServiceConfiguration.mockResolvedValue(null);
      reader.find.mockResolvedValue([]);
      reader.get.mockResolvedValue(null);
      submitter.submit.mockResolvedValue(new Map());
    });

    afterEach(async () => {
      await documented.assertDocumented();
    });

    it('responds 202 to a write with no valid events', async () => {
      const result = await request(createApp())
        .post('/audit/v1/case-service/events')
        .send({ events: [{ eventId: 'not-a-uuid' }] })
        .expect(202);

      expect(result.body.rejected).toHaveLength(1);
    });

    it('responds 403 to a write in a namespace the caller does not own', async () => {
      await request(createApp())
        .post('/audit/v1/payment-service/events')
        .send({ events: [] })
        .expect(403);
    });

    it('responds 403 to a write without audit-writer', async () => {
      await request(createApp({ ...writer, roles: [AuditServiceRoles.Reader] }))
        .post('/audit/v1/case-service/events')
        .send({ events: [] })
        .expect(403);
    });

    it('responds 400 to an invalid write envelope', async () => {
      await request(createApp()).post('/audit/v1/case-service/events').send({ events: [] }).expect(400);
    });

    it('responds 401 to an unauthenticated request', async () => {
      await request(createApp(null)).get('/audit/v1/events').expect(401);
    });

    it('responds 200 to event listings', async () => {
      await request(createApp()).get('/audit/v1/events').expect(200);
      await request(createApp()).get('/audit/v1/case-service/events').expect(200);
    });

    it('responds 404 to a missing event and to an unregistered catalog', async () => {
      await request(createApp()).get('/audit/v1/case-service/events/0b9f6a8e-5d8c-4f6f-9a52-7c2d1f0e4b11').expect(404);
      await request(createApp()).get('/audit/v1/case-service/actions').expect(404);
    });
  });
});
