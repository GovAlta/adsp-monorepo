import { DirectoryRepository } from '../../repository';
import { AdspId, adspId } from '@abgov/adsp-service-sdk';
import { DirectoryEntry, Service } from '../../types';

interface URNComponent {
  scheme?: string;
  nic?: string;
  core?: string;
  service?: string;
  apiVersion?: string;
  resource?: string;
}

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

//eslint-disable-next-line
export const getServiceUrlById = async (serviceId: AdspId, directoryRepository: DirectoryRepository) => {
  let directories = [];
  try {
    directories = await getNamespaceEntries(directoryRepository, 'platform');
    const entry = directories.find((entry) => entry.urn === `${serviceId}`);
    if (!entry) {
      throw new Error(`Directory entry for ${serviceId} not found.`);
    }
    return new URL(entry.url);
  } catch (err) {
    console.log(err);
    return null;
  }
};
//eslint-disable-next-line
export const getResourceUrlById = async (serviceId: AdspId, directoryRepository: DirectoryRepository) => {
  const serviceUrl = await getServiceUrlById(
    adspId`urn:ads:${serviceId.namespace}:${serviceId.service}:${serviceId.api}`,
    directoryRepository
  );
  // Trim any trailing slash on API url and leading slash on resource
  const resourceUrl = new URL(
    `${serviceUrl.pathname.replace(/\/$/g, '')}/${serviceId.resource.replace(/^\//, '')}`,
    serviceUrl
  );

  return resourceUrl;
};
