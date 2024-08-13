import {
  TenantService,
  toKebabName,
  EventService,
  isAllowedUser,
  UnauthorizedUserError,
  startBenchmark,
} from '@abgov/adsp-service-sdk';
import {
  InvalidValueError,
  InvalidOperationError,
  createValidationHandler,
  NotFoundError,
} from '@core-services/core-common';
import axios from 'axios';
import { Router, RequestHandler } from 'express';
import { checkSchema } from 'express-validator';
import * as HttpStatusCodes from 'http-status-codes';
import * as NodeCache from 'node-cache';
import { Logger } from 'winston';

import { entryUpdated, entryDeleted } from '../events';
import { DirectoryRepository } from '../repository';
import { ServiceRoles } from '../roles';
import { Service, Links, DirectoryEntry } from '../types';
import { getEntry, getNamespaceEntries } from './util';

const TIME_OUT = 10000;

interface DirectoryRouterProps {
  logger?: Logger;
  directoryRepository: DirectoryRepository;
  tenantService: TenantService;
  eventService: EventService;
}

export const resolveNamespaceTenant =
  (logger: Logger, tenantService: TenantService): RequestHandler =>
  async (req, _res, next) => {
    const { namespace } = req.params;
    try {
      const end = startBenchmark(req, 'get-tenant-time');
      const tenant = await tenantService.getTenantByName(namespace?.replace(/-/g, ' '));
      if (!tenant) {
        throw new NotFoundError('directory namespace', namespace);
      }
      req.tenant = tenant;
      end();

      next();
    } catch (err) {
      logger.debug(`Error encountered resolving tenant for namespace: ${namespace}. ${err}`);
      next(err);
    }
  };

export const validateNamespaceEndpointsPermission: RequestHandler = async (req, _res, next) => {
  try {
    if (!isAllowedUser(req.user, req.tenant.id, ServiceRoles.DirectoryAdmin)) {
      throw new UnauthorizedUserError('updated directory', req.user);
    }
    next();
  } catch (err) {
    next(err);
  }
};

const directoryCache = new NodeCache({ stdTTL: 300 });

export const getDirectoriesByNamespace =
  (directoryRepository: DirectoryRepository): RequestHandler =>
  async (req, res, next) => {
    let entries = [];
    try {
      const { namespace } = req.params;
      entries = await getNamespaceEntries(directoryRepository, namespace);
      res.json(entries);
    } catch (err) {
      next(err);
    }
  };

export const getEntriesForService =
  (directoryRepository: DirectoryRepository): RequestHandler =>
  async (req, res, next) => {
    try {
      const { namespace, service } = req.params;
      const result = await getEntriesForServiceImpl(namespace, service, directoryRepository);
      if (!result) {
        return res.sendStatus(HttpStatusCodes.NOT_FOUND);
      }
      return res.json(result);
    } catch (err) {
      next(err);
    }
  };

export interface ServiceEntity {
  service?: DirectoryEntry;
  apis: DirectoryEntry[];
}

export const getEntriesForServiceImpl = async (
  namespace: string,
  service: string,
  directoryRepository: DirectoryRepository
): Promise<ServiceEntity> => {
  const data = await directoryRepository.getDirectories(namespace);
  if (!data.services) {
    return null;
  }

  const filteredService = service.replace(/[^a-zA-Z- ]/g, '');

  // regex matches the service name, exactly;
  const serviceRe = new RegExp(`^${filteredService}$`);
  const serviceEntry = data.services.filter((x) => x.service.match(serviceRe)).map((s) => getEntry(namespace, s));

  // regex matches service:api
  const apisRe = new RegExp(`^${filteredService}:.+`);
  const apiEntries = data.services.filter((x) => x.service.match(apisRe)).map((s) => getEntry(namespace, s));
  const theService = serviceEntry.length > 0 ? serviceEntry[0] : null;
  return !theService && apiEntries.length == 0 ? null : { service: theService, apis: apiEntries };
};

