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

export const getEntriesForService =
  (directoryRepository: DirectoryRepository): RequestHandler =>
  async (req, res, _next) => {
    try {
      const { namespace, service } = req.params;
      const data = await getNamespaceEntries(directoryRepository, namespace);
      // regex matches service | service:whatever
      const serviceRe = new RegExp(`^${service}$`);
      const apisRe = new RegExp(`^${service}(:[a-zA-Z-]+)$`);
      const serviceEntry = data.filter((x) => x.service.match(serviceRe));
      const apiEntries = data.filter((x) => x.service.match(apisRe));

      if (!serviceEntry && !apiEntries) {
        return res.sendStatus(HttpStatusCodes.NOT_FOUND);
      } else if (!serviceEntry) {
        return res.json({ apis: apiEntries });
      } else if (!apiEntries) {
        return res.json({ service: serviceEntry });
      } else {
        return res.json({ service: serviceEntry, apis: apiEntries });
      }
    } catch (err) {
      _next(err);
    }
  };

export const getDirectoryEntryForApi =
  (directoryRepository: DirectoryRepository): RequestHandler =>
  async (req, res, _next) => {
    let result = null;
    try {
      const { namespace, service, api } = req.params;
      const entries = await getNamespaceEntries(directoryRepository, namespace);
      result = entries.find((x) => x.service === `${service}:${api}`);
      if (!result) {
        return res.sendStatus(HttpStatusCodes.NOT_FOUND);
      }
    } catch (err) {
      _next(err);
    }
    res.json(result);
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

export const addService =
  (directoryRepository: DirectoryRepository, eventService: EventService, logger: Logger): RequestHandler =>
  async (req, res, _next) => {
    const { namespace } = req.params;
    const user = req.user;
    const { service, url } = req.body;
    const entry = service;
    try {
      const result = await addEntry(namespace, entry, url, directoryRepository);
      if (!result) {
        return res.sendStatus(HttpStatusCodes.CREATED);
      }
      const serviceEvent = entry;
      eventService.send(entryUpdated(user, namespace, serviceEvent, '', url));
      return res.status(HttpStatusCodes.CREATED).json(result);
    } catch (err) {
      logger.error(`Failed creating directory for namespace: ${namespace} with error ${err.message}`);
      _next(err);
    }
  };

export const addServiceApi =
  (directoryRepository: DirectoryRepository, eventService: EventService, logger: Logger): RequestHandler =>
  async (req, res, _next) => {
    const { namespace, service } = req.params;
    const user = req.user;
    const { api, url } = req.body;
    const entry = `${service}:${api}`;
    try {
      const result = await addEntry(namespace, entry, url, directoryRepository);
      if (!result) {
        return res.sendStatus(HttpStatusCodes.CREATED);
      }
      eventService.send(entryUpdated(user, namespace, service, api, url));
      return res.status(HttpStatusCodes.CREATED).json(result);
    } catch (err) {
      logger.error(`Failed creating directory for namespace: ${namespace} with error ${err.message}`);
      _next(err);
    }
  };

const addEntry = async (
  namespace: string,
  entry: string,
  url: string,
  directoryRepository: DirectoryRepository
): Promise<Service> => {
  const result = await directoryRepository.getDirectories(namespace);

  const mappingService = {
    service: entry,
    host: url,
  };
  if (!result) {
    const directory = { name: namespace, services: [mappingService] };
    await directoryRepository.update(directory);
    return null;
  }
  const services = result.services;
  const isExist = services.find((x) => x.service === entry);

  if (isExist) {
    throw new InvalidValueError('Create new service', `${entry} already exists in ${namespace}`);
  } else {
    services.push(mappingService);
    const directory = { name: namespace, services: services };

    await directoryRepository.update(directory);
    const resultInDB = await directoryRepository.getDirectories(namespace);
    const serviceInDB = resultInDB.services;
    const results = serviceInDB.find((x) => x.service === entry);
    delete results._id;
    return results;
  }
};

export const updateService =
  (directoryRepository: DirectoryRepository, eventService: EventService, logger: Logger): RequestHandler =>
  async (req, res, _next) => {
    const { namespace, service } = req.params;
    const user = req.user;
    const { url } = req.body;

    try {
      const didUpdate = await updateEntry(namespace, service, url, directoryRepository);

      if (didUpdate) {
        logger.info(
          `Directory ${namespace}:${service} update by ${user.name} (ID: ${user.id}) user tenant id : ${user.tenantId} `
        );
        eventService.send(entryUpdated(user, namespace, service, '', url));
        return res.sendStatus(HttpStatusCodes.CREATED);
      } else {
        logger.error('modify service has error');
        return res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: `${service} does not exist in ${namespace}` });
      }
    } catch (err) {
      logger.error(`Failed updating directory for namespace: ${namespace} with error ${err.message}`);
      _next(err);
    }
  };

