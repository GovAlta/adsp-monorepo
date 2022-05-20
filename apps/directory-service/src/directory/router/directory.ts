import { Router, RequestHandler } from 'express';
import * as HttpStatusCodes from 'http-status-codes';
import { DirectoryRepository } from '../repository';
import * as NodeCache from 'node-cache';
import { Logger } from 'winston';
import {
  InvalidValueError,
  InvalidOperationError,
  createValidationHandler,
  UnauthorizedError,
} from '@core-services/core-common';
import { TenantService, toKebabName, EventService } from '@abgov/adsp-service-sdk';

import * as passport from 'passport';
import { ServiceRoles } from '../roles';
import axios from 'axios';
import { Service, Links } from '../types/directory';
import { getNamespaceEntries } from './util/getNamespaceEntries';
import { DirectoryServicePathBuilder } from './util/directoryServicePathBuilder';
import { checkSchema } from 'express-validator';
import { entryUpdated, entryDeleted } from '../events';

const TIME_OUT = 10000;

const passportMiddleware = passport.authenticate(['core', 'tenant'], { session: false });
interface DirectoryRouterProps {
  logger?: Logger;
  directoryRepository: DirectoryRepository;
  tenantService: TenantService;
  eventService: EventService;
}

const validateNamespaceEndpointsPermission =
  (tenantService: TenantService): RequestHandler =>
  async (req, res, next) => {
    const roles = req.user.roles;
    try {
      if (!roles.includes(ServiceRoles.DirectoryAdmin)) {
        throw new UnauthorizedError('Missing roles');
      }
      const tenant = await tenantService.getTenant(req.user?.tenantId);

      if (!tenant) {
        throw new UnauthorizedError();
      } else {
        /**
         * Notice, please do not use the tenant.namespace here
         * This middleware can be only applied to path has parameter 'namespace'
         * */
        const isNamespaceMatch = toKebabName(tenant.name) === req.params?.namespace;
        if (isNamespaceMatch) {
          next();
        } else {
          throw new UnauthorizedError('Wrong namespace?');
        }
      }
    } catch (err) {
      next(err);
    }
  };

const directoryCache = new NodeCache({ stdTTL: 300 });

export const getDirectoriesByNamespace =
  (directoryRepository: DirectoryRepository): RequestHandler =>
  async (req, res, _next) => {
    let entries = [];
    try {
      const { namespace } = req.params;
      entries = await getNamespaceEntries(directoryRepository, namespace);
    } catch (err) {
      _next(err);
    }
    res.json(entries);
  };

export const createNameSpace =
  (directoryRepository: DirectoryRepository, tenantService: TenantService, logger: Logger): RequestHandler =>
  async (req, res, _next) => {
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
  };
export const addServiceByNamespace =
  (directoryRepository: DirectoryRepository, logger: Logger): RequestHandler =>
  async (req, res, _next) => {
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
      const services = result.services;
      const isExist = services.find((x) => x.service === service);

      if (isExist) {
        throw new InvalidValueError('Create new service', `${service} is exist in ${namespace}`);
      } else {
        services.push(mappingService);
        const directory = { name: namespace, services: services };

        await directoryRepository.update(directory);
        const resultInDB = await directoryRepository.getDirectories(namespace);
        const serviceInDB = resultInDB.services;

        return res.status(HttpStatusCodes.CREATED).json(serviceInDB.find((x) => x.service === service));
      }
    } catch (err) {
      logger.error(`Failed creating directory for namespace: ${namespace} with error ${err.message}`);
      _next(err);
    }
  };

export const updateService =
  (directoryRepository: DirectoryRepository, eventService: EventService, logger: Logger): RequestHandler =>
  async (req, res, _next) => {
    const { namespace } = req.params;
    const user = req.user;

    try {
      const { _id, service, url } = req.body;
      const result = await directoryRepository.getDirectories(namespace);
      const services = result.services;
      const isExist = services.find((x) => x._id.toString() === _id);

      if (isExist) {
        isExist.service = service;
        isExist.host = url;
        const directory = { name: namespace, services: services };
        await directoryRepository.update(directory);
        const serviceEvent = isExist.service.split(':').length === 0 ? isExist.service : isExist.service.split(':')[0];
        const eventApi = isExist.service.split(':').length === 0 ? '' : isExist.service.split(':')[1];
        logger.info(`Directory ${namespace}:${service} update by ${user.name} (ID: ${user.id}) `);
        eventService.send(
          entryUpdated(user, namespace, serviceEvent, eventApi, url, {
            data: isExist,
          })
        );

        return res.sendStatus(HttpStatusCodes.CREATED);
      } else {
        logger.error('modify service has error');
        return res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: `${service} not exist in ${namespace}` });
      }
    } catch (err) {
      logger.error(`Failed updating directory for namespace: ${namespace} with error ${err.message}`);
      _next(err);
    }
  };