export const getDirectoryEntryForApi =
  (directoryRepository: DirectoryRepository): RequestHandler =>
  async (req, res, next) => {
    let result = null;
    try {
      const { namespace, service, api } = req.params;
      const entries = await getNamespaceEntries(directoryRepository, namespace);
      result = entries.find((x) => x.service === `${service}:${api}`);
      if (!result) {
        return res.sendStatus(HttpStatusCodes.NOT_FOUND);
      }
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

export const createNamespace =
  (directoryRepository: DirectoryRepository, tenantService: TenantService, logger: Logger): RequestHandler =>
  async (req, res, next) => {
    try {
      const user = req.user;
      const tenant = await tenantService.getTenant(req.user?.tenantId);
      req.tenant = tenant;
      const namespace = toKebabName(tenant.name);
      if (!isAllowedUser(user, tenant.id, ServiceRoles.DirectoryAdmin)) {
        throw new UnauthorizedUserError('create namespace', user);
      }

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
      next(err);
    }
  };

export const addService =
  (directoryRepository: DirectoryRepository, eventService: EventService, logger: Logger): RequestHandler =>
  async (req, res, next) => {
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
      next(err);
    }
  };

export const addServiceApi =
  (directoryRepository: DirectoryRepository, eventService: EventService, logger: Logger): RequestHandler =>
  async (req, res, next) => {
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
      next(err);
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
  async (req, res, next) => {
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
      next(err);
    }
  };

export const updateApi =
  (directoryRepository: DirectoryRepository, eventService: EventService, logger: Logger): RequestHandler =>
  async (req, res, next) => {
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
      next(err);
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
  async (req, res, next) => {
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
      next(err);
    }
  };

export const deleteApi =
  (directoryRepository: DirectoryRepository, eventService: EventService, logger: Logger): RequestHandler =>
  async (req, res, next) => {
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
      next(err);
    }
  };

export const deleteEntry = async (
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

export const getServiceData =
  (directoryRepository: DirectoryRepository, logger: Logger): RequestHandler =>
  async (req, res, next) => {
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
      next(err);
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
    resolveNamespaceTenant(logger, tenantService),
    getDirectoriesByNamespace(directoryRepository)
  );

  /**
   * Get apis for the specified Service
   */
  directoryRouter.get(
    '/namespaces/:namespace/services/:service/apis',
    createValidationHandler(
      ...checkSchema(
        {
          namespace: { isString: true, isLength: { options: { min: 1, max: 50 } } },
        },
        ['params']
      )
    ),
    resolveNamespaceTenant(logger, tenantService),
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
    resolveNamespaceTenant(logger, tenantService),
    getDirectoryEntryForApi(directoryRepository)
  );

  /**
   * Create new namespace.
   */
  directoryRouter.post('/namespaces', createNamespace(directoryRepository, tenantService, logger));

  /**
   * Add a service to a namespace.
   */
  directoryRouter.post(
    '/namespaces/:namespace/services',
    resolveNamespaceTenant(logger, tenantService),
    validateNamespaceEndpointsPermission,
    addService(directoryRepository, eventService, logger)
  );

  /**
   * Add an api to a service.
   * NOTE: This is a bit quirky; the implementation allows a service api to
   * effectively exist without the service.
   */
  directoryRouter.post(
    '/namespaces/:namespace/services/:service/apis',
    resolveNamespaceTenant(logger, tenantService),
    validateNamespaceEndpointsPermission,
    addServiceApi(directoryRepository, eventService, logger)
  );

  /**
   * modify a service in the namespace
   */
  directoryRouter.patch(
    '/namespaces/:namespace/services/:service',
    resolveNamespaceTenant(logger, tenantService),
    validateNamespaceEndpointsPermission,
    updateService(directoryRepository, eventService, logger)
  );

  /**
   * modify an api in the service
   */
  directoryRouter.patch(
    '/namespaces/:namespace/services/:service/apis/:api',
    resolveNamespaceTenant(logger, tenantService),
    validateNamespaceEndpointsPermission,
    updateApi(directoryRepository, eventService, logger)
  );

  /**
   * Delete a service
   */
  directoryRouter.delete(
    '/namespaces/:namespace/services/:service',
    resolveNamespaceTenant(logger, tenantService),
    validateNamespaceEndpointsPermission,
    deleteService(directoryRepository, eventService, logger)
  );

  /**
   * Delete an API
   */
  directoryRouter.delete(
    '/namespaces/:namespace/services/:service/apis/:api',
    resolveNamespaceTenant(logger, tenantService),
    validateNamespaceEndpointsPermission,
    deleteApi(directoryRepository, eventService, logger)
  );

  /**
   * Get the service data
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
    resolveNamespaceTenant(logger, tenantService),
    getServiceData(directoryRepository, logger)
  );

  return directoryRouter;
};
