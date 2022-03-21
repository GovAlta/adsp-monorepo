import { Router, Request, Response } from 'express';
import * as HttpStatusCodes from 'http-status-codes';
import { DirectoryRepository } from '../../directory/repository';
import * as NodeCache from 'node-cache';
import { Logger } from 'winston';
import validationMiddleware from '../../middleware/requestValidator';
import { ServiceV2 } from '../../directory/validator/directory/directoryValidator';
import { InvalidValueError } from '@core-services/core-common';
import { TenantService } from '@abgov/adsp-service-sdk';
import * as passport from 'passport';
import { validateNamespaceEndpointsPermission, toKebabName } from '../../middleware/authentication';

const passportMiddleware = passport.authenticate(['jwt', 'jwt-tenant'], { session: false });

import axios from 'axios';
import { Service } from '../../directory/types/directory';
interface DirectoryRouterProps {
  logger?: Logger;
  directoryRepository: DirectoryRepository;
  tenantService: TenantService;
}

const directoryCache = new NodeCache({ stdTTL: 300 });

export const createDirectoryRouter = ({ logger, directoryRepository, tenantService }: DirectoryRouterProps): Router => {
  const directoryRouter = Router();
  /**
   * Get all of directories
   */
  directoryRouter.get('/namespaces/:namespace', async (req: Request, res: Response, _next) => {
    const { namespace } = req.params;
    let services;

    services = directoryCache.get(`directory-${namespace}`);
    if (!services) {
      try {
        const directory = await directoryRepository.getDirectories(namespace);
        if (!directory) {
          res.json([]);
        }
        services = directory['services'];
      } catch (err) {
        _next(err);
      }
    }
    const response = [];

    for (const service of services) {
      const element = {};
      element['name'] = namespace;
      element['namespace'] = service.service;
      element['url'] = service.host;
      response.push(element);
    }

    directoryCache.set(`directory-${namespace}`, services);
    res.json(response);
  });

  /*
   * Create new namespace.
   */
  directoryRouter.post('/namespaces', passportMiddleware, async (req: Request, res: Response, _next) => {
    try {
      const tenant = await tenantService.getTenant(req.user?.tenantId);
      const namespace = toKebabName(tenant.name);
      const result = await directoryRepository.getDirectories(namespace);
      if (result) {
        throw new InvalidValueError('Create new namespace', `namespace ${namespace} exists`);
      } else {
        const directory = { name: namespace, services: [] };
        await directoryRepository.update(directory);
        return res.sendStatus(HttpStatusCodes.CREATED);
      }
    } catch (err) {
      logger.error(`Failed creating new directory namespace`);
      _next(err);
    }
  });

  /**
   * Add one services to namespace
   */
  directoryRouter.post(
    '/namespaces/:namespace',
    [passportMiddleware, validateNamespaceEndpointsPermission(tenantService), validationMiddleware(ServiceV2)],
    async (req: Request, res: Response, _next) => {
      const { namespace } = req.params;
      try {
        const { service, api, url } = req.body;
        const result = await directoryRepository.getDirectories(namespace);

        const mappingService = {
          service: service,
          api: api,
          host: url,
        };
        if (!result) {
          const directory = { name: namespace, services: [mappingService] };
          await directoryRepository.update(directory);
          directoryCache.del(`directory-${namespace}`);
          return res.sendStatus(HttpStatusCodes.CREATED);
        }
        const services = result['services'];
        const isExist = services.find((x) => x.service === service);

        if (isExist) {
          throw new InvalidValueError('Create new service', `${service} is exist in ${namespace}`);
        } else {
          services.push(mappingService);
          const directory = { name: namespace, services: services };

          await directoryRepository.update(directory);
          directoryCache.del(`directory-${namespace}`);
          return res.sendStatus(HttpStatusCodes.CREATED);
        }
      } catch (err) {
        logger.error(`Failed creating directory for namespace: ${namespace} with error ${err.message}`);
        _next(err);
      }
    }
  );
  /**
   * modify one services for the namespace
   */
  directoryRouter.put(
    '/namespaces/:namespace',
    [passportMiddleware, validateNamespaceEndpointsPermission(tenantService), validationMiddleware(ServiceV2)],
    async (req: Request, res: Response, _next) => {
      const { namespace } = req.params;
      try {
        const { service, api, url } = req.body;
        const result = await directoryRepository.getDirectories(namespace);
        const services = result['services'];
        const isExist = services.find((x) => x.service === service);

        if (isExist) {
          if (api) {
            isExist.api = api;
          }
          isExist.host = url;
          const directory = { name: namespace, services: services };
          await directoryRepository.update(directory);
          directoryCache.del(`directory-${namespace}`);
          return res.sendStatus(HttpStatusCodes.CREATED);
        } else {
          logger.error('modify service has error');
          return res.sendStatus(HttpStatusCodes.BAD_REQUEST).json({ errors: `${service} not exist in ${namespace}` });
        }
      } catch (err) {
        logger.error(`Failed updating directory for namespace: ${namespace} with error ${err.message}`);
        _next(err);
      }
    }
  );
  /**
   * Delete one service by namespace
   */
  directoryRouter.delete(
    '/namespaces/:namespace/service/:service',
    [passportMiddleware, validateNamespaceEndpointsPermission(tenantService)],
    async (req: Request, res: Response, _next) => {
      const { namespace, service } = req.params;
      try {
        const directoryEntity = await directoryRepository.getDirectories(namespace);
        if (!directoryEntity) {
          throw new InvalidValueError('Delete namespace service', `Cannot found namespace: ${namespace}`);
        }
        const services = directoryEntity['services'];
        const isExist = services.find((x) => x.service === service);
        if (!isExist) {
          throw new InvalidValueError('Delete namespace service', `${service} could not find`);
        }
        services.splice(
          services.findIndex((item) => item.service === service),
          1
        );
        const directory = { name: namespace, services: services };
        await directoryRepository.update(directory);

        directoryCache.del(`directory-${namespace}`);
        return res.sendStatus(HttpStatusCodes.OK);
      } catch (err) {
        logger.error(`Failed deleting directory for namespace: ${namespace} with error ${err.message}`);
        _next(err);
      }
    }
  );

  /**
   * Get all of services in one directory
   */
  directoryRouter.get('/namespaces/:namespace/services/:service', async (req: Request, res: Response, _next) => {
    const { namespace, service } = req.params;
    const results: [Service] = directoryCache.get(`directory-${namespace}`);

    if (results) {
      const isExist = results.find((x) => x.service === service);
      if (isExist && isExist?._links) {
        return res.status(HttpStatusCodes.OK).json(isExist);
      }
    }
    try {
      const directoryEntity = await directoryRepository.getDirectories(namespace);
      if (!directoryEntity) {
        return res.sendStatus(HttpStatusCodes.BAD_REQUEST).json({ error: `${namespace} could not find` });
      }
      const services = directoryEntity['services'];
      const filteredService = services.find((x) => x.service === service);

      // will return service information and HAL link information

      if (filteredService) {
        const { data } = await axios.get(filteredService.host);
        if (!filteredService._links) {
          filteredService._links = data._links;
        }
        directoryCache.set(`directory-${namespace}`, services);
        return res.status(HttpStatusCodes.OK).json(filteredService);
      } else {
        return res.sendStatus(HttpStatusCodes.BAD_REQUEST).json({ error: `${service} could not find` });
      }
    } catch (err) {
      logger.error(`Failed get service for namespace: ${namespace} with error ${err.message}`);
      _next(err);
    }
  });
  return directoryRouter;
};
