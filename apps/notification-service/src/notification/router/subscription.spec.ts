import { adspId } from '@abgov/adsp-service-sdk';
import { NotFoundError, UnauthorizedError } from '@core-services/core-common';
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
} from './subscription';
import { NotificationType, ServiceUserRoles } from '../types';
import { deleteSubscriber, updateSubscriber } from '.';

describe('subscription router', () => {
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

  const notificationType: NotificationType = {
    id: 'test',
    name: 'Test',
    description: 'testing 1 2 3',
    events: [],
    subscriberRoles: ['test-subscriber'],
  };

  beforeEach(() => {
    repositoryMock.findSubscribers.mockReset();
    repositoryMock.getSubscriber.mockReset();
    repositoryMock.getSubscriptions.mockReset();
    repositoryMock.saveSubscriber.mockClear();
    repositoryMock.saveSubscription.mockReset();
    repositoryMock.deleteSubscriptions.mockReset();
    repositoryMock.deleteSubscriber.mockReset();
  });

  describe('createSubscriptionRouter', () => {
    it('can create router', () => {
      const router = createSubscriptionRouter({ logger: loggerMock, subscriptionRepository: repositoryMock });
      expect(router).toBeTruthy();
    });
  });

  describe('getNotificationTypes', () => {
    it('can get types', async () => {
      const req = {
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
      const handler = getTypeSubscriptions(repositoryMock);
      expect(handler).toBeTruthy();
    });

    it('can get subscriptions', async () => {
      const req = {
        query: {},
        notificationType: new NotificationTypeEntity(notificationType, tenantId),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const result = { results: [], page: {} };
      repositoryMock.getSubscriptions.mockResolvedValueOnce(result);

      const handler = getTypeSubscriptions(repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ page: result.page }));
    });

    it('can get handle query params', async () => {
      const req = {
        query: { top: '11', after: '123' },
        notificationType: new NotificationTypeEntity(notificationType, tenantId),
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const result = { results: [], page: {} };
      repositoryMock.getSubscriptions.mockResolvedValueOnce(result);

      const handler = getTypeSubscriptions(repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getSubscriptions).toHaveBeenCalledWith(req.notificationType, 11, '123');
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ page: result.page }));
    });
  });

  describe('createTypeSubscription', () => {
    it('can create handler', () => {
      const handler = createTypeSubscription(repositoryMock);
      expect(handler).toBeTruthy();
    });

    it('can create subscription', async () => {
      const req = {
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

      const handler = createTypeSubscription(repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.saveSubscriber).toHaveBeenCalledWith(expect.objectContaining({ addressAs: 'tester' }));
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ typeId: 'test' }));
    });

    it('can create user subscription', async () => {
      const req = {
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

      const handler = createTypeSubscription(repositoryMock);
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

      const handler = createTypeSubscription(repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getSubscriber).toHaveBeenCalledWith(tenantId, 'tester', true);
      expect(repositoryMock.saveSubscriber).not.toBeCalled();
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ typeId: 'test' }));
    });
  });

  describe('addTypeSubscription', () => {
    it('can create handler', () => {
      const handler = addTypeSubscription(repositoryMock);
      expect(handler).toBeTruthy();
    });

    it('can add subscription', async () => {
      const req = {
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

      const handler = addTypeSubscription(repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getSubscriber).toHaveBeenCalledWith(tenantId, 'subscriber', false);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ typeId: 'test' }));
    });

    it('can call next with not found', async () => {
      const req = {
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

      const handler = addTypeSubscription(repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toBeCalledWith(expect.any(NotFoundError));
    });
  });

  describe('getTypeSubscription', () => {
    it('can create handler', () => {
      const handler = getTypeSubscription(repositoryMock);
      expect(handler).toBeTruthy();
    });

    it('can get subscription', async () => {
      const req = {
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

      const handler = getTypeSubscription(repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getSubscription).toHaveBeenCalledWith(req.notificationType, 'subscriber');
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ typeId: 'test', subscriber: expect.objectContaining({ id: 'subscriber' }) })
      );
    });
  });

  describe('deleteTypeSubscription', () => {
    it('can create handler', () => {
      const handler = deleteTypeSubscription(repositoryMock);
      expect(handler).toBeTruthy();
    });

    it('can delete subscription', async () => {
      const req = {
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
      const handler = getSubscribers(repositoryMock);
      expect(handler).toBeTruthy();
    });

    it('can get subscribers', async () => {
      const req = {
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

      const handler = getSubscribers(repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ page: result.page }));
    });

    it('can get subscribers with query params', async () => {
      const req = {
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

      const handler = getSubscribers(repositoryMock);
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

      const handler = getSubscribers(repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
  });

  describe('getSubscriber', () => {
    it('can create handler', () => {
      const handler = getSubscriber(repositoryMock);
      expect(handler).toBeTruthy();
    });

    it('can get subscriber', async () => {
      const req = {
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

      const handler = getSubscriber(repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getSubscriber).toHaveBeenCalledWith(tenantId, 'subscriber');
      expect(req['subscriber']).toBe(subscriber);
    });

    it('can call next with not found.', async () => {
      const req = {
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
    it('can delete subscriber', async () => {
      const subscriber = new SubscriberEntity(repositoryMock, {
        id: 'subscriber',
        tenantId,
        addressAs: 'tester',
        channels: [],
      });

      const req = {
        user: {
          id: 'tester',
          tenantId,
          name: 'Tester',
          email: 'tester@test.co',
          roles: [ServiceUserRoles.SubscriptionAdmin],
        },
        body: { addressAs: 'Best Tester' },
        subscriber,
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      repositoryMock.saveSubscriber.mockResolvedValueOnce(subscriber);

      await updateSubscriber(req as unknown as Request, res as unknown as Response, next);
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

      await updateSubscriber(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(res.send).not.toHaveBeenCalled();
    });
  });
});
