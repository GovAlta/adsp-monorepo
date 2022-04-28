import { Router, Request, Response } from 'express';
import * as HttpStatusCodes from 'http-status-codes';
import { DirectoryRepository } from '../../directory/repository';
import * as NodeCache from 'node-cache';
import { Logger } from 'winston';
import validationMiddleware from '../../middleware/requestValidator';
import { ServiceV2 } from '../../directory/validator/directory/directoryValidator';
import { InvalidValueError, InvalidOperationError } from '@core-services/core-common';
import { TenantService } from '@abgov/adsp-service-sdk';
import * as passport from 'passport';
import { validateNamespaceEndpointsPermission, toKebabName } from '../../middleware/authentication';

const passportMiddleware = passport.authenticate(['jwt', 'jwt-tenant'], { session: false });

import axios from 'axios';
import { Service, Links } from '../../directory/types/directory';
import { getNamespaceEntries } from './getNamespaceEntries';
import { DirectoryServicePathBuilder } from './directoryServicePathBuilder';

export interface URNComponent {
  scheme?: string;
  nic?: string;
  core?: string;
  service?: string;
  apiVersion?: string;
  resource?: string;
}

interface DirectoryRouterProps {
  logger?: Logger;
  directoryRepository: DirectoryRepository;
  tenantService: TenantService;
}

const directoryCache = new NodeCache({ stdTTL: 300 });

export const createDirectoryRouter = ({ logger, directoryRepository, tenantService }: DirectoryRouterProps): Router => {
  const directoryRouter = Router();

  const entriesPath = new DirectoryServicePathBuilder().entries(':namespace').build();

  /**
   * Get all directory entries
   */
  directoryRouter.get(entriesPath, async (req: Request, res: Response, _next) => {
    let entries = [];
    try {
      const { namespace } = req.params;
      entries = await getNamespaceEntries(directoryRepository, namespace);
    } catch (err) {
      _next(err);
    }
    res.json(entries);
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
        const { service, url } = req.body;
        const result = await directoryRepository.getDirectories(namespace);

        const mappingService = {
          service: service,
          host: url,
        };
        if (!result) {
          const directory = { name: namespace, services: [mappingService] };
          await directoryRepository.update(directory);

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
          const resultInDB = await directoryRepository.getDirectories(namespace);
          const serviceInDB = resultInDB['services'];

          return res.status(HttpStatusCodes.CREATED).json(serviceInDB.find((x) => x.service === service));
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
        const { _id, service, url } = req.body;
        const result = await directoryRepository.getDirectories(namespace);
        const services = result['services'];
        const isExist = services.find((x) => x._id.toString() === _id);

        if (isExist) {
          isExist.service = service;
          isExist.host = url;
          const directory = { name: namespace, services: services };
          await directoryRepository.update(directory);

          return res.sendStatus(HttpStatusCodes.CREATED);
        } else {
          logger.error('modify service has error');
          return res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: `${service} not exist in ${namespace}` });
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
    '/namespaces/:namespace/services/:service',
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

        return res.sendStatus(HttpStatusCodes.OK);
      } catch (err) {
        logger.error(`Failed deleting directory for namespace: ${namespace} with error ${err.message}`);
        _next(err);
      }
    }
  );

  /**
   * Get service by service name
   */
  directoryRouter.get('/namespaces/:namespace/services/:service', async (req: Request, res: Response, _next) => {
    const { namespace, service } = req.params;
    // check cache if data exist
    const services: Service[] = directoryCache.get(`directory-${namespace}`);
    if (services) {
      const cachedService = services.find((x) => x.service === service);
      if (cachedService && cachedService.metadata) {
        return res.status(HttpStatusCodes.OK).json(cachedService);
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
      if (!filteredService) {
        throw new InvalidValueError('Update service', `Cannot find service: ${service}`);
      }
      try {
        const { data } = await axios.get<Links>(filteredService.host, { timeout: 5000 });

        // Root attributes of Links type are all optional. So, string can pass the axios type validation.
        if (typeof data !== 'object') {
          throw new InvalidValueError('Fetch metadata', 'Invalid metadata schema');
        }

        if (!filteredService.metadata) {
          filteredService.metadata = data;
        }
      } catch (err) {
        logger.warn(`Failed fetching metadata for service ${service} with error ${err.message}`);
        throw new InvalidOperationError('Failed to fetch data from remote server', {
          statusCode: HttpStatusCodes.FAILED_DEPENDENCY,
        });
      }
      directoryCache.set(`directory-${namespace}`, services);
      return res.status(HttpStatusCodes.OK).json(filteredService);
    } catch (err) {
      logger.error(`Failed get service for namespace: ${namespace} with error ${err.message}`);
      _next(err);
    }
  });
  return directoryRouter;
};
