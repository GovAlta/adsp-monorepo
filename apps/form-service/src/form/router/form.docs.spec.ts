import { adspId, User } from '@abgov/adsp-service-sdk';
import { createErrorHandler } from '@core-services/core-common';
import { createDocumentedResponseRecorder } from '@core-services/core-common/testing';
import axios from 'axios';
import * as express from 'express';
import { Express } from 'express';
import { join } from 'path';
import * as request from 'supertest';
import { Logger } from 'winston';
import { FormDefinitionEntity, FormSubmissionEntity } from '../model';
import { ExportServiceRoles, FormServiceRoles } from '../roles';
import { FormStatus } from '../types';
import { createFormDefinitionRouter } from './definition';
import { createFormRouter } from './form';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

// Verifies the request validation, roles, and error responses documented in form.swagger.yml by sending requests
// through the definition and form routers, as mounted in the service, with the real error handler.
describe('form routers documented behaviour', () => {
  const apiId = adspId`urn:ads:platform:form-service:v1`;
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const documented = createDocumentedResponseRecorder(join(__dirname, 'form.swagger.yml'));

  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const validationService = { validate: jest.fn(), setSchema: jest.fn() };
  const calendarService = { getScheduledIntake: jest.fn(), updateScheduleIntake: jest.fn() };
  const tenantService = {
    getTenant: jest.fn(),
    getTenants: jest.fn(),
    getTenantByName: jest.fn(),
    getTenantByRealm: jest.fn(),
  };
  const directoryMock = { getServiceUrl: jest.fn(), getResourceUrl: jest.fn() };
  const tokenProviderMock = { getAccessToken: jest.fn() };
  const formRepositoryMock = { find: jest.fn(), get: jest.fn(), save: jest.fn(), delete: jest.fn() };
  const submissionRepositoryMock = { find: jest.fn(), get: jest.fn(), save: jest.fn(), delete: jest.fn() };
  const eventServiceMock = { send: jest.fn() };

  const createDefinition = (settings = {}) =>
    new FormDefinitionEntity(validationService, calendarService as never, tenantId, {
      id: 'test',
      name: 'test-form-definition',
      description: '',
      formDraftUrlTemplate: 'https://my-form/{{ id }}',
      anonymousApply: false,
      applicantRoles: ['test-applicant'],
      assessorRoles: ['test-assessor'],
      clerkRoles: [],
      submissionRecords: true,
      submissionPdfTemplate: '',
      supportTopic: false,
      dataSchema: {},
      dispositionStates: [{ id: 'approved-state', name: 'approved', description: 'Approved' }],
      ...settings,
    } as never);
  const definition = createDefinition();
  const anonymousDefinition = createDefinition({ id: 'anonymous', anonymousApply: true });
  const definitions = { test: definition, anonymous: anonymousDefinition };

  const formId = '5f1e2d3c-4b5a-4f6e-8d7c-9b0a1c2d3e4f';
  const submissionId = '6a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d';
  const noteId = '7b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e';
  const unknownId = '8c4d5e6f-7a8b-4c9d-8e1f-2a3b4c5d6e7f';

  const createSubmission = () =>
    new FormSubmissionEntity(
      submissionRepositoryMock as never,
      tenantId,
      {
        id: submissionId,
        formId,
        formDefinitionId: 'test',
        created: new Date(),
        createdBy: { id: 'applicant', name: 'applicant' },
        updated: new Date(),
        updatedBy: { id: 'applicant', name: 'applicant' },
        formData: {},
        formFiles: {},
        disposition: null,
        notes: [{ id: noteId, content: 'Looks good.', created: new Date(), createdBy: { id: 'a', name: 'a' } }],
        hash: 'hash',
      } as never,
      definition,
    );

  const user = (id: string, roles: string[], overrides: Partial<User> = {}) =>
    ({ id, name: id, tenantId, isCore: false, roles, ...overrides }) as User;
  const admin = user('admin', [FormServiceRoles.Admin]);
  const assessor = user('assessor', ['test-assessor']);
  const applicant = user('applicant', ['test-applicant']);
  const exportJob = user('export-job', [ExportServiceRoles.ExportJob]);

  function createApp(currentUser: User | null, withTenant = true): Express {
    const app = express();
    app.use(documented.middleware);
    app.use(express.json());
    app.use((req, _res, next) => {
      req.user = currentUser;
      req.isAuthenticated = (() => !!currentUser) as typeof req.isAuthenticated;
      req.tenant = withTenant ? ({ id: tenantId } as typeof req.tenant) : undefined;
      req.getServiceConfiguration = jest.fn((id: string) => Promise.resolve([definitions[id]])) as never;
      req.getServiceConfigurationRevision = jest.fn((_version: string, id: string) =>
        Promise.resolve([definitions[id]]),
      ) as never;
      next();
    });
    app.use(
      '/form/v1',
      createFormDefinitionRouter({
        directory: directoryMock as never,
        tokenProvider: tokenProviderMock,
        tenantService: tenantService as never,
        calendarService: calendarService as never,
        logger: loggerMock,
      } as never),
    );
    app.use(
      '/form/v1',
      createFormRouter({
        apiId,
        logger: loggerMock,
        repository: formRepositoryMock as never,
        submissionRepository: submissionRepositoryMock as never,
        directory: directoryMock as never,
        tokenProvider: tokenProviderMock,
        eventService: eventServiceMock,
        notificationService: null,
        queueTaskService: null,
        fileService: null,
        commentService: null,
        pdfService: null,
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
    directoryMock.getServiceUrl.mockResolvedValue(new URL('https://configuration-service'));
    tokenProviderMock.getAccessToken.mockResolvedValue('token');
    axiosMock.get.mockResolvedValue({ data: { results: [], page: { size: 0 } } });
    formRepositoryMock.find.mockResolvedValue({ results: [], page: { size: 0 } });
    formRepositoryMock.get.mockResolvedValue({ id: formId, definition });
    submissionRepositoryMock.find.mockResolvedValue({ results: [], page: { size: 0 } });
    submissionRepositoryMock.get.mockImplementation((_tenantId, id: string) =>
      Promise.resolve(id === submissionId ? createSubmission() : null),
    );
    submissionRepositoryMock.save.mockImplementation((entity) => Promise.resolve(entity));
    submissionRepositoryMock.delete.mockResolvedValue(true);
    calendarService.updateScheduleIntake.mockResolvedValue(null);
  });

  describe('GET /definitions', () => {
    it('allows the form-service admin role', async () => {
      const res = await request(createApp(admin)).get('/form/v1/definitions?name=test');
      expect(res.status).toBe(200);
      expect(axiosMock.get).toHaveBeenCalledWith(
        'https://configuration-service/v2/configuration/form-service',
        expect.objectContaining({
          params: expect.objectContaining({ criteria: JSON.stringify({ nameContains: 'test' }) }),
        }),
      );
    });

    it('responds 403 without the form-service admin role', async () => {
      const res = await request(createApp(assessor)).get('/form/v1/definitions');
      expect(res.status).toBe(403);
    });

    it('responds 403 for an anonymous request', async () => {
      const res = await request(createApp(null)).get('/form/v1/definitions');
      expect(res.status).toBe(403);
    });

    it('responds 400 for a createDateAfter that is not ISO 8601', async () => {
      const res = await request(createApp(admin)).get('/form/v1/definitions?createDateAfter=yesterday');
      expect(res.status).toBe(400);
    });
  });

  describe('GET /definitions/:definitionId', () => {
    it.each([
      ['form-service admin', admin],
      ['applicant', applicant],
      ['intake-application', user('intake', [FormServiceRoles.IntakeApp])],
    ])('allows the %s role', async (_role, currentUser) => {
      const res = await request(createApp(currentUser)).get('/form/v1/definitions/test');
      expect(res.status).toBe(200);
      expect(res.body.id).toBe('test');
    });

    it('responds 403 for a user without an admin, intake, applicant, or clerk role', async () => {
      const res = await request(createApp(assessor)).get('/form/v1/definitions/test');
      expect(res.status).toBe(403);
    });

    it('allows an anonymous request for an anonymous definition with a tenantId', async () => {
      tenantService.getTenant.mockResolvedValueOnce({ id: tenantId });
      const res = await request(createApp(null, false)).get(
        `/form/v1/definitions/anonymous?tenantId=${encodeURIComponent(tenantId.toString())}`,
      );
      expect(res.status).toBe(200);
    });

    it('responds 400 for an anonymous request without a tenantId', async () => {
      const res = await request(createApp(null, false)).get('/form/v1/definitions/anonymous');
      expect(res.status).toBe(400);
    });

    it('responds 403 for an anonymous request for a definition that does not allow anonymous applications', async () => {
      const res = await request(createApp(null)).get('/form/v1/definitions/test');
      expect(res.status).toBe(403);
    });

    it('reads the requested revision', async () => {
      const app = createApp(admin);
      const res = await request(app).get('/form/v1/definitions/test?version=2');
      expect(res.status).toBe(200);
    });

    it('responds 404 for an unknown definition', async () => {
      const res = await request(createApp(admin)).get('/form/v1/definitions/unknown');
      expect(res.status).toBe(404);
    });

    it('responds 400 for a definition ID longer than 50 characters', async () => {
      const res = await request(createApp(admin)).get(`/form/v1/definitions/${'a'.repeat(51)}`);
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /definitions/:definitionId/schedule', () => {
    const schedule = {
      name: 'Fall intake',
      calendarEventId: 12,
      start: '2026-10-01T00:00:00.000Z',
      end: '2026-10-31T00:00:00.000Z',
    };

    it('allows the form-service admin role', async () => {
      const res = await request(createApp(admin)).put('/form/v1/definitions/test/schedule').send(schedule);
      expect(res.status).toBe(200);
      expect(calendarService.updateScheduleIntake).toHaveBeenCalled();
    });

    it('responds 403 without the form-service admin role', async () => {
      const res = await request(createApp(assessor)).put('/form/v1/definitions/test/schedule').send(schedule);
      expect(res.status).toBe(403);
    });

    it.each([
      ['name is missing', { name: undefined }],
      ['calendarEventId is not an integer', { calendarEventId: 'twelve' }],
      ['start is not ISO 8601', { start: 'tomorrow' }],
      ['end is missing', { end: undefined }],
    ])('responds 400 when %s', async (_case, change) => {
      const res = await request(createApp(admin))
        .put('/form/v1/definitions/test/schedule')
        .send({ ...schedule, ...change });
      expect(res.status).toBe(400);
    });

    it('responds 401 without an authenticated user', async () => {
      const res = await request(createApp(null)).put('/form/v1/definitions/test/schedule').send(schedule);
      expect(res.status).toBe(401);
    });
  });

  describe('GET /forms', () => {
    it('limits a user without an admin or assessor role to the forms they created, and defaults top to 10', async () => {
      const res = await request(createApp(applicant)).get('/form/v1/forms');
      expect(res.status).toBe(200);
      expect(formRepositoryMock.find).toHaveBeenCalledWith(
        10,
        undefined,
        expect.objectContaining({ createdByIdEquals: applicant.id }),
        null,
      );
    });

    it('responds 403 when a user without an admin or assessor role requests includeData', async () => {
      const res = await request(createApp(applicant)).get('/form/v1/forms?includeData=true');
      expect(res.status).toBe(403);
    });

    it.each([
      ['form-service admin', admin],
      ['export-job', exportJob],
    ])('lets the %s role find all forms', async (_role, currentUser) => {
      const res = await request(createApp(currentUser)).get('/form/v1/forms?includeData=true');
      expect(res.status).toBe(200);
      expect(formRepositoryMock.find.mock.calls[0][2].createdByIdEquals).toBeUndefined();
    });

    it('lets an assessor find the submitted forms of a definition', async () => {
      const criteria = encodeURIComponent(JSON.stringify({ definitionIdEquals: 'test' }));
      const res = await request(createApp(assessor)).get(`/form/v1/forms?criteria=${criteria}`);
      expect(res.status).toBe(200);
      expect(formRepositoryMock.find.mock.calls[0][2]).toMatchObject({ statusEquals: FormStatus.Submitted });
      expect(formRepositoryMock.find.mock.calls[0][2].createdByIdEquals).toBeUndefined();
    });

    it.each(['top=0', 'top=5001', 'includeData=yes', 'sortDirection=up', 'criteria=not-json'])(
      'responds 400 for %s',
      async (query) => {
        const res = await request(createApp(admin)).get(`/form/v1/forms?${query}`);
        expect(res.status).toBe(400);
      },
    );

    it('accepts top=5000', async () => {
      const res = await request(createApp(admin)).get('/form/v1/forms?top=5000');
      expect(res.status).toBe(200);
    });

    it('responds 400 for a criteria date that is not ISO 8601', async () => {
      const criteria = encodeURIComponent(JSON.stringify({ createDateBefore: 'yesterday' }));
      const res = await request(createApp(admin)).get(`/form/v1/forms?criteria=${criteria}`);
      expect(res.status).toBe(400);
    });

    it('responds 401 without an authenticated user', async () => {
      const res = await request(createApp(null)).get('/form/v1/forms');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /forms/:formId/submissions', () => {
    it.each([
      ['form-service admin', admin],
      ['assessor', assessor],
      ['export-job', exportJob],
    ])('allows the %s role and defaults top to 100', async (_role, currentUser) => {
      const res = await request(createApp(currentUser)).get(`/form/v1/forms/${formId}/submissions`);
      expect(res.status).toBe(200);
      expect(submissionRepositoryMock.find).toHaveBeenCalledWith(
        100,
        undefined,
        expect.objectContaining({ formIdEquals: formId }),
        null,
      );
    });

    it('responds 403 without an admin, assessor, or export-job role', async () => {
      const res = await request(createApp(applicant)).get(`/form/v1/forms/${formId}/submissions`);
      expect(res.status).toBe(403);
    });

    it.each(['top=0', 'top=5001'])('responds 400 for %s', async (query) => {
      const res = await request(createApp(admin)).get(`/form/v1/forms/${formId}/submissions?${query}`);
      expect(res.status).toBe(400);
    });

    it('responds 400 for a formId that is not a UUID', async () => {
      const res = await request(createApp(admin)).get('/form/v1/forms/not-a-uuid/submissions');
      expect(res.status).toBe(400);
    });
  });

  describe('GET /submissions', () => {
    it.each([
      ['form-service admin', admin],
      ['export-job', exportJob],
    ])('allows the %s role and defaults top to 100', async (_role, currentUser) => {
      const res = await request(createApp(currentUser)).get('/form/v1/submissions');
      expect(res.status).toBe(200);
      expect(submissionRepositoryMock.find).toHaveBeenCalledWith(100, undefined, expect.any(Object), null);
    });

    it('lets an assessor retrieve submissions of a definition with definitionIdEquals', async () => {
      const criteria = encodeURIComponent(JSON.stringify({ definitionIdEquals: 'test' }));
      const res = await request(createApp(assessor)).get(`/form/v1/submissions?criteria=${criteria}`);
      expect(res.status).toBe(200);
    });

    it('responds 403 for an assessor without definitionIdEquals', async () => {
      const res = await request(createApp(assessor)).get('/form/v1/submissions');
      expect(res.status).toBe(403);
    });

    it.each(['top=0', 'top=5001', 'sortDirection=up'])('responds 400 for %s', async (query) => {
      const res = await request(createApp(admin)).get(`/form/v1/submissions?${query}`);
      expect(res.status).toBe(400);
    });
  });

  describe.each([
    ['/submissions/:submissionId', (id: string) => `/form/v1/submissions/${id}`],
    ['/forms/:formId/submissions/:submissionId', (id: string) => `/form/v1/forms/${formId}/submissions/${id}`],
  ])('GET %s', (_path, url) => {
    it.each([
      ['form-service admin', admin],
      ['assessor', assessor],
    ])('allows the %s role', async (_role, currentUser) => {
      const res = await request(createApp(currentUser)).get(url(submissionId));
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(submissionId);
    });

    it('responds 403 without an admin or assessor role', async () => {
      const res = await request(createApp(applicant)).get(url(submissionId));
      expect(res.status).toBe(403);
    });

    it('responds 404 for an unknown submission', async () => {
      const res = await request(createApp(admin)).get(url(unknownId));
      expect(res.status).toBe(404);
    });

    it('responds 400 for a submission ID that is not a UUID', async () => {
      const res = await request(createApp(admin)).get(url('not-a-uuid'));
      expect(res.status).toBe(400);
      expect(submissionRepositoryMock.get).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /submissions/:submissionId', () => {
    it('allows the form-service admin role', async () => {
      const res = await request(createApp(admin)).delete(`/form/v1/submissions/${submissionId}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ deleted: true });
    });

    it('responds 403 for an assessor', async () => {
      const res = await request(createApp(assessor)).delete(`/form/v1/submissions/${submissionId}`);
      expect(res.status).toBe(403);
      expect(submissionRepositoryMock.delete).not.toHaveBeenCalled();
    });

    it('responds 400 for a submission ID that is not a UUID', async () => {
      const res = await request(createApp(admin)).delete('/form/v1/submissions/not-a-uuid');
      expect(res.status).toBe(400);
    });
  });

  describe('POST /forms/:formId/submissions/:submissionId (disposition)', () => {
    const url = `/form/v1/forms/${formId}/submissions/${submissionId}`;

    it.each([
      ['form-service admin', admin],
      ['assessor', assessor],
    ])('allows the %s role', async (_role, currentUser) => {
      const res = await request(createApp(currentUser))
        .post(url)
        .send({ dispositionStatus: 'approved', dispositionReason: 'Meets criteria.' });
      expect(res.status).toBe(200);
      expect(res.body.disposition).toMatchObject({ status: 'approved', reason: 'Meets criteria.' });
    });

    it('responds 400 when the status is the ID rather than the name of a disposition state', async () => {
      const res = await request(createApp(admin))
        .post(url)
        .send({ dispositionStatus: 'approved-state', dispositionReason: 'Meets criteria.' });
      expect(res.status).toBe(400);
    });

    it.each([
      ['dispositionStatus', { dispositionReason: 'Meets criteria.' }],
      ['dispositionReason', { dispositionStatus: 'approved' }],
    ])('responds 400 when %s is missing', async (_field, body) => {
      const res = await request(createApp(admin)).post(url).send(body);
      expect(res.status).toBe(400);
    });

    it('responds 403 without an admin or assessor role', async () => {
      const res = await request(createApp(applicant))
        .post(url)
        .send({ dispositionStatus: 'approved', dispositionReason: 'Meets criteria.' });
      expect(res.status).toBe(403);
    });

    it('responds 404 for an unknown submission', async () => {
      const res = await request(createApp(admin))
        .post(`/form/v1/forms/${formId}/submissions/${unknownId}`)
        .send({ dispositionStatus: 'approved', dispositionReason: 'Meets criteria.' });
      expect(res.status).toBe(404);
    });
  });

  describe('POST /forms/:formId/submissions/:submissionId/notes', () => {
    const url = `/form/v1/forms/${formId}/submissions/${submissionId}/notes`;

    it('allows an assessor to add a note', async () => {
      const res = await request(createApp(assessor)).post(url).send({ content: 'Called applicant.' });
      expect(res.status).toBe(200);
      expect(res.body.notes).toHaveLength(2);
    });

    it('accepts content of 5000 characters', async () => {
      const res = await request(createApp(assessor))
        .post(url)
        .send({ content: 'a'.repeat(5000) });
      expect(res.status).toBe(200);
    });

    it.each([
      ['longer than 5000 characters', 'a'.repeat(5001)],
      ['empty', ''],
      ['missing', undefined],
    ])('responds 400 when content is %s', async (_case, content) => {
      const res = await request(createApp(assessor)).post(url).send({ content });
      expect(res.status).toBe(400);
    });

    it('responds 403 without an admin or assessor role', async () => {
      const res = await request(createApp(applicant)).post(url).send({ content: 'Called applicant.' });
      expect(res.status).toBe(403);
    });

    it('responds 404 for an unknown submission', async () => {
      const res = await request(createApp(assessor))
        .post(`/form/v1/forms/${formId}/submissions/${unknownId}/notes`)
        .send({ content: 'Called applicant.' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /forms/:formId/submissions/:submissionId/notes/:noteId', () => {
    const url = (id: string) => `/form/v1/forms/${formId}/submissions/${submissionId}/notes/${id}`;

    it('allows an assessor to remove a note', async () => {
      const res = await request(createApp(assessor)).delete(url(noteId));
      expect(res.status).toBe(200);
      expect(res.body.notes).toHaveLength(0);
    });

    it('responds 404 for an unknown note', async () => {
      const res = await request(createApp(assessor)).delete(url(unknownId));
      expect(res.status).toBe(404);
    });

    it('responds 400 for a note ID that is not a UUID', async () => {
      const res = await request(createApp(assessor)).delete(url('not-a-uuid'));
      expect(res.status).toBe(400);
    });

    it('responds 403 without an admin or assessor role', async () => {
      const res = await request(createApp(applicant)).delete(url(noteId));
      expect(res.status).toBe(403);
    });
  });
});
