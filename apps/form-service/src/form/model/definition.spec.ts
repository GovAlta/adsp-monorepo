import { adspId, Channel, User } from '@abgov/adsp-service-sdk';
import { FormServiceRoles } from '../roles';
import { QueueTaskToProcess } from '../types';
import { FormDefinitionEntity } from './definition';

describe('FormDefinitionEntity', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const validationService = {
    validate: jest.fn(),
    setSchema: jest.fn(),
  };

  beforeEach(() => {
    validationService.setSchema.mockClear();
  });

  it('can be created', () => {
    const entity = new FormDefinitionEntity(validationService, tenantId, {
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
    const entity = new FormDefinitionEntity(validationService, tenantId, {
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
    const entity = new FormDefinitionEntity(validationService, tenantId, {
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
  });

  describe('canApply', () => {
    const entity = new FormDefinitionEntity(validationService, tenantId, {
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
      const result = entity.canApply({ tenantId, id: 'tester', roles: ['test-applicant'] } as User);
      expect(result).toBe(true);
    });

    it('can return false for user without applicant role', () => {
      const result = entity.canApply({ tenantId, id: 'tester', roles: [] } as User);
      expect(result).toBe(false);
    });

    it('can return true for intake app for anonymous apply definition', () => {
      const anonymousApplyEntity = new FormDefinitionEntity(validationService, tenantId, {
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
      const result = anonymousApplyEntity.canApply({
        tenantId,
        id: 'tester',
        roles: [FormServiceRoles.IntakeApp],
      } as User);
      expect(result).toBe(true);
    });

    it('can return false for intake app for none anonymous apply definition', () => {
      const result = entity.canApply({ tenantId, id: 'tester', roles: [FormServiceRoles.IntakeApp] } as User);
      expect(result).toBe(false);
    });

    it('can return false for core user', () => {
      const result = entity.canApply({ isCore: true, id: 'tester', roles: ['test-applicant'] } as User);
      expect(result).toBe(false);
    });

    it('can return false for user of different tenant', () => {
      const result = entity.canApply({
        tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test2`,
        id: 'tester',
        roles: ['test-applicant'],
      } as User);
      expect(result).toBe(false);
    });
  });

  describe('validateDate', () => {
    const entity = new FormDefinitionEntity(validationService, tenantId, {
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

    const entity = new FormDefinitionEntity(validationService, tenantId, {
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

    it('can create form', async () => {
      notificationMock.subscribe.mockResolvedValueOnce(subscriber);
      const form = await entity.createForm(
        { ...user, roles: [FormServiceRoles.IntakeApp] },
        repositoryMock,
        notificationMock,
        subscriber
      );
      expect(form).toBeTruthy();
      expect(notificationMock.subscribe).toHaveBeenCalledWith(entity.tenantId, entity, expect.any(String), subscriber);
    });

    it('can set applicant userId for user applicant', async () => {
      notificationMock.subscribe.mockResolvedValueOnce(subscriber);
      const form = await entity.createForm(user, repositoryMock, notificationMock, subscriber);
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
