import { adspId, Channel, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, New } from '@core-services/core-common';
import { SubscriptionRepository } from '../repository';
import { ServiceUserRoles, Subscriber } from '../types';
import { SubscriberEntity } from './subscriber';

describe('SubscriberEntity', () => {
  const repositoryMock = {
    getSubscriber: jest.fn(),
    getSubscriptions: jest.fn(),
    getSubscription: jest.fn(),
    findSubscribers: jest.fn(),
    deleteSubscriber: jest.fn(),
    saveSubscription: jest.fn(),
    deleteSubscriptions: jest.fn(),
    getSubscriberById: jest.fn(),
    saveSubscriber: jest.fn((entity: SubscriberEntity) => Promise.resolve(entity)),
  };

  const verifyServiceMock = {
    sendCode: jest.fn(),
    verifyCode: jest.fn(),
  };

  beforeEach(() => {
    repositoryMock.deleteSubscriber.mockReset();
    verifyServiceMock.sendCode.mockReset();
    verifyServiceMock.verifyCode.mockReset();
  });

  it('can be created', () => {
    const entity = new SubscriberEntity(repositoryMock as SubscriptionRepository, {
      tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
      addressAs: 'Testy McTester',
      channels: [],
    });
    expect(entity).toBeTruthy();
  });

  describe('canCreate', () => {
    it('can return true for core subscription admin', () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const canCreate = SubscriberEntity.canCreate(
        { isCore: true, roles: [ServiceUserRoles.SubscriptionAdmin] } as User,
        { tenantId } as New<Subscriber>
      );
      expect(canCreate).toBe(true);
    });

    it('can return true for tenant subscription admin', () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const canCreate = SubscriberEntity.canCreate(
        { tenantId, roles: [ServiceUserRoles.SubscriptionAdmin] } as User,
        { tenantId } as New<Subscriber>
      );
      expect(canCreate).toBe(true);
    });

    it('can return false for mismatched tenant', () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const canCreate = SubscriberEntity.canCreate(
        { tenantId, roles: [ServiceUserRoles.SubscriptionAdmin] } as User,
        { tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/different` } as New<Subscriber>
      );
      expect(canCreate).toBe(false);
    });

    it('can return true for tenant user self subscribing', () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const canCreate = SubscriberEntity.canCreate(
        { id: 'test', tenantId, roles: [] } as User,
        { userId: 'test', tenantId } as New<Subscriber>
      );
      expect(canCreate).toBe(true);
    });

    it('can return false for subscriber subscribing for wrong user', () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const canCreate = SubscriberEntity.canCreate(
        { id: 'test', tenantId, roles: [] } as User,
        { userId: 'different', tenantId } as New<Subscriber>
      );
      expect(canCreate).toBe(false);
    });
  });

  describe('create', () => {
    it('can create and save entity', async () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const entity = await SubscriberEntity.create(
        { tenantId, roles: [ServiceUserRoles.SubscriptionAdmin] } as User,
        repositoryMock as SubscriptionRepository,
        { userId: 'different', tenantId, addressAs: 'Testy McTester', channels: [] }
      );

      expect(entity).toBeTruthy();
    });

    it('can throw for unauthorized user', async () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      await expect(
        SubscriberEntity.create({ tenantId, roles: [] } as User, repositoryMock as SubscriptionRepository, {
          userId: 'different',
          tenantId,
          addressAs: 'Testy McTester',
          channels: [],
        })
      ).rejects.toThrow(/User not authorized to create subscriber./);
    });
  });

  describe('canUpdate', () => {
    it('can return true for core subscription admin', () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const entity = new SubscriberEntity(repositoryMock as SubscriptionRepository, {
        tenantId,
        id: 'test',
        userId: 'test-user',
        addressAs: 'Testy McTester',
        channels: [],
      });

      const canUpdate = entity.canUpdate({ isCore: true, roles: [ServiceUserRoles.SubscriptionAdmin] } as User);
      expect(canUpdate).toBe(true);
    });

    it('can return true for tenant subscription admin', () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const entity = new SubscriberEntity(repositoryMock as SubscriptionRepository, {
        tenantId,
        id: 'test',
        userId: 'test-user',
        addressAs: 'Testy McTester',
        channels: [],
      });

      const canUpdate = entity.canUpdate({ tenantId, roles: [ServiceUserRoles.SubscriptionAdmin] } as User);
      expect(canUpdate).toBe(true);
    });

    it('can return false for subscription admin of wrong tenant', () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const entity = new SubscriberEntity(repositoryMock as SubscriptionRepository, {
        tenantId,
        id: 'test',
        userId: 'test-user',
        addressAs: 'Testy McTester',
        channels: [],
      });

      const canUpdate = entity.canUpdate({
        tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/different`,
        roles: [ServiceUserRoles.SubscriptionAdmin],
      } as User);
      expect(canUpdate).toBe(false);
    });

    it('can return true for associated user', () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const entity = new SubscriberEntity(repositoryMock as SubscriptionRepository, {
        tenantId,
        id: 'test',
        userId: 'test-user',
        addressAs: 'Testy McTester',
        channels: [],
      });

      const canUpdate = entity.canUpdate({ id: 'test-user', tenantId, roles: [] } as User);
      expect(canUpdate).toBe(true);
    });
  });

  describe('update', () => {
    it('can update', async () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const entity = new SubscriberEntity(repositoryMock as SubscriptionRepository, {
        tenantId,
        id: 'test',
        userId: 'test-user',
        addressAs: 'Testy McTester',
        channels: [],
      });

      const updated = await entity.update({ tenantId, roles: [ServiceUserRoles.SubscriptionAdmin] } as User, {
        addressAs: 'Mr. Tester',
        channels: [
          {
            channel: Channel.email,
            address: 'testy@test.co',
            verified: false,
          },
        ],
      });
      expect(updated.addressAs).toBe('Mr. Tester');
    });

    it('can update channels and retain verify status', async () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const entity = new SubscriberEntity(repositoryMock as SubscriptionRepository, {
        tenantId,
        id: 'test',
        userId: 'test-user',
        addressAs: 'Testy McTester',
        channels: [
          {
            channel: Channel.email,
            address: 'testy@test.co',
            verified: true,
          },
        ],
      });

      const updated = await entity.update({ tenantId, roles: [ServiceUserRoles.SubscriptionAdmin] } as User, {
        addressAs: 'Mr. Tester',
        channels: [
          {
            channel: Channel.email,
            address: 'testy-2@test.co',
            verified: false,
          },
          {
            channel: Channel.email,
            address: 'testy@test.co',
            verified: false,
          },
        ],
      });
      expect(updated.channels[0]).toMatchObject({
        channel: Channel.email,
        address: 'testy-2@test.co',
        verified: false,
      });
      expect(updated.channels[1]).toMatchObject({
        channel: Channel.email,
        address: 'testy@test.co',
        verified: true,
      });
    });

    it('can throw for unauthorized', () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const entity = new SubscriberEntity(repositoryMock as SubscriptionRepository, {
        tenantId,
        id: 'test',
        userId: 'test-user',
        addressAs: 'Testy McTester',
        channels: [],
      });

      expect(() =>
        entity.update({ tenantId, roles: [] } as User, {
          addressAs: 'Mr. Tester',
        })
      ).toThrow(/User not authorized to update subscriber./);
    });
  });

  describe('delete', () => {
    it('can delete', async () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const entity = new SubscriberEntity(repositoryMock as SubscriptionRepository, {
        tenantId,
        id: 'test',
        userId: 'test-user',
        addressAs: 'Testy McTester',
        channels: [],
      });

      repositoryMock.deleteSubscriber.mockResolvedValueOnce(true);
      const deleted = await entity.delete({ tenantId, roles: [ServiceUserRoles.SubscriptionAdmin] } as User);
      expect(deleted).toBe(true);
    });

    it('can throw for unauthorized', () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const entity = new SubscriberEntity(repositoryMock as SubscriptionRepository, {
        tenantId,
        id: 'test',
        userId: 'test-user',
        addressAs: 'Testy McTester',
        channels: [],
      });

      expect(() => entity.delete({ tenantId, roles: [] } as User)).toThrow(/User not authorized to delete subscriber./);
    });
  });

  describe('sendVerifyCode', () => {
    it('can send code', async () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const entity = new SubscriberEntity(repositoryMock as SubscriptionRepository, {
        tenantId,
        id: 'test',
        userId: 'test-user',
        addressAs: 'Testy McTester',
        channels: [
          {
            channel: Channel.email,
            address: 'tester@test.com',
            verified: false,
          },
        ],
      });

      await entity.sendVerifyCode(
        verifyServiceMock,
        { tenantId, roles: [ServiceUserRoles.SubscriptionAdmin] } as User,
        Channel.email,
        'tester@test.com'
      );
      expect(verifyServiceMock.sendCode).toHaveBeenCalledWith(
        entity.channels[0],
        'Enter this code to verify your contact address.'
      );
    });

    it('can send code for self', async () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const entity = new SubscriberEntity(repositoryMock as SubscriptionRepository, {
        tenantId,
        id: 'test',
        userId: 'test-user',
        addressAs: 'Testy McTester',
        channels: [
          {
            channel: Channel.email,
            address: 'tester@test.com',
            verified: false,
          },
        ],
      });

      await entity.sendVerifyCode(
        verifyServiceMock,
        { tenantId, id: 'test-user', roles: [] } as User,
        Channel.email,
        'tester@test.com'
      );
      expect(verifyServiceMock.sendCode).toHaveBeenCalledWith(
        entity.channels[0],
        'Enter this code to verify your contact address.'
      );
    });

    it('can send code as code-sender', async () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const entity = new SubscriberEntity(repositoryMock as SubscriptionRepository, {
        tenantId,
        id: 'test',
        userId: 'test-user',
        addressAs: 'Testy McTester',
        channels: [
          {
            channel: Channel.email,
            address: 'tester@test.com',
            verified: false,
          },
        ],
      });

      await entity.sendVerifyCode(
        verifyServiceMock,
        { tenantId, roles: [ServiceUserRoles.CodeSender] } as User,
        Channel.email,
        'tester@test.com'
      );
      expect(verifyServiceMock.sendCode).toHaveBeenCalledWith(
        entity.channels[0],
        'Enter this code to verify your contact address.'
      );
    });

    it('can throw for unrecognized channel', async () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const entity = new SubscriberEntity(repositoryMock as SubscriptionRepository, {
        tenantId,
        id: 'test',
        userId: 'test-user',
        addressAs: 'Testy McTester',
        channels: [
          {
            channel: Channel.email,
            address: 'tester@test.com',
            verified: false,
          },
        ],
      });

      await expect(
        entity.sendVerifyCode(
          verifyServiceMock,
          { tenantId, roles: [ServiceUserRoles.SubscriptionAdmin] } as User,
          Channel.email,
          'unknown@test.com'
        )
      ).rejects.toThrowError(InvalidOperationError);
    });

    it('can throw for unauthorized user', async () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const entity = new SubscriberEntity(repositoryMock as SubscriptionRepository, {
        tenantId,
        id: 'test',
        userId: 'test-user',
        addressAs: 'Testy McTester',
        channels: [
          {
            channel: Channel.email,
            address: 'tester@test.com',
            verified: false,
          },
        ],
      });

      await expect(
        entity.sendVerifyCode(verifyServiceMock, { tenantId, roles: [] } as User, Channel.email, 'tester@test.com')
      ).rejects.toThrowError(UnauthorizedUserError);
    });
  });

  describe('checkVerifyCode', () => {
    it('can check code', async () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const entity = new SubscriberEntity(repositoryMock as SubscriptionRepository, {
        tenantId,
        id: 'test',
        userId: 'test-user',
        addressAs: 'Testy McTester',
        channels: [
          {
            channel: Channel.email,
            address: 'tester@test.com',
            verified: false,
          },
        ],
      });

      verifyServiceMock.verifyCode.mockResolvedValueOnce(true);

      await entity.checkVerifyCode(
        verifyServiceMock,
        { tenantId, roles: [ServiceUserRoles.SubscriptionAdmin] } as User,
        Channel.email,
        'tester@test.com',
        '123'
      );
      expect(verifyServiceMock.verifyCode).toHaveBeenCalledWith(entity.channels[0], '123');
      expect(entity.channels[0].verified).toBe(false);
    });

    it('can check code and verify channel.', async () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const entity = new SubscriberEntity(repositoryMock as SubscriptionRepository, {
        tenantId,
        id: 'test',
        userId: 'test-user',
        addressAs: 'Testy McTester',
        channels: [
          {
            channel: Channel.email,
            address: 'tester@test.com',
            verified: false,
          },
        ],
      });

      verifyServiceMock.verifyCode.mockResolvedValueOnce(true);

      await entity.checkVerifyCode(
        verifyServiceMock,
        { tenantId, roles: [ServiceUserRoles.SubscriptionAdmin] } as User,
        Channel.email,
        'tester@test.com',
        '123',
        true
      );
      expect(verifyServiceMock.verifyCode).toHaveBeenCalledWith(entity.channels[0], '123');
      expect(entity.channels[0].verified).toBe(true);
    });

    it('can check code as code-sender', async () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const entity = new SubscriberEntity(repositoryMock as SubscriptionRepository, {
        tenantId,
        id: 'test',
        userId: 'test-user',
        addressAs: 'Testy McTester',
        channels: [
          {
            channel: Channel.email,
            address: 'tester@test.com',
            verified: false,
          },
        ],
      });

      verifyServiceMock.verifyCode.mockResolvedValueOnce(true);

      await entity.checkVerifyCode(
        verifyServiceMock,
        { tenantId, roles: [ServiceUserRoles.CodeSender] } as User,
        Channel.email,
        'tester@test.com',
        '123'
      );
      expect(verifyServiceMock.verifyCode).toHaveBeenCalledWith(entity.channels[0], '123');
      expect(entity.channels[0].verified).toBe(false);
    });

    it('can throw for verify channel as code-sender', async () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const entity = new SubscriberEntity(repositoryMock as SubscriptionRepository, {
        tenantId,
        id: 'test',
        userId: 'test-user',
        addressAs: 'Testy McTester',
        channels: [
          {
            channel: Channel.email,
            address: 'tester@test.com',
            verified: false,
          },
        ],
      });

      verifyServiceMock.verifyCode.mockResolvedValueOnce(true);

      await expect(
        entity.checkVerifyCode(
          verifyServiceMock,
          { tenantId, roles: [ServiceUserRoles.CodeSender] } as User,
          Channel.email,
          'tester@test.com',
          '123',
          true
        )
      ).rejects.toThrowError(UnauthorizedUserError);
    });

    it('can throw for unrecognized channel', async () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const entity = new SubscriberEntity(repositoryMock as SubscriptionRepository, {
        tenantId,
        id: 'test',
        userId: 'test-user',
        addressAs: 'Testy McTester',
        channels: [
          {
            channel: Channel.email,
            address: 'tester@test.com',
            verified: false,
          },
        ],
      });

      await expect(
        entity.checkVerifyCode(
          verifyServiceMock,
          { tenantId, roles: [ServiceUserRoles.SubscriptionAdmin] } as User,
          Channel.email,
          'unknown@test.com',
          '123'
        )
      ).rejects.toThrowError(InvalidOperationError);
    });

    it('can throw for unauthorized user', async () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const entity = new SubscriberEntity(repositoryMock as SubscriptionRepository, {
        tenantId,
        id: 'test',
        userId: 'test-user',
        addressAs: 'Testy McTester',
        channels: [
          {
            channel: Channel.email,
            address: 'tester@test.com',
            verified: false,
          },
        ],
      });

      await expect(
        entity.checkVerifyCode(
          verifyServiceMock,
          { tenantId, roles: [] } as User,
          Channel.email,
          'tester@test.com',
          '123'
        )
      ).rejects.toThrowError(UnauthorizedUserError);
    });
  });
});
