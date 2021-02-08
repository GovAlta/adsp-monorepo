import { Request, Response, Router } from 'express';
import { InvalidOperationError } from '@core-services/core-common';
import { TenantConfigurationRepository } from '../repository';
import { mapTenantConfig } from './mappers';
import { TenantConfigEntity } from '../model';
import HttpException from '../errorHandlers/httpException';

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
  * /configuration/v1/tenantConfig/:
  *   get:
  *     tags: [ServiceOption]
  *     description: Retrieves all tenant configuations
  *
  *     responses:
  *       200:
  *         description: Tenant configurations succesfully retrieved.
  */
  tenantConfigRouter.get(
    '/',
    (req: Request, res: Response, next) => {
      const { top, after } = req.query;

      tenantConfigurationRepository.find(
        parseInt((top as string) || '10', 10),
        after as string
      ).then((entities) => {
        res.json({
          page: entities.page,
          results: entities.results.map(mapTenantConfig)
        })
      }).catch((err) => next(err));
    }
  );

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
        .getTenantConfig(realmName)
        .then((tenantConfigEntity) => {
          if (!tenantConfigEntity) {
            throw new HttpException(404, `Tenant Config for Realm ${realmName} not found`);
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
      const data = req.body;
      const { realmName, configurationSettingsList } = data;

      try {

        if (!realmName) {
          throw new HttpException(400, 'Tenant Realm Name is required.');
        }

        if (!configurationSettingsList) {
          throw new HttpException(400, 'Tenant Realm Configuration Settings are required');
        }

        tenantConfigurationRepository
          .getTenantConfig(realmName)
          .then((tenantConfigEntity) => {
            if (tenantConfigEntity) {
              throw new HttpException(400, `Tenant Config for Realm ${realmName} already exists.`);
            } else {
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
          .catch((err) => {
            next(err);
          });
      } catch (err) {
        next(err);
      }
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
   *       400:
   *         description: Tenant realm name or configuration are null.
   */
  tenantConfigRouter.put(
    '/',
    (req: Request, res: Response, next) => {
      const data = req.body;
      const { realmName, id, configurationSettingsList } = data;

      try {
        if (!realmName || !configurationSettingsList) {
          throw new HttpException(400, 'Tenant Realm Name and Configuration Settings are required.');
        }

        tenantConfigurationRepository
          .get(id)
          .then((tenantConfigEntity) => {
            if (!tenantConfigEntity) {
              throw new HttpException(404, `Tenant Config for Realm ${realmName} not found`);
            } else {
              return tenantConfigEntity.update(data);
            }
          })
          .then((entity) => {
            res.json(mapTenantConfig(entity));
            return entity;
          })
          .catch((err) => {
            next(err);
          });
      } catch (err) {
        next(err);
      }
    }
  );

  /**
   * @swagger
   *
   * /configuration/v1/tenantConfig/id:
   *   delete:
   *     tags: [TenantConfig]
   *     description: Deletes tenant configuation for a realm.
   *     parameters:
   *     - name: id
   *       description: Id of the tenant configuration.
   *       in: path
   *       required: true
   *       schema:
   *         $ref: '#.../model/TenantConfigEntity'
   *
   *     responses:
   *       200:
   *         description: Tenant configuration succesfully deleted.
   *       404:
   *         description: Tenant Configuration not found.
   */
  tenantConfigRouter.delete(
    '/:id',
    (req: Request, res: Response, next) => {
      const { id } = req.params;

      return tenantConfigurationRepository.get(id)
        .then((tenantConfigEntity) => {
          if (!tenantConfigEntity) {
            throw new HttpException(404, 'Tenant Configuration not found');
          } else {
            tenantConfigEntity.delete(tenantConfigEntity)
          }
        }
        )
        .then((result) => res.json(result)
        )
        .catch((err) => next(err));
    }
  );

  return tenantConfigRouter;
};