export const updateApi =
  (directoryRepository: DirectoryRepository, eventService: EventService, logger: Logger): RequestHandler =>
  async (req, res, _next) => {
    const { namespace, service, api } = req.params;
    const user = req.user;
    const { url } = req.body;

    try {
      const entry = `${service}:${api}`;
      const didUpdate = await updateEntry(namespace, entry, url, directoryRepository);

      if (didUpdate) {
        logger.info(
          `Directory ${namespace}:${entry} update by ${user.name} (ID: ${user.id}) user tenant id : ${user.tenantId} `
        );
        eventService.send(entryUpdated(user, namespace, service, api, url));
        return res.sendStatus(HttpStatusCodes.CREATED);
      } else {
        logger.error('modify service has error');
        return res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: `${entry} does not exist in ${namespace}` });
      }
    } catch (err) {
      logger.error(`Failed updating directory for namespace: ${namespace} with error ${err.message}`);
      _next(err);
    }
  };

const updateEntry = async (
  namespace: string,
  entry: string,
  url: string,
  directoryRepository: DirectoryRepository
): Promise<boolean> => {
  const result = await directoryRepository.getDirectories(namespace);
  const services = result.services;
  const dbEntry = services.find((x) => x.service.toString() === entry);

  if (dbEntry) {
    dbEntry.service = entry;
    dbEntry.host = url;
    const directory = { name: namespace, services: services };
    await directoryRepository.update(directory);
    return true;
  }
  return false;
};

export const deleteService =
  (directoryRepository: DirectoryRepository, eventService: EventService, logger: Logger): RequestHandler =>
  async (req, res, _next) => {
    const { namespace, service } = req.params;
    const user = req.user;

    try {
      const dbEntry = await deleteEntry(namespace, service, directoryRepository);
      logger.info(
        `Directory ${namespace}:${service} update by ${user.name} (ID: ${user.id}), user tenant id : ${user.tenantId} `
      );
      eventService.send(entryDeleted(user, namespace, service, 'eventApi', dbEntry.host));
      return res.sendStatus(HttpStatusCodes.OK);
    } catch (err) {
      logger.error(`Failed deleting directory for namespace: ${namespace} with error ${err.message}`);
      _next(err);
    }
  };

export const deleteApi =
  (directoryRepository: DirectoryRepository, eventService: EventService, logger: Logger): RequestHandler =>
  async (req, res, _next) => {
    const { namespace, service, api } = req.params;
    const user = req.user;

    try {
      const dbEntry = await deleteEntry(namespace, `${service}:${api}`, directoryRepository);
      logger.info(
        `Directory ${namespace}:${service} update by ${user.name} (ID: ${user.id}), user tenant id : ${user.tenantId} `
      );
      eventService.send(entryDeleted(user, namespace, service, api, dbEntry.host));
      return res.sendStatus(HttpStatusCodes.OK);
    } catch (err) {
      logger.error(`Failed deleting directory for namespace: ${namespace} with error ${err.message}`);
      _next(err);
    }
  };

