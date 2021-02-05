import { Request, Response, Router } from 'express';
import { ServiceConfigurationRepository } from '../repository';
import { mapServiceOption } from './mappers';
import { ServiceOptionEntity } from '../model';

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
   *     tags: [ServiceOption]
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
   *       404:
   *         description: Service not found.
   */
  serviceOptionRouter.get(
    '/:service',

    (req, res, next) => {

      const { service } = req.params;

      serviceConfigurationRepository
        .getConfigOption(service)
        .then((serviceOptionEntity) => {

          if (!serviceOptionEntity) {
            res.status(404).json({ error: `Service Options ${service} not found` })
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
   *     tags: [ServiceOption]
   *     description: Creates a service option configuration.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#.../model/ServiceOptionEntity'
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
          return ServiceOptionEntity.create(serviceConfigurationRepository, {
            ...data,
            serviceOption: serviceOptionEntity,
          });
        })
        .then((entity) => {
          res.json(mapServiceOption(entity));
          return entity;
        })
        .catch((err) => next(err));
    }
  );

  /**
   * @swagger
   *
   * /configuration/v1/serviceOptions/:
   *   put:
   *     tags: [ServiceOption]
   *     description: Updates a service option configuration.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#.../model/ServiceOptionEntity'
   *
   *     responses:
   *       200:
   *         description: Service options succesfully Updated.
   *       404:
   *         description: Service not found.
   */
  serviceOptionRouter.put(
    '/',
    (req: Request, res: Response, next) => {
      const data = req.body;
      const service = data.service;

      serviceConfigurationRepository
        .getConfigOption(service)
        .then((serviceOptionEntity) => {
          if (!serviceOptionEntity) {
            res.status(404).json({ error: `Service Options ${service} not found` })
          } else {
            return serviceOptionEntity.update(data);
          }
        })
        .then((entity) => {
          res.json(mapServiceOption(entity));
          return entity;
        })
        .catch((err) => next(err));
    }
  );

  return serviceOptionRouter;
};
