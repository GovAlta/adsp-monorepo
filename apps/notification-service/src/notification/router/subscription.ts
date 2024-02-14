import { Request, RequestHandler, Response, Router } from 'express';
import { Logger } from 'winston';
import { adspId, AdspId, isAllowedUser, TenantService, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { createValidationHandler, InvalidOperationError, NotFoundError, decodeAfter } from '@core-services/core-common';
import { SubscriptionRepository } from '../repository';
import { NotificationTypeEntity, SubscriberEntity, SubscriptionEntity } from '../model';
import { mapSubscriber, mapSubscription, mapType } from './mappers';
import { NotificationConfiguration } from '../configuration';
import { Channel, ServiceUserRoles, Subscriber, SubscriptionCriteria } from '../types';
import {
  SubscriberOperationRequests,
  SUBSCRIBER_CHECK_CODE,
  SUBSCRIBER_SEND_VERIFY_CODE,
  SUBSCRIBER_SEND_VERIFY_CODE_WITH_LINK,
  SUBSCRIBER_VERIFY_CHANNEL,
} from './types';
import { VerifyService } from '../verify';
import { body, checkSchema, oneOf, param, query } from 'express-validator';

interface SubscriptionRouterProps {
  serviceId: AdspId;
  logger: Logger;
  subscriptionRepository: SubscriptionRepository;
  verifyService: VerifyService;
  tenantService: TenantService;
}

export const assertHasTenant: RequestHandler = (req, _res, next) => {
  if (!req.tenant) {
    next(new InvalidOperationError('Operation requires a tenant context.'));
  } else {
    next();
  }
};

export const getNotificationTypes: RequestHandler = async (req, res, next) => {
  try {
    const configuration = await req.getConfiguration<NotificationConfiguration, NotificationConfiguration>();

    const types = configuration.getNotificationTypes();
    res.send(types.map((t) => mapType(t)));
  } catch (err) {
    next(err);
  }
};

const TYPE_KEY = 'notificationType';
export const getNotificationType: RequestHandler = async (req, _res, next) => {
  try {
    const { type } = req.params;
    const configuration = await req.getConfiguration<NotificationConfiguration, NotificationConfiguration>();

    const typeEntity = configuration.getNotificationType(type);

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
      const user = req.user;
      const tenantId = req.tenant.id;
      const type: NotificationTypeEntity = req[TYPE_KEY];
      const { top: topValue, after, subscriberCriteria: subscriberCriteriaValue } = req.query;
      const top = topValue ? parseInt(topValue as string, 10) : 10;

      if (!isAllowedUser(user, tenantId, ServiceUserRoles.SubscriptionAdmin, true)) {
        throw new UnauthorizedUserError('get subscribers', user);
      }

      const criteria = {
        typeIdEquals: type.id,
        subscriberCriteria: subscriberCriteriaValue ? JSON.parse(subscriberCriteriaValue as string) : null,
      };

      const configuration = await req.getConfiguration<NotificationConfiguration, NotificationConfiguration>();
      const result = await repository.getSubscriptions(configuration, tenantId, top, after as string, criteria);

      res.send({
        results: result.results.map((r) => mapSubscription(apiId, r)),
        page: result.page,
      });
    } catch (err) {
      next(err);
    }
  };
}

async function addOrUpdateSubscription(
  repository: SubscriptionRepository,
  user: User,
  type: NotificationTypeEntity,
  subscriber: SubscriberEntity,
  criteria: SubscriptionCriteria | SubscriptionCriteria[]
): Promise<SubscriptionEntity> {
  let subscription = await repository.getSubscription(type, subscriber?.id);
  if (subscription) {
    // If there is a pre-existing subscription, update the criteria.
    subscription = await subscription.updateCriteria(user, criteria);
  } else {
    if (Array.isArray(criteria)) {
      throw new InvalidOperationError('New subscription cannot be created with an array of criteria.');
    }

    subscription = await type.subscribe(repository, user, subscriber, {
      description: criteria?.description,
      correlationId: criteria?.correlationId,
      context: criteria?.context,
    });
  }
  return subscription;
}

