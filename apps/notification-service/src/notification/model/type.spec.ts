import { adspId, User } from '@abgov/adsp-service-sdk';
import { DomainEvent } from '@core-services/core-common';
import { Logger } from 'winston';
import { SubscriptionRepository } from '../repository';
import { Channel, ServiceUserRoles, Subscriber } from '../types';
import { SubscriptionEntity } from './subscription';
import { SubscriberEntity } from './subscriber';
import { NotificationTypeEntity } from './type';

describe('NotificationTypeEntity', () => {
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const repositoryMock = {
    saveSubscription: jest.fn((entity: SubscriptionEntity) => {
      return Promise.resolve(entity);
    }),
    deleteSubscriptions: jest.fn(() => Promise.resolve(true)),
  };

  const templateServiceMock = {
    generateMessage: jest.fn(),
  };

  beforeEach(() => {
    repositoryMock.saveSubscription.mockClear();
    repositoryMock.deleteSubscriptions.mockClear();
    templateServiceMock.generateMessage.mockClear();
    templateServiceMock.generateMessage.mockClear();
  });

  it('can be created', () => {
    const entity = new NotificationTypeEntity(
      {
        id: 'test-type',
        name: 'test type',
        description: null,
        publicSubscribe: false,
        subscriberRoles: [],
        events: [],
      },
      adspId`urn:ads:platform:tenant-service:v2:/tenants/test`
    );

    expect(entity).toBeTruthy();
  });

  describe('canSubscribe', () => {
    it('can return false for null user', () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const entity = new NotificationTypeEntity(
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: false,
          subscriberRoles: [],
          events: [],
        },
        tenantId
      );

      expect(entity.canSubscribe(null, null)).toBe(false);
    });

    it('can return false for user of wrong tenant', () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const entity = new NotificationTypeEntity(
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: false,
          subscriberRoles: [],
          events: [],
        },
        tenantId
      );

      expect(
        entity.canSubscribe(
          {
            id: 'test',
            tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/different`,
            roles: [],
          } as User,
          {} as Subscriber
        )
      ).toBe(false);
    });

    it('can return false for user without role', () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const entity = new NotificationTypeEntity(
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: false,
          subscriberRoles: ['staff'],
          events: [],
        },
        tenantId
      );

      expect(entity.canSubscribe({ id: 'test', tenantId, roles: [] } as User, { userId: 'test' } as Subscriber)).toBe(
        false
      );
    });

    it('can return true for user with role', () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const entity = new NotificationTypeEntity(
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: false,
          subscriberRoles: ['staff'],
          events: [],
        },
        tenantId
      );

      expect(
        entity.canSubscribe({ id: 'test', tenantId, roles: ['staff'] } as User, { userId: 'test' } as Subscriber)
      ).toBe(true);
    });

    it('can return false for type without subscriber roles.', () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const entity = new NotificationTypeEntity(
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: false,
          subscriberRoles: [],
          events: [],
        },
        tenantId
      );

      expect(entity.canSubscribe({ id: 'test', tenantId, roles: [] } as User, { userId: 'test' } as Subscriber)).toBe(
        false
      );
    });

    it('can return true for type with public subscribe', () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const entity = new NotificationTypeEntity(
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: true,
          subscriberRoles: [],
          events: [],
        },
        tenantId
      );

      expect(entity.canSubscribe({ id: 'test', tenantId, roles: [] } as User, { userId: 'test' } as Subscriber)).toBe(
        true
      );
    });

    it('can return false for user subscribing for another user', () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const entity = new NotificationTypeEntity(
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: false,
          subscriberRoles: ['staff'],
          events: [],
        },
        tenantId
      );

      expect(
        entity.canSubscribe({ id: 'test', tenantId, roles: ['staff'] } as User, { userId: 'another' } as Subscriber)
      ).toBe(false);
    });

    it('can return true for user with subscription admin role', () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const entity = new NotificationTypeEntity(
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: false,
          subscriberRoles: [],
          events: [],
        },
        tenantId
      );

      expect(
        entity.canSubscribe(
          { id: 'test', tenantId, roles: [ServiceUserRoles.SubscriptionAdmin] } as User,
          { userId: 'another' } as Subscriber
        )
      ).toBe(true);
    });
  });

  describe('subscribe', () => {
    it('can create subscription', async () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const entity = new NotificationTypeEntity(
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: true,
          subscriberRoles: [],
          events: [],
        },
        tenantId
      );

      const subscriber = new SubscriberEntity(repositoryMock as unknown as SubscriptionRepository, {
        tenantId,
        addressAs: 'Tester',
        channels: [],
        userId: 'test',
      });
      const subscription = await entity.subscribe(
        repositoryMock as unknown as SubscriptionRepository,
        { id: 'test', tenantId, roles: [] } as User,
        subscriber
      );

      expect(subscription).toBeTruthy();
      expect(subscription.subscriber).toBe(subscriber);
      expect(repositoryMock.saveSubscription).toHaveBeenCalledTimes(1);
    });

    it('can throw for not authorized user', async () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const entity = new NotificationTypeEntity(
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: false,
          subscriberRoles: [],
          events: [],
        },
        tenantId
      );

      const subscriber = new SubscriberEntity(repositoryMock as unknown as SubscriptionRepository, {
        tenantId,
        addressAs: 'Tester',
        channels: [],
      });
      await expect(
        entity.subscribe(
          repositoryMock as unknown as SubscriptionRepository,
          { id: 'test', tenantId, roles: [] } as User,
          subscriber
        )
      ).rejects.toThrowError(/User not authorized to subscribe./);
    });
  });

  describe('unsubscribe', () => {
    it('can unsubscribe', async () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const entity = new NotificationTypeEntity(
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: true,
          subscriberRoles: [],
          events: [],
        },
        tenantId
      );

      const subscriber = new SubscriberEntity(repositoryMock as unknown as SubscriptionRepository, {
        tenantId,
        addressAs: 'Tester',
        channels: [],
        userId: 'test',
      });

      const user = { id: 'test', tenantId, roles: [] } as User;
      await entity.subscribe(repositoryMock as unknown as SubscriptionRepository, user, subscriber);

      const result = await entity.unsubscribe(repositoryMock as unknown as SubscriptionRepository, user, subscriber);
      expect(result).toBe(true);
      expect(repositoryMock.deleteSubscriptions).toHaveBeenCalledTimes(1);
    });

    it('can throw for unauthorized user', async () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const entity = new NotificationTypeEntity(
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: true,
          subscriberRoles: [],
          events: [],
        },
        tenantId
      );

      const subscriber = new SubscriberEntity(repositoryMock as unknown as SubscriptionRepository, {
        tenantId,
        addressAs: 'Tester',
        channels: [],
        userId: 'test',
      });

      const user = { id: 'test', tenantId, roles: [] } as User;
      await entity.subscribe(repositoryMock as unknown as SubscriptionRepository, user, subscriber);

      user.id = 'test2';
      await expect(
        entity.unsubscribe(repositoryMock as unknown as SubscriptionRepository, user, subscriber)
      ).rejects.toThrowError(/User not authorized to unsubscribe./);
    });
  });

  describe('generateNotifications', () => {
    it('can generate notifications', () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const entity = new NotificationTypeEntity(
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: false,
          subscriberRoles: [],
          events: [
            {
              namespace: 'test-service',
              name: 'test-started',
              templates: {
                [Channel.email]: {
                  subject: '',
                  body: '',
                },
              },
              channels: [Channel.email],
            },
          ],
        },
        tenantId
      );

      const subscriber = new SubscriberEntity(repositoryMock as unknown as SubscriptionRepository, {
        tenantId,
        addressAs: 'Tester',
        channels: [
          {
            channel: Channel.email,
            address: 'test@testco.org',
            verified: false,
          },
        ],
      });

      const subscription = new SubscriptionEntity(
        repositoryMock as unknown as SubscriptionRepository,
        { tenantId, typeId: 'test-type', subscriberId: 'test', criteria: {} },
        subscriber
      );

      const message = {
        subject: 'test',
        body: 'test content',
      };
      templateServiceMock.generateMessage.mockReturnValueOnce(message);

      const event: DomainEvent = {
        tenantId,
        namespace: 'test-service',
        name: 'test-started',
        timestamp: new Date(),
        payload: {},
      };
      const [notification] = entity.generateNotifications(logger, templateServiceMock, event, [subscription]);
      expect(templateServiceMock.generateMessage).toHaveBeenCalledTimes(1);
      expect(notification.to).toBe('test@testco.org');
      expect(notification.channel).toBe(Channel.email);
      expect(notification.message).toBe(message);
    });

    it('can return no notification for no channel match', () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const entity = new NotificationTypeEntity(
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: false,
          subscriberRoles: [],
          events: [
            {
              namespace: 'test-service',
              name: 'test-started',
              templates: {
                [Channel.email]: {
                  subject: '',
                  body: '',
                },
              },
              channels: [Channel.email],
            },
          ],
        },
        tenantId
      );

      const subscriber = new SubscriberEntity(repositoryMock as unknown as SubscriptionRepository, {
        tenantId,
        addressAs: 'Tester',
        channels: [
          {
            channel: Channel.sms,
            address: '780-123-3214',
            verified: false,
          },
        ],
      });

      const subscription = new SubscriptionEntity(
        repositoryMock as unknown as SubscriptionRepository,
        { tenantId, typeId: 'test-type', subscriberId: 'test', criteria: {} },
        subscriber
      );

      const event: DomainEvent = {
        tenantId,
        namespace: 'test-service',
        name: 'test-started',
        timestamp: new Date(),
        payload: {},
      };

      const notifications = entity.generateNotifications(logger, templateServiceMock, event, [subscription]);
      expect(notifications.length).toBe(0);
    });

    it('can return notification for criteria match', () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

      const entity = new NotificationTypeEntity(
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: false,
          subscriberRoles: [],
          events: [
            {
              namespace: 'test-service',
              name: 'test-started',
              templates: {
                [Channel.email]: {
                  subject: '',
                  body: '',
                },
              },
              channels: [Channel.email],
            },
          ],
        },
        tenantId
      );

      const subscriber = new SubscriberEntity(repositoryMock as unknown as SubscriptionRepository, {
        tenantId,
        addressAs: 'Tester',
        channels: [
          {
            channel: Channel.email,
            address: 'test@testco.org',
            verified: false,
          },
        ],
      });

      const subscription = new SubscriptionEntity(
        repositoryMock as unknown as SubscriptionRepository,
        { tenantId, typeId: 'test-type', subscriberId: 'test', criteria: { correlationId: '123' } },
        subscriber
      );

      const message = {
        subject: 'test',
        body: 'test content',
      };
      templateServiceMock.generateMessage.mockReturnValueOnce(message);

      const event: DomainEvent = {
        tenantId,
        namespace: 'test-service',
        name: 'test-started',
        timestamp: new Date(),
        payload: {},
        correlationId: '123',
      };

      const [notification] = entity.generateNotifications(logger, templateServiceMock, event, [subscription]);
      expect(notification.to).toBe('test@testco.org');
      expect(notification.channel).toBe(Channel.email);
      expect(notification.message).toBe(message);
    });

    it('can return notification for criteria match without notification type tenant Id', () => {
      const tenantId = null;

      const entity = new NotificationTypeEntity(
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: false,
          subscriberRoles: [],
          events: [
            {
              namespace: 'test-service',
              name: 'test-started',
              templates: {
                [Channel.email]: {
                  subject: '',
                  body: '',
                },
              },
              channels: [Channel.email],
            },
          ],
        },
        tenantId
      );

      const subscriber = new SubscriberEntity(repositoryMock as unknown as SubscriptionRepository, {
        tenantId,
        addressAs: 'Tester',
        channels: [
          {
            channel: Channel.email,
            address: 'test@testco.org',
            verified: false,
          },
        ],
      });

      const subscription = new SubscriptionEntity(
        repositoryMock as unknown as SubscriptionRepository,
        { tenantId, typeId: 'test-type', subscriberId: 'test', criteria: { correlationId: '123' } },
        subscriber
      );

      const message = {
        subject: 'test',
        body: 'test content',
      };
      templateServiceMock.generateMessage.mockReturnValueOnce(message);

      const event: DomainEvent = {
        tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
        namespace: 'test-service',
        name: 'test-started',
        timestamp: new Date(),
        payload: {},
        correlationId: '123',
      };

      const [notification] = entity.generateNotifications(logger, templateServiceMock, event, [subscription]);
      expect(notification.to).toBe('test@testco.org');
      expect(notification.channel).toBe(Channel.email);
      expect(notification.message).toBe(message);
    });

    it('can return no notification for criteria mismatch', () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const entity = new NotificationTypeEntity(
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: false,
          subscriberRoles: [],
          events: [
            {
              namespace: 'test-service',
              name: 'test-started',
              templates: {
                [Channel.email]: {
                  subject: '',
                  body: '',
                },
              },
              channels: [Channel.email],
            },
          ],
        },
        tenantId
      );

      const subscriber = new SubscriberEntity(repositoryMock as unknown as SubscriptionRepository, {
        tenantId,
        addressAs: 'Tester',
        channels: [
          {
            channel: Channel.email,
            address: 'test@testco.org',
            verified: false,
          },
        ],
      });

      const subscription = new SubscriptionEntity(
        repositoryMock as unknown as SubscriptionRepository,
        { tenantId, typeId: 'test-type', subscriberId: 'test', criteria: { correlationId: '123' } },
        subscriber
      );

      const event: DomainEvent = {
        tenantId,
        namespace: 'test-service',
        name: 'test-started',
        timestamp: new Date(),
        payload: {},
        correlationId: '213',
      };

      const notifications = entity.generateNotifications(logger, templateServiceMock, event, [subscription]);
      expect(notifications.length).toBe(0);
    });
  });
});
