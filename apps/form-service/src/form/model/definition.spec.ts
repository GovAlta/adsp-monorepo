import { adspId, Channel, User } from '@abgov/adsp-service-sdk';
import { FormServiceRoles } from '../roles';
import { FormDefinitionEntity } from './definition';
import { ValidationService } from '@core-services/core-common';

describe('FormDefinitionEntity', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const validationService: ValidationService = {
    validate: jest.fn(),
    setSchema: jest.fn(),
  };

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
    });
    expect(entity).toBeTruthy();
    expect(validationService.setSchema).toHaveBeenCalledWith(entity.id, expect.any(Object));
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
    });

    it('can validate data', () => {
      const data = {};
      entity.validateData(data);
      expect(validationService.validate).toHaveBeenCalledWith(expect.any(String), entity.id, data);
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
      expect(notificationMock.subscribe).toHaveBeenCalledWith(entity.tenantId, expect.any(String), subscriber);
    });

    it('can set applicant userId for user applicant', async () => {
      notificationMock.subscribe.mockResolvedValueOnce(subscriber);
      const form = await entity.createForm(user, repositoryMock, notificationMock, subscriber);
      expect(form).toBeTruthy();
      expect(notificationMock.subscribe).toHaveBeenCalledWith(
        entity.tenantId,
        expect.any(String),
        expect.objectContaining({ userId: user.id })
      );
    });
  });
});
