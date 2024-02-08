import { adspId, NotificationType, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { SubscriptionRepository } from '../repository';
import { Channel, NotificationTypeEvent, ServiceUserRoles } from '../types';
import { SubscriberEntity } from './subscriber';
import { SubscriptionEntity } from './subscription';
import { NotificationTypeEntity } from './type';
import { InvalidOperationError } from '@core-services/core-common';

describe('SubscriptionEntity', () => {
  const repositoryMock: unknown = {
    saveSubscription: jest.fn((entity: SubscriptionEntity) => Promise.resolve(entity)),
  };

  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const type = new NotificationTypeEntity(
    {
      id: 'test',
      name: 'test type',
      description: null,
      publicSubscribe: false,
      subscriberRoles: [],
      channels: [],
      events: [],
    },
    tenantId
  );

  it('can be created', () => {
    const entity = new SubscriptionEntity(
      repositoryMock as SubscriptionRepository,
      {
        tenantId,
        typeId: 'test',
        criteria: {},
        subscriberId: 'test',
      },
      type
    );
    expect(entity).toBeTruthy();
  });

  describe('create', () => {
    it('can create entity', async () => {
      const subscriber = new SubscriberEntity(repositoryMock as SubscriptionRepository, {
        tenantId,
        addressAs: 'test',
        channels: [],
      });
      const entity = await SubscriptionEntity.create(repositoryMock as SubscriptionRepository, type, subscriber, {
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
      const entity = new SubscriptionEntity(
        repositoryMock as SubscriptionRepository,
        {
          tenantId,
          typeId: 'test',
          criteria: {},
          subscriberId: 'test',
        },
        type
      );

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
      const entity = new SubscriptionEntity(
        repositoryMock as SubscriptionRepository,
        {
          tenantId,
          typeId: 'test',
          criteria: {
            correlationId: 'test',
          },
          subscriberId: 'test',
        },
        type
      );

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
      const entity = new SubscriptionEntity(
        repositoryMock as SubscriptionRepository,
        {
          tenantId,
          typeId: 'test',
          criteria: {
            correlationId: 'test',
          },
          subscriberId: 'test',
        },
        type
      );

      const send = entity.shouldSend({
        tenantId,
        name: 'test-started',
        timestamp: new Date(),
        correlationId: 'test',
        payload: {},
      });

      expect(send).toBe(true);
    });

    it('can return true for array correlation criteria matched', () => {
      const entity = new SubscriptionEntity(
        repositoryMock as SubscriptionRepository,
        {
          tenantId,
          typeId: 'test',
          criteria: [
            {
              correlationId: 'test2',
            },
            {
              correlationId: 'test',
            },
          ],
          subscriberId: 'test',
        },
        type
      );

      const send = entity.shouldSend({
        tenantId,
        name: 'test-started',
        timestamp: new Date(),
        correlationId: 'test',
        payload: {},
      });

      expect(send).toBe(true);
    });

    it('can return true for context criteria matched', () => {
      const entity = new SubscriptionEntity(
        repositoryMock as SubscriptionRepository,
        {
          tenantId,
          typeId: 'test',
          criteria: {
            context: { value: 'test' },
          },
          subscriberId: 'test',
        },
        type
      );

      const send = entity.shouldSend({
        tenantId,
        name: 'test-started',
        timestamp: new Date(),
        correlationId: 'test',
        context: { value: 'test' },
        payload: {},
      });

      expect(send).toBe(true);
    });
  });

  describe('getSubscriberChannel', () => {
    it('can return channel', () => {
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
        type,
        subscriber
      );

      const result = entity.getSubscriberChannel(
        { channels: [Channel.email] } as NotificationType,
        {
          templates: { [Channel.email]: { subject: 'test', body: 'test' } },
        } as NotificationTypeEvent
      );
      expect(result).toBe(channel);
    });

    it('can return falsy for no channel match', () => {
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
        type,
        subscriber
      );

      const result = entity.getSubscriberChannel(
        { channels: [Channel.email] } as NotificationType,
        {
          templates: { [Channel.email]: { subject: 'test', body: 'test' } },
        } as NotificationTypeEvent
      );
      expect(result).toBeFalsy();
    });

    it('can handle notification type missing channel template', () => {
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
        type,
        subscriber
      );

      const result = entity.getSubscriberChannel(
        { channels: [Channel.email] } as NotificationType,
        {
          templates: { [Channel.email]: null },
        } as NotificationTypeEvent
      );

      expect(result).toBeFalsy();
    });
  });

  describe('updateCriteria', () => {
    const user = {
      id: 'test',
      tenantId,
      roles: [ServiceUserRoles.SubscriptionAdmin],
    } as User;

    const subscriber = new SubscriberEntity(repositoryMock as SubscriptionRepository, {
      tenantId,
      addressAs: 'test',
      channels: [],
    });

    it('can updated criteria', async () => {
      const entity = new SubscriptionEntity(
        repositoryMock as SubscriptionRepository,
        {
          tenantId,
          typeId: 'test',
          criteria: { correlationId: 'test2' },
          subscriberId: 'test',
        },
        type,
        subscriber
      );

      const criteria = {
        correlationId: 'test',
        context: {
          value: 'test',
        },
      };
      const updated = await entity.updateCriteria(user, criteria);
      expect(updated.criteria).toMatchObject(expect.arrayContaining([expect.any(Object), criteria]));
    });

    it('can throw for additive update to empty criteria', async () => {
      const entity = new SubscriptionEntity(
        repositoryMock as SubscriptionRepository,
        {
          tenantId,
          typeId: 'test',
          criteria: null,
          subscriberId: 'test',
        },
        type,
        subscriber
      );

      const criteria = {
        correlationId: 'test',
        context: {
          value: 'test',
        },
      };
      await expect(entity.updateCriteria(user, criteria)).rejects.toThrow(InvalidOperationError);
    });

    it('can throw for update to empty criteria', async () => {
      const entity = new SubscriptionEntity(
        repositoryMock as SubscriptionRepository,
        {
          tenantId,
          typeId: 'test',
          criteria: null,
          subscriberId: 'test',
        },
        type,
        subscriber
      );

      await expect(entity.updateCriteria(user, [])).rejects.toThrow(InvalidOperationError);
    });

    it('can throw for user not allowed to subscribe', async () => {
      const entity = new SubscriptionEntity(
        repositoryMock as SubscriptionRepository,
        {
          tenantId,
          typeId: 'test',
          criteria: {},
          subscriberId: 'test',
        },
        type,
        subscriber
      );

      const criteria = {
        correlationId: 'test',
        context: {
          value: 'test',
        },
      };
      await expect(entity.updateCriteria({ ...user, roles: [] }, criteria)).rejects.toThrow(UnauthorizedUserError);
    });
  });
});
