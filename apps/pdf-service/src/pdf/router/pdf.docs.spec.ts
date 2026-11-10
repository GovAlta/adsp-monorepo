import { adspId, User } from '@abgov/adsp-service-sdk';
import { createErrorHandler } from '@core-services/core-common';
import { createDocumentedResponseRecorder } from '@core-services/core-common/testing';
import axios from 'axios';
import * as express from 'express';
import { Express, RequestHandler } from 'express';
import { join } from 'path';
import * as request from 'supertest';
import { Logger } from 'winston';
import { PDF_GENERATION_QUEUED } from '../events';
import { ServiceRoles } from '../roles';
import { createPdfRouter } from './pdf';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

// Verifies the request validation, roles, and error responses documented in pdf.swagger.yml by sending requests
// through the router with the real error handler.
describe('pdf router documented behaviour', () => {
  const serviceId = adspId`urn:ads:platform:pdf-service`;
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/61f2e3a8c9b1d2e3f4a5b6c7`;
  const otherTenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/72a3f4b9d0c2e3f4a5b6c7d8`;
  const documented = createDocumentedResponseRecorder(join(__dirname, 'pdf.swagger.yml'));

  const jobId = '7696ed03-977e-4bde-af54-d823be00ffad';
  const unknownJobId = '8c4d5e6f-7a8b-4c9d-8e1f-2a3b4c5d6e7f';

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
  const tokenProviderMock = { getAccessToken: jest.fn().mockResolvedValue('token') };
  const auditServiceMock = { record: jest.fn(), query: jest.fn(), flush: jest.fn(), droppedEventCount: 0 };
  const directoryMock = {
    getServiceUrl: jest.fn().mockResolvedValue(new URL('https://configuration-service.adsp.alberta.ca/')),
    getResourceUrl: jest.fn(),
  };

  const templates = {
    'submission-summary': {
      tenantId,
      id: 'submission-summary',
      name: 'Submission summary',
      description: 'Provides a summary of the submission',
      template: '<p>Submitted by {{data.applicant.name}}</p>',
    },
  };

  const user = (roles: string[], overrides: Partial<User> = {}) =>
    ({ id: 'tester', name: 'Test User', tenantId, isCore: false, roles, ...overrides }) as User;
  const admin = user([ServiceRoles.Admin]);
  const generator = user([ServiceRoles.PdfGenerator]);
  const noRole = user([]);
  const coreGenerator = user([ServiceRoles.PdfGenerator], { tenantId: undefined, isCore: true });

  // Stands in for passport.authenticate in main.ts, which responds 401 without a valid bearer token.
  const authenticate: RequestHandler = (req, res, next) => (req.user ? next() : res.sendStatus(401));

  function createApp(currentUser: User | null): Express {
    const app = express();
    app.use(documented.middleware);
    app.use(express.json());
    app.use((req, _res, next) => {
      req.user = currentUser;
      req.tenant = currentUser?.tenantId ? ({ id: currentUser.tenantId } as typeof req.tenant) : undefined;
      req.getConfiguration = jest.fn().mockResolvedValue([templates]);
      next();
    });
    app.use('/pdf', authenticate);
    app.use(
      '/pdf/v1',
      createPdfRouter({
        serviceId,
        logger: loggerMock,
        repository: repositoryMock,
        queueService: queueServiceMock,
        eventService: eventServiceMock,
        fileService: fileServiceMock,
        directory: directoryMock,
        tokenProvider: tokenProviderMock,
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
    axiosMock.patch.mockResolvedValue({ data: {} });
    fileServiceMock.typeExists.mockResolvedValue(true);
    repositoryMock.create.mockImplementation((_user, jobTenantId) =>
      Promise.resolve({ id: jobId, tenantId: jobTenantId, status: 'queued' }),
    );
    repositoryMock.get.mockImplementation((id: string) =>
      Promise.resolve(
        id === jobId
          ? {
              id,
              tenantId,
              status: 'completed',
              result: {
                urn: 'urn:ads:platform:file-service:v1:/files/54e22556-d453-4626-ac6b-9bcadc577901',
                id: '54e22556-d453-4626-ac6b-9bcadc577901',
                filename: 'submission-summary-1234.pdf',
              },
            }
          : null,
      ),
    );
  });

  it('responds 401 when there is no authenticated user', async () => {
    const res = await request(createApp(null)).get('/pdf/v1/templates');
    expect(res.status).toBe(401);
  });

  describe('GET /templates', () => {
    it('lists templates for any authenticated user', async () => {
      const res = await request(createApp(noRole)).get('/pdf/v1/templates');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([expect.objectContaining({ id: 'submission-summary', name: 'Submission summary' })]);
    });
  });

  describe('POST /templates', () => {
    it('creates a template with an ID derived from the name', async () => {
      const res = await request(createApp(admin))
        .post('/pdf/v1/templates')
        .send({ name: '  Application  receipt ', description: 'Receipt' });
      expect(res.status).toBe(201);
      expect(res.body).toEqual(
        expect.objectContaining({ id: 'application-receipt', name: 'Application  receipt', template: '' }),
      );
      expect(axiosMock.patch).toHaveBeenCalledWith(
        expect.stringContaining('v2/configuration/platform/pdf-service'),
        expect.objectContaining({ operation: 'UPDATE' }),
        expect.objectContaining({ params: { tenantId: tenantId.toString() } }),
      );
    });

    it('responds 400 when the name has invalid characters', async () => {
      const res = await request(createApp(admin)).post('/pdf/v1/templates').send({ name: 'bad_name!' });
      expect(res.status).toBe(400);
      expect(res.body.errorMessage).toContain('name (body)');
    });

    it('responds 403 without the pdf-admin role', async () => {
      const res = await request(createApp(generator)).post('/pdf/v1/templates').send({ name: 'New template' });
      expect(res.status).toBe(403);
    });

    it('responds 409 when a template with the ID already exists', async () => {
      const res = await request(createApp(admin)).post('/pdf/v1/templates').send({ name: 'Submission summary' });
      expect(res.status).toBe(409);
      expect(res.body).toEqual({ error: "PDF template 'Submission summary' already exists." });
      expect(axiosMock.patch).not.toHaveBeenCalled();
    });
  });

  describe('GET /templates/:templateId', () => {
    it('gets a template for any authenticated user', async () => {
      const res = await request(createApp(noRole)).get('/pdf/v1/templates/submission-summary');
      expect(res.status).toBe(200);
      expect(res.body.id).toBe('submission-summary');
    });

    it('responds 400 when the template ID is too long', async () => {
      const res = await request(createApp(noRole)).get(`/pdf/v1/templates/${'a'.repeat(51)}`);
      expect(res.status).toBe(400);
    });

    it('responds 404 for an unknown template', async () => {
      const res = await request(createApp(noRole)).get('/pdf/v1/templates/unknown');
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /templates/:templateId', () => {
    it('updates only the fields in the request and responds 201', async () => {
      const res = await request(createApp(admin))
        .patch('/pdf/v1/templates/submission-summary')
        .send({ footer: '<p>Government of Alberta</p>' });
      expect(res.status).toBe(201);
      expect(res.body).toEqual(
        expect.objectContaining({
          id: 'submission-summary',
          name: 'Submission summary',
          footer: '<p>Government of Alberta</p>',
        }),
      );
    });

    it('responds 400 when a field is not a string', async () => {
      const res = await request(createApp(admin)).patch('/pdf/v1/templates/submission-summary').send({ header: 1 });
      expect(res.status).toBe(400);
    });

    it('responds 403 without the pdf-admin role', async () => {
      const res = await request(createApp(generator)).patch('/pdf/v1/templates/submission-summary').send({});
      expect(res.status).toBe(403);
    });

    it('responds 404 for an unknown template, before checking the role', async () => {
      const res = await request(createApp(noRole)).patch('/pdf/v1/templates/unknown').send({});
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /templates/:templateId', () => {
    it('deletes a template', async () => {
      const res = await request(createApp(admin)).delete('/pdf/v1/templates/submission-summary');
      expect(res.status).toBe(204);
      expect(axiosMock.patch).toHaveBeenCalledWith(
        expect.any(String),
        { operation: 'DELETE', property: 'submission-summary' },
        expect.any(Object),
      );
    });

    it('responds 400 when the template ID is too long', async () => {
      const res = await request(createApp(admin)).delete(`/pdf/v1/templates/${'a'.repeat(51)}`);
      expect(res.status).toBe(400);
    });

    it('responds 403 without the pdf-admin role', async () => {
      const res = await request(createApp(generator)).delete('/pdf/v1/templates/submission-summary');
      expect(res.status).toBe(403);
    });

    it('responds 404 for an unknown template', async () => {
      const res = await request(createApp(admin)).delete('/pdf/v1/templates/unknown');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /jobs', () => {
    const body = {
      operation: 'generate',
      templateId: 'submission-summary',
      filename: 'submission-summary-1234.pdf',
      fileType: 'submission-documents',
      data: { applicant: { name: 'Test User' } },
    };

    it('queues a job and sends the queued event', async () => {
      const res = await request(createApp(generator)).post('/pdf/v1/jobs').send(body);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        urn: `${serviceId}:v1:/jobs/${jobId}`,
        id: jobId,
        status: 'queued',
        result: null,
      });
      expect(queueServiceMock.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({ jobId, tenantId: tenantId.toString(), recordId: jobId }),
      );
      expect(eventServiceMock.send).toHaveBeenCalledWith(expect.objectContaining({ name: PDF_GENERATION_QUEUED }));
    });

    it('responds 400 when the filename is missing', async () => {
      const res = await request(createApp(generator))
        .post('/pdf/v1/jobs')
        .send({ ...body, filename: undefined });
      expect(res.status).toBe(400);
    });

    it('responds 400 when the file type cannot be found', async () => {
      fileServiceMock.typeExists.mockResolvedValueOnce(false);
      const res = await request(createApp(generator)).post('/pdf/v1/jobs').send(body);
      expect(res.status).toBe(400);
      expect(res.body.errorMessage).toBe("Specified target file type 'submission-documents' cannot be found.");
    });

    it('responds 403 without the pdf-generator role', async () => {
      const res = await request(createApp(admin)).post('/pdf/v1/jobs').send(body);
      expect(res.status).toBe(403);
    });

    it('responds 404 for an unknown template', async () => {
      const res = await request(createApp(generator))
        .post('/pdf/v1/jobs')
        .send({ ...body, templateId: 'unknown' });
      expect(res.status).toBe(404);
    });
  });

  describe('GET /jobs/:jobId', () => {
    it('gets a job of the tenant', async () => {
      const res = await request(createApp(generator)).get(`/pdf/v1/jobs/${jobId}`);
      expect(res.status).toBe(200);
      expect(res.body.result.id).toBe('54e22556-d453-4626-ac6b-9bcadc577901');
    });

    it('responds 400 when the job ID is not a UUID', async () => {
      const res = await request(createApp(generator)).get('/pdf/v1/jobs/not-a-uuid');
      expect(res.status).toBe(400);
    });

    it('responds 403 for a job of another tenant', async () => {
      const res = await request(createApp(user([ServiceRoles.PdfGenerator], { tenantId: otherTenantId }))).get(
        `/pdf/v1/jobs/${jobId}`,
      );
      expect(res.status).toBe(403);
    });

    it('responds 403 for a core user', async () => {
      const res = await request(createApp(coreGenerator)).get(`/pdf/v1/jobs/${jobId}`);
      expect(res.status).toBe(403);
    });

    it('responds 404 for an unknown or expired job', async () => {
      const res = await request(createApp(generator)).get(`/pdf/v1/jobs/${unknownJobId}`);
      expect(res.status).toBe(404);
    });
  });
});
