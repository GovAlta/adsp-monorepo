import { RequestHandler, Router } from 'express';
import { Logger } from 'winston';
import type { User } from '@abgov/adsp-service-sdk';
import { NotFoundError, UnauthorizedError } from '@core-services/core-common';
import { SubscriptionRepository } from '../repository';
import { NotificationTypeEntity, SubscriberEntity } from '../model';
import { mapSubscriber, mapSubscription, mapType } from './mappers';
import { NotificationConfiguration } from '../configuration';
import { Channel, ServiceUserRoles, Subscriber } from '../types';

interface SubscriptionRouterProps {
  logger: Logger;
  subscriptionRepository: SubscriptionRepository;
}

export const getNotificationTypes: RequestHandler = async (req, res, next) => {
  try {
    const [configuration] = await req.getConfiguration<NotificationConfiguration, NotificationConfiguration>();

    const types = configuration?.getNotificationTypes() || [];
    res.send(types.map(mapType));
  } catch (err) {
    next(err);
  }
};

const TYPE_KEY = 'notificationType';
export const getNotificationType: RequestHandler = async (req, _res, next) => {
  try {
    const { type } = req.params;

    const [configuration] = await req.getConfiguration<NotificationConfiguration>();
    const typeEntity = configuration?.getNotificationType(type);
    if (!typeEntity) {
      throw new NotFoundError('Notification Type', type);
    }

    req[TYPE_KEY] = typeEntity;
    next();
  } catch (err) {
    next(err);
  }
};

export function getTypeSubscriptions(repository: SubscriptionRepository): RequestHandler {
  return async (req, res, next) => {
    try {
      const type: NotificationTypeEntity = req[TYPE_KEY];
      const { top: topValue, after } = req.query;
      const top = topValue ? parseInt(topValue as string, 10) : 10;

      const result = await repository.getSubscriptions(type, top, after as string);
      res.send({
        results: result.results.map(mapSubscription),
        page: result.page,
      });
    } catch (err) {
      next(err);
    }
  };
}

export function createTypeSubscription(repository: SubscriptionRepository): RequestHandler {
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
          : { tenantId: user.tenantId, ...req.body };
      let subscriberEntity: SubscriberEntity = null;
      if (subscriber.userId) {
        // Try to find an existing subscriber associated with the user ID.
        subscriberEntity = await repository.getSubscriber(user.tenantId, subscriber.userId, true);
      }

      if (!subscriberEntity) {
        subscriberEntity = await SubscriberEntity.create(user, repository, { ...subscriber });
      }

      const subscription = await type.subscribe(repository, user, subscriberEntity);
      res.send(mapSubscription(subscription));
    } catch (err) {
      next(err);
    }
  };
}

export function addTypeSubscription(repository: SubscriptionRepository): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user as User;
      const type: NotificationTypeEntity = req[TYPE_KEY];
      const { subscriber } = req.params;

      const subscriberEntity = await repository.getSubscriber(req.user.tenantId, subscriber, false);
      if (!subscriberEntity) {
        next(new NotFoundError('Subscriber', subscriber));
        return;
      }

      const subscription = await type.subscribe(repository, user, subscriberEntity);
      res.send(mapSubscription(subscription));
    } catch (err) {
      next(err);
    }
  };
}

export function getTypeSubscription(repository: SubscriptionRepository): RequestHandler {
  return async (req, res, next) => {
    try {
      const type: NotificationTypeEntity = req[TYPE_KEY];
      const { subscriber } = req.params;

      const subscription = await repository.getSubscription(type, subscriber);
      res.send(mapSubscription(subscription));
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

export function getSubscribers(repository: SubscriptionRepository): RequestHandler {
  return async (req, res, next) => {
    try {
      const { top: topValue, after } = req.query;
      const top = topValue ? parseInt(topValue as string, 10) : 10;

      if (!req.user?.roles?.includes(ServiceUserRoles.SubscriptionAdmin)) {
        throw new UnauthorizedError('User not authorized to get subscribers');
      }

      const result = await repository.findSubscribers(top, after as string, { tenantIdEquals: req.user.tenantId });
      res.send({
        results: result.results.map(mapSubscriber),
        page: result.page,
      });
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

export const updateSubscriber: RequestHandler = async (req, res, next) => {
  try {
    const user = req.user;
    const update = req.body;
    const subscriber: SubscriberEntity = req[SUBSCRIBER_KEY];

    const updated = await subscriber.update(user, update);
    res.send(mapSubscriber(updated));
  } catch (err) {
    next(err);
  }
};

export const createSubscriptionRouter = ({ subscriptionRepository }: SubscriptionRouterProps): Router => {
  const subscriptionRouter = Router();

  subscriptionRouter.get('/types', getNotificationTypes);
  subscriptionRouter.get('/types/:type', getNotificationType, async (req, res) => res.send(mapType(req[TYPE_KEY])));

  subscriptionRouter.get(
    '/types/:type/subscriptions',
    getNotificationType,
    getTypeSubscriptions(subscriptionRepository)
  );
  subscriptionRouter.post(
    '/types/:type/subscriptions',
    getNotificationType,
    createTypeSubscription(subscriptionRepository)
  );

  subscriptionRouter.post(
    '/types/:type/subscriptions/:subscriber',
    getNotificationType,
    addTypeSubscription(subscriptionRepository)
  );

  subscriptionRouter.get(
    '/types/:type/subscriptions/:subscriber',
    getNotificationType,
    getTypeSubscription(subscriptionRepository)
  );

  subscriptionRouter.delete(
    '/types/:type/subscriptions/:subscriber',
    getNotificationType,
    deleteTypeSubscription(subscriptionRepository)
  );

  subscriptionRouter.get('/subscribers', getSubscribers(subscriptionRepository));

  subscriptionRouter.get('/subscribers/:subscriber', getSubscriber(subscriptionRepository), (req, res) =>
    res.send(mapSubscriber(req[SUBSCRIBER_KEY]))
  );
  subscriptionRouter.patch('/subscribers/:subscriber', getSubscriber(subscriptionRepository), updateSubscriber);
  subscriptionRouter.delete('/subscribers/:subscriber', getSubscriber(subscriptionRepository), deleteSubscriber);

  return subscriptionRouter;
};