const deleteEntry = async (
  namespace: string,
  entry: string,
  directoryRepository: DirectoryRepository
): Promise<Service> => {
  const directoryEntity = await directoryRepository.getDirectories(namespace);
  if (!directoryEntity) {
    throw new InvalidValueError('Delete namespace service', `Cannot find namespace: ${namespace}`);
  }

  const services = directoryEntity.services;
  const dbEntry = services.find((x) => x.service === entry);
  if (!dbEntry) {
    throw new InvalidValueError('Delete namespace service', `Cannot find ${entry}`);
  }
  services.splice(
    services.findIndex((item) => item.service === entry),
    1
  );
  const directory = { name: namespace, services: services };
  await directoryRepository.update(directory);
  return dbEntry;
};

export const getServiceMetadata =
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
      return res.json(filteredService);
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

  /**
   * Get all directory entries
   */

  directoryRouter.get(
    '/namespaces/:namespace/entries',
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

  /**
   * Get entries for the specified Service
   */
  directoryRouter.get(
    '/namespaces/:namespace/services/:service/entries',
    createValidationHandler(
      ...checkSchema(
        {
          namespace: { isString: true, isLength: { options: { min: 1, max: 50 } } },
        },
        ['params']
      )
    ),
    getEntriesForService(directoryRepository)
  );

  /**
   * Get entry for the specified API
   */
  directoryRouter.get(
    '/namespaces/:namespace/services/:service/apis/:api',
    createValidationHandler(
      ...checkSchema(
        {
          namespace: { isString: true, isLength: { options: { min: 1, max: 50 } } },
        },
        ['params']
      )
    ),
    getDirectoryEntryForApi(directoryRepository)
  );

  /**
   * Create new namespace.
   */
  directoryRouter.post('/namespaces', passportMiddleware, createNameSpace(directoryRepository, tenantService, logger));

  /**
   * Add a service to a namespace.
   */
  directoryRouter.post(
    '/namespaces/:namespace/services',
    [passportMiddleware, validateNamespaceEndpointsPermission(tenantService)],
    addService(directoryRepository, eventService, logger)
  );

  /**
   * Add an api to a service.
   * NOTE: This is a bit quirky; the implementation allows a service api to
   * effectively exist without the service.
   */
  directoryRouter.post(
    '/namespaces/:namespace/services/:service/apis',
    [passportMiddleware, validateNamespaceEndpointsPermission(tenantService)],
    addServiceApi(directoryRepository, eventService, logger)
  );

  /**
   * modify a service in the namespace
   */
  directoryRouter.patch(
    '/namespaces/:namespace/services/:service',
    [passportMiddleware, validateNamespaceEndpointsPermission(tenantService)],
    updateService(directoryRepository, eventService, logger)
  );

  /**
   * modify an api in the service
   */
  directoryRouter.patch(
    '/namespaces/:namespace/services/:service/apis/:api',
    [passportMiddleware, validateNamespaceEndpointsPermission(tenantService)],
    updateApi(directoryRepository, eventService, logger)
  );

  /**
   * Delete a service
   */
  directoryRouter.delete(
    '/namespaces/:namespace/services/:service',
    [passportMiddleware, validateNamespaceEndpointsPermission(tenantService)],
    deleteService(directoryRepository, eventService, logger)
  );

  /**
   * Delete an API
   */
  directoryRouter.delete(
    '/namespaces/:namespace/services/:service/apis/:api',
    [passportMiddleware, validateNamespaceEndpointsPermission(tenantService)],
    deleteApi(directoryRepository, eventService, logger)
  );

  /**
   * Get the service metadata
   */
  directoryRouter.get(
    '/namespaces/:namespace/services/:service/metadata',
    createValidationHandler(
      ...checkSchema(
        {
          namespace: { isString: true, isLength: { options: { min: 1, max: 50 } } },
          service: { isString: true, isLength: { options: { min: 1, max: 50 } } },
        },
        ['params']
      )
    ),
    getServiceMetadata(directoryRepository, logger)
  );

  return directoryRouter;
};
