import { adspId, User } from '@abgov/adsp-service-sdk';
import { ValidationService } from '@core-services/core-common';
import { Request, Response } from 'express';
import { Logger } from 'winston';
import { FormDefinitionEntity, FormEntity } from '../model';
import { FormServiceRoles } from '../roles';
import { FormStatus } from '../types';
import { createForm, formOperation, pushToSharePoint } from './form';
import { SUBMIT_FORM_OPERATION } from './types';

describe('form router SharePoint push', () => {
  const apiId = adspId`urn:ads:platform:form-service:v1`;
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const logger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() } as unknown as Logger;

  const validationService: ValidationService = { validate: jest.fn(), setSchema: jest.fn() };
  const calendarService = { getScheduledIntake: jest.fn(), updateScheduleIntake: jest.fn() };

  const aDefinition = (sharepointConfigurationId?: string) =>
    new FormDefinitionEntity(validationService, calendarService, tenantId, {
      id: 'form-definition',
      name: 'Form definition',
      description: '',
      formDraftUrlTemplate: 'https://my-form/{{ id }}',
      anonymousApply: true,
      applicantRoles: [],
      assessorRoles: [],
      clerkRoles: [],
      submissionRecords: false,
      submissionPdfTemplate: '',
      supportTopic: false,
      dataSchema: {},
      dispositionStates: [],
      queueTaskToProcess: { queueName: '', queueNameSpace: '' },
      sharepointConfigurationId,
    });

  const intakeApp = {
    tenantId,
    id: 'intake-sa',
    name: 'service-account-intake-app',
    roles: [FormServiceRoles.IntakeApp],
    isCore: false,
  } as User;

  const repository = {
    find: jest.fn(),
    get: jest.fn(),
    save: jest.fn((entity) => Promise.resolve(entity)),
    delete: jest.fn(),
  };
  const submissionRepository = { find: jest.fn(), get: jest.fn(), save: jest.fn(), delete: jest.fn() };
  const directory = { getServiceUrl: jest.fn(), getResourceUrl: jest.fn() };
  const tokenProvider = { getAccessToken: jest.fn() };
  const eventService = { send: jest.fn() };
  const commentService = { createSupportTopic: jest.fn(), getComment: jest.fn() };
  const notificationService = {
    getSubscriber: jest.fn(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    sendCode: jest.fn(),
    verifyCode: jest.fn(),
    hasSubscribers: jest.fn(),
  };
  const fileService = { delete: jest.fn() };
  const queueTaskService = { createTask: jest.fn() };
  const pdfService = { generateFormPdf: jest.fn() };
  const auditService = {
    record: jest.fn().mockResolvedValue({ status: 'recorded', eventId: 'event' }),
    query: jest.fn(),
    flush: jest.fn(),
    droppedEventCount: 0,
  };
  const sharepointService = { push: jest.fn() };

  const createRes = () => ({ send: jest.fn() }) as unknown as Response & { send: jest.Mock };
  const flush = () => new Promise((resolve) => setImmediate(resolve));

  const aForm = (definition: FormDefinitionEntity, props: Partial<FormEntity> = {}) =>
    new FormEntity(repository, tenantId, definition, null, {
      id: 'form-1',
      formDraftUrl: 'https://my-form/form-1',
      anonymousApplicant: true,
      created: new Date(),
      createdBy: { id: intakeApp.id, name: intakeApp.name },
      locked: null,
      submitted: null,
      lastAccessed: new Date(),
      status: FormStatus.Draft,
      data: { secret: 'my-sin-123' },
      files: {},
      dryRun: false,
      ...props,
    });

  const submitOperation = (form: FormEntity, extra = {}, withService = true) =>
    formOperation(
      apiId,
      logger,
      directory,
      tokenProvider,
      eventService,
      notificationService,
      queueTaskService,
      submissionRepository,
      pdfService,
      auditService,
      withService ? sharepointService : undefined,
    )(
      { user: intakeApp, body: { operation: SUBMIT_FORM_OPERATION, ...extra }, form } as unknown as Request,
      createRes(),
      jest.fn(),
    );

  beforeEach(() => {
    jest.clearAllMocks();
    sharepointService.push.mockResolvedValue({ success: true });
  });

  describe('submit operation', () => {
    it('pushes the submitted form after responding when the definition has a destination', async () => {
      const form = aForm(aDefinition('hr-intake'));
      const res = createRes();
      const next = jest.fn();

      await formOperation(
        apiId,
        logger,
        directory,
        tokenProvider,
        eventService,
        notificationService,
        queueTaskService,
        submissionRepository,
        pdfService,
        auditService,
        sharepointService,
      )({ user: intakeApp, body: { operation: SUBMIT_FORM_OPERATION }, form } as unknown as Request, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.send).toHaveBeenCalledTimes(1);
      expect(sharepointService.push).toHaveBeenCalledTimes(1);
      expect(sharepointService.push).toHaveBeenCalledWith(expect.objectContaining({ id: 'form-1' }), null);
      expect(res.send.mock.invocationCallOrder[0]).toBeLessThan(sharepointService.push.mock.invocationCallOrder[0]);
    });

    it('does not push when the definition has no destination', async () => {
      await submitOperation(aForm(aDefinition()));

      expect(sharepointService.push).not.toHaveBeenCalled();
    });

    it('does not push a dry run', async () => {
      await submitOperation(aForm(aDefinition('hr-intake')), { dryRun: true });

      expect(sharepointService.push).not.toHaveBeenCalled();
    });

    it('submits normally when no SharePoint service is configured', async () => {
      const form = aForm(aDefinition('hr-intake'));

      await submitOperation(form, {}, false);

      expect(form.status).toBe(FormStatus.Submitted);
    });

    it('still completes the submission when the push fails', async () => {
      sharepointService.push.mockResolvedValue({ success: false, errorCode: 'graph:TooManyRequests', retryable: true });
      const form = aForm(aDefinition('hr-intake'));

      await submitOperation(form);
      await flush();

      expect(form.status).toBe(FormStatus.Submitted);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('graph:TooManyRequests (retryable: true)'),
        expect.anything(),
      );
    });
  });

  describe('create and submit', () => {
    it('pushes a form that is created and submitted in one request', async () => {
      const definition = aDefinition('hr-intake');
      const res = createRes();

      await createForm(
        apiId,
        logger,
        repository,
        submissionRepository,
        directory,
        tokenProvider,
        eventService,
        commentService,
        notificationService,
        fileService,
        queueTaskService,
        pdfService,
        auditService,
        sharepointService,
      )(
        {
          user: intakeApp,
          tenant: { id: tenantId },
          body: { definitionId: definition.id, data: { name: 'Ada' }, submit: true },
          getServiceConfiguration: jest.fn().mockResolvedValue([definition]),
        } as unknown as Request,
        res,
        jest.fn(),
      );

      expect(sharepointService.push).toHaveBeenCalledTimes(1);
    });
  });

  describe('pushToSharePoint', () => {
    it('logs a rejected push without form data', async () => {
      sharepointService.push.mockRejectedValue(new Error('boom'));
      const form = aForm(aDefinition('hr-intake'));

      pushToSharePoint(logger, sharepointService, form, null);
      await flush();

      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('boom'), expect.anything());
      expect(JSON.stringify((logger.warn as jest.Mock).mock.calls)).not.toContain('my-sin-123');
    });

    it('does nothing without a service', () => {
      expect(() => pushToSharePoint(logger, undefined, aForm(aDefinition('hr-intake')), null)).not.toThrow();
    });
  });
});
