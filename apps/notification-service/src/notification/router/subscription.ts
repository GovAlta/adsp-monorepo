import { Router } from 'express';
import { Logger } from 'winston';
import type { User } from '@abgov/adsp-service-sdk';
import { assertAuthenticatedHandler, NotFoundError, UnauthorizedError } from '@core-services/core-common';
import { SubscriptionRepository } from '../repository';
import { SubscriberEntity } from '../model';
import { mapSubscriber, mapSubscription, mapType } from './mappers';
import { NotificationConfiguration } from '../configuration';
import { Channel, ServiceUserRoles, Subscriber } from '../types';

interface SubscriptionRouterProps {
  logger: Logger;
  subscriptionRepository: SubscriptionRepository;
}

export const createSubscriptionRouter = ({ logger, subscriptionRepository }: SubscriptionRouterProps): Router => {
  const subscriptionRouter = Router();

  subscriptionRouter.get('/types', assertAuthenticatedHandler, async (req, res) => {
    const [configuration] = await req.getConfiguration<NotificationConfiguration, NotificationConfiguration>();
    const types = [...(configuration?.getNotificationTypes() || [])];

    res.send(types.map(mapType));
  });

  subscriptionRouter.get('/types/:type', assertAuthenticatedHandler, async (req, res, next) => {
    const { type } = req.params;

    const [configuration] = await req.getConfiguration<NotificationConfiguration>();
    const typeEntity = configuration?.getNotificationType(type);
    if (!typeEntity) {
      next(new NotFoundError('Notification Type', type));
      return;
    }

    res.send(mapType(typeEntity));
  });

  subscriptionRouter.get('/types/:type/subscriptions', assertAuthenticatedHandler, async (req, res, next) => {
    const { type } = req.params;
    const top = req.query.top ? parseInt(req.query.top as string, 10) : 10;
    const after = req.query.after as string;

    const [configuration] = await req.getConfiguration<NotificationConfiguration>();
    const typeEntity = configuration?.getNotificationType(type);
    if (!typeEntity) {
      next(new NotFoundError('Notification Type', type));
      return;
    }

    try {
      const result = await subscriptionRepository.getSubscriptions(typeEntity, top, after);

      res.send({
        results: result.results.map(mapSubscription),
        page: result.page,
      });
    } catch (err) {
      next(err);
    }
  });

  subscriptionRouter.post('/types/:type/subscriptions', assertAuthenticatedHandler, async (req, res, next) => {
    const user = req.user as User;
    const { type } = req.params;
    const forSelf = !!req.query.userSub;
    const subscriber: Subscriber = forSelf
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

    const [configuration] = await req.getConfiguration<NotificationConfiguration>();
    const typeEntity = configuration?.getNotificationType(type);
    if (!typeEntity) {
      next(new NotFoundError('Notification Type', type));
      return;
    }

    try {
      let subscriberEntity: SubscriberEntity = null;
      if (forSelf) {
        // Try to find an existing subscriber associated with the user ID.
        subscriberEntity = await subscriptionRepository.getSubscriber(user.tenantId, user.id, true);
      }

      if (!subscriberEntity) {
        subscriberEntity = await SubscriberEntity.create(user, subscriptionRepository, { ...subscriber });
      }

      const subscription = await typeEntity.subscribe(subscriptionRepository, user, subscriberEntity);
      res.send(mapSubscription(subscription));
    } catch (err) {
      next(err);
    }
  });

  subscriptionRouter.post(
    '/types/:type/subscriptions/:subscriber',
    assertAuthenticatedHandler,
    async (req, res, next) => {
      const user = req.user as User;
      const { type, subscriber } = req.params;

      const [configuration] = await req.getConfiguration<NotificationConfiguration>();
      const typeEntity = configuration?.getNotificationType(type);
      if (!typeEntity) {
        next(new NotFoundError('Notification Type', type));
        return;
      }

      try {
        const subscriberEntity = await subscriptionRepository.getSubscriber(req.user.tenantId, subscriber, false);
        if (!subscriberEntity) {
          next(new NotFoundError('Subscriber', subscriber));
          return;
        }

        const subscription = await typeEntity.subscribe(subscriptionRepository, user, subscriberEntity);
        res.send(mapSubscription(subscription));
      } catch (err) {
        next(err);
      }
    }
  );

  subscriptionRouter.get(
    '/types/:type/subscriptions/:subscriber',
    assertAuthenticatedHandler,
    async (req, res, next) => {
      const { type, subscriber } = req.params;

      const [configuration] = await req.getConfiguration<NotificationConfiguration>();
      const typeEntity = configuration?.getNotificationType(type);
      if (!typeEntity) {
        next(new NotFoundError('Notification Type', type));
        return;
      }

      try {
        const subscription = await subscriptionRepository.getSubscription(typeEntity, subscriber);
        res.send(mapSubscription(subscription));
      } catch (err) {
        next(err);
      }
    }
  );

  subscriptionRouter.delete(
    '/types/:type/subscriptions/:subscriber',
    assertAuthenticatedHandler,
    async (req, res, next) => {
      const user = req.user as User;
      const { type, subscriber } = req.params;

      const [configuration] = await req.getConfiguration<NotificationConfiguration>();
      const typeEntity = configuration?.getNotificationType(type);
      if (!typeEntity) {
        next(new NotFoundError('Notification Type', type));
        return;
      }

      try {
        const subscriberEntity = await subscriptionRepository.getSubscriber(user.tenantId, subscriber);
        const result = await typeEntity.unsubscribe(subscriptionRepository, user, subscriberEntity);
        res.send(result);
      } catch (err) {
        next(err);
      }
    }
  );

  subscriptionRouter.get('/subscribers', assertAuthenticatedHandler, (req, res, next) => {
    const top = req.query.top ? parseInt(req.query.top as string, 10) : 10;
    const after = req.query.after as string;

    if (!req.user?.roles?.includes(ServiceUserRoles.SubscriptionAdmin)) {
      next(new UnauthorizedError('User not authorized to get subscribers'));
    }

    subscriptionRepository
      .findSubscribers(top, after, { tenantIdEquals: req.user.tenantId })
      .then((result) =>
        res.send({
          results: result.results.map(mapSubscriber),
          page: result.page,
        })
      )
      .catch((err) => next(err));
  });

  subscriptionRouter.get('/subscribers/:subscriber', assertAuthenticatedHandler, (req, res, next) => {
    const user = req.user;
    const { subscriber } = req.params;

    subscriptionRepository
      .getSubscriber(user.tenantId, subscriber)
      .then((subscriberEntity) => res.send(mapSubscriber(subscriberEntity)))
      .catch((err) => next(err));
  });

  subscriptionRouter.delete('/subscribers/:subscriber', assertAuthenticatedHandler, (req, res, next) => {
    const user = req.user;
    const { subscriber } = req.params;

    subscriptionRepository
      .getSubscriber(user.tenantId, subscriber)
      .then((subscriberEntity) => subscriptionRepository.deleteSubscriber(subscriberEntity))
      .then((deleted) => res.send({ deleted }))
      .catch((err) => next(err));
  });

  return subscriptionRouter;
};
