import { Request, Response, Router } from 'express';
import { Logger } from 'winston';
import { ServiceConfigurationRepository } from '../repository';
import { mapServiceOption } from './mappers';
import { ServiceOptionEntity } from '../model';
import { NotFoundError } from '@core-services/core-common';

interface ServiceOptionRouterProps {
  logger: Logger,
  serviceConfigurationRepository: ServiceConfigurationRepository;
}

export const createConfigurationRouter = ({
  logger: Logger,
  serviceConfigurationRepository,
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

    (req, res, next) => {

      const { service } = req.params;

      serviceConfigurationRepository
        .get(service)
        .then((serviceOptionEntity) => {

          if (!serviceOptionEntity) {
            throw new NotFoundError('Service Options', service);
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
   *     - ServiceOption
   *     description: Creates a service option configuration.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *
   *     responses:
   *       200:
   *         description: Service options succesfully created.
   */
  serviceOptionRouter.post(
    '/serviceOptions/',
    (req: Request, res: Response, next) => {
      const { service } = req.params;
      const data = req.body;

      serviceConfigurationRepository
        .get(service)
        .then((serviceOptionEntity) => {
          if (!serviceOptionEntity) {
            ServiceOptionEntity.delete(serviceConfigurationRepository, {
              ...data,
              config: data
            });

            return ServiceOptionEntity.create(serviceConfigurationRepository, {
              ...data,
              serviceOption: data
            });
          } else {
            return ServiceOptionEntity.create(serviceConfigurationRepository, {
              ...data,
              serviceOption: serviceOptionEntity,
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
