import { Request, Response, Router } from 'express';
import { ServiceConfigurationRepository } from '../repository';
import { mapServiceOption } from './mappers';
import { ServiceOptionEntity } from '../model';
import HttpException from '../errorHandlers/httpException';

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
   * /configuration/v1/serviceOptions/:
   *   get:
   *     tags: [ServiceOption]
   *     description: Retrieves all service options
   *
   *     responses:
   *       200:
   *         description: Service options succesfully retrieved.
   */
  serviceOptionRouter.get(
    '/',
    (req: Request, res: Response, next) => {
      const { top, after } = req.query;

      serviceConfigurationRepository.find(
        parseInt((top as string) || '10', 10),
        after as string
      ).then((entities) => {
        res.json({
          page: entities.page,
          results: entities.results.map(mapServiceOption)
        })
      }).catch((err) => next(err));
    }
  );

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
    '/:id',

    (req, res, next) => {

      const { id } = req.params;

      serviceConfigurationRepository
        .get(id)
        .then((serviceOptionEntity) => {

          if (!serviceOptionEntity) {
            throw new HttpException(404, `Service Options was not found`)
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
      const data = req.body;
      const { service, version, configOptions } = data;

      try {
        if (!service || !version || !configOptions) {
          throw new HttpException(400, 'Service, Version, and ConfigOptions are required.');
        }

        serviceConfigurationRepository
          .getConfigOptionByVersion(service, version)
          .then((serviceOptionEntity) => {
            if (serviceOptionEntity) {
              throw new HttpException(400, `Service Options ${service} version ${version} already exists`);
            } else {
              return ServiceOptionEntity.create(serviceConfigurationRepository, {
                ...data,
                serviceOption: serviceOptionEntity,
              });
            }
          })
          .then((entity) => {
            res.json(mapServiceOption(entity));
            return entity;
          })
          .catch((err) => next(err));
      } catch (err) {
        next(err);
      }
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
      const { service, id, version, configOptions } = data;

      try {
        if (!service || !version || !configOptions) {
          throw new HttpException(400, 'Service, Version, and ConfigOptions are required.');
        }

        serviceConfigurationRepository
          .get(id)
          .then((serviceOptionEntity) => {
            if (!serviceOptionEntity) {
              throw new HttpException(404, `Service Options ${service} not found`);
            } else {
              return serviceOptionEntity.update(data);
            }
          })
          .then((entity) => {
            res.json(mapServiceOption(entity));
            return entity;
          })
          .catch((err) => next(err));
      } catch (err) {
        next(err);
      }
    }
  );

  /**
   * @swagger
   *
   * /configuration/v1/serviceOptions/id:
   *   delete:
   *     tags: [TenantConfig]
   *     description: Deletes service configuation..
   *     parameters:
   *     - name: id
   *       description: Id of the service.
   *       in: path
   *       required: true
   *       schema:
   *         $ref: '#.../model/TenantConfigEntity'
   *
   *     responses:
   *       200:
   *         description: Service configuration succesfully deleted.
   *       404:
   *         description: Service Configuration not found.
   */
  serviceOptionRouter.delete(
    '/:id',
    (req: Request, res: Response, next) => {
      const { id } = req.params;

      return serviceConfigurationRepository.get(id)
        .then((serviceOptionEntity) => {
          if (!serviceOptionEntity) {
            throw new HttpException(404, `Service Options not found`);
          } else {
            serviceOptionEntity.delete(serviceOptionEntity)
          }
        }
        )
        .then((result) =>
          res.json(result)
        )
        .catch((err) => next(err));
    }
  );

  return serviceOptionRouter;
};
