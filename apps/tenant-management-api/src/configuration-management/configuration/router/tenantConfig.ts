import { Request, Response, Router } from 'express';
import { TenantConfigurationRepository } from '../repository';
import { mapTenantConfig } from './mappers';
import { TenantConfigEntity } from '../model';
import { NotFoundError } from '@core-services/core-common';

interface TenantConfigRouterProps {
  tenantConfigurationRepository: TenantConfigurationRepository;
}

export const createTenantConfigurationRouter = ({
  tenantConfigurationRepository,
}: TenantConfigRouterProps) => {
  const tenantConfigRouter = Router();

  /**
   * @swagger
   *
   * /configuration/v1/tenantConfig/{realmName}:
   *   get:
   *     tags: [TenantConfig]
   *     description: Retrieves tenant configuation for a realm.
   *     parameters:
   *     - name: realmName
   *       description: Name of the realm.
   *       in: path
   *       required: true
   *       schema:
   *         $ref: '#.../model/TenantConfigEntity'
   *
   *     responses:
   *       200:
   *         description: Tenant configuration succesfully retrieved.
   *       404:
   *         description: Tenant Configuration not found.
   */
  tenantConfigRouter.get(
    '/:realmName',

    (req, res, next) => {

      const { realmName } = req.params;

      tenantConfigurationRepository
        .get(realmName)
        .then((tenantConfigEntity) => {
          if (!tenantConfigEntity) {
            res.status(404).json({ error: `Tenant Config for Realm ${realmName} not found` })
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
   * /configuration/v1/tenantConfig/:
   *   post:
   *     tags: [TenantConfig]
   *     description: Creates a tenant realm configuration.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#.../model/TenantConfigEntity'
   *     responses:
   *       200:
   *         description: Tenant Configuration succesfully created.
   */
  tenantConfigRouter.post(
    '/',
    (req: Request, res: Response, next) => {
      const { realmName } = req.params;
      const data = req.body;

      tenantConfigurationRepository
        .get(realmName)
        .then((tenantConfigEntity) => {
          if (!tenantConfigEntity) {
            return TenantConfigEntity.create(tenantConfigurationRepository, {
              ...data,
              tenantConfig: data,
            });
          }
        })
        .then((entity) => {
          res.json(mapTenantConfig(entity));
          return entity;
        })
        .catch((err) => next(err));
    }
  );

  /**
   * @swagger
   *
   * /configuration/v1/tenantConfig/:
   *   put:
   *     tags: [TenantConfig]
   *     description: Updates a tenant realm configuration.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#.../model/TenantConfigEntity'
   *     responses:
   *       200:
   *         description: Tenant Configuration succesfully created.
   *       404:
   *         description: Tenant Configuration not found.
   */
  tenantConfigRouter.put(
    '/',
    (req: Request, res: Response, next) => {
      const data = req.body;
      const realmName = data.realmName;

      tenantConfigurationRepository
        .get(realmName)
        .then((tenantConfigEntity) => {
          if (!tenantConfigEntity) {
            res.status(404).json({ error: `Tenant Config for Realm ${realmName} not found` })
          } else {
            return tenantConfigEntity.update(data);
          }
        })
        .then((entity) => {
          res.json(mapTenantConfig(entity));
          return entity;
        })
        .catch((err) => next(err));
    }
  );

  return tenantConfigRouter;
};