export function createTypeSubscription(apiId: AdspId, repository: SubscriptionRepository): RequestHandler {
  return async (req, res, next) => {
    try {
      const tenantId = req.tenant.id;
      const user = req.user as User;
      const token = req.user?.token;
      const type: NotificationTypeEntity = req[TYPE_KEY];
      const { criteria, id, userId, addressAs, channels } = req.body;
      const subscriber: Subscriber =
        req.query.userSub === 'true'
          ? {
              tenantId,
              userId: user.id,
              addressAs: user.name,
              channels: [
                {
                  channel: Channel.email,
                  address: user.email,
                  verified: token?.email_verified || false,
                },
              ],
            }
          : {
              id,
              userId,
              addressAs,
              channels,
              tenantId,
            };

      let subscriberEntity: SubscriberEntity = null;
      if (subscriber.userId) {
        // Try to find an existing subscriber associated with the user ID.
        subscriberEntity = await repository.getSubscriber(tenantId, subscriber.userId, true);
      }

      if (subscriber.id) {
        // Try to find an existing subscriber based on existing subscriber ID.
        subscriberEntity = await repository.getSubscriber(tenantId, subscriber.id, false);
      }

      if (!subscriberEntity) {
        const { id: _id, ...newSubscriber } = subscriber;
        subscriberEntity = await SubscriberEntity.create(user, repository, newSubscriber);
      }

      const subscription = await addOrUpdateSubscription(repository, user, type, subscriberEntity, criteria);
      res.send(mapSubscription(apiId, subscription));
    } catch (err) {
      next(err);
    }
  };
}

export function addOrUpdateTypeSubscription(apiId: AdspId, repository: SubscriptionRepository): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const tenantId = req.tenant.id;

      const type: NotificationTypeEntity = req[TYPE_KEY];
      const { subscriber } = req.params;
      const { criteria } = req.body;

      if (!criteria) {
        throw new InvalidOperationError('criteria value must be specified.');
      }

      const subscriberEntity = await repository.getSubscriber(tenantId, subscriber, false);
      if (!subscriberEntity) {
        throw new NotFoundError('Subscriber', subscriber);
      }

      const subscription = await addOrUpdateSubscription(repository, user, type, subscriberEntity, criteria);
      res.send(mapSubscription(apiId, subscription));
    } catch (err) {
      next(err);
    }
  };
}

export function getTypeSubscription(apiId: AdspId, repository: SubscriptionRepository): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const tenantId = req.tenant.id;
      const type: NotificationTypeEntity = req[TYPE_KEY];
      const { subscriber } = req.params;

      if (!type.tenantId) {
        type.tenantId = user.tenantId;
      }

      if (!isAllowedUser(user, tenantId, ServiceUserRoles.SubscriptionAdmin, true)) {
        throw new UnauthorizedUserError('get subscribers', user);
      }

      const subscription = await repository.getSubscription(type, subscriber);
      if (subscription) {
        res.send(mapSubscription(apiId, subscription));
      } else {
        res.send(null);
      }
    } catch (err) {
      next(err);
    }
  };
}

export function deleteTypeSubscription(repository: SubscriptionRepository): RequestHandler {
  return async (req, res, next) => {
    try {
      const tenantId = req.tenant.id;
      const type: NotificationTypeEntity = req[TYPE_KEY];
      const user = req.user as User;
      const { subscriber } = req.params;

      const subscriberEntity = await repository.getSubscriber(tenantId, subscriber);

      const result = subscriberEntity ? await type.unsubscribe(repository, user, subscriberEntity) : false;
      res.send({ deleted: result });
    } catch (err) {
      next(err);
    }
  };
}

