import { adspId, Channel, User } from '@abgov/adsp-service-sdk';
import { FormStatus } from '../types';
import { FormDefinitionEntity } from './definition';
import { FormEntity } from './form';

describe('FormEntity', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const definition = new FormDefinitionEntity(tenantId, {
    id: 'test',
    name: 'test-form-definition',
    description: null,
    anonymousApply: false,
    applicantRoles: ['test-applicant'],
    assessorRoles: ['test-assessor'],
  });

  const subscriberId = adspId`urn:ads:platform:notification-service:v1:/subscribers/test`;
  const subscriber = {
    urn: subscriberId,
    userId: null,
    addressAs: 'Tester',
    channels: [{ channel: Channel.email, address: 'test@test.co' }],
  };

  const repositoryMock = {
    find: jest.fn(),
    get: jest.fn(),
    save: jest.fn((save) => Promise.resolve(save)),
    delete: jest.fn(),
  };

  const notificationMock = {
    getSubscriber: jest.fn(),
    subscribe: jest.fn(),
    sendCode: jest.fn(),
    verifyCode: jest.fn(),
  };

  beforeEach(() => {
    repositoryMock.save.mockClear();
  });

  it('it can be created', () => {
    const formInfo = {
      id: 'test-form',
      created: new Date(),
      createdBy: { id: 'tester', name: 'tester' },
      status: FormStatus.Draft,
      locked: null,
      submitted: null,
      lastAccessed: new Date(),
      data: {},
      files: {},
    };
    const entity = new FormEntity(repositoryMock, definition, subscriber, formInfo);
    expect(entity).toBeTruthy();
    expect(entity).toMatchObject(formInfo);
  });

  describe('create', () => {
    it('can create draft form', async () => {
      const user = {
        tenantId,
        id: 'tester',
        roles: ['test-applicant'],
      } as User;

      const entity = await FormEntity.create(user, repositoryMock, definition, notificationMock, subscriber);
      expect(entity).toBeTruthy();
      expect(repositoryMock.save).toHaveBeenCalledWith(entity);
    });
  });
});
