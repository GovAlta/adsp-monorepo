import { Router, Request, Response } from 'express';
import { discovery, getDirectories } from '../../directory/services';
import * as HttpStatusCodes from 'http-status-codes';
import validationMiddleware from '../../middleware/requestValidator';
import { Directory } from '../../directory/validator/directory/directoryValidator';
import { requireDirectoryAdmin } from '../../middleware/authentication';
import { DirectoryRepository } from '../../directory/repository';

import { DirectoryEntity } from '../../directory/model';

import { Logger } from 'winston';
import { NotFoundError } from '@core-services/core-common';

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

export const createDirectoryRouter = ({ logger, directoryRepository }: DirectoryRouterProps): Router => {
  const directoryRouter = Router();
  /**
   * Get all of directories
   */
  directoryRouter.get('/namespace/:namespace', async (req: Request, res: Response, _next) => {
    try {
      // FIXME: this endpoint is not testable since the `getDirectories()` function
      // uses a non-injected mongo repo that cannot be stubbed out
      console.log(JSON.stringify(req.params) + '<req params');
      console.log(JSON.stringify(req.query) + '<req query');
      const { namespace } = req.params;
      //let result = {};
      const response = [];

      console.log(JSON.stringify(namespace) + '<namespace');

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
              element.urn = getUrn(component);
              const serviceName: string = service['host'].toString();
              element.url = serviceName;
              response.push(element);
            }
          }

          console.log(JSON.stringify(response) + '<responseresponse');
        }
      }

      console.log(JSON.stringify(result) + '<resultresultresult');

      res.json(response);
    } catch (err) {
      logger?.error(err);
      res.status(HttpStatusCodes.BAD_REQUEST).json({
        errors: [err.message],
      });
    }
  });

  return directoryRouter;
};
