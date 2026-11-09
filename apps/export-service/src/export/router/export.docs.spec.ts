import { adspId, AdspId, User } from '@abgov/adsp-service-sdk';
import { createErrorHandler } from '@core-services/core-common';
import { createDocumentedResponseRecorder } from '@core-services/core-common/testing';
import { FileResult, JobState } from '@core-services/job-common';
import * as express from 'express';
import { Express, Request } from 'express';
import { Passport } from 'passport';
import { Strategy } from 'passport-strategy';
import { join } from 'path';
import * as request from 'supertest';
import { Logger } from 'winston';
import { ExportServiceConfiguration } from '../configuration';
import { ServiceRoles } from '../roles';
import { createExportRouter } from './export';

// Stands in for the SDK tenant and core strategies: authenticates the bearer token as the named test user.
class TestStrategy extends Strategy {
  constructor(private users: Record<string, User>) {
    super();
  }

  override authenticate(req: Request) {
    const user = this.users[req.headers.authorization?.replace(/^Bearer /, '')];
    if (user) {
      this.success(user);
    } else {
      this.fail(401);
    }
  }
}

// Verifies the roles, request validation, and error responses documented in export.swagger.yml by sending requests
// through the export router as mounted in the service, with the real error handler.
describe('export router documented behaviour', () => {
  const serviceId = adspId`urn:ads:platform:export-service`;
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/61f2e3a8c9b1d2e3f4a5b6c7`;
  const tenant = { id: tenantId, name: 'My Tenant', realm: 'my-tenant' };
  const jobId = 'a66ccc16-28fc-44fb-a499-d12df0262b8b';
  const documented = createDocumentedResponseRecorder(join(__dirname, 'export.swagger.yml'));

  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;
  const repositoryMock = { create: jest.fn(), get: jest.fn(), update: jest.fn() };
  const eventServiceMock = { send: jest.fn() };
  const fileServiceMock = { typeExists: jest.fn(), upload: jest.fn() };
  const queueServiceMock = { enqueue: jest.fn(), getItems: jest.fn(), isConnected: jest.fn() };

  const tenantUser = (id: string, roles: string[]) =>
    ({ id, name: 'Test User', tenantId, isCore: false, roles }) as unknown as User;
  const users: Record<string, User> = {
    exporter: tenantUser('3f1b2c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d', [ServiceRoles.Exporter]),
    'form-admin': tenantUser('8a7b6c5d-4e3f-4a2b-9c1d-0e9f8a7b6c5d', ['urn:ads:platform:form-service:form-admin']),
    plain: tenantUser('5d4c3b2a-1f0e-4d9c-8b7a-6f5e4d3c2b1a', []),
    core: {
      id: '9e8d7c6b-5a4f-4e3d-8c2b-1a0f9e8d7c6b',
      name: 'Core User',
      isCore: true,
      roles: [ServiceRoles.Exporter],
    } as unknown as User,
  };

  const configuration = new ExportServiceConfiguration(
    { sources: { 'urn:ads:platform:form-service': { exporterRoles: ['urn:ads:platform:form-service:form-admin'] } } },
    tenantId,
  );

  const job = (createdBy: User): JobState<FileResult> => ({
    tenantId,
    id: jobId,
    createdBy: { id: createdBy.id, name: createdBy.name },
    status: 'completed',
    result: {
      urn: 'urn:ads:platform:file-service:v1:/files/51091c0d-15ce-4e93-81ab-1c6e546c667c',
      id: '51091c0d-15ce-4e93-81ab-1c6e546c667c',
      filename: 'Exports-2022-02-19.csv',
    },
  });

  function createApp(): Express {
    const passport = new Passport();
    passport.use('tenant', new TestStrategy(users));

    const app = express();
    app.use(documented.middleware);
    app.use(express.json());
    app.use(passport.initialize());
    app.use('/export', passport.authenticate(['tenant'], { session: false }), (req, _res, next) => {
      // tenantHandler sets the tenant from the token for tenant users, and from tenantId for core users.
      req.tenant = !req.user.isCore || req.query.tenantId ? tenant : undefined;
      req.getServiceConfiguration = jest.fn().mockResolvedValue(configuration) as typeof req.getServiceConfiguration;
      next();
    });
    app.use(
      '/export/v1',
      createExportRouter({
        serviceId,
        logger: loggerMock,
        eventService: eventServiceMock,
        fileService: fileServiceMock,
        repository: repositoryMock,
        queueService: queueServiceMock,
      }),
    );
    app.use(createErrorHandler(loggerMock));
    return app;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    repositoryMock.create.mockImplementation((user: User, jobTenantId: AdspId) =>
      Promise.resolve({
        tenantId: jobTenantId,
        id: jobId,
        createdBy: { id: user.id, name: user.name },
        status: 'queued',
      }),
    );
  });

  afterEach(async () => {
    await documented.assertDocumented();
  });

  describe('POST /export/v1/jobs', () => {
    const csvExport = {
      resourceId: 'urn:ads:platform:task-service:v1:/tasks',
      format: 'csv',
      filename: 'Tasks-2026-10-01',
      formatOptions: { columns: ['id', 'name'] },
    };

    it('queues an export job for a user with the exporter role', async () => {
      const res = await request(createApp())
        .post('/export/v1/jobs')
        .set('Authorization', 'Bearer exporter')
        .send(csvExport);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        urn: `${serviceId}:v1:/jobs/${jobId}`,
        id: jobId,
        status: 'queued',
        result: null,
      });
      expect(queueServiceMock.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: `${tenantId}`,
          resultsPath: 'results',
          fileType: 'export-file',
          filename: 'Tasks-2026-10-01',
        }),
      );
    });

    it('queues an export job for a user with an exporter role configured for the source', async () => {
      fileServiceMock.typeExists.mockResolvedValueOnce(true);

      const res = await request(createApp())
        .post('/export/v1/jobs')
        .set('Authorization', 'Bearer form-admin')
        .send({ resourceId: 'urn:ads:platform:form-service:v1:/forms', format: 'json', fileType: 'form-export' });

      expect(res.status).toBe(200);
      expect(fileServiceMock.typeExists).toHaveBeenCalledWith(tenantId, 'form-export');
    });

    it('queues an export job in the tenantId tenant for a core user', async () => {
      const res = await request(createApp())
        .post(`/export/v1/jobs?tenantId=${tenantId}`)
        .set('Authorization', 'Bearer core')
        .send(csvExport);

      expect(res.status).toBe(200);
      expect(repositoryMock.create).toHaveBeenCalledWith(users.core, tenantId);
    });

    it('returns 400 for an invalid format', async () => {
      const res = await request(createApp())
        .post('/export/v1/jobs')
        .set('Authorization', 'Bearer exporter')
        .send({ ...csvExport, format: 'xlsx' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when resourceId is not an ADSP URN', async () => {
      const res = await request(createApp())
        .post('/export/v1/jobs')
        .set('Authorization', 'Bearer exporter')
        .send({ ...csvExport, resourceId: 'https://task-service.adsp.alberta.ca/task/v1/tasks' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when the file type does not exist', async () => {
      fileServiceMock.typeExists.mockResolvedValueOnce(false);

      const res = await request(createApp())
        .post('/export/v1/jobs')
        .set('Authorization', 'Bearer exporter')
        .send({ ...csvExport, fileType: 'task-export-file' });

      expect(res.status).toBe(400);
      expect(repositoryMock.create).not.toHaveBeenCalled();
    });

    it('returns 401 without a bearer token', async () => {
      const res = await request(createApp()).post('/export/v1/jobs').send(csvExport);

      expect(res.status).toBe(401);
    });

    it('returns 403 for a user without an exporter role', async () => {
      const res = await request(createApp())
        .post('/export/v1/jobs')
        .set('Authorization', 'Bearer plain')
        .send(csvExport);

      expect(res.status).toBe(403);
      expect(queueServiceMock.enqueue).not.toHaveBeenCalled();
    });

    it('returns 403 for a source exporter role used on a different source', async () => {
      const res = await request(createApp())
        .post('/export/v1/jobs')
        .set('Authorization', 'Bearer form-admin')
        .send(csvExport);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /export/v1/jobs/{jobId}', () => {
    it('returns the job to the user who created it', async () => {
      repositoryMock.get.mockResolvedValueOnce(job(users.plain));

      const res = await request(createApp()).get(`/export/v1/jobs/${jobId}`).set('Authorization', 'Bearer plain');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          id: jobId,
          status: 'completed',
          result: expect.objectContaining({ id: expect.any(String) }),
        }),
      );
    });

    it('returns the job to a user with the exporter role', async () => {
      repositoryMock.get.mockResolvedValueOnce(job(users['form-admin']));

      const res = await request(createApp()).get(`/export/v1/jobs/${jobId}`).set('Authorization', 'Bearer exporter');

      expect(res.status).toBe(200);
    });

    it('returns the job to the core user who created it', async () => {
      repositoryMock.get.mockResolvedValueOnce(job(users.core));

      const res = await request(createApp()).get(`/export/v1/jobs/${jobId}`).set('Authorization', 'Bearer core');

      expect(res.status).toBe(200);
    });

    it('returns 400 when jobId is not a UUID', async () => {
      const res = await request(createApp()).get('/export/v1/jobs/not-a-uuid').set('Authorization', 'Bearer exporter');

      expect(res.status).toBe(400);
      expect(repositoryMock.get).not.toHaveBeenCalled();
    });

    it('returns 401 without a bearer token', async () => {
      const res = await request(createApp()).get(`/export/v1/jobs/${jobId}`);

      expect(res.status).toBe(401);
    });

    it('returns 403 for a user who did not create the job and does not have the exporter role', async () => {
      repositoryMock.get.mockResolvedValueOnce(job(users.exporter));

      const res = await request(createApp()).get(`/export/v1/jobs/${jobId}`).set('Authorization', 'Bearer plain');

      expect(res.status).toBe(403);
    });

    it('returns 404 when the job does not exist or has expired', async () => {
      repositoryMock.get.mockResolvedValueOnce(null);

      const res = await request(createApp()).get(`/export/v1/jobs/${jobId}`).set('Authorization', 'Bearer exporter');

      expect(res.status).toBe(404);
      expect(res.body.errorMessage).toBe(`export job with ID '${jobId}' could not be found.`);
    });
  });
});
