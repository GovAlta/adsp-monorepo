import { AdspId, adspId, User } from '@abgov/adsp-service-sdk';
import { DomainEvent, InvalidOperationError } from '@core-services/core-common';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from 'winston';
import { SubscriptionRepository } from '../repository';
import { Channel, ServiceUserRoles, Subscriber } from '../types';
import { SubscriptionEntity } from './subscription';
import { SubscriberEntity } from './subscriber';
import { DirectNotificationTypeEntity, NotificationTypeEntity } from './type';
import { NotificationConfiguration } from '../configuration';

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
    getSubscriptions: jest.fn(),
  };

  const templateServiceMock = {
    generateMessage: jest.fn(),
  };

  const attachmentServiceMock = {
    getAttachment: jest.fn(),
  };

  const configurationMock = {};

  beforeEach(() => {
    repositoryMock.saveSubscription.mockClear();
    repositoryMock.deleteSubscriptions.mockClear();
    repositoryMock.getSubscriptions.mockClear();
    templateServiceMock.generateMessage.mockClear();
    attachmentServiceMock.getAttachment.mockReset();
  });

  it('can be created', () => {
    const entity = new NotificationTypeEntity(
      logger,
      templateServiceMock,
      attachmentServiceMock,
      {
        id: 'test-type',
        name: 'test type',
        description: null,
        publicSubscribe: false,
        subscriberRoles: [],
        channels: [],
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
        logger,
        templateServiceMock,
        attachmentServiceMock,
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: false,
          subscriberRoles: [],
          channels: [],
          events: [],
        },
        tenantId
      );

      expect(entity.canSubscribe(null, null)).toBe(false);
    });

    it('can return false for user of wrong tenant', () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const entity = new NotificationTypeEntity(
        logger,
        templateServiceMock,
        attachmentServiceMock,
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: false,
          subscriberRoles: [],
          channels: [],
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
        logger,
        templateServiceMock,
        attachmentServiceMock,
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: false,
          subscriberRoles: ['staff'],
          channels: [],
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
        logger,
        templateServiceMock,
        attachmentServiceMock,
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: false,
          manageSubscribe: true,
          subscriberRoles: ['staff'],
          channels: [],
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
        logger,
        templateServiceMock,
        attachmentServiceMock,
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: false,
          subscriberRoles: [],
          channels: [],
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
        logger,
        templateServiceMock,
        attachmentServiceMock,
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: true,
          manageSubscribe: true,
          subscriberRoles: [],
          channels: [],
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
        logger,
        templateServiceMock,
        attachmentServiceMock,
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: false,
          subscriberRoles: ['staff'],
          channels: [],
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
        logger,
        templateServiceMock,
        attachmentServiceMock,
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: false,
          subscriberRoles: [],
          channels: [],
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
        logger,
        templateServiceMock,
        attachmentServiceMock,
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: true,
          manageSubscribe: true,
          subscriberRoles: [],
          channels: [],
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
        logger,
        templateServiceMock,
        attachmentServiceMock,
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: false,
          subscriberRoles: [],
          channels: [],
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
        logger,
        templateServiceMock,
        attachmentServiceMock,
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: true,
          manageSubscribe: true,
          subscriberRoles: [],
          channels: [],
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
        logger,
        templateServiceMock,
        attachmentServiceMock,
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: true,
          manageSubscribe: true,
          subscriberRoles: [],
          channels: [],
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
    const subscriberAppUrl = new URL('https://subscriptions');
    it('can generate notifications', async () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const tenant = { id: tenantId, name: 'test', realm: 'test' };
      const entity = new NotificationTypeEntity(
        logger,
        templateServiceMock,
        attachmentServiceMock,
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: false,
          subscriberRoles: [],
          channels: [Channel.email],
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
        entity,
        subscriber
      );
      repositoryMock.getSubscriptions.mockResolvedValueOnce({ results: [subscription], page: {} });

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
        traceparent: '123',
      };
      const [notification] = await entity.generateNotifications(
        logger,
        subscriberAppUrl,
        repositoryMock as unknown as SubscriptionRepository,
        configurationMock as NotificationConfiguration,
        event,
        {
          tenant,
        }
      );
      expect(templateServiceMock.generateMessage).toHaveBeenCalledTimes(1);
      expect(notification.to).toBe('test@testco.org');
      expect(notification.channel).toBe(Channel.email);
      expect(notification.message).toBe(message);
    });

    it('can handle missing event configuration', async () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const tenant = { id: tenantId, name: 'test', realm: 'test' };
      const entity = new NotificationTypeEntity(
        logger,
        templateServiceMock,
        attachmentServiceMock,
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: false,
          subscriberRoles: [],
          channels: [Channel.email],
          events: [],
        },
        tenantId
      );

      const event: DomainEvent = {
        tenantId,
        namespace: 'test-service',
        name: 'test-started',
        timestamp: new Date(),
        payload: {},
        traceparent: '123',
      };
      const results = await entity.generateNotifications(
        logger,
        subscriberAppUrl,
        repositoryMock as unknown as SubscriptionRepository,
        configurationMock as NotificationConfiguration,
        event,
        {
          tenant,
        }
      );
      expect(results).toEqual(expect.arrayContaining([]));
    });

    it('can generate notifications with title and subtitle', async () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const tenant = { id: tenantId, name: 'test', realm: 'test' };
      const entity = new NotificationTypeEntity(
        logger,
        templateServiceMock,
        attachmentServiceMock,
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: false,
          subscriberRoles: [],
          channels: [Channel.email],
          events: [
            {
              namespace: 'test-service',
              name: 'test-started',
              templates: {
                [Channel.email]: {
                  subject: '',
                  body: '',
                  title: 'My notification',
                  subtitle: 'Update about the notification',
                },
              },
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
        entity,
        subscriber
      );
      repositoryMock.getSubscriptions.mockResolvedValueOnce({ results: [subscription], page: {} });

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
        traceparent: '123',
      };
      const [notification] = await entity.generateNotifications(
        logger,
        subscriberAppUrl,
        repositoryMock as unknown as SubscriptionRepository,
        configurationMock as NotificationConfiguration,
        event,
        {
          tenant,
        }
      );
      expect(templateServiceMock.generateMessage).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          title: 'My notification',
          subtitle: 'Update about the notification',
        })
      );
      expect(notification.to).toBe('test@testco.org');
      expect(notification.channel).toBe(Channel.email);
      expect(notification.message).toBe(message);
    });

    it('can generate notifications with title and subtitle on other channel', async () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const tenant = { id: tenantId, name: 'test', realm: 'test' };
      const entity = new NotificationTypeEntity(
        logger,
        templateServiceMock,
        attachmentServiceMock,
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: false,
          subscriberRoles: [],
          channels: [Channel.sms],
          events: [
            {
              namespace: 'test-service',
              name: 'test-started',
              templates: {
                [Channel.sms]: {
                  subject: '',
                  body: '',
                  title: 'My notification',
                  subtitle: 'Update about the notification',
                },
              },
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
            address: '123456789',
            verified: false,
          },
        ],
      });

      const subscription = new SubscriptionEntity(
        repositoryMock as unknown as SubscriptionRepository,
        { tenantId, typeId: 'test-type', subscriberId: 'test', criteria: {} },
        entity,
        subscriber
      );
      repositoryMock.getSubscriptions.mockResolvedValueOnce({ results: [subscription], page: {} });

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
        traceparent: '123',
      };
      const [notification] = await entity.generateNotifications(
        logger,
        subscriberAppUrl,
        repositoryMock as unknown as SubscriptionRepository,
        configurationMock as NotificationConfiguration,
        event,
        {
          tenant,
        }
      );
      expect(templateServiceMock.generateMessage).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          title: 'My notification',
          subtitle: 'Update about the notification',
        })
      );
      expect(notification.to).toBe('123456789');
      expect(notification.channel).toBe(Channel.sms);
      expect(notification.message).toBe(message);
    });

    it('can generate notifications with attachments', async () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const tenant = { id: tenantId, name: 'test', realm: 'test' };
      const entity = new NotificationTypeEntity(
        logger,
        templateServiceMock,
        attachmentServiceMock,
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: false,
          subscriberRoles: [],
          channels: [Channel.email],
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
              attachments: ['file', 'urn:ads:platform:file-service:v2:/files/321'],
            },
          ],
        },
        tenantId
      );

      const attachment1 = {},
        attachment2 = {};
      attachmentServiceMock.getAttachment.mockResolvedValueOnce(attachment1).mockResolvedValueOnce(attachment2);

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
        entity,
        subscriber
      );
      repositoryMock.getSubscriptions.mockResolvedValueOnce({ results: [subscription, subscription], page: {} });

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
        payload: {
          file: 'urn:ads:platform:file-service:v2:/files/123',
        },
        traceparent: '123',
      };
      const [notification] = await entity.generateNotifications(
        logger,
        subscriberAppUrl,
        repositoryMock as unknown as SubscriptionRepository,
        configurationMock as NotificationConfiguration,
        event,
        {
          tenant,
        }
      );
      expect(templateServiceMock.generateMessage).toHaveBeenCalledTimes(2);
      // This is called once per attachment, doesn't increase for additional subscriptions.
      expect(attachmentServiceMock.getAttachment).toHaveBeenCalledTimes(2);
      expect(notification.to).toBe('test@testco.org');
      expect(notification.attachments).toEqual(expect.arrayContaining([attachment1, attachment2]));
    });

    it('can return no notification for no channel match', async () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const tenant = { id: tenantId, name: 'test', realm: 'test' };
      const entity = new NotificationTypeEntity(
        logger,
        templateServiceMock,
        attachmentServiceMock,
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: false,
          subscriberRoles: [],
          channels: [Channel.email],
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
        entity,
        subscriber
      );
      repositoryMock.getSubscriptions.mockResolvedValueOnce({ results: [subscription], page: {} });

      const event: DomainEvent = {
        tenantId,
        namespace: 'test-service',
        name: 'test-started',
        timestamp: new Date(),
        payload: {},
        traceparent: '123',
      };

      const notifications = await entity.generateNotifications(
        logger,
        subscriberAppUrl,
        repositoryMock as unknown as SubscriptionRepository,
        configurationMock as NotificationConfiguration,
        event,
        {
          tenant,
        }
      );
      expect(notifications.length).toBe(0);
    });

    it('can return notification for criteria match', async () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const tenant = { id: tenantId, name: 'test', realm: 'test' };

      const entity = new NotificationTypeEntity(
        logger,
        templateServiceMock,
        attachmentServiceMock,
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: false,
          subscriberRoles: [],
          channels: [Channel.email],
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
        entity,
        subscriber
      );
      repositoryMock.getSubscriptions.mockResolvedValueOnce({ results: [subscription], page: {} });

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
        traceparent: '123',
      };

      const [notification] = await entity.generateNotifications(
        logger,
        subscriberAppUrl,
        repositoryMock as unknown as SubscriptionRepository,
        configurationMock as NotificationConfiguration,
        event,
        {
          tenant,
        }
      );
      expect(notification.to).toBe('test@testco.org');
      expect(notification.channel).toBe(Channel.email);
      expect(notification.message).toBe(message);
    });

    it('can return notification for criteria match without notification type tenant Id', async () => {
      const tenantId = null;

      const entity = new NotificationTypeEntity(
        logger,
        templateServiceMock,
        attachmentServiceMock,
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: false,
          subscriberRoles: [],
          channels: [Channel.email],
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
        entity,
        subscriber
      );
      repositoryMock.getSubscriptions.mockResolvedValueOnce({ results: [subscription], page: {} });

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
        traceparent: '123',
      };

      const [notification] = await entity.generateNotifications(
        logger,
        subscriberAppUrl,
        repositoryMock as unknown as SubscriptionRepository,
        configurationMock as NotificationConfiguration,
        event,
        {
          tenant: null,
        }
      );
      expect(notification.to).toBe('test@testco.org');
      expect(notification.channel).toBe(Channel.email);
      expect(notification.message).toBe(message);
    });

    it('can return no notification for criteria mismatch', async () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const tenant = { id: tenantId, name: 'test', realm: 'test' };
      const entity = new NotificationTypeEntity(
        logger,
        templateServiceMock,
        attachmentServiceMock,
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: false,
          subscriberRoles: [],
          channels: [Channel.email],
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
        entity,
        subscriber
      );
      repositoryMock.getSubscriptions.mockResolvedValueOnce({ results: [subscription], page: {} });

      const event: DomainEvent = {
        tenantId,
        namespace: 'test-service',
        name: 'test-started',
        timestamp: new Date(),
        payload: {},
        correlationId: '213',
        traceparent: '123',
      };

      const notifications = await entity.generateNotifications(
        logger,
        subscriberAppUrl,
        repositoryMock as unknown as SubscriptionRepository,
        configurationMock as NotificationConfiguration,
        event,
        {
          tenant,
        }
      );
      expect(notifications.length).toBe(0);
    });
  });

  describe('overrideWith', () => {
    it('can override event template', () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const baseTypeEntity = new NotificationTypeEntity(logger, templateServiceMock, attachmentServiceMock, {
        id: 'test-type',
        name: 'test type',
        description: null,
        publicSubscribe: false,
        subscriberRoles: [],
        channels: [Channel.email, Channel.bot],
        events: [
          {
            namespace: 'test',
            name: 'test-started',
            templates: {
              email: {
                subject: 'base',
                body: 'base',
              },
              bot: {
                subject: 'base',
                body: 'base',
              },
            },
          },
          {
            namespace: 'test',
            name: 'test-stopped',
            templates: {
              email: {
                subject: 'base',
                body: 'base',
              },
              bot: {
                subject: 'base',
                body: 'base',
              },
            },
          },
        ],
      });

      const customTypeEntity = new NotificationTypeEntity(
        logger,
        templateServiceMock,
        attachmentServiceMock,
        {
          ...baseTypeEntity,
          events: [
            {
              namespace: 'test',
              name: 'test-started',
              templates: {
                email: {
                  subject: 'custom',
                  body: 'custom',
                },
              },
            },
          ],
        },
        tenantId
      );

      const effectiveEvent = baseTypeEntity.overrideWith(customTypeEntity);
      // Expect effective to be override of event template.
      expect(effectiveEvent).toMatchObject(
        expect.objectContaining({
          tenantId,
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: false,
          subscriberRoles: expect.arrayContaining([]),
          channels: expect.arrayContaining([Channel.email, Channel.bot]),
          events: expect.arrayContaining([
            expect.objectContaining({
              namespace: 'test',
              name: 'test-started',
              templates: expect.objectContaining({
                email: expect.objectContaining({
                  subject: 'custom',
                  body: 'custom',
                }),
                bot: expect.objectContaining({
                  subject: 'base',
                  body: 'base',
                }),
              }),
            }),
            expect.objectContaining({
              namespace: 'test',
              name: 'test-stopped',
              templates: expect.objectContaining({
                email: expect.objectContaining({
                  subject: 'base',
                  body: 'base',
                }),
                bot: expect.objectContaining({
                  subject: 'base',
                  body: 'base',
                }),
              }),
            }),
          ]),
        })
      );

      expect(baseTypeEntity).toMatchObject(
        expect.objectContaining({
          tenantId: undefined,
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: false,
          subscriberRoles: expect.arrayContaining([]),
          channels: expect.arrayContaining([Channel.email, Channel.bot]),
          events: expect.arrayContaining([
            expect.objectContaining({
              namespace: 'test',
              name: 'test-started',
              templates: expect.objectContaining({
                email: expect.objectContaining({
                  subject: 'base',
                  body: 'base',
                }),
                bot: expect.objectContaining({
                  subject: 'base',
                  body: 'base',
                }),
              }),
            }),
            expect.objectContaining({
              namespace: 'test',
              name: 'test-stopped',
              templates: expect.objectContaining({
                email: expect.objectContaining({
                  subject: 'base',
                  body: 'base',
                }),
                bot: expect.objectContaining({
                  subject: 'base',
                  body: 'base',
                }),
              }),
            }),
          ]),
        })
      );
    });
  });
});

