import { Router } from 'express';
import { Logger } from 'winston';
import {
  ServiceConfigurationRepository,
  TenantConfigurationRepository,
} from '../repository';
import { mapServiceOption } from './mappers';
import { ServiceOptionEntity, TenantConfigEntity } from '../model';
import {
  assertAuthenticatedHandler,
  User,
  UnauthorizedError,
  NotFoundError,
} from '@core-services/core-common';

interface ServiceOptionRouterProps {
  logger: Logger;
  serviceConfigRepository: ServiceConfigurationRepository;
}

export const createConfigurationRouter = ({
  logger,
  serviceConfigRepository,
}: ServiceOptionRouterProps) => {
  const serviceOptionRouter = Router();

  /**
   * @swagger
   *
   * /configuration/v1/serviceOptions/{service}:
   *   get:
   *     tags:
   *     - Subscription
   *     description: Retrieves service options for a service type.
   *     parameters:
   *     - name: service
   *       description: Service type.
   *       in: path
   *       required: true
   *       schema:
   *         type: string
   *
   *     responses:
   *       200:
   *         description: Service options succesfully retrieved.
   */
  serviceOptionRouter.get(
    '/serviceOptions/:service',
    assertAuthenticatedHandler,
    (req, res, next) => {
      const user = req.user as User;
      const { service } = req.params;

      serviceConfigRepository
        .get(service)
        .then((serviceOptionEntity) => {
          if (!serviceOptionEntity) {
            throw new NotFoundError('Service Options', service);
          } else if (!serviceOptionEntity.canAccess(user)) {
            throw new UnauthorizedError(
              'User not authorized to access service option.'
            );
          } else {
            res.json(mapServiceOption(serviceOptionEntity));
          }
        })
        .catch((err) => next(err));
    }
  );

  /**
   * @swagger
   *
   * /configuration/v1/serviceOptions/{service}:
   *   post:
   *     tags:
   *     - Subscription
   *     description: Creates a service option configuration.
   *     parameters:
   *     - name: service
   *       description: Service option.
   *       in: path
   *       required: true
   *       schema:
   *         type: string
   * 
   *     responses:
   *       200:
   *         description: Subscriptions succesfully retrieved.
   */
  serviceOptionRouter.post(
    '/serviceOptions/:service',
    assertAuthenticatedHandler,
    (req, res, next) => {
      const user = req.user as User;
      const { service } = req.params;
      const data = req.body;

      serviceConfigRepository
        .get(service)
        .then((serviceOptionEntity) => {
          if (!serviceOptionEntity) {
            throw new NotFoundError('Service Options', service);
          } else if (!serviceOptionEntity.canAccess(user)) {
            throw new UnauthorizedError(
              'User not authorized to access service option.'
            );
          } else {
            return ServiceOptionEntity.create(serviceConfigRepository, {
              ...data,
              serviceOption: service,
            });
          }
        })
        .then((entity) => {
          res.send(mapServiceOption(entity));
          return entity;
        })
        .catch((err) => next(err));
    }
  );

  
  return serviceOptionRouter;
};
