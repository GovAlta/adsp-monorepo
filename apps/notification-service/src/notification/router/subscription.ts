import { RequestHandler, Router } from 'express';
import { Logger } from 'winston';
import { adspId, AdspId, User } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, NotFoundError, UnauthorizedError } from '@core-services/core-common';
import { SubscriptionRepository } from '../repository';
import { NotificationTypeEntity, SubscriberEntity } from '../model';
import { mapSubscriber, mapSubscription, mapType } from './mappers';
import { NotificationConfiguration } from '../configuration';
import { Channel, ServiceUserRoles, Subscriber } from '../types';
import {
  SubscriberOperationRequests,
  SUBSCRIBER_CHECK_CODE,
  SUBSCRIBER_SEND_VERIFY_CODE,
  SUBSCRIBER_VERIFY_CHANNEL,
} from './types';
import { VerifyService } from '../verify';

interface SubscriptionRouterProps {
  serviceId: AdspId;
  logger: Logger;
  subscriptionRepository: SubscriptionRepository;
  verifyService: VerifyService;
}

export const getNotificationTypes: RequestHandler = async (req, res, next) => {
  try {
    const [configuration, options] = await req.getConfiguration<NotificationConfiguration, NotificationConfiguration>();

    const types = [...(configuration?.getNotificationTypes() || []), ...(options?.getNotificationTypes() || [])];
    res.send(types.map(mapType));
  } catch (err) {
    next(err);
  }
};

const TYPE_KEY = 'notificationType';
export const getNotificationType: RequestHandler = async (req, _res, next) => {
  try {
    const { type } = req.params;

    const [configuration, options] = await req.getConfiguration<NotificationConfiguration, NotificationConfiguration>();
    const typeEntity = configuration?.getNotificationType(type) || options?.getNotificationType(type);
    if (!typeEntity) {
      throw new NotFoundError('Notification Type', type);
    }

    req[TYPE_KEY] = typeEntity;
    next();
  } catch (err) {
    next(err);
  }
};

export function getTypeSubscriptions(apiId: AdspId, repository: SubscriptionRepository): RequestHandler {
  return async (req, res, next) => {
    try {
      const type: NotificationTypeEntity = req[TYPE_KEY];
      const { top: topValue, after } = req.query;
      const top = topValue ? parseInt(topValue as string, 10) : 10;

      const result = await repository.getSubscriptions(type, top, after as string);
      res.send({
        results: result.results.map((r) => mapSubscription(apiId, r)),
        page: result.page,
      });
    } catch (err) {
      next(err);
    }
  };
}

export function createTypeSubscription(apiId: AdspId, repository: SubscriptionRepository): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user as User;
      const type: NotificationTypeEntity = req[TYPE_KEY];
      const subscriber: Subscriber =
        req.query.userSub === 'true'
          ? {
              tenantId: user.tenantId,
              userId: user.id,
              addressAs: user.name,
              channels: [
                {
                  channel: Channel.email,
                  address: user.email,
                },
              ],
            }
          : { ...req.body, tenantId: user.tenantId };
      let subscriberEntity: SubscriberEntity = null;
      if (subscriber.userId) {
        // Try to find an existing subscriber associated with the user ID.
        subscriberEntity = await repository.getSubscriber(user.tenantId, subscriber.userId, true);
      }

      if (!subscriberEntity) {
        subscriberEntity = await SubscriberEntity.create(user, repository, subscriber);
      }

      const subscription = await type.subscribe(repository, user, subscriberEntity);
      res.send(mapSubscription(apiId, subscription));
    } catch (err) {
      next(err);
    }
  };
}

export function addTypeSubscription(apiId: AdspId, repository: SubscriptionRepository): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user as User;
      const type: NotificationTypeEntity = req[TYPE_KEY];
      const { subscriber } = req.params;

      const subscriberEntity = await repository.getSubscriber(req.user.tenantId, subscriber, false);
      if (!subscriberEntity) {
        throw new NotFoundError('Subscriber', subscriber);
      }

      const subscription = await type.subscribe(repository, user, subscriberEntity);
      res.send(mapSubscription(apiId, subscription));
    } catch (err) {
      next(err);
    }
  };
}

export function getTypeSubscription(apiId: AdspId, repository: SubscriptionRepository): RequestHandler {
  return async (req, res, next) => {
    try {
      const type: NotificationTypeEntity = req[TYPE_KEY];
      const { subscriber } = req.params;

      const subscription = await repository.getSubscription(type, subscriber);
      res.send(mapSubscription(apiId, subscription));
    } catch (err) {
      next(err);
    }
  };
}

export function deleteTypeSubscription(repository: SubscriptionRepository): RequestHandler {
  return async (req, res, next) => {
    try {
      const type: NotificationTypeEntity = req[TYPE_KEY];
      const user = req.user as User;
      const { subscriber } = req.params;

      const subscriberEntity = await repository.getSubscriber(user.tenantId, subscriber);
      const result = await type.unsubscribe(repository, user, subscriberEntity);
      res.send({ deleted: result });
    } catch (err) {
      next(err);
    }
  };
}

