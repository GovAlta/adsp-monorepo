import { adspId, Channel, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { ValidationService } from '@core-services/core-common';
import { Request, Response } from 'express';
import { Logger } from 'winston';
import {
  AnonymousApplicantAuditActor,
  DATA_UPDATED_AUDIT_WINDOW_MS,
  createAuditThrottle,
  FormAccessCodeSentAuditAction,
  FormAccessedWithCodeAuditAction,
  FormArchivedAuditAction,
  FormCreatedAuditAction,
  FormDataUpdatedAuditAction,
  FormDeletedAuditAction,
  FormSetToDraftAuditAction,
  FormSubmittedAuditAction,
  FormUnlockedAuditAction,
  SubmissionDeletedAuditAction,
} from '../audit';
import { FormDefinitionEntity, FormEntity } from '../model';
import { FormServiceRoles } from '../roles';
import { FormStatus } from '../types';
import { accessForm, createForm, deleteForm, deleteFormSubmission, formOperation, updateFormData } from './form';
import {
  ARCHIVE_FORM_OPERATION,
  SEND_CODE_OPERATION,
  SET_TO_DRAFT_FORM_OPERATION,
  SUBMIT_FORM_OPERATION,
  UNLOCK_FORM_OPERATION,
} from './types';

describe('form router audit', () => {
  const apiId = adspId`urn:ads:platform:form-service:v1`;
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const logger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() } as unknown as Logger;

  const validationService: ValidationService = { validate: jest.fn(), setSchema: jest.fn() };
  const calendarService = { getScheduledIntake: jest.fn(), updateScheduleIntake: jest.fn() };

  const definition = new FormDefinitionEntity(validationService, calendarService, tenantId, {
    id: 'anonymous-form',
    name: 'Anonymous form',
    description: '',
    formDraftUrlTemplate: 'https://my-form/{{ id }}',
    anonymousApply: true,
    applicantRoles: [],
    assessorRoles: ['test-assessor'],
    clerkRoles: [],
    submissionRecords: false,
    submissionPdfTemplate: '',
    supportTopic: false,
    dataSchema: {},
    dispositionStates: [],
    queueTaskToProcess: { queueName: '', queueNameSpace: '' },
  });

  const applicantAddress = 'jane.doe@test.co';
  const subscriber = {
    id: 'subscriber',
    urn: adspId`urn:ads:platform:notification-service:v1:/subscribers/subscriber`,
    userId: 'jane',
    addressAs: 'Jane Doe',
    channels: [{ channel: Channel.email, address: applicantAddress }],
  };

  const intakeApp = {
    tenantId,
    id: 'intake-sa',
    name: 'service-account-intake-app',
    roles: [FormServiceRoles.IntakeApp],
    isCore: false,
  } as User;
  const admin = { tenantId, id: 'admin', name: 'Admin', roles: [FormServiceRoles.Admin], isCore: false } as User;

  const repository = {
    find: jest.fn(),
    get: jest.fn(),
    save: jest.fn((entity) => Promise.resolve(entity)),
    delete: jest.fn(() => Promise.resolve(true)),
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

  const createHandler = createForm(
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
  );
  const operationHandler = formOperation(
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
  );

  const createRes = () => ({ send: jest.fn() }) as unknown as Response & { send: jest.Mock };

  const aForm = (props: Partial<FormEntity> = {}) =>
    new FormEntity(repository, tenantId, definition, subscriber, {
      id: 'form-1',
      formDraftUrl: 'https://my-form/form-1',
      anonymousApplicant: true,
      created: new Date(),
      createdBy: { id: intakeApp.id, name: intakeApp.name },
      locked: null,
      submitted: null,
      lastAccessed: new Date(),
      status: FormStatus.Draft,
      data: {},
      files: {},
      dryRun: false,
      ...props,
    });

  const recordedActions = () => auditService.record.mock.calls.map(([action]) => action.name);

  beforeEach(() => {
    jest.clearAllMocks();
    notificationService.subscribe.mockResolvedValue(subscriber);
    notificationService.verifyCode.mockResolvedValue(true);
  });

  it('records each step of the anonymous applicant flow without applicant details or form data', async () => {
    const next = jest.fn();

    const createReq = {
      user: intakeApp,
      tenant: { id: tenantId },
      body: {
        definitionId: definition.id,
        applicant: { addressAs: 'Jane Doe', channels: [{ channel: Channel.email, address: applicantAddress }] },
      },
      getServiceConfiguration: jest.fn().mockResolvedValue([definition]),
    };
    await createHandler(createReq as unknown as Request, createRes(), next);
    const form: FormEntity = repository.save.mock.calls[0][0];

    await operationHandler(
      { user: intakeApp, body: { operation: SEND_CODE_OPERATION }, form } as unknown as Request,
      createRes(),
      next,
    );
    await accessForm(logger, notificationService, auditService)(
      { user: intakeApp, query: { code: '123456' }, form } as unknown as Request,
      createRes(),
      next,
    );
    await updateFormData(logger, fileService, auditService)(
      { user: intakeApp, body: { data: { secret: 'my-sin-123' } }, form } as unknown as Request,
      createRes(),
      next,
    );
    await operationHandler(
      { user: intakeApp, body: { operation: SUBMIT_FORM_OPERATION }, form } as unknown as Request,
      createRes(),
      next,
    );

    expect(next).not.toHaveBeenCalled();
    expect(recordedActions()).toEqual([
      FormCreatedAuditAction.name,
      FormAccessCodeSentAuditAction.name,
      FormAccessedWithCodeAuditAction.name,
      FormDataUpdatedAuditAction.name,
      FormSubmittedAuditAction.name,
    ]);
    for (const [, details] of auditService.record.mock.calls) {
      expect(details).toMatchObject({
        tenantId,
        actor: AnonymousApplicantAuditActor,
        resource: { type: 'form', id: form.id },
        metadata: { definitionId: definition.id, anonymousApplicant: true, callerId: intakeApp.id },
      });
    }
    expect(auditService.record.mock.calls[1][1].metadata).toMatchObject({ channels: [Channel.email] });
    expect(auditService.record.mock.calls[4][1].metadata).toMatchObject({
      status: FormStatus.Submitted,
      previousStatus: FormStatus.Draft,
    });

    const recorded = JSON.stringify(auditService.record.mock.calls);
    expect(recorded).not.toContain('my-sin-123');
    expect(recorded).not.toContain(applicantAddress);
    expect(recorded).not.toContain('Jane Doe');
  });

  it('records created, data updated, then submitted when a form is created with data and submitted', async () => {
    const next = jest.fn();
    const req = {
      user: intakeApp,
      tenant: { id: tenantId },
      body: { definitionId: definition.id, data: { secret: 'my-sin-123' }, submit: true },
      getServiceConfiguration: jest.fn().mockResolvedValue([definition]),
    };

    await createHandler(req as unknown as Request, createRes(), next);

    expect(next).not.toHaveBeenCalled();
    expect(recordedActions()).toEqual([
      FormCreatedAuditAction.name,
      FormDataUpdatedAuditAction.name,
      FormSubmittedAuditAction.name,
    ]);
    expect(auditService.record.mock.calls.map(([, details]) => details.metadata.status)).toEqual([
      FormStatus.Draft,
      FormStatus.Draft,
      FormStatus.Submitted,
    ]);
    expect(JSON.stringify(auditService.record.mock.calls)).not.toContain('my-sin-123');
  });

  it('records form data updates once per form and caller in the throttle window', async () => {
    let now = 0;
    const handler = updateFormData(
      logger,
      fileService,
      auditService,
      createAuditThrottle(DATA_UPDATED_AUDIT_WINDOW_MS, () => now),
    );
    const form = aForm();
    const otherForm = aForm({ id: 'form-2' });
    const update = (target: FormEntity) =>
      handler(
        { user: intakeApp, body: { data: { field: 'value' } }, form: target } as unknown as Request,
        createRes(),
        jest.fn(),
      );

    await update(form);
    now = DATA_UPDATED_AUDIT_WINDOW_MS - 1;
    await update(form);
    await update(otherForm);
    now = DATA_UPDATED_AUDIT_WINDOW_MS;
    await update(form);

    expect(repository.save).toHaveBeenCalledTimes(4);
    expect(auditService.record.mock.calls.map(([, details]) => details.resource.id)).toEqual([
      'form-1',
      'form-2',
      'form-1',
    ]);
  });

  it('records nothing when form creation is not authorized', async () => {
    const next = jest.fn();
    const req = {
      user: { tenantId, id: 'nobody', name: 'Nobody', roles: [] },
      tenant: { id: tenantId },
      body: { definitionId: definition.id },
      getServiceConfiguration: jest.fn().mockResolvedValue([definition]),
    };

    await createHandler(req as unknown as Request, createRes(), next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    expect(auditService.record).not.toHaveBeenCalled();
  });

  it('records unlock by an administrator with the administrator as actor', async () => {
    const lockedAt = new Date('2026-10-01T00:00:00Z');
    const form = aForm({ status: FormStatus.Locked, locked: lockedAt });

    await operationHandler(
      { user: admin, body: { operation: UNLOCK_FORM_OPERATION }, form } as unknown as Request,
      createRes(),
      jest.fn(),
    );

    expect(auditService.record).toHaveBeenCalledWith(
      FormUnlockedAuditAction,
      expect.objectContaining({
        actor: expect.objectContaining({ id: 'admin', type: 'user', name: 'Admin' }),
        metadata: expect.objectContaining({
          status: FormStatus.Draft,
          previousStatus: FormStatus.Locked,
          locked: lockedAt.toISOString(),
        }),
      }),
    );
    expect(FormUnlockedAuditAction.severity).toBe('warning');
    expect(auditService.record.mock.calls[0][1].metadata).not.toHaveProperty('callerId');
  });

  it('records nothing when unlock is not authorized', async () => {
    const next = jest.fn();
    const form = aForm({ status: FormStatus.Locked, locked: new Date() });

    await operationHandler(
      { user: intakeApp, body: { operation: UNLOCK_FORM_OPERATION }, form } as unknown as Request,
      createRes(),
      next,
    );

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    expect(auditService.record).not.toHaveBeenCalled();
  });

  it.each([
    [SET_TO_DRAFT_FORM_OPERATION, FormStatus.Submitted, FormSetToDraftAuditAction, FormStatus.Draft],
    [ARCHIVE_FORM_OPERATION, FormStatus.Submitted, FormArchivedAuditAction, FormStatus.Archived],
  ])('records %s operation', async (operation, status, action, expectedStatus) => {
    const form = aForm({ status });

    await operationHandler({ user: admin, body: { operation }, form } as unknown as Request, createRes(), jest.fn());

    expect(auditService.record).toHaveBeenCalledWith(
      action,
      expect.objectContaining({
        metadata: expect.objectContaining({ status: expectedStatus, previousStatus: status }),
      }),
    );
  });

  it('records nothing for send code when the form has no applicant', async () => {
    const form = aForm();
    form.applicant = null;

    await operationHandler(
      { user: intakeApp, body: { operation: SEND_CODE_OPERATION }, form } as unknown as Request,
      createRes(),
      jest.fn(),
    );

    expect(notificationService.sendCode).not.toHaveBeenCalled();
    expect(auditService.record).not.toHaveBeenCalled();
  });

  it('records nothing when the access code is not verified', async () => {
    notificationService.verifyCode.mockResolvedValueOnce(false);
    const next = jest.fn();

    await accessForm(logger, notificationService, auditService)(
      { user: intakeApp, query: { code: 'bad' }, form: aForm() } as unknown as Request,
      createRes(),
      next,
    );

    expect(next).toHaveBeenCalled();
    expect(auditService.record).not.toHaveBeenCalled();
  });

  it('records nothing when form data is read without a code', async () => {
    await accessForm(logger, notificationService, auditService)(
      { user: admin, query: {}, form: aForm() } as unknown as Request,
      createRes(),
      jest.fn(),
    );

    expect(auditService.record).not.toHaveBeenCalled();
  });

  it('records form deletion', async () => {
    const form = aForm();

    await deleteForm(
      apiId,
      logger,
      eventService,
      fileService,
      notificationService,
      auditService,
    )({ user: admin, form } as unknown as Request, createRes(), jest.fn());

    expect(auditService.record).toHaveBeenCalledWith(
      FormDeletedAuditAction,
      expect.objectContaining({
        tenantId,
        actor: expect.objectContaining({ id: 'admin' }),
        resource: { type: 'form', id: form.id },
      }),
    );
  });

  it('records nothing when form deletion is not authorized', async () => {
    const next = jest.fn();

    await deleteForm(
      apiId,
      logger,
      eventService,
      fileService,
      notificationService,
      auditService,
    )({ user: { tenantId, id: 'nobody', roles: [] }, form: aForm() } as unknown as Request, createRes(), next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    expect(auditService.record).not.toHaveBeenCalled();
  });

  describe('deleteFormSubmission', () => {
    const submission = {
      tenantId,
      id: 'submission-1',
      formId: 'form-1',
      formDefinitionId: definition.id,
      dryRun: false,
      formData: { secret: 'my-sin-123' },
    };
    const handler = deleteFormSubmission(apiId, eventService, submissionRepository, logger, auditService);

    it('records submission deletion', async () => {
      submissionRepository.get.mockResolvedValueOnce(submission);
      submissionRepository.delete.mockResolvedValueOnce(true);

      await handler(
        {
          user: admin,
          tenant: { id: tenantId },
          params: { formId: 'form-1', submissionId: 'submission-1' },
        } as unknown as Request,
        createRes(),
        jest.fn(),
      );

      expect(auditService.record).toHaveBeenCalledWith(SubmissionDeletedAuditAction, {
        tenantId,
        actor: expect.objectContaining({ id: 'admin' }),
        resource: { type: 'submission', id: 'submission-1' },
        correlationId: 'form-1',
        metadata: { formId: 'form-1', definitionId: definition.id, dryRun: false },
      });
      expect(JSON.stringify(auditService.record.mock.calls)).not.toContain('my-sin-123');
    });

    it('records nothing when the submission is not found', async () => {
      submissionRepository.get.mockResolvedValueOnce(null);

      await handler(
        {
          user: admin,
          tenant: { id: tenantId },
          params: { formId: 'form-1', submissionId: 'missing' },
        } as unknown as Request,
        createRes(),
        jest.fn(),
      );

      expect(auditService.record).not.toHaveBeenCalled();
    });
  });
});
