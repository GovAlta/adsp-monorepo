import { adspId } from '@abgov/adsp-service-sdk';
import { SubscriptionRepository } from '../repository';
import { Channel, NotificationTypeEvent } from '../types';
import { SubscriberEntity } from './subscriber';
import { SubscriptionEntity } from './subscription';

describe('SubscriptionEntity', () => {
  const repositoryMock: unknown = {
    saveSubscription: jest.fn((entity: SubscriptionEntity) => Promise.resolve(entity)),
  };
  it('can be created', () => {
    const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
    const entity = new SubscriptionEntity(repositoryMock as SubscriptionRepository, {
      tenantId,
      typeId: 'test',
      criteria: {},
      subscriberId: 'test',
    });
    expect(entity).toBeTruthy();
  });

  describe('create', () => {
    it('can create entity', async () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const subscriber = new SubscriberEntity(repositoryMock as SubscriptionRepository, {
        tenantId,
        addressAs: 'test',
        channels: [],
      });
      const entity = await SubscriptionEntity.create(repositoryMock as SubscriptionRepository, subscriber, {
        tenantId,
        typeId: 'test',
        subscriberId: 'test-subscriber',
        criteria: {},
      });
      expect(entity).toBeTruthy();
    });
  });

  describe('shouldSend', () => {
    it('can return true for empty criteria', () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const entity = new SubscriptionEntity(repositoryMock as SubscriptionRepository, {
        tenantId,
        typeId: 'test',
        criteria: {},
        subscriberId: 'test',
      });

      const send = entity.shouldSend({
        tenantId,
        name: 'test-started',
        timestamp: new Date(),
        correlationId: null,
        payload: {},
      });

      expect(send).toBe(true);
    });

    it('can return false for correlation criteria not matched', () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const entity = new SubscriptionEntity(repositoryMock as SubscriptionRepository, {
        tenantId,
        typeId: 'test',
        criteria: {
          correlationId: 'test',
        },
        subscriberId: 'test',
      });

      const send = entity.shouldSend({
        tenantId,
        name: 'test-started',
        timestamp: new Date(),
        correlationId: 'different',
        payload: {},
      });

      expect(send).toBe(false);
    });

    it('can return true for correlation criteria matched', () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const entity = new SubscriptionEntity(repositoryMock as SubscriptionRepository, {
        tenantId,
        typeId: 'test',
        criteria: {
          correlationId: 'test',
        },
        subscriberId: 'test',
      });

      const send = entity.shouldSend({
        tenantId,
        name: 'test-started',
        timestamp: new Date(),
        correlationId: 'test',
        payload: {},
      });

      expect(send).toBe(true);
    });
  });

  describe('getSubscriberChannel', () => {
    it('can return channel', () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const channel = {
        channel: Channel.email,
        address: 'test@test.co',
        verified: false,
      };
      const subscriber = new SubscriberEntity(repositoryMock as SubscriptionRepository, {
        tenantId,
        addressAs: 'test',
        channels: [
          {
            channel: Channel.sms,
            address: '123',
            verified: false,
          },
          channel,
        ],
      });
      const entity = new SubscriptionEntity(
        repositoryMock as SubscriptionRepository,
        {
          tenantId,
          typeId: 'test',
          subscriberId: 'test-subscriber',
          criteria: {},
        },
        subscriber
      );

      const result = entity.getSubscriberChannel({ channels: [Channel.email] } as NotificationTypeEvent);
      expect(result).toBe(channel);
    });

    it('can return falsy for no channel match', () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const subscriber = new SubscriberEntity(repositoryMock as SubscriptionRepository, {
        tenantId,
        addressAs: 'test',
        channels: [
          {
            channel: Channel.sms,
            address: '123',
            verified: false,
          },
        ],
      });
      const entity = new SubscriptionEntity(
        repositoryMock as SubscriptionRepository,
        {
          tenantId,
          typeId: 'test',
          subscriberId: 'test-subscriber',
          criteria: {},
        },
        subscriber
      );

      const result = entity.getSubscriberChannel({ channels: [Channel.email] } as NotificationTypeEvent);
      expect(result).toBeFalsy();
    });
  });
});
