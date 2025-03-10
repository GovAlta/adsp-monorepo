import { adspId, Channel, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, NotFoundError, UnauthorizedError } from '@core-services/core-common';
import { Request, Response } from 'express';
import { Logger } from 'winston';
import { NotificationTypeEntity, SubscriberEntity, SubscriptionEntity } from '../model';
import { NotificationConfiguration } from '../configuration';
import {
  createTypeSubscription,
  getTypeSubscriptions,
  addOrUpdateTypeSubscription,
  createSubscriptionRouter,
  deleteTypeSubscription,
  getNotificationType,
  getNotificationTypes,
  getSubscriber,
  getSubscribers,
  getTypeSubscription,
  subscriberOperations,
  getSubscriberSubscriptions,
  getSubscriberDetails,
  getSubscriberByUserId,
  getSubscriptionChannels,
  deleteTypeSubscriptionCriteria,
} from './subscription';
import { NotificationType, ServiceUserRoles, Subscription } from '../types';
import { assertHasTenant, createSubscriber, deleteSubscriber, updateSubscriber } from '.';

describe('subscription router', () => {
  const serviceId = adspId`urn:ads:platform:notification-service`;
  const apiId = adspId`${serviceId}:v1`;
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  } as unknown as Logger;

  const repositoryMock = {
    getSubscriber: jest.fn(),
    getSubscriptions: jest.fn(),
    getSubscription: jest.fn(),
    findSubscribers: jest.fn(),
    deleteSubscriber: jest.fn(),
    saveSubscription: jest.fn(),
    deleteSubscriptions: jest.fn(),
    saveSubscriber: jest.fn((entity) => Promise.resolve(entity)),
  };

  const eventServiceMock = {
    send: jest.fn(),
  };

  const tenantServiceMock = {
    getTenants: jest.fn(),
    getTenant: jest.fn(),
    getTenantByName: jest.fn(),
    getTenantByRealm: jest.fn(),
  };

  const notificationType: NotificationType = {
    id: 'test',
    name: 'Test',
    description: 'testing 1 2 3',
    events: [],
    publicSubscribe: false,
    manageSubscribe: false,
    subscriberRoles: ['test-subscriber'],
    channels: [],
  };

  const verifyServiceMock = {
    sendCode: jest.fn(),
    sendCodeWithLink: jest.fn(),
    verifyCode: jest.fn(),
  };

  beforeEach(() => {
    repositoryMock.findSubscribers.mockReset();
    repositoryMock.getSubscriber.mockReset();
    repositoryMock.getSubscription.mockReset();
    repositoryMock.getSubscriptions.mockReset();
    repositoryMock.saveSubscriber.mockClear();
    repositoryMock.saveSubscription.mockReset();
    repositoryMock.deleteSubscriptions.mockReset();
    repositoryMock.deleteSubscriber.mockReset();
    eventServiceMock.send.mockReset();
    verifyServiceMock.sendCode.mockReset();
    verifyServiceMock.sendCodeWithLink.mockReset();
    verifyServiceMock.verifyCode.mockReset();
  });

  describe('createSubscriptionRouter', () => {
    it('can create router', () => {
      const router = createSubscriptionRouter({
        serviceId,
        logger: loggerMock,
        subscriptionRepository: repositoryMock,
        eventService: eventServiceMock,
        verifyService: verifyServiceMock,
        tenantService: tenantServiceMock,
      });
      expect(router).toBeTruthy();
    });
  });

  describe('assertHasTenant', () => {
    it('can call next with tenant', () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        getConfiguration: jest.fn(),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      assertHasTenant(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('can call next with error for no tenant', () => {
      const req = {
        getConfiguration: jest.fn(),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      assertHasTenant(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });
  });

  describe('getNotificationTypes', () => {
    it('can get types', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        getConfiguration: jest.fn(),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      req.getConfiguration.mockResolvedValueOnce(
        new NotificationConfiguration({ test: notificationType }, {}, tenantId)
      );
      await getNotificationTypes(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining(notificationType)]));
      expect(res.send.mock.calls[0][0]).toMatchSnapshot();
    });
  });

  describe('getNotificationType', () => {
    it('can get type', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        params: { type: 'test' },
        getConfiguration: jest.fn(),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      req.getConfiguration.mockResolvedValueOnce(
        new NotificationConfiguration({ test: notificationType }, {}, tenantId)
      );
      await getNotificationType(req as unknown as Request, res as unknown as Response, next);
      expect(req['notificationType']).toMatchObject(notificationType);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith();
    });

    it('can call next with not found', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        params: { type: 'not-there' },
        getConfiguration: jest.fn(),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      req.getConfiguration.mockResolvedValueOnce(
        new NotificationConfiguration({ test: notificationType }, {}, tenantId)
      );
      await getNotificationType(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });

  describe('getTypeSubscriptions', () => {
    it('can create handler', () => {
      const handler = getTypeSubscriptions(apiId, repositoryMock);
      expect(handler).toBeTruthy();
    });

    it('can get subscriptions', async () => {
      const req = {
        user: {
          id: 'tester',
          tenantId,
          name: 'Tester',
          email: 'tester@test.co',
          roles: [ServiceUserRoles.SubscriptionAdmin],
        },
        tenant: {
          id: tenantId,
        },
        query: {},
        notificationType: new NotificationTypeEntity(notificationType, tenantId),
        getConfiguration: jest.fn(),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      req.getConfiguration.mockResolvedValueOnce(
        new NotificationConfiguration({ test: notificationType }, {}, tenantId)
      );
      const result = { results: [], page: {} };
      repositoryMock.getSubscriptions.mockResolvedValueOnce(result);

      const handler = getTypeSubscriptions(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ page: result.page }));
      expect(res.send.mock.calls[0][0]).toMatchSnapshot();
    });

    it('can handle query params', async () => {
      const req = {
        user: {
          id: 'tester',
          tenantId,
          name: 'Tester',
          email: 'tester@test.co',
          roles: [ServiceUserRoles.SubscriptionAdmin],
        },
        tenant: {
          id: tenantId,
        },
        query: { top: '11', after: '123' },
        notificationType: new NotificationTypeEntity(notificationType, tenantId),
        getConfiguration: jest.fn(),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const configuration = new NotificationConfiguration({ test: notificationType }, {}, tenantId);
      req.getConfiguration.mockResolvedValueOnce(configuration);
      const result = { results: [], page: {} };
      repositoryMock.getSubscriptions.mockResolvedValueOnce(result);

      const handler = getTypeSubscriptions(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getSubscriptions).toHaveBeenCalledWith(
        configuration,
        req.tenant.id,
        11,
        '123',
        expect.objectContaining({ typeIdEquals: notificationType.id })
      );
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ page: result.page }));
    });

    it('can call next for unauthorized user', async () => {
      const req = {
        user: {
          id: 'tester',
          tenantId,
          name: 'Tester',
          email: 'tester@test.co',
          roles: [],
        },
        tenant: {
          id: tenantId,
        },
        query: {},
        notificationType: new NotificationTypeEntity(notificationType, tenantId),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = getTypeSubscriptions(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });

  describe('createTypeSubscription', () => {
    it('can create handler', () => {
      const handler = createTypeSubscription(apiId, repositoryMock, eventServiceMock);
      expect(handler).toBeTruthy();
    });

    it('can create subscription', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          tenantId,
          roles: [ServiceUserRoles.SubscriptionAdmin],
        },
        query: {},
        body: { addressAs: 'tester' },
        notificationType: new NotificationTypeEntity(notificationType, tenantId),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const subscriber = new SubscriberEntity(repositoryMock, {
        id: 'subscriber',
        tenantId,
        addressAs: 'tester',
        channels: [],
      });
      const subscription = new SubscriptionEntity(
        repositoryMock,
        { tenantId, typeId: 'test', subscriberId: 'subscriber', criteria: {} },
        req.notificationType,
        subscriber
      );
      repositoryMock.getSubscription.mockResolvedValueOnce(null);
      repositoryMock.saveSubscriber.mockResolvedValueOnce(subscriber);
      repositoryMock.saveSubscription.mockResolvedValueOnce(subscription);

      const handler = createTypeSubscription(apiId, repositoryMock, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.saveSubscriber).toHaveBeenCalledWith(expect.objectContaining({ addressAs: 'tester' }));
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ typeId: 'test' }));
      expect(res.send.mock.calls[0][0]).toMatchSnapshot();
      expect(eventServiceMock.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'subscriber-created' }));
      expect(eventServiceMock.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'subscription-set' }));
    });

    it('can create user subscription', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          id: 'tester',
          tenantId,
          name: 'Tester',
          email: 'tester@test.co',
          roles: [ServiceUserRoles.SubscriptionAdmin],
        },
        query: { userSub: 'true' },
        body: {},
        notificationType: new NotificationTypeEntity(notificationType, tenantId),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const subscriber = new SubscriberEntity(repositoryMock, {
        id: 'subscriber',
        tenantId,
        addressAs: 'tester',
        channels: [],
      });
      const subscription = new SubscriptionEntity(
        repositoryMock,
        { tenantId, typeId: 'test', subscriberId: 'subscriber', criteria: {} },
        req.notificationType,
        subscriber
      );
      repositoryMock.getSubscription.mockResolvedValueOnce(null);
      repositoryMock.saveSubscriber.mockResolvedValueOnce(subscriber);
      repositoryMock.saveSubscription.mockResolvedValueOnce(subscription);

      const handler = createTypeSubscription(apiId, repositoryMock, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.saveSubscriber).toHaveBeenCalledWith(
        expect.objectContaining({
          addressAs: 'Tester',
          userId: 'tester',
          channels: expect.arrayContaining([expect.objectContaining({ channel: 'email', address: 'tester@test.co' })]),
        })
      );
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ typeId: 'test' }));
      expect(eventServiceMock.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'subscriber-created' }));
      expect(eventServiceMock.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'subscription-set' }));
    });

    it('can create subscription for existing user subscriber', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          id: 'tester',
          tenantId,
          name: 'Tester',
          email: 'tester@test.co',
          roles: [ServiceUserRoles.SubscriptionAdmin],
        },
        query: { userSub: 'true' },
        body: {},
        notificationType: new NotificationTypeEntity(notificationType, tenantId),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const subscriber = new SubscriberEntity(repositoryMock, {
        id: 'subscriber',
        tenantId,
        addressAs: 'tester',
        channels: [],
      });
      const subscription = new SubscriptionEntity(
        repositoryMock,
        { tenantId, typeId: 'test', subscriberId: 'subscriber', criteria: {} },
        req.notificationType,
        subscriber
      );
      repositoryMock.getSubscriber.mockResolvedValueOnce(subscriber);
      repositoryMock.getSubscription.mockResolvedValueOnce(null);
      repositoryMock.saveSubscription.mockResolvedValueOnce(subscription);

      const handler = createTypeSubscription(apiId, repositoryMock, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getSubscriber).toHaveBeenCalledWith(tenantId, 'tester', true);
      expect(repositoryMock.saveSubscriber).not.toBeCalled();
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ typeId: 'test' }));
      expect(eventServiceMock.send).not.toHaveBeenCalledWith(expect.objectContaining({ name: 'subscriber-created' }));
      expect(eventServiceMock.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'subscription-set' }));
    });

    it('can create subscription for existing subscriber', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          id: 'tester',
          tenantId,
          name: 'Tester',
          email: 'tester@test.co',
          roles: [ServiceUserRoles.SubscriptionAdmin],
        },
        query: {},
        body: { id: 'subscriber' },
        notificationType: new NotificationTypeEntity(notificationType, tenantId),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const subscriber = new SubscriberEntity(repositoryMock, {
        id: 'subscriber',
        tenantId,
        addressAs: 'tester',
        channels: [],
      });
      const subscription = new SubscriptionEntity(
        repositoryMock,
        { tenantId, typeId: 'test', subscriberId: 'subscriber', criteria: {} },
        req.notificationType,
        subscriber
      );
      repositoryMock.getSubscriber.mockResolvedValueOnce(subscriber);
      repositoryMock.getSubscription.mockResolvedValueOnce(null);
      repositoryMock.saveSubscription.mockResolvedValueOnce(subscription);

      const handler = createTypeSubscription(apiId, repositoryMock, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getSubscriber).toHaveBeenCalledWith(tenantId, 'subscriber', false);
      expect(repositoryMock.saveSubscriber).not.toBeCalled();
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ typeId: 'test' }));
      expect(eventServiceMock.send).not.toHaveBeenCalledWith(expect.objectContaining({ name: 'subscriber-created' }));
      expect(eventServiceMock.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'subscription-set' }));
    });
  });

  describe('addOrUpdateTypeSubscription', () => {
    it('can create handler', () => {
      const handler = addOrUpdateTypeSubscription(apiId, repositoryMock, eventServiceMock);
      expect(handler).toBeTruthy();
    });

    it('can add subscription', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          id: 'tester',
          tenantId,
          name: 'Tester',
          email: 'tester@test.co',
          roles: [ServiceUserRoles.SubscriptionAdmin],
        },
        body: { criteria: { correlationId: 'test' } },
        query: {},
        params: { subscriber: 'subscriber' },
        notificationType: new NotificationTypeEntity(notificationType, tenantId),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const subscriber = new SubscriberEntity(repositoryMock, {
        id: 'subscriber',
        tenantId,
        addressAs: 'tester',
        channels: [],
      });
      const subscription = new SubscriptionEntity(
        repositoryMock,
        { tenantId, typeId: 'test', subscriberId: 'subscriber', criteria: {} },
        req.notificationType,
        subscriber
      );
      repositoryMock.getSubscriber.mockResolvedValueOnce(subscriber);
      repositoryMock.getSubscription.mockResolvedValueOnce(null);
      repositoryMock.saveSubscription.mockResolvedValueOnce(subscription);

      const handler = addOrUpdateTypeSubscription(apiId, repositoryMock, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getSubscriber).toHaveBeenCalledWith(tenantId, 'subscriber', false);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ typeId: 'test' }));
      expect(res.send.mock.calls[0][0]).toMatchSnapshot();
      expect(eventServiceMock.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'subscription-set' }));
    });

    it('can add subscription with criteria', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          id: 'tester',
          tenantId,
          name: 'Tester',
          email: 'tester@test.co',
          roles: [ServiceUserRoles.SubscriptionAdmin],
        },
        body: { criteria: { correlationId: '123', context: {} } },
        query: {},
        params: { subscriber: 'subscriber' },
        notificationType: new NotificationTypeEntity(notificationType, tenantId),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const subscriber = new SubscriberEntity(repositoryMock, {
        id: 'subscriber',
        tenantId,
        addressAs: 'tester',
        channels: [],
      });
      const subscription = new SubscriptionEntity(
        repositoryMock,
        { tenantId, typeId: 'test', subscriberId: 'subscriber', criteria: {} },
        req.notificationType,
        subscriber
      );
      repositoryMock.getSubscriber.mockResolvedValueOnce(subscriber);
      repositoryMock.getSubscription.mockResolvedValueOnce(null);
      repositoryMock.saveSubscription.mockResolvedValueOnce(subscription);

      const handler = addOrUpdateTypeSubscription(apiId, repositoryMock, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getSubscriber).toHaveBeenCalledWith(tenantId, 'subscriber', false);
      expect(repositoryMock.saveSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          criteria: expect.arrayContaining([
            expect.objectContaining({
              correlationId: req.body.criteria.correlationId,
              context: req.body.criteria.context,
            }),
          ]),
        })
      );
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ typeId: 'test' }));
      expect(eventServiceMock.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'subscription-set' }));
    });

    it('can update subscription criteria', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          id: 'tester',
          tenantId,
          name: 'Tester',
          email: 'tester@test.co',
          roles: [ServiceUserRoles.SubscriptionAdmin],
        },
        body: { criteria: [{ correlationId: '123', context: {} }] },
        query: {},
        params: { subscriber: 'subscriber' },
        notificationType: new NotificationTypeEntity(notificationType, tenantId),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const subscriber = new SubscriberEntity(repositoryMock, {
        id: 'subscriber',
        tenantId,
        addressAs: 'tester',
        channels: [],
      });
      const subscription = new SubscriptionEntity(
        repositoryMock,
        { tenantId, typeId: 'test', subscriberId: 'subscriber', criteria: {} },
        req.notificationType,
        subscriber
      );
      repositoryMock.getSubscriber.mockResolvedValueOnce(subscriber);
      repositoryMock.getSubscription.mockResolvedValueOnce(subscription);
      repositoryMock.saveSubscription.mockResolvedValueOnce(subscription);

      const handler = addOrUpdateTypeSubscription(apiId, repositoryMock, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getSubscriber).toHaveBeenCalledWith(tenantId, 'subscriber', false);
      expect(repositoryMock.saveSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          criteria: expect.arrayContaining([
            expect.objectContaining({
              correlationId: req.body.criteria[0].correlationId,
            }),
          ]),
        })
      );
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ typeId: 'test' }));
      expect(res.send.mock.calls[0][0]).toMatchSnapshot();
      expect(eventServiceMock.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'subscription-set' }));
    });

    it('can call next with error', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          id: 'tester',
          tenantId,
          name: 'Tester',
          email: 'tester@test.co',
          roles: [ServiceUserRoles.SubscriptionAdmin],
        },
        body: { criteria: { correlationId: 'test' } },
        query: {},
        params: { subscriber: 'subscriber' },
        notificationType: new NotificationTypeEntity(notificationType, tenantId),
      };

      const mockResponse = () => {
        const res = { send: jest.fn(), status: {}, json: {} };
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        return res;
      };

      const res = mockResponse();
      const next = jest.fn();

      repositoryMock.getSubscriber.mockResolvedValueOnce(null);

      const handler = addOrUpdateTypeSubscription(apiId, repositoryMock, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });

  describe('getTypeSubscription', () => {
    it('can create handler', () => {
      const handler = getTypeSubscription(apiId, repositoryMock);
      expect(handler).toBeTruthy();
    });

    it('can get subscription', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          id: 'tester',
          tenantId,
          name: 'Tester',
          email: 'tester@test.co',
          roles: [ServiceUserRoles.SubscriptionAdmin],
        },
        query: {},
        params: { subscriber: 'subscriber' },
        notificationType: new NotificationTypeEntity(notificationType, tenantId),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const subscriber = new SubscriberEntity(repositoryMock, {
        id: 'subscriber',
        tenantId,
        addressAs: 'tester',
        channels: [],
      });
      const subscription = new SubscriptionEntity(
        repositoryMock,
        { tenantId, typeId: 'test', subscriberId: 'subscriber', criteria: {} },
        req.notificationType,
        subscriber
      );

      repositoryMock.getSubscription.mockResolvedValueOnce(subscription);

      const handler = getTypeSubscription(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getSubscription).toHaveBeenCalledWith(req.notificationType, 'subscriber');
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ typeId: 'test', subscriber: expect.objectContaining({ id: 'subscriber' }) })
      );
      expect(res.send.mock.calls[0][0]).toMatchSnapshot();
    });

    it('can call next for unauthorized', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          id: 'tester',
          tenantId,
          name: 'Tester',
          email: 'tester@test.co',
          roles: [],
        },
        query: {},
        params: { subscriber: 'subscriber' },
        notificationType: new NotificationTypeEntity(notificationType, tenantId),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = getTypeSubscription(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenLastCalledWith(expect.any(UnauthorizedUserError));
    });
  });

  describe('deleteTypeSubscription', () => {
    it('can create handler', () => {
      const handler = deleteTypeSubscription(repositoryMock, eventServiceMock);
      expect(handler).toBeTruthy();
    });

    it('can delete subscription', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          id: 'tester',
          tenantId,
          name: 'Tester',
          email: 'tester@test.co',
          roles: [ServiceUserRoles.SubscriptionAdmin],
        },
        query: {},
        params: { subscriber: 'subscriber' },
        notificationType: new NotificationTypeEntity(notificationType, tenantId),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const subscriber = new SubscriberEntity(repositoryMock, {
        id: 'subscriber',
        tenantId,
        addressAs: 'tester',
        channels: [],
      });

      repositoryMock.getSubscriber.mockResolvedValueOnce(subscriber);
      repositoryMock.deleteSubscriptions.mockResolvedValueOnce(true);

      const handler = deleteTypeSubscription(repositoryMock, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.deleteSubscriptions).toHaveBeenCalledWith(tenantId, notificationType.id, 'subscriber');
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ deleted: true }));
      expect(res.send.mock.calls[0][0]).toMatchSnapshot();
      expect(eventServiceMock.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'subscription-deleted' }));
    });
  });

  describe('deleteTypeSubscriptionCriteria', () => {
    it('can create handler', () => {
      const handler = deleteTypeSubscriptionCriteria(repositoryMock, eventServiceMock);
      expect(handler).toBeTruthy();
    });

    it('can delete subscription criteria', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          id: 'tester',
          tenantId,
          name: 'Tester',
          email: 'tester@test.co',
          roles: [ServiceUserRoles.SubscriptionAdmin],
        },
        query: {
          criteria: JSON.stringify({ correlationId: 'test' }),
        },
        params: { subscriber: 'subscriber' },
        notificationType: new NotificationTypeEntity(notificationType, tenantId),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const subscriber = new SubscriberEntity(repositoryMock, {
        id: 'subscriber',
        tenantId,
        addressAs: 'tester',
        channels: [],
      });
      const subscription = new SubscriptionEntity(
        repositoryMock,
        {
          tenantId,
          typeId: 'test',
          subscriberId: 'subscriber',
          criteria: [{ correlationId: 'test' }, { correlationId: 'test2' }],
        },
        req.notificationType,
        subscriber
      );

      repositoryMock.getSubscription.mockResolvedValueOnce(subscription);
      repositoryMock.saveSubscription.mockResolvedValueOnce(subscription);

      const handler = deleteTypeSubscriptionCriteria(repositoryMock, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.saveSubscription).toHaveBeenCalledWith(subscription);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ deleted: true }));
      expect(eventServiceMock.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'subscription-set' }));
    });

    it('can delete subscription criteria and remove subscription', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          id: 'tester',
          tenantId,
          name: 'Tester',
          email: 'tester@test.co',
          roles: [ServiceUserRoles.SubscriptionAdmin],
        },
        query: {
          criteria: JSON.stringify({ correlationId: 'test' }),
        },
        params: { subscriber: 'subscriber' },
        notificationType: new NotificationTypeEntity(notificationType, tenantId),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const subscriber = new SubscriberEntity(repositoryMock, {
        id: 'subscriber',
        tenantId,
        addressAs: 'tester',
        channels: [],
      });
      const subscription = new SubscriptionEntity(
        repositoryMock,
        {
          tenantId,
          typeId: 'test',
          subscriberId: 'subscriber',
          criteria: [{ correlationId: 'test' }],
        },
        req.notificationType,
        subscriber
      );

      repositoryMock.getSubscription.mockResolvedValueOnce(subscription);
      repositoryMock.deleteSubscriptions.mockResolvedValueOnce(true);

      const handler = deleteTypeSubscriptionCriteria(repositoryMock, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.deleteSubscriptions).toHaveBeenCalledWith(
        subscription.tenantId,
        notificationType.id,
        subscriber.id
      );
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ deleted: true }));
      expect(eventServiceMock.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'subscription-deleted' }));
    });

    it('can call next with error', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          id: 'tester',
          tenantId,
          name: 'Tester',
          email: 'tester@test.co',
          roles: [ServiceUserRoles.SubscriptionAdmin],
        },
        query: {},
        params: { subscriber: 'subscriber' },
        notificationType: new NotificationTypeEntity(notificationType, tenantId),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const subscriber = new SubscriberEntity(repositoryMock, {
        id: 'subscriber',
        tenantId,
        addressAs: 'tester',
        channels: [],
      });
      const subscription = new SubscriptionEntity(
        repositoryMock,
        {
          tenantId,
          typeId: 'test',
          subscriberId: 'subscriber',
          criteria: [{ correlationId: 'test' }, { correlationId: 'test2' }],
        },
        req.notificationType,
        subscriber
      );

      repositoryMock.getSubscription.mockResolvedValueOnce(subscription);

      const handler = deleteTypeSubscriptionCriteria(repositoryMock, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });
  });

  describe('getSubscribers', () => {
    it('can create handler', () => {
      const handler = getSubscribers(apiId, repositoryMock);
      expect(handler).toBeTruthy();
    });

    it('can get subscribers', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          id: 'tester',
          tenantId,
          name: 'Tester',
          email: 'tester@test.co',
          roles: [ServiceUserRoles.SubscriptionAdmin],
        },
        query: {},
        params: { subscriber: 'subscriber' },
        notificationType: new NotificationTypeEntity(notificationType, tenantId),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const result = { results: [], page: {} };
      repositoryMock.findSubscribers.mockResolvedValueOnce(result);

      const handler = getSubscribers(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ page: result.page }));
      expect(res.send.mock.calls[0][0]).toMatchSnapshot();
    });

    it('can get subscribers with query params', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          id: 'tester',
          tenantId,
          name: 'Tester',
          email: 'tester@test.co',
          roles: [ServiceUserRoles.SubscriptionAdmin],
        },
        query: { top: '11', after: '123' },
        params: { subscriber: 'subscriber' },
        notificationType: new NotificationTypeEntity(notificationType, tenantId),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const result = { results: [], page: {} };
      repositoryMock.findSubscribers.mockResolvedValueOnce(result);

      const handler = getSubscribers(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.findSubscribers).toHaveBeenCalledWith(
        11,
        '123',
        expect.objectContaining({ tenantIdEquals: tenantId })
      );
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ page: result.page }));
    });

    it('can call next with error for non-admin', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          id: 'tester',
          tenantId,
          name: 'Tester',
          email: 'tester@test.co',
          roles: [],
        },
        query: {},
        params: { subscriber: 'subscriber' },
        notificationType: new NotificationTypeEntity(notificationType, tenantId),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = getSubscribers(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });

  describe('createSubscriber', () => {
    it('can create handler', () => {
      const handler = createSubscriber(apiId, repositoryMock, eventServiceMock);
      expect(handler).toBeTruthy();
    });

    it('can create subscriber', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          tenantId,
          roles: [ServiceUserRoles.SubscriptionAdmin],
        },
        query: {},
        body: { addressAs: 'tester@test.com', userId: 'tester@test.com' },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const subscriber = new SubscriberEntity(repositoryMock, {
        id: 'subscriber',
        tenantId,
        addressAs: 'tester@test.com',
        channels: [],
      });
      repositoryMock.saveSubscriber.mockResolvedValueOnce(subscriber);

      const handler = createSubscriber(apiId, repositoryMock, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.saveSubscriber).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'tester@test.com',
        })
      );
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          addressAs: 'tester@test.com',
        })
      );
      expect(res.send.mock.calls[0][0]).toMatchSnapshot();
      expect(eventServiceMock.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'subscriber-created' }));
    });

    it('can create user subscriber', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          id: 'tester',
          tenantId,
          name: 'Tester',
          email: 'tester@test.co',
          roles: [ServiceUserRoles.SubscriptionAdmin],
        },
        query: { userSub: 'true' },
        body: {},
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const subscriber = new SubscriberEntity(repositoryMock, {
        id: 'subscriber',
        tenantId,
        addressAs: 'tester',
        channels: [],
      });
      repositoryMock.saveSubscriber.mockResolvedValueOnce(subscriber);

      const handler = createSubscriber(apiId, repositoryMock, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.saveSubscriber).toHaveBeenCalledWith(
        expect.objectContaining({
          addressAs: 'Tester',
          userId: 'tester',
          channels: expect.arrayContaining([expect.objectContaining({ channel: 'email', address: 'tester@test.co' })]),
        })
      );
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ addressAs: 'tester' }));
      expect(eventServiceMock.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'subscriber-created' }));
    });

    it('can update existing subscriber with userId', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          tenantId,
          roles: [ServiceUserRoles.SubscriptionAdmin],
        },
        query: {},
        body: { addressAs: 'new@test.com', userId: 'tester@test.com' },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const subscriber = new SubscriberEntity(repositoryMock, {
        id: 'subscriber',
        userId: 'tester@test.com',
        tenantId,
        addressAs: 'tester@test.com',
        channels: [],
      });
      repositoryMock.getSubscriber.mockResolvedValueOnce(subscriber);
      repositoryMock.saveSubscriber.mockResolvedValueOnce(subscriber);

      const handler = createSubscriber(apiId, repositoryMock, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.saveSubscriber).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'subscriber',
        })
      );
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          addressAs: 'new@test.com',
        })
      );
      expect(eventServiceMock.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'subscriber-updated' }));
    });

    it('can call next with unauthorized', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          tenantId,
          roles: [],
        },
        query: {},
        body: { addressAs: 'tester@test.com', userId: 'tester@test.com' },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = createSubscriber(apiId, repositoryMock, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(res.send).not.toHaveBeenCalled();
    });
  });

  describe('getSubscriber', () => {
    const subscriber = new SubscriberEntity(repositoryMock, {
      id: 'subscriber',
      tenantId,
      addressAs: 'tester',
      channels: [],
    });

    it('can create handler', () => {
      const handler = getSubscriber(repositoryMock);
      expect(handler).toBeTruthy();
    });

    it('can get subscriber', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          id: 'tester',
          tenantId,
          name: 'Tester',
          email: 'tester@test.co',
          roles: [ServiceUserRoles.SubscriptionAdmin],
        },
        query: {},
        params: { subscriber: 'subscriber' },
        notificationType: new NotificationTypeEntity(notificationType, tenantId),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      repositoryMock.getSubscriber.mockResolvedValueOnce(subscriber);

      const handler = getSubscriber(repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getSubscriber).toHaveBeenCalledWith(tenantId, 'subscriber');
      expect(req['subscriber']).toBe(subscriber);
    });

    it('can call next with not found.', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          id: 'tester',
          tenantId,
          name: 'Tester',
          email: 'tester@test.co',
          roles: [ServiceUserRoles.SubscriptionAdmin],
        },
        query: {},
        params: { subscriber: 'subscriber' },
        notificationType: new NotificationTypeEntity(notificationType, tenantId),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      repositoryMock.getSubscriber.mockResolvedValueOnce(null);

      const handler = getSubscriber(repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });

    it('can call next for unauthorized.', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          id: 'tester',
          tenantId,
          name: 'Tester',
          email: 'tester@test.co',
          roles: [],
        },
        query: {},
        params: { subscriber: 'subscriber' },
        notificationType: new NotificationTypeEntity(notificationType, tenantId),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      repositoryMock.getSubscriber.mockResolvedValueOnce(subscriber);

      const handler = getSubscriber(repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });

  describe('getSubscriberByUserId', () => {
    const subscriber = new SubscriberEntity(repositoryMock, {
      id: 'subscriber',
      tenantId,
      addressAs: 'tester',
      channels: [],
    });

    it('can create handler', () => {
      const handler = getSubscriberByUserId(repositoryMock);
      expect(handler).toBeTruthy();
    });

    it('can get subscriber', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          id: 'tester',
          tenantId,
          name: 'Tester',
          email: 'tester@test.co',
          roles: [ServiceUserRoles.SubscriptionAdmin],
        },
        query: {},
        params: {},
        notificationType: new NotificationTypeEntity(notificationType, tenantId),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      repositoryMock.getSubscriber.mockResolvedValueOnce(subscriber);

      const handler = getSubscriberByUserId(repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getSubscriber).toHaveBeenCalledWith(tenantId, 'tester', true);
      expect(req['subscriber']).toBe(subscriber);
    });

    it('can call next with not found.', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          id: 'tester',
          tenantId,
          name: 'Tester',
          email: 'tester@test.co',
          roles: [ServiceUserRoles.SubscriptionAdmin],
        },
        query: {},
        params: {},
        notificationType: new NotificationTypeEntity(notificationType, tenantId),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      repositoryMock.getSubscriber.mockResolvedValueOnce(null);

      const handler = getSubscriberByUserId(repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });

    it('can call next for unauthorized.', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          id: 'tester',
          tenantId,
          name: 'Tester',
          email: 'tester@test.co',
          roles: [],
        },
        query: {},
        params: {},
        notificationType: new NotificationTypeEntity(notificationType, tenantId),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      repositoryMock.getSubscriber.mockResolvedValueOnce(subscriber);

      const handler = getSubscriberByUserId(repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });

  describe('getSubscriberDetails', () => {
    it('can create handler', () => {
      const handler = getSubscriberDetails(apiId, repositoryMock);
      expect(handler).toBeTruthy();
    });

    it('can get subscriber subscriptions', async () => {
      const subscriber = new SubscriberEntity(repositoryMock, {
        id: 'subscriber',
        tenantId,
        addressAs: 'tester',
        channels: [],
      });

      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          id: 'tester',
          tenantId,
          name: 'Tester',
          email: 'tester@test.co',
          roles: [],
        },
        query: {
          includeSubscriptions: 'true',
        },
        subscriber,
        getConfiguration: jest.fn(),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      req.getConfiguration.mockResolvedValueOnce(
        new NotificationConfiguration({ test: notificationType }, {}, tenantId)
      );

      const subscription: Subscription = {
        tenantId,
        subscriberId: subscriber.id,
        typeId: 'test',
        criteria: {},
      };
      repositoryMock.getSubscriptions.mockResolvedValueOnce({
        results: [
          new SubscriptionEntity(
            repositoryMock,
            subscription,
            new NotificationTypeEntity(notificationType, tenantId),
            subscriber
          ),
        ],
      });

      const handler = getSubscriberDetails(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'subscriber',
          addressAs: 'tester',
          subscriptions: expect.arrayContaining([
            expect.objectContaining({ subscriberId: subscriber.id, typeId: 'test' }),
          ]),
        })
      );
      expect(res.send.mock.calls[0][0]).toMatchSnapshot();
    });

    it('can get subscriber without subscriptions', async () => {
      const subscriber = new SubscriberEntity(repositoryMock, {
        id: 'subscriber',
        tenantId,
        addressAs: 'tester',
        channels: [],
      });

      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          id: 'tester',
          tenantId,
          name: 'Tester',
          email: 'tester@test.co',
          roles: [],
        },
        query: {},
        subscriber,
        getConfiguration: jest.fn(),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = getSubscriberDetails(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'subscriber',
          addressAs: 'tester',
        })
      );
    });

    it('can get subscriber with no request tenant context', async () => {
      const subscriber = new SubscriberEntity(repositoryMock, {
        id: 'subscriber',
        tenantId,
        addressAs: 'tester',
        channels: [],
      });

      const req = {
        user: {
          isCore: true,
          id: 'tester',
          name: 'Tester',
          email: 'tester@test.co',
          roles: [],
        },
        query: {
          includeSubscriptions: 'true',
        },
        subscriber,
        getConfiguration: jest.fn(),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      req.getConfiguration.mockResolvedValueOnce(
        new NotificationConfiguration({ test: notificationType }, {}, tenantId)
      );

      const subscription: Subscription = {
        tenantId,
        subscriberId: subscriber.id,
        typeId: 'test',
        criteria: {},
      };
      repositoryMock.getSubscriptions.mockResolvedValueOnce({
        results: [
          new SubscriptionEntity(
            repositoryMock,
            subscription,
            new NotificationTypeEntity(notificationType, tenantId),
            subscriber
          ),
        ],
      });

      const handler = getSubscriberDetails(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(req.getConfiguration).toHaveBeenCalledWith(subscriber.tenantId);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'subscriber',
          addressAs: 'tester',
        })
      );
    });
  });

  describe('deleteSubscriber', () => {
    it('can create handler', () => {
      const handler = deleteSubscriber(eventServiceMock);
      expect(handler).toBeTruthy();
    });

    it('can delete subscriber', async () => {
      const subscriber = new SubscriberEntity(repositoryMock, {
        id: 'subscriber',
        tenantId,
        addressAs: 'tester',
        channels: [],
      });

      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          id: 'tester',
          tenantId,
          name: 'Tester',
          email: 'tester@test.co',
          roles: [ServiceUserRoles.SubscriptionAdmin],
        },
        query: {},
        subscriber,
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      repositoryMock.deleteSubscriber.mockResolvedValueOnce(true);

      const handler = deleteSubscriber(eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ deleted: true }));
      expect(res.send.mock.calls[0][0]).toMatchSnapshot();
      expect(eventServiceMock.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'subscriber-deleted' }));
    });

    it('can call next with unauthorized', async () => {
      const subscriber = new SubscriberEntity(repositoryMock, {
        id: 'subscriber',
        tenantId,
        addressAs: 'tester',
        channels: [],
      });

      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          id: 'tester',
          tenantId,
          name: 'Tester',
          email: 'tester@test.co',
          roles: [],
        },
        query: {},
        subscriber,
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = deleteSubscriber(eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(res.send).not.toHaveBeenCalled();
    });
  });

  describe('getSubscriptionChannels', () => {
    const subscriber = new SubscriberEntity(repositoryMock, {
      id: 'subscriber',
      tenantId,
      addressAs: 'tester',
      channels: [
        {
          channel: Channel.email,
          address: 'tester@test.co',
          verified: false,
        },
      ],
    });
    it('can create handler', () => {
      const handler = getSubscriptionChannels(repositoryMock);
      expect(handler).toBeTruthy();
    });

    it('can get channels', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        params: {
          subscriber: 'subscriber-id',
        },
        getConfiguration: jest.fn(),
        notificationType: new NotificationTypeEntity(
          {
            id: 'test',
            name: 'Test',
            description: null,
            publicSubscribe: false,
            subscriberRoles: [],
            channels: [Channel.email, Channel.sms],
            events: [
              {
                namespace: 'mock-namespace',
                name: 'mock-name',
                customized: true,
                templates: {
                  email: {
                    subject: 'mock-email-subject',
                    body: '<html></html>',
                  },
                },
              },
            ],
          },
          tenantId
        ),
      };
      const subscription = new SubscriptionEntity(
        repositoryMock,
        { tenantId, typeId: 'test', subscriberId: 'subscriber', criteria: {} },
        req.notificationType,
        subscriber
      );
      repositoryMock.getSubscription.mockResolvedValueOnce(subscription);
      const handler = getSubscriptionChannels(repositoryMock);
      const res = { json: jest.fn() };
      const next = jest.fn();
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([{ channel: 'email', address: 'tester@test.co', verified: false }])
      );
      expect(res.json.mock.calls[0][0]).toMatchSnapshot();
    });

    it('will can ge empty channels', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        params: {
          subscriber: 'subscriber-id',
        },
        getConfiguration: jest.fn(),
        notificationType: new NotificationTypeEntity(
          {
            id: 'test',
            name: 'Test',
            description: null,
            channels: [Channel.sms],
            publicSubscribe: false,
            subscriberRoles: [],
            events: [
              {
                namespace: 'mock-namespace',
                name: 'mock-name',
                customized: true,
                templates: {
                  email: {
                    subject: 'mock-email-subject',
                    body: '<html></html>',
                  },
                },
              },
            ],
          },
          tenantId
        ),
      };
      const subscription = new SubscriptionEntity(
        repositoryMock,
        { tenantId, typeId: 'test', subscriberId: 'subscriber', criteria: {} },

        req.notificationType,
        subscriber
      );
      repositoryMock.getSubscription.mockResolvedValueOnce(subscription);
      const handler = getSubscriptionChannels(repositoryMock);
      const res = { json: jest.fn() };
      const next = jest.fn();
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([]));
    });
  });

  describe('updateSubscriber', () => {
    it('can create handler', () => {
      const handler = updateSubscriber(apiId, eventServiceMock);
      expect(handler).toBeTruthy();
    });

    it('can update subscriber', async () => {
      const subscriber = new SubscriberEntity(repositoryMock, {
        id: 'subscriber',
        tenantId,
        addressAs: 'tester',
        channels: [],
      });

      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          id: 'tester',
          tenantId,
          name: 'Tester',
          email: 'tester@test.co',
          roles: [ServiceUserRoles.SubscriptionAdmin],
        },
        body: {
          addressAs: 'tester',
          channels: [],
          id: 'subscriber',
          urn: 'urn:ads:platform:notification-service:v1:/subscribers/subscriber',
          userId: undefined,
        },
        subscriber,
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      repositoryMock.saveSubscriber.mockResolvedValueOnce(subscriber);
      repositoryMock.findSubscribers.mockResolvedValueOnce({ results: [] });

      const handler = updateSubscriber(apiId, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining(req.body));
      expect(res.send.mock.calls[0][0]).toMatchSnapshot();
      expect(eventServiceMock.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'subscriber-updated' }));
    });

    it('can call next with unauthorized', async () => {
      const subscriber = new SubscriberEntity(repositoryMock, {
        id: 'subscriber',
        tenantId,
        addressAs: 'tester',
        channels: [],
      });

      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          id: 'tester',
          tenantId,
          name: 'Tester',
          email: 'tester@test.co',
          roles: [],
        },
        body: {
          addressAs: 'tester',
          channels: [{ channel: Channel.email, address: 'bob@gmail.com', verified: false }],
          id: 'subscriber',
          urn: 'urn:ads:platform:notification-service:v1:/subscribers/subscriber',
          userId: undefined,
        },
        subscriber,
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      repositoryMock.findSubscribers.mockResolvedValueOnce({ results: [] });

      const handler = updateSubscriber(apiId, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(res.send).not.toHaveBeenCalled();
    });
  });

  describe('subscriberOperations', () => {
    it('can create handler', () => {
      const handler = subscriberOperations(eventServiceMock, verifyServiceMock);
      expect(handler).toBeTruthy();
    });

    it('can send code', async () => {
      const subscriber = new SubscriberEntity(repositoryMock, {
        id: 'subscriber',
        tenantId,
        addressAs: 'tester',
        channels: [
          {
            channel: Channel.email,
            address: 'tester@test.co',
            verified: false,
          },
        ],
      });

      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          id: 'tester',
          tenantId,
          name: 'Tester',
          email: 'tester@test.co',
          roles: [ServiceUserRoles.CodeSender],
        },
        body: {
          operation: 'send-code',
          channel: Channel.email,
          address: 'tester@test.co',
        },
        subscriber,
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      repositoryMock.saveSubscriber.mockResolvedValueOnce(subscriber);
      verifyServiceMock.sendCode.mockResolvedValueOnce('key');

      const handler = subscriberOperations(eventServiceMock, verifyServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(verifyServiceMock.sendCode).toHaveBeenCalledWith(
        subscriber.channels[0],
        'Enter this code to verify your contact address.'
      );
      expect(subscriber.channels[0].verifyKey).toBe('key');
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ sent: true }));
      expect(res.send.mock.calls[0][0]).toMatchSnapshot();
    });

    it('can check code', async () => {
      const subscriber = new SubscriberEntity(repositoryMock, {
        id: 'subscriber',
        tenantId,
        addressAs: 'tester',
        channels: [
          {
            channel: Channel.email,
            address: 'tester@test.co',
            verified: false,
            verifyKey: 'key',
          },
        ],
      });

      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          id: 'tester',
          tenantId,
          name: 'Tester',
          email: 'tester@test.co',
          roles: [ServiceUserRoles.CodeSender],
        },
        body: {
          operation: 'check-code',
          channel: Channel.email,
          address: 'tester@test.co',
          code: '123',
        },
        subscriber,
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      verifyServiceMock.verifyCode.mockResolvedValueOnce(true);

      const handler = subscriberOperations(eventServiceMock, verifyServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(verifyServiceMock.verifyCode).toHaveBeenCalledWith(subscriber.channels[0], '123');
      expect(subscriber.channels[0].verified).toBe(false);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ verified: true }));
      expect(res.send.mock.calls[0][0]).toMatchSnapshot();
    });

    it('can verify channel', async () => {
      const subscriber = new SubscriberEntity(repositoryMock, {
        id: 'subscriber',
        tenantId,
        addressAs: 'tester',
        channels: [
          {
            channel: Channel.email,
            address: 'tester@test.co',
            verified: false,
            verifyKey: 'key',
          },
        ],
      });

      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          id: 'tester',
          tenantId,
          name: 'Tester',
          email: 'tester@test.co',
          roles: [ServiceUserRoles.SubscriptionAdmin],
        },
        body: {
          operation: 'verify-channel',
          channel: Channel.email,
          address: 'tester@test.co',
          code: '123',
        },
        subscriber,
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      verifyServiceMock.verifyCode.mockResolvedValueOnce(true);
      repositoryMock.saveSubscriber.mockResolvedValueOnce(subscriber);

      const handler = subscriberOperations(eventServiceMock, verifyServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(verifyServiceMock.verifyCode).toHaveBeenCalledWith(subscriber.channels[0], '123');
      expect(subscriber.channels[0].verified).toBe(true);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ verified: true }));
      expect(res.send.mock.calls[0][0]).toMatchSnapshot();
      expect(eventServiceMock.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'subscriber-updated' }));
    });

    it('can call next with invalid operation for unrecognized operation', async () => {
      const subscriber = new SubscriberEntity(repositoryMock, {
        id: 'subscriber',
        tenantId,
        addressAs: 'tester',
        channels: [
          {
            channel: Channel.email,
            address: 'tester@test.co',
            verified: false,
          },
        ],
      });

      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          id: 'tester',
          tenantId,
          name: 'Tester',
          email: 'tester@test.co',
          roles: [ServiceUserRoles.CodeSender],
        },
        body: {
          operation: 'no-op',
          channel: Channel.email,
          address: 'tester@test.co',
        },
        subscriber,
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = subscriberOperations(eventServiceMock, verifyServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });
  });

  describe('getSubscriberSubscriptions', () => {
    const subscriber = new SubscriberEntity(repositoryMock, {
      id: 'subscriber',
      tenantId,
      addressAs: 'tester',
      channels: [
        {
          channel: Channel.email,
          address: 'tester@test.co',
          verified: false,
        },
      ],
    });

    it('can create handler', () => {
      const handler = getSubscriberSubscriptions(apiId, repositoryMock);
      expect(handler).toBeTruthy();
    });

    it('can get subscriptions', async () => {
      const req = {
        user: {
          id: 'tester',
          tenantId,
          name: 'Tester',
          email: 'tester@test.co',
          roles: [ServiceUserRoles.SubscriptionAdmin],
        },
        tenant: {
          id: tenantId,
        },
        query: {},
        subscriber,
        getConfiguration: jest.fn(),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      req.getConfiguration.mockResolvedValueOnce(
        new NotificationConfiguration({ test: notificationType }, {}, tenantId)
      );

      const result = { results: [], page: {} };
      repositoryMock.getSubscriptions.mockResolvedValueOnce(result);

      const handler = getSubscriberSubscriptions(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ page: result.page }));
      expect(res.send.mock.calls[0][0]).toMatchSnapshot();
    });

    it('can handle query params', async () => {
      const req = {
        user: {
          id: 'tester',
          tenantId,
          name: 'Tester',
          email: 'tester@test.co',
          roles: [ServiceUserRoles.SubscriptionAdmin],
        },
        tenant: {
          id: tenantId,
        },
        query: { top: '11', after: '123' },
        subscriber,
        getConfiguration: jest.fn(),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const configuration = new NotificationConfiguration({ test: notificationType }, {}, tenantId);
      req.getConfiguration.mockResolvedValueOnce(configuration);

      const subscription = new SubscriptionEntity(
        repositoryMock,
        { tenantId, typeId: 'test', subscriberId: 'subscriber', criteria: {} },
        configuration.getNotificationType('test'),
        subscriber
      );

      const result = { results: [subscription], page: {} };
      repositoryMock.getSubscriptions.mockResolvedValueOnce(result);

      const handler = getSubscriberSubscriptions(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getSubscriptions).toHaveBeenCalledWith(
        configuration,
        req.tenant.id,
        11,
        '123',
        expect.objectContaining({ subscriberIdEquals: subscriber.id })
      );
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ page: result.page }));
    });

    it('can call next for unauthorized user', async () => {
      const req = {
        user: {
          id: 'tester',
          tenantId,
          name: 'Tester',
          email: 'tester@test.co',
          roles: [],
        },
        tenant: {
          id: tenantId,
        },
        query: {},
        subscriber,
        getConfiguration: jest.fn(),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = getSubscriberSubscriptions(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });
});
