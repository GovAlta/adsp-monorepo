import { DirectoryRepository } from '../../repository';
import { DirectoryEntry, Service } from '../../types';

interface URNComponent {
  scheme?: string;
  nic?: string;
  core?: string;
  service?: string;
  apiVersion?: string;
  resource?: string;
}

export const getUrn = (component: URNComponent) => {
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
  if (!directory || !directory.services) {
    return [];
  }
  const services = directory.services;

  const response = [];

  for (const service of services) {
    const entry = getEntry(namespace, service);
    response.push(entry);
  }

  return response;
};

export const getEntry = (namespace: string, service: Service): DirectoryEntry => {
  const element = {};
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
  return element as DirectoryEntry;
};
