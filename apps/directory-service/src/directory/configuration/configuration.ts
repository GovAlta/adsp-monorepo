import { AdspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import { ResourceType } from '../model';
import { DirectoryConfigurationValue } from './types';
import { Logger } from 'winston';
import { DirectoryRepository } from '../repository';
import { DomainEvent } from '@core-services/core-common';

interface ConfigurationProps {
  logger: Logger;
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
  repository: DirectoryRepository;
}

export class DirectoryConfiguration {
  private resourceTypesByApi: Record<string, ResourceType[]> = {};
  private resourceTypesByDeleteEvent: Record<string, ResourceType> = {};

  constructor(
    { logger, directory, tokenProvider, repository }: ConfigurationProps,
    tenant: DirectoryConfigurationValue,
    core: DirectoryConfigurationValue,
    tenantId: AdspId
  ) {
    Object.entries({ ...tenant, ...core }).forEach(([api, apiConfiguration]) => {
      const apiResourceTypes = [];
      apiConfiguration?.resourceTypes?.forEach((type) => {
        try {
          const resourceType = new ResourceType(logger, directory, tokenProvider, repository, type);
          apiResourceTypes.push(resourceType);

          if (type.deleteEvent?.namespace && type.deleteEvent?.name) {
            this.resourceTypesByDeleteEvent[`${type.deleteEvent?.namespace}:${type.deleteEvent?.name}`] = resourceType;
          }
        } catch (err) {
          logger.warn(`Error encountered on initializing resource type ${type?.type} from configuration`, {
            context: 'ConfigurationConverter',
            tenant: tenantId?.toString(),
          });
        }
      });

      if (apiResourceTypes.length > 0) {
        this.resourceTypesByApi[api] = apiResourceTypes;
      }
    });
  }

  public getResourceType(resourceId: AdspId): ResourceType {
    const apiId = `urn:ads:${resourceId.namespace}:${resourceId.service}:${resourceId.api}`;
    const types = this.resourceTypesByApi[apiId];
    const type = types?.find((type) => type.matches(resourceId));

    return type;
  }

  public getResourceTypeForDeleteEvent(event: DomainEvent): ResourceType {
    let resourceType: ResourceType;
    if (event?.namespace && event?.name) {
      resourceType = this.resourceTypesByDeleteEvent[`${event.namespace}:${event.name}`];
    }

    return resourceType;
  }
}