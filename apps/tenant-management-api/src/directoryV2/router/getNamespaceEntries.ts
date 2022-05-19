import { DirectoryRepository } from '../../directory/repository';
import { URNComponent } from './directory';

const getUrn = (component: URNComponent) => {
  let urn = `${component.scheme}:${component.nic}:${component.core}:${component.service}`;
  urn = component.apiVersion ? `${urn}:${component.apiVersion}` : urn;
  urn = component.resource ? `${urn}:${component.resource}` : urn;
  return urn;
};

export const getNamespaceEntries = async (
  directoryRepository: DirectoryRepository,
  namespace: string
): Promise<URNComponent[]> => {
  const directory = await directoryRepository.getDirectories(namespace);
  if (!directory) {
    return [];
  }
  const services = directory.services;

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

  return response;
};
