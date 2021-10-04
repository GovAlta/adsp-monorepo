import { adspId, User } from '@abgov/adsp-service-sdk';
import { New } from '@core-services/core-common';
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
    saveSubscriber: jest.fn((entity: SubscriberEntity) => Promise.resolve(entity)),
  };

  beforeEach(() => {
    repositoryMock.deleteSubscriber.mockReset();
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
      });
      expect(updated.addressAs).toBe('Mr. Tester');
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
});
