import { adspId, Channel, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, NotFoundError, UnauthorizedError } from '@core-services/core-common';
import { Request, Response } from 'express';
import { Logger } from 'winston';
import { NotificationTypeEntity, SubscriberEntity, SubscriptionEntity } from '../model';
import { NotificationConfiguration } from '../configuration';
import {
  createTypeSubscription,
  getTypeSubscriptions,
  addTypeSubscription,
  createSubscriptionRouter,
  deleteTypeSubscription,
  getNotificationType,
  getNotificationTypes,
  getSubscriber,
  getSubscribers,
  getTypeSubscription,
  subscriberOperations,
  getSubscriberSubscriptions,
} from './subscription';
import { NotificationType, ServiceUserRoles } from '../types';
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
    getSubscriberByEmail: jest.fn(),
    getSubscriptions: jest.fn(),
    getSubscription: jest.fn(),
    findSubscribers: jest.fn(),
    deleteSubscriber: jest.fn(),
    saveSubscription: jest.fn(),
    deleteSubscriptions: jest.fn(),
    saveSubscriber: jest.fn((entity) => Promise.resolve(entity)),
  };

  const notificationType: NotificationType = {
    id: 'test',
    name: 'Test',
    description: 'testing 1 2 3',
    events: [],
    publicSubscribe: false,
    subscriberRoles: ['test-subscriber'],
  };

  const verifyServiceMock = {
    sendCode: jest.fn(),
    verifyCode: jest.fn(),
  };

  beforeEach(() => {
    repositoryMock.findSubscribers.mockReset();
    repositoryMock.getSubscriber.mockReset();
    repositoryMock.getSubscriberByEmail.mockReset();
    repositoryMock.getSubscriptions.mockReset();
    repositoryMock.saveSubscriber.mockClear();
    repositoryMock.saveSubscription.mockReset();
    repositoryMock.deleteSubscriptions.mockReset();
    repositoryMock.deleteSubscriber.mockReset();
    verifyServiceMock.sendCode.mockReset();
    verifyServiceMock.verifyCode.mockReset();
  });

  describe('createSubscriptionRouter', () => {
    it('can create router', () => {
      const router = createSubscriptionRouter({
        serviceId,
        logger: loggerMock,
        subscriptionRepository: repositoryMock,
        verifyService: verifyServiceMock,
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

      req.getConfiguration.mockResolvedValueOnce([new NotificationConfiguration({ test: notificationType }, tenantId)]);
      await getNotificationTypes(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining(notificationType)]));
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

      req.getConfiguration.mockResolvedValueOnce([new NotificationConfiguration({ test: notificationType }, tenantId)]);
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

      req.getConfiguration.mockResolvedValueOnce([new NotificationConfiguration({ test: notificationType }, tenantId)]);
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
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const result = { results: [], page: {} };
      repositoryMock.getSubscriptions.mockResolvedValueOnce(result);

      const handler = getTypeSubscriptions(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ page: result.page }));
    });

    it('can get handle query params', async () => {
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
        query: { topValue: '11', after: '123' },
        notificationType: new NotificationTypeEntity(notificationType, tenantId),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const result = { results: [], page: {} };
      repositoryMock.getSubscriptions.mockResolvedValueOnce(result);

      const handler = getTypeSubscriptions(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getSubscriptions).toHaveBeenCalledWith(
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
      const handler = createTypeSubscription(apiId, repositoryMock);
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
        subscriber
      );
      repositoryMock.saveSubscriber.mockResolvedValueOnce(subscriber);
      repositoryMock.saveSubscription.mockResolvedValueOnce(subscription);

      const handler = createTypeSubscription(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.saveSubscriber).toHaveBeenCalledWith(expect.objectContaining({ addressAs: 'tester' }));
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ typeId: 'test' }));
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
        subscriber
      );
      repositoryMock.saveSubscriber.mockResolvedValueOnce(subscriber);
      repositoryMock.saveSubscription.mockResolvedValueOnce(subscription);

      const handler = createTypeSubscription(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.saveSubscriber).toHaveBeenCalledWith(
        expect.objectContaining({
          addressAs: 'Tester',
          userId: 'tester',
          channels: expect.arrayContaining([expect.objectContaining({ channel: 'email', address: 'tester@test.co' })]),
        })
      );
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ typeId: 'test' }));
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
        subscriber
      );
      repositoryMock.getSubscriber.mockResolvedValueOnce(subscriber);
      repositoryMock.saveSubscription.mockResolvedValueOnce(subscription);

      const handler = createTypeSubscription(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getSubscriber).toHaveBeenCalledWith(tenantId, 'tester', true);
      expect(repositoryMock.saveSubscriber).not.toBeCalled();
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ typeId: 'test' }));
    });
  });

  describe('addTypeSubscription', () => {
    it('can create handler', () => {
      const handler = addTypeSubscription(apiId, repositoryMock);
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
        subscriber
      );
      repositoryMock.getSubscriber.mockResolvedValueOnce(subscriber);
      repositoryMock.saveSubscription.mockResolvedValueOnce(subscription);

      const handler = addTypeSubscription(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getSubscriber).toHaveBeenCalledWith(tenantId, 'subscriber', false);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ typeId: 'test' }));
    });

    it('can call with error 400', async () => {
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

      const mockResponse = () => {
        const res = { send: jest.fn(), status: {}, json: {} };
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        return res;
      };

      const res = mockResponse();
      const next = jest.fn();

      repositoryMock.getSubscriber.mockResolvedValueOnce(null);

      const handler = addTypeSubscription(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.status).toHaveBeenCalledWith(400);
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
        subscriber
      );

      repositoryMock.getSubscription.mockResolvedValueOnce(subscription);

      const handler = getTypeSubscription(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getSubscription).toHaveBeenCalledWith(req.notificationType, 'subscriber');
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ typeId: 'test', subscriber: expect.objectContaining({ id: 'subscriber' }) })
      );
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
      const handler = deleteTypeSubscription(repositoryMock);
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

      const handler = deleteTypeSubscription(repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.deleteSubscriptions).toHaveBeenCalledWith(tenantId, notificationType.id, 'subscriber');
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ deleted: true }));
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
      const handler = createSubscriber(apiId, repositoryMock);
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
        body: { addressAs: 'tester@test.com', email: 'tester@test.com' },
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

      const handler = createSubscriber(apiId, repositoryMock);
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

      const handler = createSubscriber(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.saveSubscriber).toHaveBeenCalledWith(
        expect.objectContaining({
          addressAs: 'Tester',
          userId: 'tester',
          channels: expect.arrayContaining([expect.objectContaining({ channel: 'email', address: 'tester@test.co' })]),
        })
      );
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ addressAs: 'tester' }));
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

  describe('deleteSubscriber', () => {
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

      await deleteSubscriber(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ deleted: true }));
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

      await deleteSubscriber(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(res.send).not.toHaveBeenCalled();
    });
  });

  describe('updateSubscriber', () => {
    it('can create handler', () => {
      const handler = updateSubscriber(apiId, repositoryMock);
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

      const handler = updateSubscriber(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining(req.body));
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
        body: {},
        subscriber,
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = updateSubscriber(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(res.send).not.toHaveBeenCalled();
    });
  });

  describe('subscriberOperations', () => {
    it('can create handler', () => {
      const handler = subscriberOperations(verifyServiceMock);
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

      const handler = subscriberOperations(verifyServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(verifyServiceMock.sendCode).toHaveBeenCalledWith(
        subscriber.channels[0],
        'Enter this code to verify your contact address.'
      );
      expect(subscriber.channels[0].verifyKey).toBe('key');
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ sent: true }));
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

      const handler = subscriberOperations(verifyServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(verifyServiceMock.verifyCode).toHaveBeenCalledWith(subscriber.channels[0], '123');
      expect(subscriber.channels[0].verified).toBe(false);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ verified: true }));
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

      const handler = subscriberOperations(verifyServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(verifyServiceMock.verifyCode).toHaveBeenCalledWith(subscriber.channels[0], '123');
      expect(subscriber.channels[0].verified).toBe(true);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ verified: true }));
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

      const handler = subscriberOperations(verifyServiceMock);
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

      req.getConfiguration.mockResolvedValueOnce([new NotificationConfiguration({ test: notificationType }, tenantId)]);

      const result = { results: [], page: {} };
      repositoryMock.getSubscriptions.mockResolvedValueOnce(result);

      const handler = getSubscriberSubscriptions(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ page: result.page }));
    });

    it('can get handle query params', async () => {
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

      req.getConfiguration.mockResolvedValueOnce([new NotificationConfiguration({ test: notificationType }, tenantId)]);

      const subscription = new SubscriptionEntity(
        repositoryMock,
        { tenantId, typeId: 'test', subscriberId: 'subscriber', criteria: {} },
        subscriber
      );

      const result = { results: [subscription], page: {} };
      repositoryMock.getSubscriptions.mockResolvedValueOnce(result);

      const handler = getSubscriberSubscriptions(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getSubscriptions).toHaveBeenCalledWith(
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
