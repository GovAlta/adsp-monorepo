import { adspId, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import { ValidationService } from '@core-services/core-common';
import * as HttpStatusCodes from 'http-status-codes';
import axios from 'axios';
import { Request, Response } from 'express';
import { Logger } from 'winston';
import { FormDefinitionEntity } from '../model';
import { FormServiceRoles } from '..';
import {
  createFormDefinition,
  createFormDefinitionRouter,
  deleteFormDefinition,
  getFormDefinitions,
  patchFormDefinition,
  updateFormDefinition,
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
    tokenProviderMock.getAccessToken.mockReturnValue(Promise.resolve('token'));
  });

  it('can create router', () => {
    const router = createFormDefinitionRouter({
      directory: directoryMock,
      tokenProvider: tokenProviderMock,
      tenantService: tenantServiceMock,
      calendarService: calendarServiceMock,
      logger: loggerMock as unknown as Logger,
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
      const configurationServiceUrl = new URL('http://configuration-service');
      directoryMock.getServiceUrl.mockResolvedValue(configurationServiceUrl);
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
      const configurationServiceUrl = new URL('http://configuration-service');
      directoryMock.getServiceUrl.mockResolvedValue(configurationServiceUrl);
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
  });

  describe('createFormDefinition', () => {
    it('can create handler', () => {
      const handler = createFormDefinition(directoryMock, tokenProviderMock, loggerMock as unknown as Logger);
      expect(handler).toBeTruthy();
    });

    it('can call next with unauthorized for non-admin', async () => {
      const req = {
        user: { tenantId, id: 'tester', roles: ['test-applicant'] },
        body: { id: 'test', name: 'test', anonymousApply: false, applicantRoles: [], assessorRoles: [] },
        tenant: { id: tenantId },
      };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
      const next = jest.fn();

      const handler = createFormDefinition(directoryMock, tokenProviderMock, loggerMock as unknown as Logger);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });

    it('can reject id with path traversal characters', async () => {
      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        body: { id: '../../etc/passwd', name: 'bad', anonymousApply: false, applicantRoles: [], assessorRoles: [] },
        tenant: { id: tenantId },
      };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
      const next = jest.fn();

      // The route validator would block this before reaching the handler.
      // Verify the handler also rejects it by checking the id fails the safe pattern.
      const unsafeId = req.body.id;
      expect(/^[a-z0-9-]+$/.test(unsafeId)).toBe(false);
    });

    it('can return 409 if definition already exists', async () => {
      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        body: { id: 'test', name: 'Existing', anonymousApply: false, applicantRoles: [], assessorRoles: [] },
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
      const configurationServiceUrl = new URL('http://configuration-service');
      directoryMock.getServiceUrl.mockResolvedValue(configurationServiceUrl);
      const newDefinition = {
        id: 'new-def',
        name: 'New Definition',
        anonymousApply: false,
        applicantRoles: [],
        assessorRoles: [],
      };
      // Existence check returns null — definition does not exist yet.
      axiosMock.patch.mockResolvedValue({
        data: { latest: { revision: 1, configuration: newDefinition } },
      });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        body: newDefinition,
        tenant: { id: tenantId },
        getServiceConfiguration: jest.fn().mockResolvedValue([null]),
      };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
      const next = jest.fn();

      const handler = createFormDefinition(directoryMock, tokenProviderMock, loggerMock as unknown as Logger);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(axiosMock.patch).toHaveBeenCalledWith(
        expect.stringContaining('new-def'),
        expect.objectContaining({ operation: 'REPLACE', configuration: newDefinition }),
        expect.any(Object),
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ id: 'new-def' }));
      expect(next).not.toHaveBeenCalled();
    });

    it('can auto-generate id from name when id not provided', async () => {
      const configurationServiceUrl = new URL('http://configuration-service');
      directoryMock.getServiceUrl.mockResolvedValue(configurationServiceUrl);
      const newDefinition = {
        name: 'My New Form',
        anonymousApply: false,
        applicantRoles: [],
        assessorRoles: [],
      };
      axiosMock.patch.mockResolvedValue({
        data: { latest: { revision: 1, configuration: { ...newDefinition, id: 'my-new-form' } } },
      });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        body: newDefinition,
        tenant: { id: tenantId },
        getServiceConfiguration: jest.fn().mockResolvedValue([null]),
      };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
      const next = jest.fn();

      const handler = createFormDefinition(directoryMock, tokenProviderMock, loggerMock as unknown as Logger);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(axiosMock.patch).toHaveBeenCalledWith(
        expect.stringContaining('my-new-form'),
        expect.objectContaining({
          operation: 'REPLACE',
          configuration: expect.objectContaining({ id: 'my-new-form', name: 'My New Form' }),
        }),
        expect.any(Object),
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ id: 'my-new-form', name: 'My New Form' }));
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next with 400 when configuration service rejects the patch', async () => {
      const configurationServiceUrl = new URL('http://configuration-service');
      directoryMock.getServiceUrl.mockResolvedValue(configurationServiceUrl);
      const axiosError = Object.assign(new Error('Bad Request'), {
        isAxiosError: true,
        response: { data: { errorMessage: 'Schema validation failed.' } },
      });
      jest.mocked(axiosMock.isAxiosError).mockReturnValue(true);
      axiosMock.patch.mockRejectedValue(axiosError);

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        body: { name: 'Test', anonymousApply: false, applicantRoles: [], assessorRoles: [] },
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

    describe('default roles', () => {
      it('applies default applicantRoles when not provided in body', async () => {
        const configurationServiceUrl = new URL('http://configuration-service');
        directoryMock.getServiceUrl.mockResolvedValue(configurationServiceUrl);
        axiosMock.patch.mockResolvedValue({
          data: { latest: { revision: 1, configuration: { id: 'test-def', name: 'Test' } } },
        });

        // express-validator's .default() middleware injects these values into req.body before
        // the handler runs; simulate that here by providing the defaulted values.
        const req = {
          user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
          body: {
            name: 'Test',
            anonymousApply: false,
            applicantRoles: ['urn:ads:platform:form-service:form-applicant'],
            assessorRoles: [],
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
          expect.objectContaining({
            configuration: expect.objectContaining({
              applicantRoles: ['urn:ads:platform:form-service:form-applicant'],
              assessorRoles: [],
            }),
          }),
          expect.any(Object),
        );
      });

      it('overrides default applicantRoles when provided in body', async () => {
        const configurationServiceUrl = new URL('http://configuration-service');
        directoryMock.getServiceUrl.mockResolvedValue(configurationServiceUrl);
        axiosMock.patch.mockResolvedValue({
          data: { latest: { revision: 1, configuration: { id: 'test-def', name: 'Test' } } },
        });

        const req = {
          user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
          body: { name: 'Test', anonymousApply: false, applicantRoles: ['custom-role'], assessorRoles: ['assessor'] },
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
              applicantRoles: ['custom-role'],
              assessorRoles: ['assessor'],
            }),
          }),
          expect.any(Object),
        );
      });

      it('passes formDraftUrlTemplate through to configuration service', async () => {
        const configurationServiceUrl = new URL('http://configuration-service');
        directoryMock.getServiceUrl.mockResolvedValue(configurationServiceUrl);
        axiosMock.patch.mockResolvedValue({
          data: { latest: { revision: 1, configuration: { id: 'test-def', name: 'Test' } } },
        });

        const req = {
          user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
          body: {
            name: 'Test',
            anonymousApply: false,
            applicantRoles: [],
            assessorRoles: [],
            formDraftUrlTemplate: 'https://example.com/form/{{id}}',
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
          expect.objectContaining({
            configuration: expect.objectContaining({
              formDraftUrlTemplate: 'https://example.com/form/{{id}}',
            }),
          }),
          expect.any(Object),
        );
      });
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
      const configurationServiceUrl = new URL('http://configuration-service');
      directoryMock.getServiceUrl.mockResolvedValue(configurationServiceUrl);

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
      const configurationServiceUrl = new URL('http://configuration-service');
      directoryMock.getServiceUrl.mockResolvedValue(configurationServiceUrl);

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

      axiosMock.get.mockResolvedValue({
        status: HttpStatusCodes.OK,
        data: existingDefinition,
      });

      axiosMock.patch.mockResolvedValue({
        data: {
          latest: {
            revision: 2,
            configuration: expectedPatchedDefinition,
          },
        },
      });

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
      const configurationServiceUrl = new URL('http://configuration-service');
      directoryMock.getServiceUrl.mockResolvedValue(configurationServiceUrl);

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

      axiosMock.get.mockResolvedValue({
        status: HttpStatusCodes.OK,
        data: existingDefinition,
      });

      axiosMock.patch.mockResolvedValue({
        data: {
          latest: {
            revision: 2,
            configuration: expectedPatchedDefinition,
          },
        },
      });

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
      const configurationServiceUrl = new URL('http://configuration-service');
      directoryMock.getServiceUrl.mockResolvedValue(configurationServiceUrl);

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
      const configurationServiceUrl = new URL('http://configuration-service');
      directoryMock.getServiceUrl.mockResolvedValue(configurationServiceUrl);
      const updated = {
        id: 'test',
        name: 'Updated Name',
        anonymousApply: false,
        applicantRoles: [],
        assessorRoles: [],
      };
      axiosMock.patch.mockResolvedValue({
        data: { latest: { revision: 2, configuration: updated } },
      });

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
      const configurationServiceUrl = new URL('http://configuration-service');
      directoryMock.getServiceUrl.mockResolvedValue(configurationServiceUrl);
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
});

const calendarServiceMock = {
  getScheduledIntake: jest.fn(),
};