export function deleteTypeSubscriptionCriteria(repository: SubscriptionRepository): RequestHandler {
  return async (req, res, next) => {
    try {
      const type: NotificationTypeEntity = req[TYPE_KEY];
      const user = req.user as User;
      const { subscriber } = req.params;
      const { criteria: criteriaValue } = req.query;
      const criteria: SubscriptionCriteria = criteriaValue ? JSON.parse(criteriaValue as string) : null;

      let result = false;
      const subscription = await repository.getSubscription(type, subscriber);
      if (subscription) {
        result = await subscription.deleteCriteria(user, criteria);
      }

      res.send({ deleted: result });
    } catch (err) {
      next(err);
    }
  };
}

export function getSubscribers(apiId: AdspId, repository: SubscriptionRepository): RequestHandler {
  return async (req, res, next) => {
    try {
      const tenantId = req.tenant.id;
      const user = req.user;
      const { top: topValue, after, email, sms, name } = req.query;
      const top = topValue ? parseInt(topValue as string, 10) : 10;

      if (!isAllowedUser(user, tenantId, ServiceUserRoles.SubscriptionAdmin, true)) {
        throw new UnauthorizedUserError('get subscribers', user);
      }
      const criteria = {
        tenantIdEquals: tenantId,
        name: name as string | undefined,
        email: email as string | undefined,
        sms: sms as string | undefined,
      };

      const result = await repository.findSubscribers(top, after as string, criteria);
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
      const user = req.user;
      const token = req.user?.token;
      const tenantId = req.tenant.id;
      // Omit the id field from the request body.
      const { userId, addressAs, channels } = req.body;

      const subscriber: Subscriber =
        req.query.userSub === 'true'
          ? {
              tenantId,
              userId: user.id,
              addressAs: user.name,
              channels: [
                {
                  channel: Channel.email,
                  address: user.email,
                  verified: token?.email_verified || false,
                },
              ],
            }
          : {
              tenantId,
              userId,
              addressAs,
              channels,
            };

      let entity = subscriber.userId ? await repository.getSubscriber(tenantId, subscriber.userId, true) : null;
      if (entity) {
        entity = await entity.update(user, subscriber);
      } else {
        entity = await SubscriberEntity.create(user, repository, subscriber);
      }

      res.send(mapSubscriber(apiId, entity));
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
      const tenantId = req.tenant?.id;
      const { subscriber } = req.params;

      const entity = await repository.getSubscriber(tenantId, subscriber);
      if (!entity) {
        throw new NotFoundError('Subscriber', subscriber);
      }

      if (!entity.canUpdate(user)) {
        throw new UnauthorizedUserError('access subscriber', user);
      }

      req[SUBSCRIBER_KEY] = entity;

      next();
    } catch (err) {
      next(err);
    }
  };
}

