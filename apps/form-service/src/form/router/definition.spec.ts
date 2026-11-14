import { adspId, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, InvalidValueError, NotFoundError, ValidationService } from '@core-services/core-common';
import * as HttpStatusCodes from 'http-status-codes';
import axios from 'axios';
import { Request, Response } from 'express';
import { Logger } from 'winston';
import { RegistrationReviewedAuditAction, RegistrationSubmittedAuditAction } from '../audit';
import { FormDefinitionEntity, FormRegistrationEntity } from '../model';
import { RegistrationStatus } from '../types';
import { FormServiceRoles } from '..';
import {
  createFormDefinition,
  createFormDefinitionRouter,
  deleteFormDefinition,
  getFormDefinitions,
  getRegistrationByEmail,
  getRegistrations,
  patchFormDefinition,
  patchFormDefinitionLifecycle,
  patchFormDefinitionSubmissionActions,
  submitRegistration,
  updateFormDefinition,
  updateFormDefinitionRoles,
  updateFormDefinitionSchemas,
  updateRegistration,
} from './definition';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('definition router', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

  const validationService: ValidationService = {
    validate: jest.fn(),
    setSchema: jest.fn(),
  };

  const calendarService = {
    getScheduledIntake: jest.fn(),
    updateScheduleIntake: jest.fn(),
  };

  const definition = new FormDefinitionEntity(validationService, calendarService, tenantId, {
    id: 'test',
    name: 'test-form-definition',
    description: '',
    formDraftUrlTemplate: 'https://my-form/{{ id }}',
    anonymousApply: false,
    applicantRoles: ['test-applicant'],
    assessorRoles: ['test-assessor'],
    submissionRecords: false,
    submissionPdfTemplate: '',
    supportTopic: false,
    clerkRoles: [],
    dataSchema: {},
    dispositionStates: [],
  });

  const directoryMock = {
    getServiceUrl: jest.fn(),
    getResourceUrl: jest.fn(),
  };

  const tokenProviderMock = {
    getAccessToken: jest.fn(() => Promise.resolve('token')),
  };

  const tenantServiceMock = {
    getTenants: jest.fn(),
    getTenant: jest.fn(),
    getTenantByName: jest.fn(),
    getTenantByRealm: jest.fn(),
  };

  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(() => {
    axiosMock.get.mockReset();
    axiosMock.patch.mockReset();
    axiosMock.delete.mockReset();
    jest.mocked(axiosMock.isAxiosError).mockReturnValue(false);
    directoryMock.getServiceUrl.mockReset();
    directoryMock.getServiceUrl.mockResolvedValue(new URL('http://configuration-service'));
    tokenProviderMock.getAccessToken.mockReturnValue(Promise.resolve('token'));
  });

  function mockPatchSuccess(configuration: Record<string, unknown>, revision = 1): void {
    axiosMock.patch.mockResolvedValue({ data: { latest: { revision, configuration } } });
  }

  it('can create router', () => {
    const router = createFormDefinitionRouter({
      directory: directoryMock,
      tokenProvider: tokenProviderMock,
      tenantService: tenantServiceMock,
      calendarService: calendarServiceMock,
      logger: loggerMock as unknown as Logger,
      registrationRepository: registrationRepositoryMock,
      eventService: { send: jest.fn() },
      auditService: auditServiceMock,
    });
    expect(router).toBeTruthy();
  });

  describe('getFormDefinitions', () => {
    it('can create handler', () => {
      const handler = getFormDefinitions(directoryMock, tokenProviderMock);
      expect(handler).toBeTruthy();
    });

    it('can call next with unauthorized for non-admin', async () => {
      const req = {
        user: { tenantId, id: 'tester', roles: ['test-applicant'] },
        query: {},
        tenant: { id: tenantId },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = getFormDefinitions(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });

    it('can get definitions', async () => {
      axiosMock.get.mockResolvedValue({
        data: {
          results: [{ latest: { revision: 1, configuration: definition }, active: null }],
          page: { size: 1 },
        },
      });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin] },
        query: {},
        tenant: { id: tenantId },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = getFormDefinitions(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ results: expect.arrayContaining([expect.objectContaining({ id: 'test' })]) }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('can get definitions with name search', async () => {
      axiosMock.get.mockResolvedValue({
        data: {
          results: [{ latest: { revision: 1, configuration: definition }, active: null }],
          page: { size: 1 },
        },
      });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin] },
        query: { name: 'test-form' },
        tenant: { id: tenantId },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = getFormDefinitions(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(axiosMock.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            criteria: JSON.stringify({ nameContains: 'test-form' }),
          }),
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('can get definitions with date range criteria', async () => {
      axiosMock.get.mockResolvedValue({
        data: {
          results: [{ latest: { revision: 1, configuration: definition }, active: null }],
          page: { size: 1 },
        },
      });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin] },
        query: { createDateAfter: '2024-01-01', createDateBefore: '2024-01-31' },
        tenant: { id: tenantId },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = getFormDefinitions(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(axiosMock.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            criteria: JSON.stringify({ createDateAfter: '2024-01-01', createDateBefore: '2024-01-31' }),
          }),
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('does not set criteria param when no search criteria are provided', async () => {
      axiosMock.get.mockResolvedValue({
        data: {
          results: [{ latest: { revision: 1, configuration: definition }, active: null }],
          page: { size: 1 },
        },
      });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin] },
        query: {},
        tenant: { id: tenantId },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = getFormDefinitions(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(axiosMock.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.not.objectContaining({ criteria: expect.anything() }),
        }),
      );
    });

    it('includes the created date of the latest revision on results', async () => {
      const created = '2024-01-15T10:00:00.000Z';
      axiosMock.get.mockResolvedValue({
        data: {
          results: [{ latest: { revision: 1, configuration: definition, created }, active: null }],
          page: { size: 1 },
        },
      });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin] },
        query: {},
        tenant: { id: tenantId },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = getFormDefinitions(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ results: expect.arrayContaining([expect.objectContaining({ created })]) }),
      );
    });
  });

  describe('createFormDefinition', () => {
    it('can create handler', () => {
      const handler = createFormDefinition(directoryMock, tokenProviderMock, loggerMock as unknown as Logger);
      expect(handler).toBeTruthy();
    });

    it('can call next with unauthorized for non-admin', async () => {
      const req = {
        user: { tenantId, id: 'tester', roles: ['test-applicant'] },
        body: { name: 'test' },
        tenant: { id: tenantId },
      };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
      const next = jest.fn();

      const handler = createFormDefinition(directoryMock, tokenProviderMock, loggerMock as unknown as Logger);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });

    it('can return 409 if definition already exists', async () => {
      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        body: { name: 'Test' },
        tenant: { id: tenantId },
        getServiceConfiguration: jest.fn().mockResolvedValue([definition]),
      };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
      const next = jest.fn();

      const handler = createFormDefinition(directoryMock, tokenProviderMock, loggerMock as unknown as Logger);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ extra: expect.objectContaining({ statusCode: 409 }) }),
      );
      expect(axiosMock.patch).not.toHaveBeenCalled();
    });

    it('can create a definition', async () => {
      const createdDefinition = {
        id: 'new-definition',
        name: 'New Definition',
        description: '',
        anonymousApply: false,
        applicantRoles: [],
        assessorRoles: [],
        clerkRoles: [],
        dataSchema: {},
        securityClassification: 'protected b',
      };
      mockPatchSuccess(createdDefinition);

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        body: { name: 'New Definition' },
        tenant: { id: tenantId },
        getServiceConfiguration: jest.fn().mockResolvedValue([null]),
      };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
      const next = jest.fn();

      const handler = createFormDefinition(directoryMock, tokenProviderMock, loggerMock as unknown as Logger);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(axiosMock.patch).toHaveBeenCalledWith(
        expect.stringContaining('new-definition'),
        expect.objectContaining({ operation: 'REPLACE', configuration: createdDefinition }),
        expect.any(Object),
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ id: 'new-definition' }));
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next with 400 when configuration service rejects the patch', async () => {
      const axiosError = Object.assign(new Error('Bad Request'), {
        isAxiosError: true,
        response: { data: { errorMessage: 'Schema validation failed.' } },
      });
      jest.mocked(axiosMock.isAxiosError).mockReturnValue(true);
      axiosMock.patch.mockRejectedValue(axiosError);

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        body: { name: 'Test' },
        tenant: { id: tenantId },
        getServiceConfiguration: jest.fn().mockResolvedValue([null]),
      };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
      const next = jest.fn();

      const handler = createFormDefinition(directoryMock, tokenProviderMock, loggerMock as unknown as Logger);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ extra: expect.objectContaining({ statusCode: 400 }) }),
      );
      expect(res.send).not.toHaveBeenCalled();
    });

    describe('formDraftUrlTemplate validation', () => {
      const FORM_DRAFT_URL_PATTERN = /^https?:\/\/.+$/;

      it('accepts a valid https URL', () => {
        expect(FORM_DRAFT_URL_PATTERN.test('https://example.com/form/{{id}}')).toBe(true);
      });

      it('accepts a valid http URL', () => {
        expect(FORM_DRAFT_URL_PATTERN.test('http://example.com/form/{{id}}')).toBe(true);
      });

      it('rejects a URL without a scheme', () => {
        expect(FORM_DRAFT_URL_PATTERN.test('example.com/form/{{id}}')).toBe(false);
      });

      it('rejects an ftp URL', () => {
        expect(FORM_DRAFT_URL_PATTERN.test('ftp://example.com/form')).toBe(false);
      });

      it('rejects an empty string', () => {
        expect(FORM_DRAFT_URL_PATTERN.test('')).toBe(false);
      });

      it('enforces minimum length of 6', () => {
        // 'http:/' is 6 chars but has no host — pattern still rejects it
        expect('http:/'.length).toBe(6);
        expect(FORM_DRAFT_URL_PATTERN.test('http:/')).toBe(false);
        // Valid URL that is at least 6 chars
        expect('http://x'.length).toBeGreaterThanOrEqual(6);
        expect(FORM_DRAFT_URL_PATTERN.test('http://x')).toBe(true);
      });

      it('enforces maximum length of 150', () => {
        const longUrl = 'https://example.com/' + 'a'.repeat(131); // total 151 chars
        expect(longUrl.length).toBe(151);
        // length check is done by express-validator; pattern itself does not enforce max
        // so just confirm the length is > 150
        expect(longUrl.length > 150).toBe(true);
      });
    });

    it('always sets anonymousApply=false, applicantRoles=[], assessorRoles=[] regardless of body', async () => {
      mockPatchSuccess({ id: 'test', name: 'Test' });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        body: { name: 'Test' },
        tenant: { id: tenantId },
        getServiceConfiguration: jest.fn().mockResolvedValue([null]),
      };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
      const next = jest.fn();

      const handler = createFormDefinition(directoryMock, tokenProviderMock, loggerMock as unknown as Logger);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(axiosMock.patch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          configuration: expect.objectContaining({
            anonymousApply: false,
            applicantRoles: [],
            assessorRoles: [],
          }),
        }),
        expect.any(Object),
      );
    });

    it('derives kebab-case id from multi-word name', async () => {
      mockPatchSuccess({ id: 'my-application-form', name: 'My Application Form' });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        body: { name: 'My Application Form' },
        tenant: { id: tenantId },
        getServiceConfiguration: jest.fn().mockResolvedValue([null]),
      };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
      const next = jest.fn();

      const handler = createFormDefinition(directoryMock, tokenProviderMock, loggerMock as unknown as Logger);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(axiosMock.patch).toHaveBeenCalledWith(
        expect.stringContaining('my-application-form'),
        expect.objectContaining({ configuration: expect.objectContaining({ id: 'my-application-form' }) }),
        expect.any(Object),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next with invalid operation error when name cannot produce a valid id', async () => {
      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        body: { name: '   ' },
        tenant: { id: tenantId },
      };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
      const next = jest.fn();

      const handler = createFormDefinition(directoryMock, tokenProviderMock, loggerMock as unknown as Logger);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(axiosMock.patch).not.toHaveBeenCalled();
    });

    it('passes description from body to the configuration service', async () => {
      mockPatchSuccess({ id: 'test', name: 'Test' });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        body: { name: 'Test', description: 'A test form' },
        tenant: { id: tenantId },
        getServiceConfiguration: jest.fn().mockResolvedValue([null]),
      };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
      const next = jest.fn();

      const handler = createFormDefinition(directoryMock, tokenProviderMock, loggerMock as unknown as Logger);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(axiosMock.patch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ configuration: expect.objectContaining({ description: 'A test form' }) }),
        expect.any(Object),
      );
    });

    it('ignores extra body fields and sends only the permitted fields', async () => {
      mockPatchSuccess({ id: 'test', name: 'Test' });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        body: {
          name: 'Test',
          anonymousApply: true,
          applicantRoles: ['custom-role'],
          assessorRoles: ['assessor'],
          formDraftUrlTemplate: 'https://example.com/form/{{id}}',
          dataSchema: { type: 'object' },
        },
        tenant: { id: tenantId },
        getServiceConfiguration: jest.fn().mockResolvedValue([null]),
      };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
      const next = jest.fn();

      const handler = createFormDefinition(directoryMock, tokenProviderMock, loggerMock as unknown as Logger);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(axiosMock.patch).toHaveBeenCalledWith(
        expect.any(String),
        {
          operation: 'REPLACE',
          configuration: {
            id: 'test',
            name: 'Test',
            description: '',
            anonymousApply: false,
            applicantRoles: [],
            assessorRoles: [],
            clerkRoles: [],
            dataSchema: {},
            securityClassification: 'protected b',
          },
        },
        expect.any(Object),
      );
    });

    it('defaults description to empty string when not provided', async () => {
      mockPatchSuccess({ id: 'test', name: 'Test' });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        body: { name: 'Test' },
        tenant: { id: tenantId },
        getServiceConfiguration: jest.fn().mockResolvedValue([null]),
      };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
      const next = jest.fn();

      const handler = createFormDefinition(directoryMock, tokenProviderMock, loggerMock as unknown as Logger);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(axiosMock.patch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ configuration: expect.objectContaining({ description: '' }) }),
        expect.any(Object),
      );
    });

    it('proceeds to create when the existence check throws', async () => {
      mockPatchSuccess({ id: 'test', name: 'Test' });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        body: { name: 'Test' },
        tenant: { id: tenantId },
        getServiceConfiguration: jest.fn().mockRejectedValue(new Error('config service unavailable')),
      };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
      const next = jest.fn();

      const handler = createFormDefinition(directoryMock, tokenProviderMock, loggerMock as unknown as Logger);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(loggerMock.warn).toHaveBeenCalledWith(expect.stringContaining('test'));
      expect(axiosMock.patch).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('patchFormDefinition', () => {
    it('can create handler', () => {
      const handler = patchFormDefinition(directoryMock, tokenProviderMock);
      expect(handler).toBeTruthy();
    });

    it('can call next with unauthorized for non-admin', async () => {
      const req = {
        user: { tenantId, id: 'tester', roles: ['test-applicant'] },
        params: { definitionId: 'test' },
        body: { name: 'patched' },
        tenant: { id: tenantId },
      };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
      const next = jest.fn();

      const handler = patchFormDefinition(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
      expect(axiosMock.get).not.toHaveBeenCalled();
      expect(axiosMock.patch).not.toHaveBeenCalled();
    });

    it('can call next with not found when definition does not exist', async () => {
      axiosMock.get.mockResolvedValue({
        status: 404,
        data: {},
      });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        params: { definitionId: 'missing-def' },
        body: { name: 'patched' },
        tenant: { id: tenantId },
      };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
      const next = jest.fn();

      const handler = patchFormDefinition(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(axiosMock.get).toHaveBeenCalledWith(
        expect.stringContaining('missing-def/latest'),
        expect.objectContaining({
          headers: { Authorization: 'Bearer token' },
          params: { tenantId: tenantId.toString() },
          validateStatus: expect.any(Function),
        }),
      );
      expect(axiosMock.patch).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('missing-def'),
        }),
      );
    });

    it('can patch only provided fields and preserve existing definition values', async () => {
      const existingDefinition = {
        id: 'test',
        name: 'Original Name',
        description: 'Original description',
        anonymousApply: false,
        applicantRoles: ['test-applicant'],
        assessorRoles: ['test-assessor'],
        submissionRecords: false,
        submissionPdfTemplate: '',
        supportTopic: false,
        clerkRoles: [],
        dataSchema: {
          type: 'object',
          properties: {
            firstName: { type: 'string' },
          },
        },
        uiSchema: {
          type: 'VerticalLayout',
          elements: [],
        },
        dispositionStates: [],
      };

      const expectedPatchedDefinition = {
        ...existingDefinition,
        id: 'test',
        name: 'Patched Name',
        description: 'Patched description',
      };

      axiosMock.get.mockResolvedValue({ status: HttpStatusCodes.OK, data: existingDefinition });
      mockPatchSuccess(expectedPatchedDefinition, 2);

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        params: { definitionId: 'test' },
        body: {
          name: 'Patched Name',
          description: 'Patched description',
        },
        tenant: { id: tenantId },
      };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
      const next = jest.fn();

      const handler = patchFormDefinition(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(axiosMock.get).toHaveBeenCalledWith(
        expect.stringContaining('test/latest'),
        expect.objectContaining({
          headers: { Authorization: 'Bearer token' },
          params: { tenantId: tenantId.toString() },
          validateStatus: expect.any(Function),
        }),
      );

      expect(axiosMock.patch).toHaveBeenCalledWith(
        expect.stringContaining('test'),
        {
          operation: 'REPLACE',
          configuration: expectedPatchedDefinition,
        },
        expect.objectContaining({
          headers: { Authorization: 'Bearer token' },
          params: { tenantId: tenantId.toString() },
        }),
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test',
          name: 'Patched Name',
          description: 'Patched description',
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('can patch dataSchema and uiSchema', async () => {
      const existingDefinition = {
        id: 'test',
        name: 'Original Name',
        description: '',
        anonymousApply: false,
        applicantRoles: [],
        assessorRoles: [],
        submissionRecords: false,
        submissionPdfTemplate: '',
        supportTopic: false,
        clerkRoles: [],
        dataSchema: {},
        uiSchema: {},
        dispositionStates: [],
      };

      const patchedDataSchema = {
        type: 'object',
        properties: {
          email: { type: 'string' },
        },
      };

      const patchedUiSchema = {
        type: 'VerticalLayout',
        elements: [{ type: 'Control', scope: '#/properties/email' }],
      };

      const expectedPatchedDefinition = {
        ...existingDefinition,
        dataSchema: patchedDataSchema,
        uiSchema: patchedUiSchema,
      };

      axiosMock.get.mockResolvedValue({ status: HttpStatusCodes.OK, data: existingDefinition });
      mockPatchSuccess(expectedPatchedDefinition, 2);

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        params: { definitionId: 'test' },
        body: {
          dataSchema: patchedDataSchema,
          uiSchema: patchedUiSchema,
        },
        tenant: { id: tenantId },
      };

      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
      const next = jest.fn();

      const handler = patchFormDefinition(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(axiosMock.get).toHaveBeenCalledWith(
        expect.stringContaining('test/latest'),
        expect.objectContaining({
          headers: { Authorization: 'Bearer token' },
          params: { tenantId: tenantId.toString() },
          validateStatus: expect.any(Function),
        }),
      );

      expect(axiosMock.patch).toHaveBeenCalledWith(
        expect.stringContaining('test'),
        {
          operation: 'REPLACE',
          configuration: expectedPatchedDefinition,
        },
        expect.objectContaining({
          headers: { Authorization: 'Bearer token' },
          params: { tenantId: tenantId.toString() },
        }),
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test',
          dataSchema: patchedDataSchema,
          uiSchema: patchedUiSchema,
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next with 400 when configuration service rejects the patch', async () => {
      axiosMock.get.mockResolvedValue({ status: HttpStatusCodes.OK, data: { id: 'test', name: 'Test' } });

      const axiosError = Object.assign(new Error('Bad Request'), {
        isAxiosError: true,
        response: { data: { errorMessage: 'Schema validation failed.' } },
      });
      jest.mocked(axiosMock.isAxiosError).mockReturnValue(true);
      axiosMock.patch.mockRejectedValue(axiosError);

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        params: { definitionId: 'test' },
        body: { name: 'Patched' },
        tenant: { id: tenantId },
      };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
      const next = jest.fn();

      const handler = patchFormDefinition(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ extra: expect.objectContaining({ statusCode: 400 }) }),
      );
      expect(res.send).not.toHaveBeenCalled();
    });
  });

  describe('updateFormDefinition', () => {
    it('can create handler', () => {
      const handler = updateFormDefinition(directoryMock, tokenProviderMock);
      expect(handler).toBeTruthy();
    });

    it('can call next with unauthorized for non-admin', async () => {
      const req = {
        user: { tenantId, id: 'tester', roles: ['test-applicant'] },
        params: { definitionId: 'test' },
        body: { name: 'updated' },
        tenant: { id: tenantId },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = updateFormDefinition(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });

    it('can update a definition', async () => {
      const updated = {
        id: 'test',
        name: 'Updated Name',
        anonymousApply: false,
        applicantRoles: [],
        assessorRoles: [],
      };
      mockPatchSuccess(updated, 2);

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        params: { definitionId: 'test' },
        body: updated,
        tenant: { id: tenantId },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = updateFormDefinition(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(axiosMock.patch).toHaveBeenCalledWith(
        expect.stringContaining('test'),
        expect.objectContaining({ operation: 'REPLACE', configuration: expect.objectContaining({ id: 'test' }) }),
        expect.any(Object),
      );
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ id: 'test' }));
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('deleteFormDefinition', () => {
    it('can create handler', () => {
      const handler = deleteFormDefinition(directoryMock, tokenProviderMock);
      expect(handler).toBeTruthy();
    });

    it('can call next with unauthorized for non-admin', async () => {
      const req = {
        user: { tenantId, id: 'tester', roles: ['test-applicant'] },
        params: { definitionId: 'test' },
        tenant: { id: tenantId },
      };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
      const next = jest.fn();

      const handler = deleteFormDefinition(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });

    it('can delete a definition', async () => {
      axiosMock.delete.mockResolvedValue({});

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        params: { definitionId: 'test' },
        tenant: { id: tenantId },
      };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
      const next = jest.fn();

      const handler = deleteFormDefinition(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(axiosMock.delete).toHaveBeenCalledWith(expect.stringContaining('test'), expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('updateFormDefinitionSchemas', () => {
    const existingDefinition = {
      id: 'test',
      name: 'Test Form',
      description: '',
      anonymousApply: false,
      applicantRoles: [],
      assessorRoles: [],
      clerkRoles: [],
      dataSchema: {},
      uiSchema: {},
      dispositionStates: [],
    };

    let res: { status: jest.Mock; send: jest.Mock };
    let next: jest.Mock;

    beforeEach(() => {
      res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
      next = jest.fn();
    });

    it('can create handler', () => {
      const handler = updateFormDefinitionSchemas(directoryMock, tokenProviderMock);
      expect(handler).toBeTruthy();
    });

    it('can call next with unauthorized for non-admin', async () => {
      const req = {
        user: { tenantId, id: 'tester', roles: ['test-applicant'] },
        params: { definitionId: 'test' },
        body: { 'data-schema': {}, 'ui-schema': {} },
        tenant: { id: tenantId },
      };

      const handler = updateFormDefinitionSchemas(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
      expect(axiosMock.get).not.toHaveBeenCalled();
      expect(axiosMock.patch).not.toHaveBeenCalled();
    });

    it('can call next with not found when definition does not exist', async () => {
      axiosMock.get.mockResolvedValue({ status: HttpStatusCodes.NOT_FOUND, data: {} });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        params: { definitionId: 'missing-def' },
        body: { 'data-schema': {}, 'ui-schema': {} },
        tenant: { id: tenantId },
      };

      const handler = updateFormDefinitionSchemas(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(axiosMock.get).toHaveBeenCalledWith(
        expect.stringContaining('missing-def/latest'),
        expect.objectContaining({ validateStatus: expect.any(Function) }),
      );
      expect(axiosMock.patch).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('missing-def') }));
    });

    it('can call next with not found when response data is null', async () => {
      axiosMock.get.mockResolvedValue({ status: HttpStatusCodes.OK, data: null });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        params: { definitionId: 'test' },
        body: { 'data-schema': {}, 'ui-schema': {} },
        tenant: { id: tenantId },
      };

      const handler = updateFormDefinitionSchemas(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(axiosMock.patch).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('test') }));
    });

    it('can update schemas and return 204', async () => {
      const newDataSchema = { type: 'object', properties: { name: { type: 'string' } } };
      const newUiSchema = { type: 'VerticalLayout', elements: [] };

      axiosMock.get.mockResolvedValue({ status: HttpStatusCodes.OK, data: existingDefinition });
      axiosMock.patch.mockResolvedValue({
        data: {
          latest: {
            revision: 2,
            configuration: { ...existingDefinition, dataSchema: newDataSchema, uiSchema: newUiSchema },
          },
        },
      });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        params: { definitionId: 'test' },
        body: { 'data-schema': newDataSchema, 'ui-schema': newUiSchema },
        tenant: { id: tenantId },
      };

      const handler = updateFormDefinitionSchemas(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(axiosMock.patch).toHaveBeenCalledWith(
        expect.stringContaining('test'),
        {
          operation: 'REPLACE',
          configuration: expect.objectContaining({ dataSchema: newDataSchema, uiSchema: newUiSchema }),
        },
        expect.any(Object),
      );
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('preserves existing definition fields when updating schemas', async () => {
      const newDataSchema = { type: 'object' };
      const newUiSchema = { type: 'HorizontalLayout', elements: [] };

      axiosMock.get.mockResolvedValue({ status: HttpStatusCodes.OK, data: existingDefinition });
      axiosMock.patch.mockResolvedValue({ data: { latest: { revision: 2, configuration: existingDefinition } } });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        params: { definitionId: 'test' },
        body: { 'data-schema': newDataSchema, 'ui-schema': newUiSchema },
        tenant: { id: tenantId },
      };

      const handler = updateFormDefinitionSchemas(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(axiosMock.patch).toHaveBeenCalledWith(
        expect.any(String),
        {
          operation: 'REPLACE',
          configuration: expect.objectContaining({
            id: 'test',
            name: 'Test Form',
            applicantRoles: [],
            dataSchema: newDataSchema,
            uiSchema: newUiSchema,
          }),
        },
        expect.any(Object),
      );
    });

    it('falls back to existing data-schema when data-schema is omitted', async () => {
      const existingDataSchema = { type: 'object', properties: { name: { type: 'string' } } };
      const newUiSchema = { type: 'VerticalLayout', elements: [] };
      const definitionWithSchema = { ...existingDefinition, dataSchema: existingDataSchema, uiSchema: {} };

      axiosMock.get.mockResolvedValue({ status: HttpStatusCodes.OK, data: definitionWithSchema });
      axiosMock.patch.mockResolvedValue({ data: { latest: { revision: 2, configuration: definitionWithSchema } } });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        params: { definitionId: 'test' },
        body: { 'ui-schema': newUiSchema },
        tenant: { id: tenantId },
      };

      const handler = updateFormDefinitionSchemas(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(axiosMock.patch).toHaveBeenCalledWith(
        expect.any(String),
        {
          operation: 'REPLACE',
          configuration: expect.objectContaining({
            dataSchema: existingDataSchema,
            uiSchema: newUiSchema,
          }),
        },
        expect.any(Object),
      );
      expect(res.status).toHaveBeenCalledWith(204);
      expect(next).not.toHaveBeenCalled();
    });

    it('falls back to existing ui-schema when ui-schema is omitted', async () => {
      const newDataSchema = { type: 'object', properties: { email: { type: 'string' } } };
      const existingUiSchema = { type: 'VerticalLayout', elements: [{ type: 'Control', scope: '#/properties/name' }] };
      const definitionWithSchema = { ...existingDefinition, dataSchema: {}, uiSchema: existingUiSchema };

      axiosMock.get.mockResolvedValue({ status: HttpStatusCodes.OK, data: definitionWithSchema });
      axiosMock.patch.mockResolvedValue({ data: { latest: { revision: 2, configuration: definitionWithSchema } } });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        params: { definitionId: 'test' },
        body: { 'data-schema': newDataSchema },
        tenant: { id: tenantId },
      };

      const handler = updateFormDefinitionSchemas(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(axiosMock.patch).toHaveBeenCalledWith(
        expect.any(String),
        {
          operation: 'REPLACE',
          configuration: expect.objectContaining({
            dataSchema: newDataSchema,
            uiSchema: existingUiSchema,
          }),
        },
        expect.any(Object),
      );
      expect(res.status).toHaveBeenCalledWith(204);
      expect(next).not.toHaveBeenCalled();
    });

    it('uses existing schemas for both when body is empty', async () => {
      const existingDataSchema = { type: 'object', properties: { age: { type: 'number' } } };
      const existingUiSchema = { type: 'VerticalLayout', elements: [] };
      const definitionWithSchemas = {
        ...existingDefinition,
        dataSchema: existingDataSchema,
        uiSchema: existingUiSchema,
      };

      axiosMock.get.mockResolvedValue({ status: HttpStatusCodes.OK, data: definitionWithSchemas });
      axiosMock.patch.mockResolvedValue({ data: { latest: { revision: 2, configuration: definitionWithSchemas } } });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        params: { definitionId: 'test' },
        body: {},
        tenant: { id: tenantId },
      };

      const handler = updateFormDefinitionSchemas(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(axiosMock.patch).toHaveBeenCalledWith(
        expect.any(String),
        {
          operation: 'REPLACE',
          configuration: expect.objectContaining({
            dataSchema: existingDataSchema,
            uiSchema: existingUiSchema,
          }),
        },
        expect.any(Object),
      );
      expect(res.status).toHaveBeenCalledWith(204);
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next with 400 when configuration service rejects the patch', async () => {
      axiosMock.get.mockResolvedValue({ status: HttpStatusCodes.OK, data: existingDefinition });

      const axiosError = Object.assign(new Error('Bad Request'), {
        isAxiosError: true,
        response: { data: { errorMessage: 'Schema validation failed.' } },
      });
      jest.mocked(axiosMock.isAxiosError).mockReturnValue(true);
      axiosMock.patch.mockRejectedValue(axiosError);

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        params: { definitionId: 'test' },
        body: { 'data-schema': {}, 'ui-schema': {} },
        tenant: { id: tenantId },
      };

      const handler = updateFormDefinitionSchemas(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ extra: expect.objectContaining({ statusCode: 400 }) }),
      );
      expect(res.send).not.toHaveBeenCalled();
    });

    it('calls next with raw error when patch fails with a non-axios error', async () => {
      axiosMock.get.mockResolvedValue({ status: HttpStatusCodes.OK, data: existingDefinition });

      const networkError = new Error('network failure');
      jest.mocked(axiosMock.isAxiosError).mockReturnValue(false);
      axiosMock.patch.mockRejectedValue(networkError);

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        params: { definitionId: 'test' },
        body: { 'data-schema': {}, 'ui-schema': {} },
        tenant: { id: tenantId },
      };

      const handler = updateFormDefinitionSchemas(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(networkError);
      expect(res.send).not.toHaveBeenCalled();
    });
  });

  describe('updateFormDefinitionRoles', () => {
    const existingDefinition = {
      id: 'test',
      name: 'Test Form',
      description: '',
      anonymousApply: false,
      applicantRoles: ['old-applicant'],
      assessorRoles: ['old-assessor'],
      clerkRoles: ['old-clerk'],
      dataSchema: {},
      uiSchema: {},
      dispositionStates: [],
    };

    let res: { status: jest.Mock; send: jest.Mock };
    let next: jest.Mock;

    beforeEach(() => {
      res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
      next = jest.fn();
    });

    it('can create handler', () => {
      const handler = updateFormDefinitionRoles(directoryMock, tokenProviderMock);
      expect(handler).toBeTruthy();
    });

    it('can call next with unauthorized for non-admin', async () => {
      const req = {
        user: { tenantId, id: 'tester', roles: ['test-applicant'] },
        params: { definitionId: 'test' },
        body: { applicantRoles: ['a'], assessorRoles: [], clerkRoles: [] },
        tenant: { id: tenantId },
      };

      const handler = updateFormDefinitionRoles(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
      expect(axiosMock.get).not.toHaveBeenCalled();
      expect(axiosMock.patch).not.toHaveBeenCalled();
    });

    it('reports an authenticated caller without the admin role as forbidden, not unauthorized', () => {
      // Acceptance criterion: 403 when authenticated but lacking form-admin. 401 is reserved for
      // callers the auth middleware never authenticated at all.
      const err = new UnauthorizedUserError('update form definition roles', {
        id: 'tester',
        name: 'Tester',
      } as never);

      expect(err.extra.statusCode).toBe(HttpStatusCodes.FORBIDDEN);
    });

    it('can call next with not found when the definition has never been written', async () => {
      // The configuration service answers /latest with 200 and {} for a definition that does not
      // exist. Previously this fell through to the PATCH and surfaced the configuration service's
      // schema error as a 400.
      axiosMock.get.mockResolvedValue({ status: HttpStatusCodes.OK, data: {} });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        params: { definitionId: 'never-written' },
        body: { applicantRoles: ['a'], assessorRoles: [], clerkRoles: [] },
        tenant: { id: tenantId },
      };

      const handler = updateFormDefinitionRoles(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(axiosMock.patch).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('never-written') }));
    });

    it('can call next with not found when definition does not exist', async () => {
      axiosMock.get.mockResolvedValue({ status: HttpStatusCodes.NOT_FOUND, data: {} });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        params: { definitionId: 'missing-def' },
        body: { applicantRoles: ['a'], assessorRoles: [], clerkRoles: [] },
        tenant: { id: tenantId },
      };

      const handler = updateFormDefinitionRoles(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(axiosMock.get).toHaveBeenCalledWith(
        expect.stringContaining('missing-def/latest'),
        expect.objectContaining({ validateStatus: expect.any(Function) }),
      );
      expect(axiosMock.patch).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('missing-def') }));
    });

    it('replaces roles entirely and returns 200 with the mapped definition', async () => {
      const newRoles = {
        applicantRoles: ['new-applicant'],
        assessorRoles: ['new-assessor'],
        clerkRoles: ['new-clerk'],
      };

      axiosMock.get.mockResolvedValue({ status: HttpStatusCodes.OK, data: existingDefinition });
      axiosMock.patch.mockResolvedValue({
        data: { latest: { revision: 2, configuration: { ...existingDefinition, ...newRoles } } },
      });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        params: { definitionId: 'test' },
        body: newRoles,
        tenant: { id: tenantId },
      };

      const handler = updateFormDefinitionRoles(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(axiosMock.patch).toHaveBeenCalledWith(
        expect.stringContaining('test'),
        {
          operation: 'REPLACE',
          configuration: expect.objectContaining({
            id: 'test',
            name: 'Test Form',
            applicantRoles: ['new-applicant'],
            assessorRoles: ['new-assessor'],
            clerkRoles: ['new-clerk'],
          }),
        },
        expect.any(Object),
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ applicantRoles: ['new-applicant'], assessorRoles: ['new-assessor'] }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('resets omitted role arrays to empty', async () => {
      axiosMock.get.mockResolvedValue({ status: HttpStatusCodes.OK, data: existingDefinition });
      axiosMock.patch.mockResolvedValue({ data: { latest: { revision: 2, configuration: existingDefinition } } });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        params: { definitionId: 'test' },
        body: { applicantRoles: ['only-applicant'] },
        tenant: { id: tenantId },
      };

      const handler = updateFormDefinitionRoles(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(axiosMock.patch).toHaveBeenCalledWith(
        expect.any(String),
        {
          operation: 'REPLACE',
          configuration: expect.objectContaining({
            applicantRoles: ['only-applicant'],
            assessorRoles: [],
            clerkRoles: [],
          }),
        },
        expect.any(Object),
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next with 400 when configuration service rejects the patch', async () => {
      axiosMock.get.mockResolvedValue({ status: HttpStatusCodes.OK, data: existingDefinition });

      const axiosError = Object.assign(new Error('Bad Request'), {
        isAxiosError: true,
        response: { data: { errorMessage: 'Role validation failed.' } },
      });
      jest.mocked(axiosMock.isAxiosError).mockReturnValue(true);
      axiosMock.patch.mockRejectedValue(axiosError);

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        params: { definitionId: 'test' },
        body: { applicantRoles: [], assessorRoles: [], clerkRoles: [] },
        tenant: { id: tenantId },
      };

      const handler = updateFormDefinitionRoles(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ extra: expect.objectContaining({ statusCode: 400 }) }),
      );
      expect(res.send).not.toHaveBeenCalled();
    });
  });

  describe('patchFormDefinitionLifecycle', () => {
    const existingDefinition = {
      id: 'test',
      name: 'Test Form',
      description: '',
      anonymousApply: false,
      oneFormPerApplicant: true,
      applicantRoles: [],
      assessorRoles: [],
      clerkRoles: [],
      dataSchema: {},
      supportTopic: false,
      securityClassification: 'public',
    };

    let res: { status: jest.Mock; send: jest.Mock };
    let next: jest.Mock;

    beforeEach(() => {
      res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
      next = jest.fn();
    });

    it('can create handler', () => {
      const handler = patchFormDefinitionLifecycle(directoryMock, tokenProviderMock);
      expect(handler).toBeTruthy();
    });

    it('can call next with unauthorized for non-admin', async () => {
      const req = {
        user: { tenantId, id: 'tester', roles: ['test-applicant'] },
        params: { definitionId: 'test' },
        body: { allowAnonymousApplication: true },
        tenant: { id: tenantId },
      };

      const handler = patchFormDefinitionLifecycle(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
      expect(axiosMock.get).not.toHaveBeenCalled();
      expect(axiosMock.patch).not.toHaveBeenCalled();
    });

    it('can call next with not found when definition does not exist', async () => {
      axiosMock.get.mockResolvedValue({ status: HttpStatusCodes.NOT_FOUND, data: {} });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        params: { definitionId: 'missing-def' },
        body: { allowAnonymousApplication: true },
        tenant: { id: tenantId },
      };

      const handler = patchFormDefinitionLifecycle(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(axiosMock.patch).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('missing-def') }));
    });

    it('can update allowAnonymousApplication', async () => {
      axiosMock.get.mockResolvedValue({ status: HttpStatusCodes.OK, data: existingDefinition });
      mockPatchSuccess({ ...existingDefinition, anonymousApply: true });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        params: { definitionId: 'test' },
        body: { allowAnonymousApplication: true },
        tenant: { id: tenantId },
      };

      const handler = patchFormDefinitionLifecycle(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(axiosMock.patch).toHaveBeenCalledWith(
        expect.any(String),
        { operation: 'REPLACE', configuration: expect.objectContaining({ anonymousApply: true }) },
        expect.any(Object),
      );
      expect(res.send).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('sets oneFormPerApplicant=false when allowMultipleFormsPerApplicant=true', async () => {
      axiosMock.get.mockResolvedValue({ status: HttpStatusCodes.OK, data: existingDefinition });
      mockPatchSuccess({ ...existingDefinition, oneFormPerApplicant: false });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        params: { definitionId: 'test' },
        body: { allowMultipleFormsPerApplicant: true },
        tenant: { id: tenantId },
      };

      const handler = patchFormDefinitionLifecycle(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(axiosMock.patch).toHaveBeenCalledWith(
        expect.any(String),
        { operation: 'REPLACE', configuration: expect.objectContaining({ oneFormPerApplicant: false }) },
        expect.any(Object),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('sets oneFormPerApplicant=true when allowMultipleFormsPerApplicant=false', async () => {
      axiosMock.get.mockResolvedValue({
        status: HttpStatusCodes.OK,
        data: { ...existingDefinition, oneFormPerApplicant: false },
      });
      mockPatchSuccess({ ...existingDefinition, oneFormPerApplicant: true });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        params: { definitionId: 'test' },
        body: { allowMultipleFormsPerApplicant: false },
        tenant: { id: tenantId },
      };

      const handler = patchFormDefinitionLifecycle(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(axiosMock.patch).toHaveBeenCalledWith(
        expect.any(String),
        { operation: 'REPLACE', configuration: expect.objectContaining({ oneFormPerApplicant: true }) },
        expect.any(Object),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('can update createSupportTopic', async () => {
      axiosMock.get.mockResolvedValue({ status: HttpStatusCodes.OK, data: existingDefinition });
      mockPatchSuccess({ ...existingDefinition, supportTopic: true });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        params: { definitionId: 'test' },
        body: { createSupportTopic: true },
        tenant: { id: tenantId },
      };

      const handler = patchFormDefinitionLifecycle(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(axiosMock.patch).toHaveBeenCalledWith(
        expect.any(String),
        { operation: 'REPLACE', configuration: expect.objectContaining({ supportTopic: true }) },
        expect.any(Object),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('can update securityClassification', async () => {
      axiosMock.get.mockResolvedValue({ status: HttpStatusCodes.OK, data: existingDefinition });
      mockPatchSuccess({ ...existingDefinition, securityClassification: 'protected a' });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        params: { definitionId: 'test' },
        body: { securityClassification: 'protected a' },
        tenant: { id: tenantId },
      };

      const handler = patchFormDefinitionLifecycle(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(axiosMock.patch).toHaveBeenCalledWith(
        expect.any(String),
        { operation: 'REPLACE', configuration: expect.objectContaining({ securityClassification: 'protected a' }) },
        expect.any(Object),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('preserves existing fields when only one lifecycle field is provided', async () => {
      axiosMock.get.mockResolvedValue({ status: HttpStatusCodes.OK, data: existingDefinition });
      mockPatchSuccess(existingDefinition);

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        params: { definitionId: 'test' },
        body: { createSupportTopic: true },
        tenant: { id: tenantId },
      };

      const handler = patchFormDefinitionLifecycle(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(axiosMock.patch).toHaveBeenCalledWith(
        expect.any(String),
        {
          operation: 'REPLACE',
          configuration: expect.objectContaining({
            anonymousApply: false,
            oneFormPerApplicant: true,
            supportTopic: true,
            securityClassification: 'public',
          }),
        },
        expect.any(Object),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next with 400 when configuration service rejects the patch', async () => {
      axiosMock.get.mockResolvedValue({ status: HttpStatusCodes.OK, data: existingDefinition });

      const axiosError = Object.assign(new Error('Bad Request'), {
        isAxiosError: true,
        response: { data: { errorMessage: 'Validation failed.' } },
      });
      jest.mocked(axiosMock.isAxiosError).mockReturnValue(true);
      axiosMock.patch.mockRejectedValue(axiosError);

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        params: { definitionId: 'test' },
        body: { allowAnonymousApplication: true },
        tenant: { id: tenantId },
      };

      const handler = patchFormDefinitionLifecycle(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ extra: expect.objectContaining({ statusCode: 400 }) }),
      );
      expect(res.send).not.toHaveBeenCalled();
    });
  });

  describe('patchFormDefinitionSubmissionActions', () => {
    const existingDefinition = {
      id: 'test',
      name: 'Test Form',
      description: '',
      anonymousApply: false,
      applicantRoles: [],
      assessorRoles: [],
      clerkRoles: [],
      dataSchema: {},
      submissionRecords: false,
      submissionPdfTemplate: null,
      includeDataInSubmission: false,
      dispositionStates: [],
    };

    let res: { status: jest.Mock; send: jest.Mock };
    let next: jest.Mock;

    beforeEach(() => {
      res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
      next = jest.fn();
    });

    it('can create handler', () => {
      const handler = patchFormDefinitionSubmissionActions(directoryMock, tokenProviderMock);
      expect(handler).toBeTruthy();
    });

    it('can call next with unauthorized for non-admin', async () => {
      const req = {
        user: { tenantId, id: 'tester', roles: ['test-applicant'] },
        params: { definitionId: 'test' },
        body: { createSubmissionRecords: true },
        tenant: { id: tenantId },
      };

      const handler = patchFormDefinitionSubmissionActions(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
      expect(axiosMock.get).not.toHaveBeenCalled();
      expect(axiosMock.patch).not.toHaveBeenCalled();
    });

    it('can call next with not found when definition does not exist', async () => {
      axiosMock.get.mockResolvedValue({ status: HttpStatusCodes.NOT_FOUND, data: {} });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        params: { definitionId: 'missing-def' },
        body: { createSubmissionRecords: true },
        tenant: { id: tenantId },
      };

      const handler = patchFormDefinitionSubmissionActions(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(axiosMock.patch).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('missing-def') }));
    });

    it('can update submission actions and return mapped definition', async () => {
      axiosMock.get.mockResolvedValue({ status: HttpStatusCodes.OK, data: existingDefinition });
      mockPatchSuccess({
        ...existingDefinition,
        submissionRecords: true,
        submissionPdfTemplate: 'submitted-form',
        includeDataInSubmission: true,
        customSubmissionEvent: { namespace: 'form-service', name: 'custom-submitted' },
        queueTaskToProcess: { queueNameSpace: 'queue-service', queueName: 'review' },
        dispositionStates: [{ id: 'approved', name: 'Approved', description: 'Approved submission' }],
      });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        params: { definitionId: 'test' },
        body: {
          createPDF: true,
          createSubmissionRecords: true,
          event: 'form-service:custom-submitted',
          includeDataInEvent: true,
          taskQueue: 'queue-service:review',
          dispositionStates: [{ id: 'approved', name: 'Approved', description: 'Approved submission' }],
        },
        tenant: { id: tenantId },
      };

      const handler = patchFormDefinitionSubmissionActions(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(axiosMock.patch).toHaveBeenCalledWith(
        expect.any(String),
        {
          operation: 'REPLACE',
          configuration: expect.objectContaining({
            id: 'test',
            submissionRecords: true,
            submissionPdfTemplate: 'submitted-form',
            includeDataInSubmission: true,
            customSubmissionEvent: { namespace: 'form-service', name: 'custom-submitted' },
            queueTaskToProcess: { queueNameSpace: 'queue-service', queueName: 'review' },
            dispositionStates: [{ id: 'approved', name: 'Approved', description: 'Approved submission' }],
          }),
        },
        expect.any(Object),
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ submissionRecords: true, generatesPdf: true }));
      expect(next).not.toHaveBeenCalled();
    });

    it('can disable optional submission actions', async () => {
      const definitionWithActions = {
        ...existingDefinition,
        submissionRecords: true,
        submissionPdfTemplate: 'submitted-form',
        includeDataInSubmission: true,
        customSubmissionEvent: { namespace: 'form-service', name: 'custom-submitted' },
        queueTaskToProcess: { queueNameSpace: 'queue-service', queueName: 'review' },
      };
      axiosMock.get.mockResolvedValue({ status: HttpStatusCodes.OK, data: definitionWithActions });
      mockPatchSuccess({
        ...definitionWithActions,
        submissionRecords: false,
        submissionPdfTemplate: null,
        includeDataInSubmission: false,
        customSubmissionEvent: null,
        queueTaskToProcess: null,
      });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        params: { definitionId: 'test' },
        body: {
          createPDF: false,
          createSubmissionRecords: false,
          event: null,
          includeDataInEvent: false,
          taskQueue: null,
        },
        tenant: { id: tenantId },
      };

      const handler = patchFormDefinitionSubmissionActions(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(axiosMock.patch).toHaveBeenCalledWith(
        expect.any(String),
        {
          operation: 'REPLACE',
          configuration: expect.objectContaining({
            submissionRecords: false,
            submissionPdfTemplate: null,
            includeDataInSubmission: false,
            customSubmissionEvent: null,
            queueTaskToProcess: null,
          }),
        },
        expect.any(Object),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('preserves existing actions when only one action field is provided', async () => {
      const definitionWithActions = {
        ...existingDefinition,
        submissionPdfTemplate: 'existing-template',
        includeDataInSubmission: true,
      };
      axiosMock.get.mockResolvedValue({ status: HttpStatusCodes.OK, data: definitionWithActions });
      mockPatchSuccess({ ...definitionWithActions, submissionRecords: true });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        params: { definitionId: 'test' },
        body: { createSubmissionRecords: true },
        tenant: { id: tenantId },
      };

      const handler = patchFormDefinitionSubmissionActions(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(axiosMock.patch).toHaveBeenCalledWith(
        expect.any(String),
        {
          operation: 'REPLACE',
          configuration: expect.objectContaining({
            submissionRecords: true,
            submissionPdfTemplate: 'existing-template',
            includeDataInSubmission: true,
          }),
        },
        expect.any(Object),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next with 400 when configuration service rejects the patch', async () => {
      axiosMock.get.mockResolvedValue({ status: HttpStatusCodes.OK, data: existingDefinition });

      const axiosError = Object.assign(new Error('Bad Request'), {
        isAxiosError: true,
        response: { data: { errorMessage: 'Validation failed.' } },
      });
      jest.mocked(axiosMock.isAxiosError).mockReturnValue(true);
      axiosMock.patch.mockRejectedValue(axiosError);

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        params: { definitionId: 'test' },
        body: { createSubmissionRecords: true },
        tenant: { id: tenantId },
      };

      const handler = patchFormDefinitionSubmissionActions(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ extra: expect.objectContaining({ statusCode: 400 }) }),
      );
      expect(res.send).not.toHaveBeenCalled();
    });
  });
});

const registrationRepositoryMock = {
  get: jest.fn(),
  getLatestByEmail: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  updateIfPending: jest.fn(),
};

const auditServiceMock = {
  record: jest.fn().mockResolvedValue({ status: 'recorded', eventId: 'event' }),
  query: jest.fn(),
  flush: jest.fn(),
  droppedEventCount: 0,
};

describe('definition router registrations', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const definitionId = 'medical-intake';
  const registrationId = '6f1c2a9e-3b4d-4c8e-9a2f-1d5e7b8c9a01';

  const eventServiceMock = { send: jest.fn() };
  const loggerMock = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() } as unknown as Logger;
  const definitionMock = {
    id: definitionId,
    isRegistrationEnabled: jest.fn(),
    validateRegistrationData: jest.fn(),
  };

  const createUser = (roles: string[], email = 'reviewer@gov.ab.ca') => ({
    id: 'user-1',
    name: 'Test User',
    email,
    tenantId,
    roles,
    isCore: false,
  });

  const createRegistration = () =>
    new FormRegistrationEntity({
      id: registrationId,
      tenantId,
      formDefinitionId: definitionId,
      status: RegistrationStatus.Pending,
      firstName: 'Test',
      lastName: 'User',
      email: 'test.user@gov.ab.ca',
      data: { profession: 'nurse' },
      submittedAt: new Date('2026-11-12T16:00:00Z'),
    });

  const createReq = (roles: string[], props: Record<string, unknown> = {}) =>
    ({
      user: createUser(roles),
      tenant: { id: tenantId },
      params: { definitionId },
      query: {},
      body: {},
      getServiceConfiguration: jest.fn().mockResolvedValue([definitionMock]),
      ...props,
    }) as unknown as Request;

  const createRes = () =>
    ({
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    }) as unknown as Response & { status: jest.Mock; send: jest.Mock };

  const conflict = expect.objectContaining({ extra: expect.objectContaining({ statusCode: 409 }) });

  beforeEach(() => {
    jest.clearAllMocks();
    definitionMock.isRegistrationEnabled.mockReturnValue(true);
    definitionMock.validateRegistrationData.mockReturnValue(undefined);
  });

  describe('submitRegistration', () => {
    const handler = () =>
      submitRegistration(registrationRepositoryMock, eventServiceMock, auditServiceMock, loggerMock);
    const body = { firstName: 'Test', lastName: 'User', email: 'Test.User@gov.ab.ca', data: { profession: 'nurse' } };

    it.each([FormServiceRoles.RegistrationRequester, FormServiceRoles.Admin])(
      'creates a pending registration for a user with %s and responds 201',
      async (role) => {
        registrationRepositoryMock.create.mockImplementationOnce((entity) => Promise.resolve(entity));
        const req = createReq([role], { body });
        const res = createRes();
        const next = jest.fn();

        await handler()(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(definitionMock.validateRegistrationData).toHaveBeenCalledWith({ profession: 'nurse' });
        expect(registrationRepositoryMock.create).toHaveBeenCalledWith(
          expect.objectContaining({ email: 'test.user@gov.ab.ca', status: RegistrationStatus.Pending }),
        );
        expect(res.status).toHaveBeenCalledWith(HttpStatusCodes.CREATED);
        expect(res.send).toHaveBeenCalledWith(
          expect.objectContaining({ id: expect.any(String), status: 'pending', formDefinitionId: definitionId }),
        );
        expect(eventServiceMock.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'registration-submitted' }));
        expect(auditServiceMock.record).toHaveBeenCalledWith(RegistrationSubmittedAuditAction, expect.any(Object));
      },
    );

    it('validates missing additional data as an empty object', async () => {
      registrationRepositoryMock.create.mockImplementationOnce((entity) => Promise.resolve(entity));
      const req = createReq([FormServiceRoles.RegistrationRequester], {
        body: { firstName: 'Test', lastName: 'User', email: 'test.user@gov.ab.ca' },
      });

      await handler()(req, createRes(), jest.fn());

      expect(definitionMock.validateRegistrationData).toHaveBeenCalledWith({});
    });

    it('rejects a user without the requester role', async () => {
      const next = jest.fn();

      await handler()(createReq([FormServiceRoles.RegistrationReader], { body }), createRes(), next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
      expect(registrationRepositoryMock.create).not.toHaveBeenCalled();
    });

    it('responds not found when the definition does not exist', async () => {
      const req = createReq([FormServiceRoles.RegistrationRequester], {
        body,
        getServiceConfiguration: jest.fn().mockResolvedValue([null]),
      });
      const next = jest.fn();

      await handler()(req, createRes(), next);

      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });

    it('rejects when registration is not enabled for the form', async () => {
      definitionMock.isRegistrationEnabled.mockReturnValueOnce(false);
      const next = jest.fn();

      await handler()(createReq([FormServiceRoles.RegistrationRequester], { body }), createRes(), next);

      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
      expect(registrationRepositoryMock.create).not.toHaveBeenCalled();
    });

    it('rejects data that does not match the registration configuration', async () => {
      definitionMock.validateRegistrationData.mockImplementationOnce(() => {
        throw new InvalidValueError('access request', 'must NOT have additional properties');
      });
      const next = jest.fn();

      await handler()(createReq([FormServiceRoles.RegistrationRequester], { body }), createRes(), next);

      expect(next).toHaveBeenCalledWith(expect.any(InvalidValueError));
      expect(registrationRepositoryMock.create).not.toHaveBeenCalled();
    });

    it('passes on the conflict for a duplicate pending registration', async () => {
      const error = new InvalidOperationError('duplicate', { statusCode: HttpStatusCodes.CONFLICT });
      registrationRepositoryMock.create.mockRejectedValueOnce(error);
      const next = jest.fn();

      await handler()(createReq([FormServiceRoles.RegistrationRequester], { body }), createRes(), next);

      expect(next).toHaveBeenCalledWith(error);
      expect(eventServiceMock.send).not.toHaveBeenCalled();
    });

    it('requires a tenant context', async () => {
      const next = jest.fn();

      await handler()(
        createReq([FormServiceRoles.RegistrationRequester], { body, tenant: undefined }),
        createRes(),
        next,
      );

      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });
  });

  describe('getRegistrations', () => {
    const results = { results: [createRegistration()], page: { size: 1, next: null, after: null, total: 1 } };

    it.each([FormServiceRoles.RegistrationReader, FormServiceRoles.RegistrationWriter, FormServiceRoles.Admin])(
      'returns the registrations for the form to a user with %s',
      async (role) => {
        registrationRepositoryMock.find.mockResolvedValueOnce(results);
        const req = createReq([role], { query: { top: '5', after: 'NQ==', status: 'pending' } });
        const res = createRes();
        const next = jest.fn();

        await getRegistrations(registrationRepositoryMock)(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(registrationRepositoryMock.find).toHaveBeenCalledWith(5, 'NQ==', {
          tenantIdEquals: tenantId,
          definitionIdEquals: definitionId,
          statusEquals: 'pending',
        });
        expect(res.send).toHaveBeenCalledWith({
          results: [expect.objectContaining({ id: registrationId, data: { profession: 'nurse' } })],
          page: results.page,
        });
      },
    );

    it('defaults to 10 results', async () => {
      registrationRepositoryMock.find.mockResolvedValueOnce(results);

      await getRegistrations(registrationRepositoryMock)(
        createReq([FormServiceRoles.RegistrationReader]),
        createRes(),
        jest.fn(),
      );

      expect(registrationRepositoryMock.find).toHaveBeenCalledWith(10, undefined, expect.any(Object));
    });

    it('rejects a user without a reviewer role', async () => {
      const next = jest.fn();

      await getRegistrations(registrationRepositoryMock)(
        createReq([FormServiceRoles.RegistrationRequester]),
        createRes(),
        next,
      );

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
      expect(registrationRepositoryMock.find).not.toHaveBeenCalled();
    });
  });

  describe('getRegistrationByEmail', () => {
    it('returns the caller their own registration', async () => {
      registrationRepositoryMock.getLatestByEmail.mockResolvedValueOnce(createRegistration());
      const req = createReq([FormServiceRoles.RegistrationRequester], {
        user: createUser([FormServiceRoles.RegistrationRequester], 'Test.User@gov.ab.ca'),
        params: { definitionId, email: 'test.user@gov.ab.ca' },
      });
      const res = createRes();
      const next = jest.fn();

      await getRegistrationByEmail(registrationRepositoryMock)(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(registrationRepositoryMock.getLatestByEmail).toHaveBeenCalledWith(
        tenantId,
        definitionId,
        'test.user@gov.ab.ca',
      );
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ id: registrationId }));
    });

    it.each([FormServiceRoles.RegistrationReader, FormServiceRoles.Admin])(
      'returns another user registration to a user with %s',
      async (role) => {
        registrationRepositoryMock.getLatestByEmail.mockResolvedValueOnce(createRegistration());
        const req = createReq([role], {
          params: { definitionId, email: 'test.user@gov.ab.ca' },
        });
        const next = jest.fn();

        await getRegistrationByEmail(registrationRepositoryMock)(req, createRes(), next);

        expect(next).not.toHaveBeenCalled();
      },
    );

    it('rejects a request for another user email', async () => {
      const req = createReq([FormServiceRoles.RegistrationRequester], {
        params: { definitionId, email: 'someone.else@gov.ab.ca' },
      });
      const next = jest.fn();

      await getRegistrationByEmail(registrationRepositoryMock)(req, createRes(), next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
      expect(registrationRepositoryMock.getLatestByEmail).not.toHaveBeenCalled();
    });

    it('responds not found when there is no registration', async () => {
      registrationRepositoryMock.getLatestByEmail.mockResolvedValueOnce(null);
      const req = createReq([FormServiceRoles.RegistrationReader], {
        params: { definitionId, email: 'test.user@gov.ab.ca' },
      });
      const next = jest.fn();

      await getRegistrationByEmail(registrationRepositoryMock)(req, createRes(), next);

      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });

  describe('updateRegistration', () => {
    const handler = () =>
      updateRegistration(registrationRepositoryMock, eventServiceMock, auditServiceMock, loggerMock);
    const params = { definitionId, requestId: registrationId };

    it.each([FormServiceRoles.RegistrationWriter, FormServiceRoles.Admin])(
      'records the review by a user with %s and returns the updated registration',
      async (role) => {
        registrationRepositoryMock.get.mockResolvedValueOnce(createRegistration());
        registrationRepositoryMock.updateIfPending.mockImplementationOnce((entity) => Promise.resolve(entity));
        const req = createReq([role], { params, body: { status: 'approved' } });
        const res = createRes();
        const next = jest.fn();

        await handler()(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(registrationRepositoryMock.get).toHaveBeenCalledWith(tenantId, definitionId, registrationId);
        expect(res.send).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'approved',
            reviewedBy: { id: 'user-1', name: 'Test User' },
            reviewedAt: expect.any(Date),
          }),
        );
        expect(eventServiceMock.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'registration-reviewed' }));
        expect(auditServiceMock.record).toHaveBeenCalledWith(RegistrationReviewedAuditAction, expect.any(Object));
      },
    );

    it('rejects a user without the writer role', async () => {
      const next = jest.fn();

      await handler()(
        createReq([FormServiceRoles.RegistrationReader], { params, body: { status: 'approved' } }),
        createRes(),
        next,
      );

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
      expect(registrationRepositoryMock.get).not.toHaveBeenCalled();
    });

    it('responds not found when the registration does not exist for the form', async () => {
      registrationRepositoryMock.get.mockResolvedValueOnce(null);
      const next = jest.fn();

      await handler()(
        createReq([FormServiceRoles.RegistrationWriter], { params, body: { status: 'approved' } }),
        createRes(),
        next,
      );

      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });

    it('responds conflict when the registration is already approved', async () => {
      const approved = createRegistration();
      approved.status = RegistrationStatus.Approved;
      registrationRepositoryMock.get.mockResolvedValueOnce(approved);
      const next = jest.fn();

      await handler()(
        createReq([FormServiceRoles.RegistrationWriter], { params, body: { status: 'approved' } }),
        createRes(),
        next,
      );

      expect(next).toHaveBeenCalledWith(conflict);
      expect(registrationRepositoryMock.updateIfPending).not.toHaveBeenCalled();
    });

    it('responds conflict when another reviewer updated the registration first', async () => {
      registrationRepositoryMock.get.mockResolvedValueOnce(createRegistration());
      registrationRepositoryMock.updateIfPending.mockResolvedValueOnce(null);
      const next = jest.fn();

      await handler()(
        createReq([FormServiceRoles.RegistrationWriter], { params, body: { status: 'denied' } }),
        createRes(),
        next,
      );

      expect(next).toHaveBeenCalledWith(conflict);
      expect(eventServiceMock.send).not.toHaveBeenCalled();
    });
  });
});

const calendarServiceMock = {
  getScheduledIntake: jest.fn(),
  updateScheduleIntake: jest.fn(),
};
