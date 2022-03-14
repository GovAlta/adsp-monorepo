import { Router, Request, Response } from 'express';
import * as HttpStatusCodes from 'http-status-codes';
import { DirectoryRepository } from '../../directory/repository';
import * as NodeCache from 'node-cache';
import { Logger } from 'winston';
import validationMiddleware from '../../middleware/requestValidator';
import { ServiceV2 } from '../../directory/validator/directory/directoryValidator';
import { InvalidValueError } from '@core-services/core-common';

interface DirectoryRouterProps {
  logger?: Logger;
  directoryRepository: DirectoryRepository;
}

export interface URNComponent {
  scheme?: string;
  nic?: string;
  core?: string;
  service?: string;
  apiVersion?: string;
  resource?: string;
}

export interface Resp {
  url?: string;
  urn?: string;
}

const getUrn = (component: URNComponent) => {
  let urn = `${component.scheme}:${component.nic}:${component.core}:${component.service}`;
  urn = component.apiVersion ? `${urn}:${component.apiVersion}` : urn;
  urn = component.resource ? `${urn}:${component.resource}` : urn;
  return urn;
};

const directoryCache = new NodeCache({ stdTTL: 300 });

export const createDirectoryRouter = ({ logger, directoryRepository }: DirectoryRouterProps): Router => {
  const directoryRouter = Router();
  /**
   * Get all of directories
   */
  directoryRouter.get('/namespaces/:namespace', async (req: Request, res: Response, _next) => {
    const { namespace } = req.params;
    const results = directoryCache.get(`directory-${namespace}`);
    if (results) {
      res.json(results);
    } else {
      try {
        const response = {};
        const result = await directoryRepository.find(100, null, null);
        const directories = result.results;
        if (directories && directories.length > 0) {
          for (const directory of directories) {
            if (directory.name === namespace) {
              const services = directory['services'];
              for (const service of services) {
                const component: URNComponent = {
                  scheme: 'urn',
                  nic: 'ads',
                  core: directory['name'],
                  service: service['service'],
                };
                const serviceName: string = service['host'].toString();
                response[getUrn(component)] = serviceName;
              }
            }
          }
        }

        directoryCache.set(`directory-${namespace}`, response);
        res.json(response);
      } catch (err) {
        _next(err);
      }
    }
  });

  /**
   * Add one services to namespace
   */
  directoryRouter.post(
    '/namespaces/:namespace',
    [validationMiddleware(ServiceV2)],
    async (req: Request, res: Response, _next) => {
      const { namespace } = req.params;
      try {
        const { service, api, url } = req.body;
        let result;
        try {
          result = await directoryRepository.getDirectories(namespace);
        } catch (err) {
          _next(err);
        }

        const mappingService = {
          service: service,
          api: api,
          host: url,
        };
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
    [validationMiddleware(ServiceV2)],
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
  directoryRouter.delete('/namespaces/:namespace/service/:service', async (req: Request, res: Response, _next) => {
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
  });
  return directoryRouter;
};
