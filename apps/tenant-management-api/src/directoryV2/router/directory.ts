import { Router, Request, Response } from 'express';
import * as HttpStatusCodes from 'http-status-codes';
import { DirectoryRepository } from '../../directory/repository';
import * as NodeCache from 'node-cache';
import { Logger } from 'winston';
import { requireDirectoryAdmin } from '../../middleware/authentication';
import validationMiddleware from '../../middleware/requestValidator';
import { ServiceV2 } from '../../directory/validator/directory/directoryValidator';
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
  directoryRouter.get('/namespaces/:namespace', requireDirectoryAdmin, async (req: Request, res: Response, _next) => {
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
    requireDirectoryAdmin,
    validationMiddleware(ServiceV2),
    async (req: Request, res: Response, _next) => {
      if (req.body) {
        const { service, api, url } = req.body;
        const { namespace } = req.params;
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
        let isExist;
        try {
          isExist = services.find((x) => x.service === service);
        } catch (err) {
          _next(err);
        }
        if (isExist) {
          logger?.error(`${service} is exist in ${namespace}`);
          return res.sendStatus(HttpStatusCodes.BAD_REQUEST).json({ errors: `${service} is exist in ${namespace}` });
        } else {
          services.push(mappingService);
          const directory = { name: namespace, services: services };
          try {
            await directoryRepository.update(directory);
          } catch (err) {
            _next(err);
          }

          directoryCache.del(`directory-${namespace}`);

          return res.sendStatus(HttpStatusCodes.CREATED);
        }
      }
      logger?.error('There is no context in post request body');
      return res.sendStatus(HttpStatusCodes.BAD_REQUEST).json({ errors: 'There is no context in post request body' });
    }
  );
  /**
   * modify one services for the namespace
   */
  directoryRouter.put(
    '/namespaces/:namespace',
    requireDirectoryAdmin,
    validationMiddleware(ServiceV2),
    async (req: Request, res: Response, _next) => {
      if (req.body) {
        const { service, api, url } = req.body;
        const { namespace } = req.params;
        let result;
        try {
          result = await directoryRepository.getDirectories(namespace);
        } catch (err) {
          _next(err);
        }

        const services = result['services'];
        let isExist;
        try {
          isExist = services.find((x) => x.service === service);
        } catch (err) {
          _next(err);
        }
        if (isExist) {
          if (api) {
            isExist.api = api;
          }
          isExist.host = url;
          const directory = { name: namespace, services: services };
          try {
            await directoryRepository.update(directory);
          } catch (err) {
            _next(err);
          }
          directoryCache.del(`directory-${namespace}`);
          return res.sendStatus(HttpStatusCodes.CREATED);
        } else {
          logger?.error('modify service has error');
          return res.sendStatus(HttpStatusCodes.BAD_REQUEST).json({ errors: `${service} not exist in ${namespace}` });
        }
      }

      logger?.error('There is no context in put request body');
      return res.sendStatus(HttpStatusCodes.BAD_REQUEST).json({ errors: 'There is no context in put request body' });
    }
  );
  /**
   * Delete one service by namespace
   */
  directoryRouter.delete('/namespaces/:namespace/service/:service', async (req: Request, res: Response, _next) => {
    const { namespace, service } = req.params;
    const directoryEntity = await directoryRepository.getDirectories(namespace);
    if (!directoryEntity) {
      return res.sendStatus(HttpStatusCodes.BAD_REQUEST).json({ error: `${namespace} could not find` });
    }
    const services = directoryEntity['services'];
    const isExist = services.find((x) => x.service === service);
    if (isExist) {
      services.splice(
        services.findIndex((item) => item.service === service),
        1
      );
      const directory = { name: namespace, services: services };
      try {
        await directoryRepository.update(directory);
      } catch (err) {
        _next(err);
      }
      directoryCache.del(`directory-${namespace}`);
      return res.sendStatus(HttpStatusCodes.OK);
    } else {
      return res.sendStatus(HttpStatusCodes.BAD_REQUEST).json({ error: `${service} could not find` });
    }
  });
  return directoryRouter;
};
