import { Router, Request, Response } from 'express';
import * as HttpStatusCodes from 'http-status-codes';
import { DirectoryRepository } from '../../directory/repository';
import * as NodeCache from 'node-cache';

import { Logger } from 'winston';

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
                const element: Resp = {};
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
        logger?.error(err);
        res.status(HttpStatusCodes.BAD_REQUEST).json({
          errors: [err.message],
        });
      }
    }
  });

  return directoryRouter;
};
