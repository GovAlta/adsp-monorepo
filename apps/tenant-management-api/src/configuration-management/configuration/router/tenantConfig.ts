import { Request, Response, Router } from 'express';
import { TenantConfigurationRepository } from '../repository';
import { mapTenantConfig } from './mappers';
import { TenantConfigEntity } from '../model';
import HttpException from '../errorHandlers/httpException';
import * as HttpStatusCodes from 'http-status-codes';
import { errorHandler } from '../errorHandlers';

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
  tenantConfigRouter.get('/', async (req: Request, res: Response, next) => {
    const { top, after } = req.query;

    try {
      const results = await tenantConfigurationRepository.find(
        parseInt((top as string) || '10', 10),
        after as string
      );

      res.json({
        page: results.page,
        results: results.results.map(mapTenantConfig),
      });
    } catch (err) {
      errorHandler(err, req, res);
    }
  });

  /**
   * @swagger
   *
   * /configuration/v1/tenantConfig/{id}:
   *   get:
   *     tags: [TenantConfig]
   *     description: Retrieves tenant configuation for a realm.
   *     parameters:
   *     - name: id
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
  tenantConfigRouter.get('/:id', async (req, res, next) => {
    const { id } = req.params;

    try {
      const results = await tenantConfigurationRepository.get(id);

      if (!results) {
        throw new HttpException(
          HttpStatusCodes.NOT_FOUND,
          `Tenant Config for ID ${id} not found`
        );
      }
      res.json(mapTenantConfig(results));
    } catch (err) {
      errorHandler(err, req, res);
    }
  });

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
  tenantConfigRouter.post('/', async (req: Request, res: Response, next) => {
    const data = req.body;
    const { realmName, configurationSettingsList } = data;

    try {
      if (!realmName) {
        throw new HttpException(
          HttpStatusCodes.BAD_REQUEST,
          'Tenant Realm Name is required.'
        );
      }

      if (!configurationSettingsList) {
        throw new HttpException(
          HttpStatusCodes.BAD_REQUEST,
          'Tenant Realm Configuration Settings are required'
        );
      }

      const results = await tenantConfigurationRepository.getTenantConfig(
        realmName
      );

      if (results) {
        throw new HttpException(
          HttpStatusCodes.BAD_REQUEST,
          `Tenant Config for Realm ${realmName} already exists.`
        );
      }
      const entity = await TenantConfigEntity.create(
        tenantConfigurationRepository,
        {
          ...data,
          tenantConfig: data,
        }
      );

      res.json(mapTenantConfig(entity));
    } catch (err) {
      errorHandler(err, req, res);
    }
  });

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
  tenantConfigRouter.put('/', async (req: Request, res: Response, next) => {
    const data = req.body;
    const { realmName, id, configurationSettingsList } = data;

    try {
      if (!realmName || !configurationSettingsList) {
        throw new HttpException(
          HttpStatusCodes.BAD_REQUEST,
          'Tenant Realm Name and Configuration Settings are required.'
        );
      }

      const results = await tenantConfigurationRepository.get(id);

      if (!results) {
        throw new HttpException(
          HttpStatusCodes.NOT_FOUND,
          `Tenant Config for ID ${id} not found`
        );
      }
      const entity = await results.update(data);

      res.json(mapTenantConfig(entity));
    } catch (err) {
      errorHandler(err, req, res);
    }
  });

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
    async (req: Request, res: Response, next) => {
      const { id } = req.params;

      try {
        const results = await tenantConfigurationRepository.get(id);

        if (!results) {
          throw new HttpException(
            HttpStatusCodes.NOT_FOUND,
            `Tenant Config for ID ${id} not found`
          );
        }
        const success = await results.delete();
        res.json(success);
      } catch (err) {
        errorHandler(err, req, res);
      }
    }
  );

  return tenantConfigRouter;
};