describe('DirectNotificationTypeEntity', () => {
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
    getSubscriptions: jest.fn(),
  };

  const templateServiceMock = {
    generateMessage: jest.fn(),
  };

  const attachmentServiceMock = {
    getAttachment: jest.fn(),
  };

  const configurationMock = {};

  beforeEach(() => {
    repositoryMock.saveSubscription.mockClear();
    repositoryMock.deleteSubscriptions.mockClear();
    repositoryMock.getSubscriptions.mockClear();
    templateServiceMock.generateMessage.mockClear();
    templateServiceMock.generateMessage.mockClear();
  });

  it('can be created', () => {
    const entity = new DirectNotificationTypeEntity(
      logger,
      templateServiceMock,
      attachmentServiceMock,
      {
        id: 'test-type',
        name: 'test type',
        description: null,
        publicSubscribe: false,
        addressPath: 'details.email',
        subscriberRoles: [],
        channels: [],
        events: [],
      },
      adspId`urn:ads:platform:tenant-service:v2:/tenants/test`
    );

    expect(entity).toBeTruthy();
  });

  it('can be created for configured address', () => {
    const entity = new DirectNotificationTypeEntity(
      logger,
      templateServiceMock,
      attachmentServiceMock,
      {
        id: 'test-type',
        name: 'test type',
        description: null,
        publicSubscribe: false,
        address: 'test@test.co',
        subscriberRoles: [],
        channels: [],
        events: [],
      },
      adspId`urn:ads:platform:tenant-service:v2:/tenants/test`
    );

    expect(entity).toBeTruthy();
  });

  it('can throw for missing addressPath', () => {
    expect(() => {
      new DirectNotificationTypeEntity(
        logger,
        templateServiceMock,
        attachmentServiceMock,
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: false,
          subscriberRoles: [],
          channels: [],
          events: [],
        },
        adspId`urn:ads:platform:tenant-service:v2:/tenants/test`
      );
    }).toThrowError(InvalidOperationError);
  });

  describe('subscribe', () => {
    it('can throw invalid operation', async () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const entity = new DirectNotificationTypeEntity(
        logger,
        templateServiceMock,
        attachmentServiceMock,
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: false,
          addressPath: 'details.email',
          subscriberRoles: [],
          channels: [],
          events: [],
        },
        adspId`urn:ads:platform:tenant-service:v2:/tenants/test`
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

      await expect(
        entity.subscribe(
          repositoryMock as unknown as SubscriptionRepository,
          { id: 'test', tenantId, roles: [] } as User,
          subscriber
        )
      ).rejects.toThrowError(InvalidOperationError);
    });
  });

  describe('unsubscribe', () => {
    it('can throw invalid operation', async () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const entity = new DirectNotificationTypeEntity(
        logger,
        templateServiceMock,
        attachmentServiceMock,
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: false,
          addressPath: 'details.email',
          subscriberRoles: [],
          channels: [],
          events: [],
        },
        adspId`urn:ads:platform:tenant-service:v2:/tenants/test`
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

      await expect(
        entity.unsubscribe(
          repositoryMock as unknown as SubscriptionRepository,
          { id: 'test', tenantId, roles: [] } as User,
          subscriber
        )
      ).rejects.toThrowError(InvalidOperationError);
    });
  });

  describe('generateNotifications', () => {
    const subscriberAppUrl = new URL('https://subscriptions');

    const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
    const tenant = { id: tenantId, name: 'test', realm: 'test' };

    const entity = new DirectNotificationTypeEntity(
      logger,
      templateServiceMock,
      attachmentServiceMock,
      {
        id: 'test-type',
        name: 'test type',
        description: null,
        publicSubscribe: false,
        addressPath: 'details.email',
        subscriberRoles: [],
        channels: [Channel.email],
        events: [
          {
            namespace: 'test-service',
            name: 'test-started',
            templates: {
              [Channel.email]: { subject: '', body: '' },
            },
          },
        ],
      },
      adspId`urn:ads:platform:tenant-service:v2:/tenants/test`
    );

    it('can generate direct notification', async () => {
      const event = {
        tenantId,
        namespace: 'test-service',
        name: 'test-started',
        timestamp: new Date(),
        payload: { details: { email: 'tester@test.co' } },
        traceparent: '123',
      };

      const message = {
        subject: 'test',
        body: 'test content',
      };
      templateServiceMock.generateMessage.mockReturnValueOnce(message);

      const [result] = await entity.generateNotifications(
        logger as Logger,
        subscriberAppUrl,
        repositoryMock as unknown as SubscriptionRepository,
        configurationMock as NotificationConfiguration,
        event,
        { tenant }
      );

      expect(result).toMatchObject({
        tenantId: tenantId.toString(),
        message,
        to: event.payload.details.email,
        channel: Channel.email,
      });
    });

    it('can generate notification with attachment', async () => {
      const fileUrn = 'urn:ads:platform:file-service:v1:/files/123';
      const event = {
        tenantId,
        namespace: 'test-service',
        name: 'test-started',
        timestamp: new Date(),
        payload: { details: { email: 'tester@test.co' }, file: fileUrn },
        traceparent: '123',
      };

      const message = {
        subject: 'test',
        body: 'test content',
      };
      templateServiceMock.generateMessage.mockReturnValueOnce(message);
      const attachment = {};
      attachmentServiceMock.getAttachment.mockResolvedValueOnce(attachment);

      const entity = new DirectNotificationTypeEntity(
        logger,
        templateServiceMock,
        attachmentServiceMock,
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: false,
          addressPath: 'details.email',
          subscriberRoles: [],
          channels: [Channel.email],
          events: [
            {
              namespace: 'test-service',
              name: 'test-started',
              templates: {
                [Channel.email]: { subject: '', body: '' },
              },
            },
          ],
          attachmentPath: 'file',
        },
        adspId`urn:ads:platform:tenant-service:v2:/tenants/test`
      );
      const [result] = await entity.generateNotifications(
        logger as Logger,
        subscriberAppUrl,
        repositoryMock as unknown as SubscriptionRepository,
        configurationMock as NotificationConfiguration,
        event,
        { tenant }
      );

      expect(result).toMatchObject({
        tenantId: tenantId.toString(),
        message,
        to: event.payload.details.email,
        attachments: expect.arrayContaining([attachment]),
      });
      expect(attachmentServiceMock.getAttachment).toHaveBeenCalledWith(expect.any(AdspId));
    });

    it('can generate notification with attachments array', async () => {
      const fileUrn = 'urn:ads:platform:file-service:v1:/files/123';
      const event = {
        tenantId,
        namespace: 'test-service',
        name: 'test-started',
        timestamp: new Date(),
        payload: { details: { email: 'tester@test.co' }, file: [fileUrn] },
        traceparent: '123',
      };

      const message = {
        subject: 'test',
        body: 'test content',
      };
      templateServiceMock.generateMessage.mockReturnValueOnce(message);
      const attachment = {};
      attachmentServiceMock.getAttachment.mockResolvedValueOnce(attachment);

      const entity = new DirectNotificationTypeEntity(
        logger,
        templateServiceMock,
        attachmentServiceMock,
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: false,
          addressPath: 'details.email',
          subscriberRoles: [],
          channels: [Channel.email],
          events: [
            {
              namespace: 'test-service',
              name: 'test-started',
              templates: {
                [Channel.email]: { subject: '', body: '' },
              },
            },
          ],
          attachmentPath: 'file',
        },
        adspId`urn:ads:platform:tenant-service:v2:/tenants/test`
      );
      const [result] = await entity.generateNotifications(
        logger as Logger,
        subscriberAppUrl,
        repositoryMock as unknown as SubscriptionRepository,
        configurationMock as NotificationConfiguration,
        event,
        { tenant }
      );

      expect(result).toMatchObject({
        tenantId: tenantId.toString(),
        message,
        to: event.payload.details.email,
        attachments: expect.arrayContaining([attachment]),
      });
      expect(attachmentServiceMock.getAttachment).toHaveBeenCalledWith(expect.any(AdspId));
    });

    it('can generate notification with uuid attachment', async () => {
      const fileUuid = uuidv4();
      const event = {
        tenantId,
        namespace: 'test-service',
        name: 'test-started',
        timestamp: new Date(),
        payload: { details: { email: 'tester@test.co' }, file: fileUuid },
        traceparent: '123',
      };

      const message = {
        subject: 'test',
        body: 'test content',
      };
      templateServiceMock.generateMessage.mockReturnValueOnce(message);
      const attachment = {};
      attachmentServiceMock.getAttachment.mockResolvedValueOnce(attachment);

      const entity = new DirectNotificationTypeEntity(
        logger,
        templateServiceMock,
        attachmentServiceMock,
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: false,
          addressPath: 'details.email',
          subscriberRoles: [],
          channels: [Channel.email],
          events: [
            {
              namespace: 'test-service',
              name: 'test-started',
              templates: {
                [Channel.email]: { subject: '', body: '' },
              },
            },
          ],
          attachmentPath: 'file',
        },
        adspId`urn:ads:platform:tenant-service:v2:/tenants/test`
      );
      const [result] = await entity.generateNotifications(
        logger as Logger,
        subscriberAppUrl,
        repositoryMock as unknown as SubscriptionRepository,
        configurationMock as NotificationConfiguration,
        event,
        { tenant }
      );

      expect(result).toMatchObject({
        tenantId: tenantId.toString(),
        message,
        to: event.payload.details.email,
        attachments: expect.arrayContaining([attachment]),
      });
      expect(attachmentServiceMock.getAttachment).toHaveBeenCalledWith(expect.any(AdspId));
    });

    it('can generate notification with a static attachment', async () => {
      const fileUrn = 'urn:ads:platform:file-service:v1:/files/123';
      const event = {
        tenantId,
        namespace: 'test-service',
        name: 'test-started',
        timestamp: new Date(),
        payload: { details: { email: 'tester@test.co' } },
        traceparent: '123',
      };

      const message = {
        subject: 'test',
        body: 'test content',
      };
      templateServiceMock.generateMessage.mockReturnValueOnce(message);
      const attachment = {};
      attachmentServiceMock.getAttachment.mockResolvedValueOnce(attachment);

      const entity = new DirectNotificationTypeEntity(
        logger,
        templateServiceMock,
        attachmentServiceMock,
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: false,
          addressPath: 'details.email',
          subscriberRoles: [],
          channels: [Channel.email],
          events: [
            {
              namespace: 'test-service',
              name: 'test-started',
              templates: {
                [Channel.email]: { subject: '', body: '' },
              },
            },
          ],
          attachmentPath: fileUrn,
        },
        adspId`urn:ads:platform:tenant-service:v2:/tenants/test`
      );
      const [result] = await entity.generateNotifications(
        logger as Logger,
        subscriberAppUrl,
        repositoryMock as unknown as SubscriptionRepository,
        configurationMock as NotificationConfiguration,
        event,
        { tenant }
      );

      expect(result).toMatchObject({
        tenantId: tenantId.toString(),
        message,
        to: event.payload.details.email,
        attachments: expect.arrayContaining([attachment]),
      });
      expect(attachmentServiceMock.getAttachment).toHaveBeenCalledWith(expect.any(AdspId));
    });

    it('can generate notification with attachment configured per event', async () => {
      const fileUrn = 'urn:ads:platform:file-service:v1:/files/123';
      const event = {
        tenantId,
        namespace: 'test-service',
        name: 'test-started',
        timestamp: new Date(),
        payload: { details: { email: 'tester@test.co' }, file: fileUrn },
        traceparent: '123',
      };

      const message = {
        subject: 'test',
        body: 'test content',
      };
      templateServiceMock.generateMessage.mockReturnValueOnce(message);
      const attachment = {};
      attachmentServiceMock.getAttachment.mockResolvedValueOnce(attachment);

      const entity = new DirectNotificationTypeEntity(
        logger,
        templateServiceMock,
        attachmentServiceMock,
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: false,
          addressPath: 'details.email',
          subscriberRoles: [],
          channels: [Channel.email],
          events: [
            {
              namespace: 'test-service',
              name: 'test-started',
              templates: {
                [Channel.email]: { subject: '', body: '' },
              },
              attachments: 'file',
            },
          ],
        },
        adspId`urn:ads:platform:tenant-service:v2:/tenants/test`
      );
      const [result] = await entity.generateNotifications(
        logger as Logger,
        subscriberAppUrl,
        repositoryMock as unknown as SubscriptionRepository,
        configurationMock as NotificationConfiguration,
        event,
        { tenant }
      );

      expect(result).toMatchObject({
        tenantId: tenantId.toString(),
        message,
        to: event.payload.details.email,
        attachments: expect.arrayContaining([attachment]),
      });
      expect(attachmentServiceMock.getAttachment).toHaveBeenCalledWith(expect.any(AdspId));
    });

    it('can log and throw attachment error', async () => {
      const fileUrn = 'urn:ads:platform:file-service:v1:/files/123';
      const event = {
        tenantId,
        namespace: 'test-service',
        name: 'test-started',
        timestamp: new Date(),
        payload: { details: { email: 'tester@test.co' }, file: fileUrn },
        traceparent: '123',
      };

      const message = {
        subject: 'test',
        body: 'test content',
      };
      templateServiceMock.generateMessage.mockReturnValueOnce(message);
      attachmentServiceMock.getAttachment.mockRejectedValueOnce(new Error('Test error'));

      const entity = new DirectNotificationTypeEntity(
        logger,
        templateServiceMock,
        attachmentServiceMock,
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: false,
          addressPath: 'details.email',
          subscriberRoles: [],
          channels: [Channel.email],
          events: [
            {
              namespace: 'test-service',
              name: 'test-started',
              templates: {
                [Channel.email]: { subject: '', body: '' },
              },
            },
          ],
          attachmentPath: 'file',
        },
        adspId`urn:ads:platform:tenant-service:v2:/tenants/test`
      );
      await expect(
        entity.generateNotifications(
          logger as Logger,
          subscriberAppUrl,
          repositoryMock as unknown as SubscriptionRepository,
          configurationMock as NotificationConfiguration,
          event,
          { tenant }
        )
      ).rejects.toThrow('Test error');
    });

    it('can handle missing address value', async () => {
      const event = {
        tenantId,
        namespace: 'test-service',
        name: 'test-started',
        timestamp: new Date(),
        payload: {},
        traceparent: '123',
      };

      const message = {
        subject: 'test',
        body: 'test content',
      };
      templateServiceMock.generateMessage.mockReturnValueOnce(message);

      const results = await entity.generateNotifications(
        logger as Logger,
        subscriberAppUrl,
        repositoryMock as unknown as SubscriptionRepository,
        configurationMock as NotificationConfiguration,
        event,
        { tenant }
      );

      expect(results).toMatchObject(expect.arrayContaining([]));
    });

    it('can handle missing channel', async () => {
      const entity = new DirectNotificationTypeEntity(
        logger,
        templateServiceMock,
        attachmentServiceMock,
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: false,
          addressPath: 'details.email',
          subscriberRoles: [],
          channels: [],
          events: [
            {
              namespace: 'test-service',
              name: 'test-started',
              templates: {
                [Channel.email]: { subject: '', body: '' },
              },
            },
          ],
        },
        adspId`urn:ads:platform:tenant-service:v2:/tenants/test`
      );

      const event = {
        tenantId,
        namespace: 'test-service',
        name: 'test-started',
        timestamp: new Date(),
        payload: {},
        traceparent: '123',
      };

      const message = {
        subject: 'test',
        body: 'test content',
      };
      templateServiceMock.generateMessage.mockReturnValueOnce(message);

      const results = await entity.generateNotifications(
        logger as Logger,
        subscriberAppUrl,
        repositoryMock as unknown as SubscriptionRepository,
        configurationMock as NotificationConfiguration,
        event,
        { tenant }
      );

      expect(results).toMatchObject(expect.arrayContaining([]));
    });

    it('can generate to configured address', async () => {
      const entity = new DirectNotificationTypeEntity(
        logger,
        templateServiceMock,
        attachmentServiceMock,
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: false,
          address: 'test+configured@test.co',
          subscriberRoles: [],
          channels: [Channel.email],
          events: [
            {
              namespace: 'test-service',
              name: 'test-started',
              templates: {
                [Channel.email]: { subject: '', body: '' },
              },
            },
          ],
        },
        adspId`urn:ads:platform:tenant-service:v2:/tenants/test`
      );

      const event = {
        tenantId,
        namespace: 'test-service',
        name: 'test-started',
        timestamp: new Date(),
        payload: { details: { email: 'tester@test.co' } },
        traceparent: '123',
      };

      const message = {
        subject: 'test',
        body: 'test content',
      };
      templateServiceMock.generateMessage.mockReturnValueOnce(message);

      const [result] = await entity.generateNotifications(
        logger as Logger,
        subscriberAppUrl,
        repositoryMock as unknown as SubscriptionRepository,
        configurationMock as NotificationConfiguration,
        event,
        { tenant }
      );

      expect(result).toMatchObject({ tenantId: tenantId.toString(), message, to: entity.address });
    });

    it('can handle missing channel template', async () => {
      const entity = new DirectNotificationTypeEntity(
        logger,
        templateServiceMock,
        attachmentServiceMock,
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: false,
          addressPath: 'details.email',
          subscriberRoles: [],
          channels: [Channel.email],
          events: [
            {
              namespace: 'test-service',
              name: 'test-started',
              templates: {},
            },
          ],
        },
        adspId`urn:ads:platform:tenant-service:v2:/tenants/test`
      );

      const event = {
        tenantId,
        namespace: 'test-service',
        name: 'test-started',
        timestamp: new Date(),
        payload: {},
        traceparent: '123',
      };

      const message = {
        subject: 'test',
        body: 'test content',
      };
      templateServiceMock.generateMessage.mockReturnValueOnce(message);

      const results = await entity.generateNotifications(
        logger as Logger,
        subscriberAppUrl,
        repositoryMock as unknown as SubscriptionRepository,
        configurationMock as NotificationConfiguration,
        event,
        { tenant }
      );

      expect(results).toMatchObject(expect.arrayContaining([]));
    });

    it('can generate direct notification to SMS', async () => {
      const event = {
        tenantId,
        namespace: 'test-service',
        name: 'test-started',
        timestamp: new Date(),
        payload: { details: { phoneNumber: '7800032345' } },
        traceparent: '123',
      };

      const message = {
        subject: 'test',
        body: 'test content',
      };
      templateServiceMock.generateMessage.mockReturnValueOnce(message);

      const entity = new DirectNotificationTypeEntity(
        logger,
        templateServiceMock,
        attachmentServiceMock,
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          publicSubscribe: false,
          addressPath: 'details.phoneNumber',
          subscriberRoles: [],
          channels: [Channel.email, Channel.sms],
          events: [
            {
              namespace: 'test-service',
              name: 'test-started',
              templates: {
                [Channel.email]: { subject: '', body: '' },
                [Channel.sms]: { subject: '', body: '' },
              },
            },
          ],
        },
        adspId`urn:ads:platform:tenant-service:v2:/tenants/test`
      );
      const [result] = await entity.generateNotifications(
        logger as Logger,
        subscriberAppUrl,
        repositoryMock as unknown as SubscriptionRepository,
        configurationMock as NotificationConfiguration,
        event,
        { tenant }
      );

      expect(result).toMatchObject({
        tenantId: tenantId.toString(),
        message,
        to: event.payload.details.phoneNumber,
        channel: Channel.sms,
      });
    });
  });
});
