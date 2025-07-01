import { adspId, Channel, User } from '@abgov/adsp-service-sdk';
import { FormServiceRoles } from '../roles';
import { Intake, QueueTaskToProcess } from '../types';
import { FormDefinitionEntity } from './definition';

describe('FormDefinitionEntity', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const validationService = {
    validate: jest.fn(),
    setSchema: jest.fn(),
  };

  const calendarService = {
    getScheduledIntake: jest.fn(),
  };

  beforeEach(() => {
    validationService.setSchema.mockClear();
    calendarService.getScheduledIntake.mockClear();
  });

  it('can be created', () => {
    const entity = new FormDefinitionEntity(validationService, calendarService, tenantId, {
      id: 'test',
      name: 'test-form-definition',
      description: null,
      formDraftUrlTemplate: 'https://my-form/{{ id }}',
      anonymousApply: false,
      applicantRoles: ['test-applicant'],
      assessorRoles: ['test-assessor'],
      clerkRoles: [],
      dataSchema: null,
      submissionRecords: false,
      submissionPdfTemplate: '',
      supportTopic: false,
      queueTaskToProcess: {} as QueueTaskToProcess,
    });
    expect(entity).toBeTruthy();
    expect(validationService.setSchema).toHaveBeenCalledWith(`${tenantId.resource}:${entity.id}`, expect.any(Object));
  });

  it('can be created with null roles', () => {
    const entity = new FormDefinitionEntity(validationService, calendarService, tenantId, {
      id: 'test',
      name: 'test-form-definition',
      description: null,
      formDraftUrlTemplate: 'https://my-form/{{ id }}',
      anonymousApply: false,
      applicantRoles: null,
      assessorRoles: null,
      clerkRoles: null,
      dataSchema: null,
      submissionRecords: false,
      submissionPdfTemplate: '',
      supportTopic: false,
      queueTaskToProcess: {} as QueueTaskToProcess,
    });
    expect(entity).toBeTruthy();
  });

  describe('canAccessDefinition', () => {
    const entity = new FormDefinitionEntity(validationService, calendarService, tenantId, {
      id: 'test',
      name: 'test-form-definition',
      description: null,
      formDraftUrlTemplate: 'https://my-form/{{ id }}',
      anonymousApply: false,
      applicantRoles: ['test-applicant'],
      assessorRoles: ['test-assessor'],
      clerkRoles: [],
      dataSchema: null,
      submissionRecords: false,
      submissionPdfTemplate: '',
      supportTopic: false,
      queueTaskToProcess: {} as QueueTaskToProcess,
    });

    it('can return true for user with applicant role', () => {
      const result = entity.canAccessDefinition({ tenantId, id: 'tester', roles: ['test-applicant'] } as User);
      expect(result).toBe(true);
    });

    it('can return false for user without applicant role', () => {
      const result = entity.canAccessDefinition({ tenantId, id: 'tester', roles: [] } as User);
      expect(result).toBe(false);
    });

    it('can return true for intake app', () => {
      const result = entity.canAccessDefinition({
        tenantId,
        id: 'tester',
        roles: [FormServiceRoles.IntakeApp],
      } as User);
      expect(result).toBe(true);
    });

    it('can return true for form admin', () => {
      const result = entity.canAccessDefinition({
        tenantId,
        id: 'tester',
        roles: [FormServiceRoles.Admin],
      } as User);
      expect(result).toBe(true);
    });

    it('can return false for core user', () => {
      const result = entity.canAccessDefinition({ isCore: true, id: 'tester', roles: ['test-applicant'] } as User);
      expect(result).toBe(false);
    });

    it('can return false for user of different tenant', () => {
      const result = entity.canAccessDefinition({
        tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test2`,
        id: 'tester',
        roles: ['test-applicant'],
      } as User);
      expect(result).toBe(false);
    });

    it('can return true for anonymous apply form', () => {
      const entity = new FormDefinitionEntity(validationService, calendarService, tenantId, {
        id: 'test',
        name: 'test-form-definition',
        description: null,
        formDraftUrlTemplate: 'https://my-form/{{ id }}',
        anonymousApply: true,
        applicantRoles: null,
        assessorRoles: null,
        clerkRoles: null,
        dataSchema: null,
        submissionRecords: false,
        submissionPdfTemplate: '',
        supportTopic: false,
        queueTaskToProcess: {} as QueueTaskToProcess,
      });

      const result = entity.canAccessDefinition(null);
      expect(result).toBe(true);
    });
  });

  describe('canApply', () => {
    const entity = new FormDefinitionEntity(validationService, calendarService, tenantId, {
      id: 'test',
      name: 'test-form-definition',
      description: null,
      formDraftUrlTemplate: 'https://my-form/{{ id }}',
      anonymousApply: false,
      applicantRoles: ['test-applicant'],
      assessorRoles: ['test-assessor'],
      clerkRoles: [],
      dataSchema: null,
      submissionRecords: false,
      submissionPdfTemplate: '',
      supportTopic: false,
      queueTaskToProcess: {} as QueueTaskToProcess,
    });

    const scheduled = new FormDefinitionEntity(validationService, calendarService, tenantId, {
      id: 'test',
      name: 'test-form-definition',
      description: null,
      formDraftUrlTemplate: 'https://my-form/{{ id }}',
      anonymousApply: false,
      applicantRoles: ['test-applicant'],
      assessorRoles: ['test-assessor'],
      clerkRoles: [],
      dataSchema: null,
      submissionRecords: false,
      submissionPdfTemplate: '',
      supportTopic: false,
      queueTaskToProcess: {} as QueueTaskToProcess,
      scheduledIntakes: true,
    });

    it('can return true for user with applicant role', async () => {
      const result = await entity.canApply({ tenantId, id: 'tester', roles: ['test-applicant'] } as User);
      expect(result).toBe(true);
    });

    it('can return false for user without applicant role', async () => {
      const result = await entity.canApply({ tenantId, id: 'tester', roles: [] } as User);
      expect(result).toBe(false);
    });

    it('can return true for intake app for anonymous apply definition', async () => {
      const anonymousApplyEntity = new FormDefinitionEntity(validationService, calendarService, tenantId, {
        id: 'test',
        name: 'test-form-definition',
        description: null,
        formDraftUrlTemplate: 'https://my-form/{{ id }}',
        anonymousApply: true,
        applicantRoles: ['test-applicant'],
        assessorRoles: ['test-assessor'],
        clerkRoles: [],
        dataSchema: null,
        submissionRecords: false,
        submissionPdfTemplate: '',
        supportTopic: false,
        queueTaskToProcess: {} as QueueTaskToProcess,
      });
      const result = await anonymousApplyEntity.canApply({
        tenantId,
        id: 'tester',
        roles: [FormServiceRoles.IntakeApp],
      } as User);
      expect(result).toBe(true);
    });

    it('can return false for intake app for none anonymous apply definition', async () => {
      const result = await entity.canApply({ tenantId, id: 'tester', roles: [FormServiceRoles.IntakeApp] } as User);
      expect(result).toBe(false);
    });

    it('can return true for core user', async () => {
      const result = await entity.canApply({ isCore: true, id: 'tester', roles: ['test-applicant'] } as User);
      expect(result).toBe(true);
    });

    it('can return false for user of different tenant', async () => {
      const result = await entity.canApply({
        tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test2`,
        id: 'tester',
        roles: ['test-applicant'],
      } as User);
      expect(result).toBe(false);
    });

    it('can return false for scheduled intake form without scheduled intake', async () => {
      calendarService.getScheduledIntake.mockResolvedValueOnce(null);
      const result = await scheduled.canApply({ tenantId, id: 'tester', roles: ['test-applicant'] } as User);
      expect(result).toBe(false);
    });

    it('can return true for scheduled intake form without scheduled intake for testers', async () => {
      const result = await scheduled.canApply({
        tenantId,
        id: 'tester',
        roles: [FormServiceRoles.Tester, 'test-applicant'],
      } as User);
      expect(result).toBe(true);
    });

    it('can return false for scheduled intake form without scheduled intake for testers without applicant role', async () => {
      const result = await scheduled.canApply({ tenantId, id: 'tester', roles: [FormServiceRoles.Tester] } as User);
      expect(result).toBe(false);
    });

    it('can return true for scheduled intake form with scheduled intake', async () => {
      calendarService.getScheduledIntake.mockResolvedValueOnce({ start: new Date(), isUpcoming: false } as Intake);
      const result = await scheduled.canApply({ tenantId, id: 'tester', roles: ['test-applicant'] } as User);
      expect(result).toBe(true);
    });

    it('can return false for scheduled intake form with upcoming scheduled intake', async () => {
      calendarService.getScheduledIntake.mockResolvedValueOnce({ start: new Date(), isUpcoming: true } as Intake);
      const result = await scheduled.canApply({ tenantId, id: 'tester', roles: ['test-applicant'] } as User);
      expect(result).toBe(false);
    });
  });

  describe('validateDate', () => {
    const entity = new FormDefinitionEntity(validationService, calendarService, tenantId, {
      id: 'test',
      name: 'test-form-definition',
      description: null,
      formDraftUrlTemplate: 'https://my-form/{{ id }}',
      anonymousApply: false,
      applicantRoles: ['test-applicant'],
      assessorRoles: ['test-assessor'],
      clerkRoles: [],
      dataSchema: { type: 'object' },
      submissionRecords: false,
      submissionPdfTemplate: '',
      supportTopic: false,
      queueTaskToProcess: {} as QueueTaskToProcess,
    });

    it('can validate data', () => {
      const data = {};
      entity.validateData('form submission test', data);
      expect(validationService.validate).toHaveBeenCalledWith(
        expect.any(String),
        `${tenantId.resource}:${entity.id}`,
        data
      );
    });
  });

  describe('createForm', () => {
    const user = {
      tenantId,
      id: 'tester',
      roles: ['test-applicant'],
    } as User;

    const repositoryMock = {
      find: jest.fn(),
      get: jest.fn(),
      save: jest.fn((save) => Promise.resolve(save)),
      delete: jest.fn(),
    };

    const notificationMock = {
      getSubscriber: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      sendCode: jest.fn(),
      verifyCode: jest.fn(),
    };

    const subscriberId = adspId`urn:ads:platform:notification-service:v1:/subscribers/test`;
    const subscriber = {
      id: 'test',
      urn: subscriberId,
      userId: null,
      addressAs: 'Tester',
      channels: [{ channel: Channel.email, address: 'test@test.co' }],
    };

    const entity = new FormDefinitionEntity(validationService, calendarService, tenantId, {
      id: 'test',
      name: 'test-form-definition',
      description: null,
      formDraftUrlTemplate: 'https://my-form/{{ id }}',
      anonymousApply: true,
      applicantRoles: ['test-applicant'],
      assessorRoles: ['test-assessor'],
      clerkRoles: [],
      dataSchema: null,
      submissionRecords: false,
      submissionPdfTemplate: '',
      supportTopic: false,
      queueTaskToProcess: {} as QueueTaskToProcess,
    });

    beforeEach(() => {
      notificationMock.subscribe.mockReset();
    });

    it('can create form', async () => {
      notificationMock.subscribe.mockResolvedValueOnce(subscriber);
      const form = await entity.createForm(
        { ...user, roles: [FormServiceRoles.IntakeApp] },
        repositoryMock,
        notificationMock,
        true,
        subscriber
      );
      expect(form).toBeTruthy();
      expect(notificationMock.subscribe).toHaveBeenCalledWith(entity.tenantId, entity, expect.any(String), subscriber);
    });

    it('can set applicant userId for user applicant', async () => {
      notificationMock.subscribe.mockResolvedValueOnce(subscriber);
      const form = await entity.createForm(user, repositoryMock, notificationMock, false, subscriber);
      expect(form).toBeTruthy();
      expect(notificationMock.subscribe).toHaveBeenCalledWith(
        entity.tenantId,
        entity,
        expect.any(String),
        expect.objectContaining({ userId: user.id })
      );
    });

    it('can allow unset user applicant for definitions that allow multiple forms', async () => {
      const entity = new FormDefinitionEntity(validationService, calendarService, tenantId, {
        id: 'test',
        name: 'test-form-definition',
        description: null,
        formDraftUrlTemplate: 'https://my-form/{{ id }}',
        anonymousApply: true,
        applicantRoles: ['test-applicant'],
        assessorRoles: ['test-assessor'],
        clerkRoles: [],
        dataSchema: null,
        submissionRecords: false,
        submissionPdfTemplate: '',
        supportTopic: false,
        queueTaskToProcess: {} as QueueTaskToProcess,
        oneFormPerApplicant: false,
      });

      notificationMock.subscribe.mockResolvedValueOnce(subscriber);
      const form = await entity.createForm(user, repositoryMock, notificationMock);
      expect(form).toBeTruthy();
      expect(notificationMock.subscribe).not.toHaveBeenCalled();
    });

    it('can set applicant userId for definitions that allow multiple forms', async () => {
      const entity = new FormDefinitionEntity(validationService, calendarService, tenantId, {
        id: 'test',
        name: 'test-form-definition',
        description: null,
        formDraftUrlTemplate: 'https://my-form/{{ id }}',
        anonymousApply: true,
        applicantRoles: ['test-applicant'],
        assessorRoles: ['test-assessor'],
        clerkRoles: [],
        dataSchema: null,
        submissionRecords: false,
        submissionPdfTemplate: '',
        supportTopic: false,
        queueTaskToProcess: {} as QueueTaskToProcess,
        oneFormPerApplicant: false,
      });

      notificationMock.subscribe.mockResolvedValueOnce(subscriber);
      const form = await entity.createForm(user, repositoryMock, notificationMock, false, subscriber);
      expect(form).toBeTruthy();
      expect(notificationMock.subscribe).toHaveBeenCalledWith(
        entity.tenantId,
        entity,
        expect.any(String),
        expect.objectContaining({ userId: user.id })
      );
    });
  });
});
