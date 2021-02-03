import { Request, Response, Router } from 'express';
import { Logger } from 'winston';
import { TenantConfigurationRepository } from '../repository';
import { mapTenantConfig } from './mappers';
import { TenantConfigEntity } from '../model';
import {  NotFoundError } from '@core-services/core-common';

interface TenantConfigRouterProps {
  logger: Logger,
  tenantConfigurationRepository: TenantConfigurationRepository;
}

export const createTenantConfigurationRouter = ({
  logger: Logger,
  tenantConfigurationRepository,
}: TenantConfigRouterProps) => {
  const tenantConfigRouter = Router();
    
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
  tenantConfigRouter.get(
    '/tenantConfig/:realmName',

    (req, res, next) => {

      const { realmName } = req.params;

      tenantConfigurationRepository
        .get(realmName)
        .then((tenantConfigEntity) => {
          
          if (!tenantConfigEntity) {
            throw new NotFoundError('Tenant Config', realmName);
          } else {
            res.json(mapTenantConfig(tenantConfigEntity));
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
  tenantConfigRouter.post(
    '/tenantConfig/',
    (req: Request, res: Response, next) => {
      const { realmName } = req.params;
      const data = req.body;

      tenantConfigurationRepository
        .get(realmName)
        .then((tenantConfigEntity) => {
          if (!tenantConfigEntity) {
            TenantConfigEntity.delete(tenantConfigurationRepository, {
              ...data,
              config: data
            });

            return TenantConfigEntity.create(tenantConfigurationRepository, {
              ...data,
              tenantConfig: data
            });
          } else {
            return TenantConfigEntity.create(tenantConfigurationRepository, {
              ...data,
              tenantConfig: data,
            });
          }
        })
        .then((entity) => {
          res.send(mapTenantConfig(entity));
          return entity;
        })
        .catch((err) => next(err));
    }
  );
  
  return tenantConfigRouter;
};