export function getSubscriberByUserId(repository: SubscriptionRepository): RequestHandler {
  return async (req, _res, next) => {
    try {
      const user = req.user;
      const tenantId = req.tenant.id;

      const entity = await repository.getSubscriber(tenantId, user.id, true);
      if (!entity) {
        throw new NotFoundError('Subscriber', user.id);
      }

      if (!entity.canUpdate(user)) {
        throw new UnauthorizedUserError('access subscriber', user);
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
          await subscriber.sendVerifyCode(verifyService, user, request.channel, request.address, request.reason);
          result = { sent: true };
          break;
        case SUBSCRIBER_SEND_VERIFY_CODE_WITH_LINK:
          await subscriber.sendVerifyCodeWithLink(
            verifyService,
            user,
            request.channel,
            request.address,
            request.reason,
            request.expireIn,
            request.verificationLink
          );
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

export function getSubscriberSubscriptions(apiId: AdspId, repository: SubscriptionRepository): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const tenantId = req.tenant?.id;
      const subscriber: SubscriberEntity = req[SUBSCRIBER_KEY];
      const { top: topValue, after } = req.query;
      const top = topValue ? parseInt(topValue as string, 10) : 10;

      if (!subscriber.canUpdate(user)) {
        throw new UnauthorizedUserError('access subscribers subscriptions', user);
      }

      const configuration = await req.getConfiguration<NotificationConfiguration, NotificationConfiguration>();
      const result = await repository.getSubscriptions(configuration, tenantId, top, after as string, {
        subscriberIdEquals: subscriber.id,
      });

      res.send({
        results: result.results.map((r) => {
          const { subscriber: _subscriber, ...subscription } = mapSubscription(apiId, r, true);

          return subscription;
        }),
        page: result.page,
      });
    } catch (err) {
      next(err);
    }
  };
}

export function getSubscriberDetails(apiId: AdspId, repository: SubscriptionRepository): RequestHandler {
  return async (req, res, next) => {
    try {
      const subscriber: SubscriberEntity = req[SUBSCRIBER_KEY];
      const tenantId = req.tenant?.id || subscriber.tenantId;
      const { includeSubscriptions } = req.query;

      let subscriberDetails = mapSubscriber(apiId, subscriber);
      if (includeSubscriptions === 'true') {
        const configuration = await req.getConfiguration<NotificationConfiguration, NotificationConfiguration>();
        const { results } = await repository.getSubscriptions(configuration, tenantId, 0, undefined, {
          subscriberIdEquals: subscriber.id,
        });

        const subscriberSubscriptions = results.map((r) => {
          const { subscriber: _subscriber, ...subscription } = mapSubscription(apiId, r, true);

          return subscription;
        });

        subscriberDetails = {
          ...subscriberDetails,
          subscriptions: subscriberSubscriptions,
        };
      }

      res.send(subscriberDetails);
    } catch (err) {
      next(err);
    }
  };
}

export const getSubscriptionChannels = (repository: SubscriptionRepository): RequestHandler => {
  return async (req, res, next) => {
    try {
      const { subscriber } = req.params;
      const notification = req[TYPE_KEY] as NotificationTypeEntity;
      const subscription = await repository.getSubscription(notification, subscriber);
      const channels = await subscription.getSubscriberChannels(notification);
      res.json(channels);
    } catch (err) {
      next(err);
    }
  };
};

export const createSubscriptionRouter = ({
  serviceId,
  subscriptionRepository,
  verifyService,
}: SubscriptionRouterProps): Router => {
  const apiId = adspId`${serviceId}:v1`;
  const subscriptionRouter = Router();

  const validateTypeHandler = createValidationHandler(param('type').isString().isLength({ min: 1, max: 50 }));
  const validateSubscriberHandler = createValidationHandler(param('subscriber').isMongoId());
  const validateTypeAndSubscriberHandler = createValidationHandler(
    param('type').isString().isLength({ min: 1, max: 50 }),
    param('subscriber').isMongoId()
  );

  subscriptionRouter.get('/types', getNotificationTypes);
  subscriptionRouter.get(
    '/types/:type',
    validateTypeHandler,
    getNotificationType,
    async (req: Request, res: Response) => res.send(mapType(req[TYPE_KEY]))
  );

  subscriptionRouter.get(
    '/types/:type/subscriptions',
    validateTypeHandler,
    createValidationHandler(
      query('top').optional().isInt({ min: 1, max: 5000 }),
      query('after')
        .optional()
        .isString()
        .custom((val) => {
          return !isNaN(decodeAfter(val));
        })
    ),
    getNotificationType,
    getTypeSubscriptions(apiId, subscriptionRepository)
  );
  subscriptionRouter.post(
    '/types/:type/subscriptions',
    validateTypeHandler,
    createValidationHandler(
      query('userSub').optional().isBoolean(),
      ...checkSchema(
        {
          id: { optional: true, isMongoId: true },
          userId: { optional: true, isString: true },
          addressAs: { optional: true, isString: true },
          channels: { optional: true, isArray: true },
          criteria: { optional: true, isObject: true },
        },
        ['body']
      )
    ),
    getNotificationType,
    createTypeSubscription(apiId, subscriptionRepository)
  );

  subscriptionRouter.post(
    '/types/:type/subscriptions/:subscriber',
    validateTypeAndSubscriberHandler,
    createValidationHandler(
      oneOf([
        [
          body('criteria').isArray({ min: 1, max: 200 }),
          body('criteria.*.description').optional().isString(),
          body('criteria.*.correlationId').optional().isString(),
          body('criteria.*.context').optional().isObject(),
        ],
        [
          body('criteria').isObject(),
          body('criteria.description').optional().isString(),
          body('criteria.correlationId').optional().isString(),
          body('criteria.context').optional().isObject(),
        ],
      ])
    ),
    getNotificationType,
    addOrUpdateTypeSubscription(apiId, subscriptionRepository)
  );

  subscriptionRouter.delete(
    '/types/:type/subscriptions/:subscriber/criteria',
    validateTypeAndSubscriberHandler,
    getNotificationType,
    deleteTypeSubscriptionCriteria(subscriptionRepository)
  );

  subscriptionRouter.get(
    '/types/:type/subscriptions/:subscriber',
    validateTypeAndSubscriberHandler,
    getNotificationType,
    getTypeSubscription(apiId, subscriptionRepository)
  );

  subscriptionRouter.delete(
    '/types/:type/subscriptions/:subscriber',
    validateTypeAndSubscriberHandler,
    getNotificationType,
    deleteTypeSubscription(subscriptionRepository)
  );

  subscriptionRouter.get(
    '/subscribers',
    createValidationHandler(
      query('top').optional().isInt({ min: 1, max: 5000 }),
      query('after')
        .optional()
        .isString()
        .custom((val) => {
          return !isNaN(decodeAfter(val));
        })
    ),
    getSubscribers(apiId, subscriptionRepository)
  );
  subscriptionRouter.post('/subscribers', createSubscriber(apiId, subscriptionRepository));

  subscriptionRouter.get(
    '/subscribers/my-subscriber',
    getSubscriberByUserId(subscriptionRepository),
    getSubscriberDetails(apiId, subscriptionRepository)
  );

  subscriptionRouter.get(
    '/subscribers/:subscriber',
    validateSubscriberHandler,
    getSubscriber(subscriptionRepository),
    getSubscriberDetails(apiId, subscriptionRepository)
  );

  subscriptionRouter.patch(
    '/subscribers/:subscriber',
    validateSubscriberHandler,
    createValidationHandler(
      ...checkSchema(
        {
          addressAs: { optional: true, isString: true },
          channels: { optional: true, isArray: true },
        },
        ['body']
      )
    ),
    getSubscriber(subscriptionRepository),
    updateSubscriber(apiId)
  );
  subscriptionRouter.post(
    '/subscribers/:subscriber',
    validateSubscriberHandler,
    createValidationHandler(
      ...checkSchema(
        {
          operation: { isString: true },
          channel: { optional: true, isString: true },
          address: { optional: true, isString: true },
          code: { optional: true, isString: true },
          reason: { optional: true, isString: true },
          verificationLink: { optional: true, isString: true },
        },
        ['body']
      )
    ),
    getSubscriber(subscriptionRepository),
    subscriberOperations(verifyService)
  );
  subscriptionRouter.delete(
    '/subscribers/:subscriber',
    validateSubscriberHandler,
    getSubscriber(subscriptionRepository),
    deleteSubscriber
  );

  subscriptionRouter.get(
    '/subscribers/:subscriber/subscriptions',
    validateSubscriberHandler,
    createValidationHandler(
      query('top').optional().isInt({ min: 1, max: 5000 }),
      query('after')
        .optional()
        .isString()
        .custom((val) => {
          return !isNaN(decodeAfter(val));
        })
    ),
    getSubscriber(subscriptionRepository),
    getSubscriberSubscriptions(apiId, subscriptionRepository)
  );

  subscriptionRouter.get(
    '/subscribers/:subscriber/types/:type/channels',
    validateTypeHandler,
    getNotificationType,
    getSubscriptionChannels
  );

  return subscriptionRouter;
};
