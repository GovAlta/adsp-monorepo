import { Request, Response, Router } from 'express';
import { ServiceConfigurationRepository } from '../repository';
import { mapServiceOption } from './mappers';
import { ServiceOptionEntity } from '../model';
import { NotFoundError } from '@core-services/core-common';

interface ServiceOptionRouterProps {
  serviceConfigurationRepository: ServiceConfigurationRepository;
}

export const createConfigurationRouter = ({
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
    '/:service',

    (req, res, next) => {

      const { service } = req.params;

      serviceConfigurationRepository
        .getConfigOption(service)
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
   * /configuration/v1/serviceOptions/:
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
    '/',
    (req: Request, res: Response, next) => {
      const { service } = req.params;
      const data = req.body;

      serviceConfigurationRepository
        .getConfigOption(service)
        .then((serviceOptionEntity) => {

          if (!serviceOptionEntity) {
            return serviceOptionEntity.update(data);
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
