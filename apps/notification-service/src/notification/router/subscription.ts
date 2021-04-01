import { Router } from 'express';
import { Logger } from 'winston';
import { assertAuthenticatedHandler, User } from '@core-services/core-common';
import { NotificationSpaceRepository, NotificationTypeRepository, SubscriptionRepository } from '../repository';
import { SubscriberEntity } from '../model';
import { mapSubscriber, mapSubscription } from './mappers';

interface SubscriptionRouterProps {
  logger: Logger;
  spaceRepository: NotificationSpaceRepository;
  typeRepository: NotificationTypeRepository;
  subscriptionRepository: SubscriptionRepository;
}

export const createSubscriptionRouter = ({
  logger,
  spaceRepository,
  typeRepository,
  subscriptionRepository,
}: SubscriptionRouterProps) => {
  const subscriptionRouter = Router();

  /**
   * @swagger
   *
   * /subscription/v1/{space}/{type}/subscriptions:
   *   get:
   *     tags:
   *     - Subscription
   *     description: Retrieves subscriptions for a notification type.
   *     parameters:
   *     - name: space
   *       description: Notification space of the type.
   *       in: path
   *       required: true
   *       schema:
   *         type: string
   *     - name: type
   *       description: Notification type to get subscriptions for.
   *       in: path
   *       required: true
   *       schema:
   *         type: string
   *     responses:
   *       200:
   *         description: Subscriptions successfully retrieved.
   */
  subscriptionRouter.get('/:space/:type/subscriptions', assertAuthenticatedHandler, (req, res, next) => {
    const { space, type } = req.params;
    const top = req.query.top ? parseInt(req.query.top as string, 10) : 10;
    const after = req.query.after as string;

    spaceRepository
      .get(space)
      .then((spaceEntity) => typeRepository.get(spaceEntity, type))
      .then((typeEntity) => subscriptionRepository.getSubscriptions(typeEntity, top, after))
      .then((result) =>
        res.send({
          results: result.results.map(mapSubscription),
          page: result.page,
        })
      )
      .catch((err) => next(err));
  });

  /**
   * @swagger
   *
   * /subscription/v1/{space}/{type}/subscriptions:
   *   post:
   *     tags:
   *     - Subscription
   *     description: Creates a subscription for a notification type.
   *     parameters:
   *     - name: space
   *       description: Notification space of the type.
   *       in: path
   *       required: true
   *       schema:
   *         type: string
   *     - name: type
   *       description: Notification type to get subscriptions for.
   *       in: path
   *       required: true
   *       schema:
   *         type: string
   *     responses:
   *       200:
   *         description: Subscriptions successfully retrieved.
   */
  subscriptionRouter.post('/:space/:type/subscriptions', assertAuthenticatedHandler, (req, res, next) => {
    const user = req.user as User;
    const { space, type } = req.params;
    const subscriberId = req.body.subscriberId as string;
    const subscriber = req.body;

    Promise.all([
      spaceRepository.get(space).then((spaceEntity) => typeRepository.get(spaceEntity, type)),
      subscriberId
        ? subscriptionRepository.getSubscriber(subscriberId)
        : SubscriberEntity.create(subscriptionRepository, { ...subscriber, spaceId: space }),
    ])
      .then(([typeEntity, subscriberEntity]) => typeEntity.subscribe(subscriptionRepository, user, subscriberEntity))
      .then((subEntity) => res.send(mapSubscription(subEntity)))
      .catch((err) => next(err));
  });

  /**
   * @swagger
   *
   * /subscription/v1/{space}/{type}/subscriptions/{subscriber}:
   *   get:
   *     tags:
   *     - Subscription
   *     description: Creates a subscription for a notification type.
   *     parameters:
   *     - name: space
   *       description: Notification space of the type.
   *       in: path
   *       required: true
   *       schema:
   *         type: string
   *     - name: type
   *       description: Notification type to get subscription for.
   *       in: path
   *       required: true
   *       schema:
   *         type: string
   *     - name: subscriber
   *       description: Subscriber to get subscription for.
   *       in: path
   *       required: true
   *       schema:
   *         type: string
   *     responses:
   *       200:
   *         description: Subscriptions successfully retrieved.
   */
  subscriptionRouter.get('/:space/:type/subscriptions/:subscriber', assertAuthenticatedHandler, (req, res, next) => {
    const { space, type, subscriber } = req.params;

    spaceRepository
      .get(space)
      .then((spaceEntity) => typeRepository.get(spaceEntity, type))
      .then((typeEntity) => subscriptionRepository.getSubscription(typeEntity, subscriber))
      .then((entity) => res.send(mapSubscription(entity)))
      .catch((err) => next(err));
  });

  /**
   * @swagger
   *
   * /subscription/v1/{space}/{type}/subscriptions/{subscriber}:
   *   delete:
   *     tags:
   *     - Subscription
   *     description: Removes a subscription from a notification type.
   *     parameters:
   *     - name: space
   *       description: Notification space of the type.
   *       in: path
   *       required: true
   *       schema:
   *         type: string
   *     - name: type
   *       description: Notification type to of the subscription.
   *       in: path
   *       required: true
   *       schema:
   *         type: string
   *     - name: subscriber
   *       description: Subscriber to remove the subscription for.
   *       in: path
   *       required: true
   *       schema:
   *         type: string
   *     responses:
   *       200:
   *         description: Subscriptions successfully removed.
   */
  subscriptionRouter.delete('/:space/:type/subscriptions/:subscriber', assertAuthenticatedHandler, (req, res, next) => {
    const user = req.user as User;
    const { space, type, subscriber } = req.params;

    Promise.all([
      spaceRepository.get(space).then((spaceEntity) => typeRepository.get(spaceEntity, type)),
      subscriptionRepository.getSubscriber(subscriber),
    ])
      .then(([typeEntity, subscriberEntity]) => typeEntity.unsubscribe(subscriptionRepository, user, subscriberEntity))
      .then((result) => res.send(result))
      .catch((err) => next(err));
  });

  /**
   * @swagger
   *
   * /subscription/v1/{space}/subscribers:
   *   get:
   *     tags:
   *     - Subscription
   *     description: Retrieves subscriptions for a notification type.
   *     parameters:
   *     - name: space
   *       description: Notification space of the subscribers.
   *       in: path
   *       required: true
   *       schema:
   *         type: string
   *     responses:
   *       200:
   *         description: Subscribers successfully retrieved.
   */
  subscriptionRouter.get('/:space/subscribers', assertAuthenticatedHandler, (req, res, next) => {
    const { space } = req.params;
    const top = req.query.top ? parseInt(req.query.top as string, 10) : 10;
    const after = req.query.after as string;

    subscriptionRepository
      .findSubscribers(top, after, { spaceIdEquals: space })
      .then((result) =>
        res.send({
          results: result.results.map(mapSubscriber),
          page: result.page,
        })
      )
      .catch((err) => next(err));
  });

  /**
   * @swagger
   *
   * /subscription/v1/{space}/subscribers/{subscriber}:
   *   get:
   *     tags:
   *     - Subscription
   *     description: Retrieves a subscriber of a notification space.
   *     parameters:
   *     - name: space
   *       description: Notification space of the subscriber.
   *       in: path
   *       required: true
   *       schema:
   *         type: string
   *     - name: subscriber
   *       description: Subscriber to get.
   *       in: path
   *       required: true
   *       schema:
   *         type: string
   *     responses:
   *       200:
   *         description: Subscriber successfully retrieved.
   */
  subscriptionRouter.get('/:space/subscribers/:subscriber', assertAuthenticatedHandler, (req, res, next) => {
    const { subscriber } = req.params;

    subscriptionRepository
      .getSubscriber(subscriber)
      .then((subscriberEntity) => res.send(mapSubscriber(subscriberEntity)))
      .catch((err) => next(err));
  });

  /**
   * @swagger
   *
   * /subscription/v1/{space}/subscribers/{subscriber}:
   *   delete:
   *     tags:
   *     - Subscription
   *     description: Deletes a subscriber of a notification space.
   *     parameters:
   *     - name: space
   *       description: Notification space of the subscriber.
   *       in: path
   *       required: true
   *       schema:
   *         type: string
   *     - name: subscriber
   *       description: Subscriber to get.
   *       in: path
   *       required: true
   *       schema:
   *         type: string
   *     responses:
   *       200:
   *         description: Subscriber successfully deleted.
   */
  subscriptionRouter.delete('/:space/subscribers/:subscriber', assertAuthenticatedHandler, (req, res, next) => {
    const { subscriber } = req.params;

    subscriptionRepository
      .getSubscriber(subscriber)
      .then((subscriberEntity) => subscriptionRepository.deleteSubscriber(subscriberEntity))
      .then((deleted) => res.send({ deleted }))
      .catch((err) => next(err));
  });

  return subscriptionRouter;
};
