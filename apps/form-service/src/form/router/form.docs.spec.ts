import { adspId, User } from '@abgov/adsp-service-sdk';
import { createErrorHandler } from '@core-services/core-common';
import { createDocumentedResponseRecorder } from '@core-services/core-common/testing';
import axios from 'axios';
import * as express from 'express';
import { Express } from 'express';
import { join } from 'path';
import * as request from 'supertest';
import { Logger } from 'winston';
import { FormDefinitionEntity, FormEntity, FormSubmissionEntity } from '../model';
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
  const notificationServiceMock = {
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    sendCode: jest.fn(),
    verifyCode: jest.fn(),
    getSubscriber: jest.fn(),
  };

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
  const scheduledDefinition = createDefinition({ id: 'scheduled', scheduledIntakes: true });
  const definitions = { test: definition, anonymous: anonymousDefinition, scheduled: scheduledDefinition };

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

  const createForm = (status = FormStatus.Draft, createdById = 'applicant') =>
    new FormEntity(formRepositoryMock as never, tenantId, definition, null, {
      id: formId,
      formDraftUrl: `https://my-form/${formId}`,
      anonymousApplicant: false,
      created: new Date(),
      createdBy: { id: createdById, name: createdById },
      locked: status === FormStatus.Locked ? new Date() : null,
      submitted: status === FormStatus.Submitted ? new Date() : null,
      lastAccessed: new Date(),
      status,
      data: {},
      files: {},
    } as never);

  const user = (id: string, roles: string[], overrides: Partial<User> = {}) =>
    ({ id, name: id, tenantId, isCore: false, roles, ...overrides }) as User;
  const admin = user('admin', [FormServiceRoles.Admin]);
  const assessor = user('assessor', ['test-assessor']);
  const applicant = user('applicant', ['test-applicant']);
  const exportJob = user('export-job', [ExportServiceRoles.ExportJob]);
  const intakeApp = user('intake', [FormServiceRoles.IntakeApp]);
  const noRoles = user('no-roles', []);

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
        auditService: {
          record: jest.fn().mockResolvedValue({ status: 'recorded', eventId: 'event' }),
          query: jest.fn(),
          flush: jest.fn(),
          droppedEventCount: 0,
        },
        notificationService: notificationServiceMock as never,
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
    formRepositoryMock.get.mockImplementation((_tenantId, id: string) =>
      Promise.resolve(id === formId ? createForm() : null),
    );
    formRepositoryMock.save.mockImplementation((entity) => Promise.resolve(entity));
    formRepositoryMock.delete.mockResolvedValue(true);
    submissionRepositoryMock.find.mockResolvedValue({ results: [], page: { size: 0 } });
    submissionRepositoryMock.get.mockImplementation((_tenantId, id: string) =>
      Promise.resolve(id === submissionId ? createSubmission() : null),
    );
    submissionRepositoryMock.save.mockImplementation((entity) => Promise.resolve(entity));
    submissionRepositoryMock.delete.mockResolvedValue(true);
    calendarService.updateScheduleIntake.mockResolvedValue(null);
    calendarService.getScheduledIntake.mockResolvedValue(undefined);
    notificationServiceMock.subscribe.mockResolvedValue({
      urn: adspId`urn:ads:platform:notification-service:v1:/subscribers/applicant`,
      addressAs: 'applicant',
      channels: [],
    });
    axiosMock.patch.mockImplementation((_url, body: { configuration: Record<string, unknown> }) =>
      Promise.resolve({ data: { latest: { revision: 2, configuration: body.configuration } } }),
    );
    axiosMock.delete.mockResolvedValue({ data: { deleted: true } });
  });

  // Every operation other than reading definitions requires a signed-in user.
  describe.each([
    ['post', '/form/v1/definitions'],
    ['put', '/form/v1/definitions/test'],
    ['patch', '/form/v1/definitions/test'],
    ['delete', '/form/v1/definitions/test'],
    ['put', '/form/v1/definitions/test/schemas'],
    ['put', '/form/v1/definitions/test/roles'],
    ['patch', '/form/v1/definitions/test/lifecycle'],
    ['patch', '/form/v1/definitions/test/submission-actions'],
    ['post', '/form/v1/forms'],
    ['get', `/form/v1/forms/${formId}`],
    ['post', `/form/v1/forms/${formId}`],
    ['delete', `/form/v1/forms/${formId}`],
    ['get', `/form/v1/forms/${formId}/data`],
    ['put', `/form/v1/forms/${formId}/data`],
    ['get', '/form/v1/submissions'],
    ['get', `/form/v1/submissions/${submissionId}`],
    ['delete', `/form/v1/submissions/${submissionId}`],
    ['get', `/form/v1/forms/${formId}/submissions`],
    ['get', `/form/v1/forms/${formId}/submissions/${submissionId}`],
    ['post', `/form/v1/forms/${formId}/submissions/${submissionId}`],
    ['post', `/form/v1/forms/${formId}/submissions/${submissionId}/notes`],
    ['delete', `/form/v1/forms/${formId}/submissions/${submissionId}/notes/${noteId}`],
  ])('%s %s', (method: 'get' | 'post' | 'put' | 'patch' | 'delete', url: string) => {
    it('responds 401 without an authenticated user', async () => {
      const res = await request(createApp(null))[method](url).send({});
      expect(res.status).toBe(401);
    });
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

    it('responds 400 for a definition that does not exist', async () => {
      const res = await request(createApp(admin)).put('/form/v1/definitions/unknown/schedule').send(schedule);
      expect(res.status).toBe(400);
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

    it('accepts the ID of a disposition state', async () => {
      const res = await request(createApp(admin))
        .post(url)
        .send({ dispositionStatus: 'approved-state', dispositionReason: 'Meets criteria.' });
      expect(res.status).toBe(200);
      expect(res.body.disposition).toMatchObject({ status: 'approved' });
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

  describe('POST /definitions', () => {
    it('lets the form-service admin role create a definition', async () => {
      const res = await request(createApp(admin)).post('/form/v1/definitions').send({ name: 'New form' });
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ id: 'new-form', name: 'New form', applicantRoles: [] });
    });

    it.each([
      ['name is missing', {}],
      ['the name has no characters for an ID', { name: '!!!' }],
    ])('responds 400 when %s', async (_case, body) => {
      const res = await request(createApp(admin)).post('/form/v1/definitions').send(body);
      expect(res.status).toBe(400);
    });

    it('responds 403 without the form-service admin role', async () => {
      const res = await request(createApp(assessor)).post('/form/v1/definitions').send({ name: 'New form' });
      expect(res.status).toBe(403);
    });

    it('responds 409 when a definition with the generated ID exists', async () => {
      const res = await request(createApp(admin)).post('/form/v1/definitions').send({ name: 'Test' });
      expect(res.status).toBe(409);
    });
  });

  describe('PUT /definitions/:definitionId', () => {
    it('lets the form-service admin role replace a definition, taking the ID from the path', async () => {
      const res = await request(createApp(admin))
        .put('/form/v1/definitions/test')
        .send({ id: 'other', name: 'Test', anonymousApply: false, applicantRoles: [], assessorRoles: [] });
      expect(res.status).toBe(200);
      expect(res.body.id).toBe('test');
    });

    it('responds 400 for a formDraftUrlTemplate that is not a URL', async () => {
      const res = await request(createApp(admin))
        .put('/form/v1/definitions/test')
        .send({ name: 'Test', formDraftUrlTemplate: 'not a url' });
      expect(res.status).toBe(400);
    });

    it('responds 403 without the form-service admin role', async () => {
      const res = await request(createApp(assessor)).put('/form/v1/definitions/test').send({ name: 'Test' });
      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /definitions/:definitionId', () => {
    it('lets the form-service admin role delete a definition', async () => {
      const res = await request(createApp(admin)).delete('/form/v1/definitions/test');
      expect(res.status).toBe(204);
    });

    it('responds 400 for a definition ID with characters other than letters, digits, and hyphens', async () => {
      const res = await request(createApp(admin)).delete('/form/v1/definitions/not_valid');
      expect(res.status).toBe(400);
    });

    it('responds 403 without the form-service admin role', async () => {
      const res = await request(createApp(assessor)).delete('/form/v1/definitions/test');
      expect(res.status).toBe(403);
    });
  });

  // These operations read the latest revision of the definition and write back the changed fields.
  describe.each<['put' | 'patch', string, object, object, number]>([
    ['patch', '/form/v1/definitions/test', { description: 'Updated' }, { name: '' }, 200],
    ['put', '/form/v1/definitions/test/schemas', { 'data-schema': { type: 'object' } }, { 'data-schema': 'x' }, 204],
    ['put', '/form/v1/definitions/test/roles', { applicantRoles: ['test-applicant'] }, { otherRoles: [] }, 200],
    [
      'patch',
      '/form/v1/definitions/test/lifecycle',
      { createSupportTopic: true },
      { securityClassification: 'x' },
      200,
    ],
    ['patch', '/form/v1/definitions/test/submission-actions', { createPDF: true }, { event: 'no-namespace' }, 200],
  ])('%s %s', (method: 'put' | 'patch', url: string, body: object, invalidBody: object, successStatus: number) => {
    const existing = { id: 'test', name: 'Test', applicantRoles: [], assessorRoles: [], clerkRoles: [] };

    it('allows the form-service admin role', async () => {
      axiosMock.get.mockResolvedValueOnce({ status: 200, data: existing });
      const res = await request(createApp(admin))[method](url).send(body);
      expect(res.status).toBe(successStatus);
    });

    it('responds 400 for an invalid body', async () => {
      const res = await request(createApp(admin))[method](url).send(invalidBody);
      expect(res.status).toBe(400);
    });

    it('responds 403 without the form-service admin role', async () => {
      const res = await request(createApp(assessor))[method](url).send(body);
      expect(res.status).toBe(403);
    });

    it('responds 404 for a definition that does not exist', async () => {
      axiosMock.get.mockResolvedValueOnce({ status: 200, data: {} });
      const res = await request(createApp(admin))[method](url).send(body);
      expect(res.status).toBe(404);
    });
  });

  describe('POST /forms', () => {
    it('lets an applicant create a draft form', async () => {
      const res = await request(createApp(applicant)).post('/form/v1/forms').send({ definitionId: 'test' });
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ status: FormStatus.Draft, definition: { id: 'test' } });
      expect(eventServiceMock.send).toHaveBeenCalled();
    });

    it('responds 400 when definitionId is missing', async () => {
      const res = await request(createApp(applicant)).post('/form/v1/forms').send({});
      expect(res.status).toBe(400);
    });

    it('responds 400 when the definition has no active intake', async () => {
      const res = await request(createApp(applicant)).post('/form/v1/forms').send({ definitionId: 'scheduled' });
      expect(res.status).toBe(400);
    });

    it('responds 403 without an applicant or clerk role of the definition', async () => {
      const res = await request(createApp(assessor)).post('/form/v1/forms').send({ definitionId: 'test' });
      expect(res.status).toBe(403);
    });

    it('responds 404 for a definition that does not exist', async () => {
      const res = await request(createApp(applicant)).post('/form/v1/forms').send({ definitionId: 'unknown' });
      expect(res.status).toBe(404);
    });
  });

  describe('GET /forms/:formId', () => {
    it.each([
      ['form-service admin', admin],
      ['assessor', assessor],
      ['creating applicant', applicant],
    ])('allows the %s', async (_role, currentUser) => {
      const res = await request(createApp(currentUser)).get(`/form/v1/forms/${formId}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(formId);
    });

    it('responds 400 when includeData is requested for a locked form', async () => {
      formRepositoryMock.get.mockResolvedValueOnce(createForm(FormStatus.Locked));
      const res = await request(createApp(admin)).get(`/form/v1/forms/${formId}?includeData=true`);
      expect(res.status).toBe(400);
    });

    it('responds 400 for a form ID that is not a UUID', async () => {
      const res = await request(createApp(admin)).get('/form/v1/forms/not-a-uuid');
      expect(res.status).toBe(400);
    });

    it('responds 403 for a user who cannot read the form', async () => {
      const res = await request(createApp(noRoles)).get(`/form/v1/forms/${formId}`);
      expect(res.status).toBe(403);
    });

    it('responds 404 for an unknown form', async () => {
      const res = await request(createApp(admin)).get(`/form/v1/forms/${unknownId}`);
      expect(res.status).toBe(404);
    });
  });

  describe('POST /forms/:formId', () => {
    it('lets the creating applicant submit a draft form', async () => {
      const res = await request(createApp(applicant)).post(`/form/v1/forms/${formId}`).send({ operation: 'submit' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe(FormStatus.Submitted);
    });

    it('lets the form-service admin role archive a form', async () => {
      const res = await request(createApp(admin)).post(`/form/v1/forms/${formId}`).send({ operation: 'archive' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe(FormStatus.Archived);
    });

    it.each([
      ['an unknown operation', 'lock'],
      ['unlocking a form that is not locked', 'unlock'],
    ])('responds 400 for %s', async (_case, operation) => {
      const res = await request(createApp(admin)).post(`/form/v1/forms/${formId}`).send({ operation });
      expect(res.status).toBe(400);
    });

    it('responds 403 when the applicant archives their form', async () => {
      const res = await request(createApp(applicant)).post(`/form/v1/forms/${formId}`).send({ operation: 'archive' });
      expect(res.status).toBe(403);
    });

    it('responds 404 for an unknown form', async () => {
      const res = await request(createApp(admin)).post(`/form/v1/forms/${unknownId}`).send({ operation: 'archive' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /forms/:formId', () => {
    it.each([
      ['form-service admin', admin],
      ['creating applicant of a draft', applicant],
    ])('allows the %s', async (_role, currentUser) => {
      const res = await request(createApp(currentUser)).delete(`/form/v1/forms/${formId}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ deleted: true });
    });

    it('responds 400 for a form ID that is not a UUID', async () => {
      const res = await request(createApp(admin)).delete('/form/v1/forms/not-a-uuid');
      expect(res.status).toBe(400);
    });

    it('responds 403 for an assessor', async () => {
      const res = await request(createApp(assessor)).delete(`/form/v1/forms/${formId}`);
      expect(res.status).toBe(403);
      expect(formRepositoryMock.delete).not.toHaveBeenCalled();
    });

    it('responds 404 for an unknown form', async () => {
      const res = await request(createApp(admin)).delete(`/form/v1/forms/${unknownId}`);
      expect(res.status).toBe(404);
    });
  });

  describe('GET /forms/:formId/data', () => {
    it('lets the creating applicant read the data', async () => {
      const res = await request(createApp(applicant)).get(`/form/v1/forms/${formId}/data`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ id: formId, data: {}, files: {} });
    });

    it('responds 400 when the form is locked', async () => {
      formRepositoryMock.get.mockResolvedValueOnce(createForm(FormStatus.Locked));
      const res = await request(createApp(admin)).get(`/form/v1/forms/${formId}/data`);
      expect(res.status).toBe(400);
    });

    it('responds 400 for a code longer than 10 characters', async () => {
      const res = await request(createApp(intakeApp)).get(`/form/v1/forms/${formId}/data?code=12345678901`);
      expect(res.status).toBe(400);
    });

    it('responds 401 when the code cannot be verified', async () => {
      const res = await request(createApp(intakeApp)).get(`/form/v1/forms/${formId}/data?code=123456`);
      expect(res.status).toBe(401);
    });

    it('responds 403 for an assessor of a draft form', async () => {
      const res = await request(createApp(assessor)).get(`/form/v1/forms/${formId}/data`);
      expect(res.status).toBe(403);
    });

    it('responds 404 for an unknown form', async () => {
      const res = await request(createApp(admin)).get(`/form/v1/forms/${unknownId}/data`);
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /forms/:formId/data', () => {
    const data = { data: { firstName: 'Test' } };

    it('lets the creating applicant update the data of a draft', async () => {
      const res = await request(createApp(applicant)).put(`/form/v1/forms/${formId}/data`).send(data);
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(data.data);
    });

    it('responds 400 when data is missing', async () => {
      const res = await request(createApp(applicant)).put(`/form/v1/forms/${formId}/data`).send({});
      expect(res.status).toBe(400);
    });

    it('responds 400 when the form is not a draft', async () => {
      formRepositoryMock.get.mockResolvedValueOnce(createForm(FormStatus.Submitted));
      const res = await request(createApp(applicant)).put(`/form/v1/forms/${formId}/data`).send(data);
      expect(res.status).toBe(400);
    });

    it('responds 403 for an assessor', async () => {
      const res = await request(createApp(assessor)).put(`/form/v1/forms/${formId}/data`).send(data);
      expect(res.status).toBe(403);
    });

    it('responds 404 for an unknown form', async () => {
      const res = await request(createApp(applicant)).put(`/form/v1/forms/${unknownId}/data`).send(data);
      expect(res.status).toBe(404);
    });
  });
});