export function getSubscribers(apiId: AdspId, repository: SubscriptionRepository): RequestHandler {
  return async (req, res, next) => {
    try {
      const { top: topValue, after } = req.query;
      const top = topValue ? parseInt(topValue as string, 10) : 10;

      if (!req.user?.roles?.includes(ServiceUserRoles.SubscriptionAdmin)) {
        throw new UnauthorizedError('User not authorized to get subscribers');
      }

      const result = await repository.findSubscribers(top, after as string, { tenantIdEquals: req.user.tenantId });
      res.send({
        results: result.results.map((r) => mapSubscriber(apiId, r)),
        page: result.page,
      });
    } catch (err) {
      next(err);
    }
  };
}

export function createSubscriber(apiId: AdspId, repository: SubscriptionRepository): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user as User;
      const subscriber: Subscriber =
        req.query.userSub === 'true'
          ? {
              tenantId: user.tenantId,
              userId: user.id,
              addressAs: user.name,
              channels: [
                {
                  channel: Channel.email,
                  address: user.email,
                },
              ],
            }
          : { ...req.body, tenantId: user.tenantId };

      const subscriberEntity = await SubscriberEntity.create(user, repository, subscriber);
      res.send(mapSubscriber(apiId, subscriberEntity));
    } catch (err) {
      next(err);
    }
  };
}

const SUBSCRIBER_KEY = 'subscriber';
export function getSubscriber(repository: SubscriptionRepository): RequestHandler {
  return async (req, _res, next) => {
    try {
      const user = req.user;
      const { subscriber } = req.params;

      const entity = await repository.getSubscriber(user.tenantId, subscriber);
      if (!entity) {
        throw new NotFoundError('Subscriber', subscriber);
      }

      req[SUBSCRIBER_KEY] = entity;
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function updateSubscriber(apiId: AdspId): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const update = req.body;
      const subscriber: SubscriberEntity = req[SUBSCRIBER_KEY];

      const updated = await subscriber.update(user, update);
      res.send(mapSubscriber(apiId, updated));
    } catch (err) {
      next(err);
    }
  };
}

export function subscriberOperations(verifyService: VerifyService): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const request: SubscriberOperationRequests = req.body;
      const subscriber: SubscriberEntity = req[SUBSCRIBER_KEY];

      let result = null;
      switch (request.operation) {
        case SUBSCRIBER_SEND_VERIFY_CODE:
          await subscriber.sendVerifyCode(verifyService, user, request.channel, request.address);
          result = { sent: true };
          break;
        case SUBSCRIBER_CHECK_CODE: {
          const verified = await subscriber.checkVerifyCode(
            verifyService,
            user,
            request.channel,
            request.address,
            request.code
          );
          result = { verified };
          break;
        }
        case SUBSCRIBER_VERIFY_CHANNEL: {
          const verified = await subscriber.checkVerifyCode(
            verifyService,
            user,
            request.channel,
            request.address,
            request.code,
            true
          );
          result = { verified };
          break;
        }
        default:
          throw new InvalidOperationError('Requested subscriber operation not recognized.');
      }

      res.send(result);
    } catch (err) {
      next(err);
    }
  };
}

export const deleteSubscriber: RequestHandler = async (req, res, next) => {
  try {
    const user = req.user;
    const subscriber: SubscriberEntity = req[SUBSCRIBER_KEY];

    const deleted = await subscriber.delete(user);
    res.send({ deleted });
  } catch (err) {
    next(err);
  }
};

export const createSubscriptionRouter = ({
  serviceId,
  subscriptionRepository,
  verifyService,
}: SubscriptionRouterProps): Router => {
  const apiId = adspId`${serviceId}:v1`;
  const subscriptionRouter = Router();

  subscriptionRouter.get('/types', getNotificationTypes);
  subscriptionRouter.get('/types/:type', getNotificationType, async (req, res) => res.send(mapType(req[TYPE_KEY])));

  subscriptionRouter.get(
    '/types/:type/subscriptions',
    getNotificationType,
    getTypeSubscriptions(apiId, subscriptionRepository)
  );
  subscriptionRouter.post(
    '/types/:type/subscriptions',
    getNotificationType,
    createTypeSubscription(apiId, subscriptionRepository)
  );

  subscriptionRouter.post(
    '/types/:type/subscriptions/:subscriber',
    getNotificationType,
    addTypeSubscription(apiId, subscriptionRepository)
  );

  subscriptionRouter.get(
    '/types/:type/subscriptions/:subscriber',
    getNotificationType,
    getTypeSubscription(apiId, subscriptionRepository)
  );

  subscriptionRouter.delete(
    '/types/:type/subscriptions/:subscriber',
    getNotificationType,
    deleteTypeSubscription(subscriptionRepository)
  );

  subscriptionRouter.get('/subscribers', getSubscribers(apiId, subscriptionRepository));
  subscriptionRouter.post('/subscribers', createSubscriber(apiId, subscriptionRepository));

  subscriptionRouter.get('/subscribers/:subscriber', getSubscriber(subscriptionRepository), (req, res) =>
    res.send(mapSubscriber(apiId, req[SUBSCRIBER_KEY]))
  );
  subscriptionRouter.patch('/subscribers/:subscriber', getSubscriber(subscriptionRepository), updateSubscriber(apiId));
  subscriptionRouter.post(
    '/subscribers/:subscriber',
    getSubscriber(subscriptionRepository),
    subscriberOperations(verifyService)
  );
  subscriptionRouter.delete('/subscribers/:subscriber', getSubscriber(subscriptionRepository), deleteSubscriber);

  return subscriptionRouter;
};
