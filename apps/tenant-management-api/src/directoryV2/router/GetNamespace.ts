import { NextFunction, Request, Response } from 'express';
import { DirectoryRepository } from '../../directory/repository';
import { Service } from '../../directory/types';
import { URNComponent } from './directory';

const getUrn = (component: URNComponent) => {
  let urn = `${component.scheme}:${component.nic}:${component.core}:${component.service}`;
  urn = component.apiVersion ? `${urn}:${component.apiVersion}` : urn;
  urn = component.resource ? `${urn}:${component.resource}` : urn;
  return urn;
};

export const getNamespace =
  (directoryRepository: DirectoryRepository) =>
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    let services: Service[];
    const { namespace } = req.params;
    try {
      const directory = await directoryRepository.getDirectories(namespace);
      if (!directory) {
        res.json([]);
        return;
      }
      services = directory.services;
    } catch (err) {
      _next(err);
      return;
    }

    const response = [];

    for (const service of services) {
      const element = {};
      element['_id'] = service._id;
      element['namespace'] = namespace;
      element['service'] = service.service;
      element['url'] = service.host;

      const component: URNComponent = {
        scheme: 'urn',
        nic: 'ads',
        core: namespace,
        service: service.service,
      };
      element['urn'] = getUrn(component);

      response.push(element);
    }

    res.json(response);
  };
