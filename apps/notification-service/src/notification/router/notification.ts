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

export const createNotificationType: RequestHandler = async (req, _res, next) => {
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


export const deleteNotificationType: RequestHandler = async (req, _res, next) => {
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




export const createSubscriptionRouter = ({ subscriptionRepository }: SubscriptionRouterProps): Router => {
  const notificationRouter = Router();

  notificationRouter.get('/types', getNotificationTypes);
  notificationRouter.get('/types/:type', getNotificationType, async (req, res) => res.send(mapType(req[TYPE_KEY])));

  notificationRouter.post('/types', createNotificationType);

  notificationRouter.delete('/types/:type', deleteNotificationType, async (req, res) => res.send(mapType(req[TYPE_KEY])));

  return notificationRouter;
};
