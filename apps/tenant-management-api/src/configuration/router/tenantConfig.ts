import { Router } from 'express';
import { TenantConfigurationRepository } from '../repository';
import { mapTenantConfig } from './mappers';
import { TenantConfigEntity } from '../model';
import HttpException from '../errorHandlers/httpException';
import * as HttpStatusCodes from 'http-status-codes';
import { errorHandler } from '../errorHandlers';
import { EventService } from '@abgov/adsp-service-sdk';
import { TenantServiceRoles } from '../../roles';
import { configurationUpdated } from '../events';

interface TenantConfigRouterProps {
  eventService: EventService;
  tenantConfigurationRepository: TenantConfigurationRepository;
}

export const createTenantConfigurationRouter = ({
  eventService,
  tenantConfigurationRepository,
}: TenantConfigRouterProps): Router => {
  const tenantConfigRouter = Router();

  tenantConfigRouter.get('/list', async (req, res, next) => {
    const { top, after } = req.query;

    try {
      const results = await tenantConfigurationRepository.find(parseInt((top as string) || '10', 10), after as string);

      res.json({
        page: results.page,
        results: results.results.map(mapTenantConfig),
      });
    } catch (err) {
      errorHandler(err, req, res, next);
    }
  });

  tenantConfigRouter.get('/', async (req, res, next) => {
    try {
      const user = req.user;
      const tenant = `${user.tenantId}`;
      const results = await tenantConfigurationRepository.getTenantConfig(tenant);

      if (!results) {
        throw new HttpException(HttpStatusCodes.NOT_FOUND, `Tenant Config for tenant '${tenant}' not found`);
      }
      res.json(mapTenantConfig(results));
    } catch (err) {
      errorHandler(err, req, res, next);
    }
  });

  tenantConfigRouter.get('/:service', async (req, res, next) => {
    const { service } = req.params;
    const user = req.user;
    const tenant =
      user.isCore && user.roles.includes(TenantServiceRoles.PlatformService)
        ? `${req.query.tenantId}`
        : `${user.tenantId}`;

    try {
      const results = await tenantConfigurationRepository.getTenantConfig(tenant);

      if (!results) {
        throw new HttpException(HttpStatusCodes.NOT_FOUND, `Tenant Config for tenant '${tenant}' not found`);
      }
      res.json(mapTenantConfig(results).configurationSettingsList[service] || {});
    } catch (err) {
      errorHandler(err, req, res, next);
    }
  });

  tenantConfigRouter.post('/', async (req, res, next) => {
    const data = req.body;
    const { configurationSettingsList } = data;
    const user = req.user;
    const tenant = `${user.tenantId}`;
    try {
      if (!configurationSettingsList) {
        throw new HttpException(HttpStatusCodes.BAD_REQUEST, 'Tenant Realm Configuration Settings are required');
      }

      const tenantConfig = await tenantConfigurationRepository.getTenantConfig(tenant);
      let entity;
      if (tenantConfig) {
        entity = await tenantConfig.update(user, configurationSettingsList);
      } else {
        entity = await TenantConfigEntity.create(user, tenantConfigurationRepository, {
          ...data,
          tenantName: tenant,
        });
      }

      res.json(mapTenantConfig(entity));
      eventService.send(configurationUpdated(user, user.tenantId));
    } catch (err) {
      errorHandler(err, req, res, next);
    }
  });

  tenantConfigRouter.put('/:service', async (req, res, next) => {
    const { service } = req.params;
    const serviceSettings = req.body;
    const user = req.user;
    const tenant = `${user.tenantId}`;
    try {
      if (!serviceSettings) {
        throw new HttpException(HttpStatusCodes.BAD_REQUEST, 'Tenant Realm Configuration Settings are required');
      }

      const tenantConfig = await tenantConfigurationRepository.getTenantConfig(tenant);
      const entity = await tenantConfig.updateService(user, service, serviceSettings);

      res.json(mapTenantConfig(entity).configurationSettingsList[service]);
      eventService.send(configurationUpdated(user, user.tenantId, service));
    } catch (err) {
      errorHandler(err, req, res, next);
    }
  });

  tenantConfigRouter.put('/', async (req, res, next) => {
    const data = req.body;
    const user = req.user;
    const tenant = `${user.tenantId}`;
    const { configurationSettingsList } = data;
    console.log('put ', configurationSettingsList);
    try {
      const tenantConfig = await tenantConfigurationRepository.getTenantConfig(tenant);

      if (!tenantConfig) {
        throw new HttpException(HttpStatusCodes.NOT_FOUND, `Tenant Config for tenant ${tenant} not found`);
      }
      const entity = await tenantConfig.update(user, configurationSettingsList);

      res.json(mapTenantConfig(entity));
      eventService.send(configurationUpdated(user, user.tenantId));
    } catch (err) {
      errorHandler(err, req, res, next);
    }
  });

  tenantConfigRouter.delete('/', async (req, res, next) => {
    const user = req.user;
    const tenant = `${user.tenantId}`;

    try {
      const results = await tenantConfigurationRepository.getTenantConfig(tenant);

      if (!results) {
        throw new HttpException(HttpStatusCodes.NOT_FOUND, `Tenant Config for tenant ${tenant} not found`);
      }
      const success = await results.delete(user);
      res.json(success);
    } catch (err) {
      errorHandler(err, req, res, next);
    }
  });

  return tenantConfigRouter;
};