export const deleteService =
  (directoryRepository: DirectoryRepository, eventService: EventService, logger: Logger): RequestHandler =>
  async (req, res, _next) => {
    const { namespace, service } = req.params;
    const user = req.user;

    try {
      const directoryEntity = await directoryRepository.getDirectories(namespace);
      if (!directoryEntity) {
        throw new InvalidValueError('Delete namespace service', `Cannot found namespace: ${namespace}`);
      }
      const services = directoryEntity.services;
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
      const serviceEvent = isExist.service.split(':').length === 0 ? isExist.service : isExist.service.split(':')[0];
      const eventApi = isExist.service.split(':').length === 0 ? '' : isExist.service.split(':')[1];
      logger.info(`Directory ${namespace}:${service} update by ${user.name} (ID: ${user.id}) `);
      eventService.send(entryDeleted(user, namespace, serviceEvent, eventApi, isExist.host));
      return res.sendStatus(HttpStatusCodes.OK);
    } catch (err) {
      logger.error(`Failed deleting directory for namespace: ${namespace} with error ${err.message}`);
      _next(err);
    }
  };

export const getMetadataByService =
  (directoryRepository: DirectoryRepository, logger: Logger): RequestHandler =>
  async (req, res, _next) => {
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
      const services = directoryEntity.services;
      const filteredService = services.find((x) => x.service === service);

      // will return service information and HAL link information
      if (!filteredService) {
        throw new InvalidValueError('Update service', `Cannot find service: ${service}`);
      }
      try {
        const { data } = await axios.get<Links>(filteredService.host, { timeout: TIME_OUT });

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
  };

export const createDirectoryRouter = ({
  logger,
  directoryRepository,
  tenantService,
  eventService,
}: DirectoryRouterProps): Router => {
  const directoryRouter = Router();

  const entriesPath = new DirectoryServicePathBuilder().entries(':namespace').build();

  /**
   * Get all directory entries
   */

  directoryRouter.get(
    entriesPath,
    createValidationHandler(
      ...checkSchema(
        {
          namespace: { isString: true, isLength: { options: { min: 1, max: 50 } } },
        },
        ['params']
      )
    ),
    getDirectoriesByNamespace(directoryRepository)
  );

  /*
   * Create new namespace.
   */
  directoryRouter.post('/namespaces', passportMiddleware, createNameSpace(directoryRepository, tenantService, logger));

  /**
   * Add one services to namespace
   */
  directoryRouter.post(
    '/namespaces/:namespace',
    [passportMiddleware, validateNamespaceEndpointsPermission(tenantService)],
    addServiceByNamespace(directoryRepository, logger)
  );
  /**
   * modify one services for the namespace
   */
  directoryRouter.put(
    '/namespaces/:namespace',
    [passportMiddleware, validateNamespaceEndpointsPermission(tenantService)],
    updateService(directoryRepository, eventService, logger)
  );

  /**
   * Delete one service by namespace
   */
  directoryRouter.delete(
    '/namespaces/:namespace/services/:service',
    [passportMiddleware, validateNamespaceEndpointsPermission(tenantService)],
    deleteService(directoryRepository, eventService, logger)
  );

  /**
   * Get service by service name
   */
  directoryRouter.get(
    '/namespaces/:namespace/services/:service',
    createValidationHandler(
      ...checkSchema(
        {
          namespace: { isString: true, isLength: { options: { min: 1, max: 50 } } },
          service: { isString: true, isLength: { options: { min: 1, max: 50 } } },
        },
        ['params']
      )
    ),
    getMetadataByService(directoryRepository, logger)
  );
  return directoryRouter;
};
