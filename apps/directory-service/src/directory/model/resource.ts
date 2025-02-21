import { AdspId, assertAdspId, ServiceDirectory } from '@abgov/adsp-service-sdk';
import { DomainEvent, InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { property } from 'lodash';
import axios from 'axios';
import { Logger } from 'winston';
import { DirectoryRepository } from '../repository';
import { Resource, ResourceTypeConfiguration } from '../types';

export class ResourceType {
  public type: string;
  private matcher: RegExp;
  private nameGetter: (value: unknown) => string;
  private descriptionGetter: (value: unknown) => string;
  private eventResourceIdGetter: (value: unknown) => string;
  private deleteEventNamespace: string;
  private deleteEventName: string;

  constructor(
    private logger: Logger,
    private directory: ServiceDirectory,
    private repository: DirectoryRepository,
    { type, matcher, namePath, descriptionPath, deleteEvent }: ResourceTypeConfiguration
  ) {
    this.type = type;
    this.matcher = new RegExp(matcher);
    this.nameGetter = namePath ? property(namePath) : () => undefined;
    this.descriptionGetter = descriptionPath ? property(descriptionPath) : () => undefined;
    this.eventResourceIdGetter = deleteEvent?.resourceIdPath ? property(deleteEvent?.resourceIdPath) : () => undefined;
    this.deleteEventNamespace = deleteEvent?.namespace;
    this.deleteEventName = deleteEvent?.name;
  }

  public matches(urn: AdspId): boolean {
    assertAdspId(urn, null, 'resource');
    return this.matcher.test(urn.resource);
  }

  public async resolve(
    token: string,
    resource: Resource,
    sync = false,
    params: Record<string, unknown> = null
  ): Promise<Resource> {
    if (!this.matches(resource?.urn)) {
      throw new InvalidOperationError(`Resource type '${this.type}' not matched to resource: ${resource.urn}`);
    }

    try {
      if (sync) {
        // Set the type since it's a match on the resource URN.
        resource = await this.repository.saveResource({ ...resource, type: this.type });
      }

      const resourceUrl = await this.directory.getResourceUrl(resource.urn);
      if (!resourceUrl) {
        throw new NotFoundError(`Failed to lookup URL for resource: ${resource.urn}.`);
      }

      this.logger.debug(`Retrieving resource ${resource.urn} from: ${resourceUrl}...`, {
        context: 'ResourceType',
        tenant: resource.tenantId?.toString(),
      });

      const { data } = await axios.get(resourceUrl.href, {
        headers: { Authorization: `Bearer ${token}` },
        params: { ...params, tenantId: resource.tenantId?.toString() },
      });

      this.logger.debug(`Retrieved resource ${resource.urn} and resolving name and description...`, {
        context: 'ResourceType',
        tenant: resource.tenantId?.toString(),
      });

      const name = this.nameGetter(data) || resource.name;
      const description = this.descriptionGetter(data) || resource.description;
      if (name !== resource.name || description !== resource.description) {
        resource = sync
          ? await this.repository.saveResource({ ...resource, name, description })
          : { ...resource, name, description };
      }

      return { ...resource, data };
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404 && sync) {
        // If there's a 404, then the resource doesn't exist. This can happen if the resource was deleted before being resolved.
        // Delete the missing resource for consistency.
        await this.repository.deleteResource(resource);
        // Undefined is returned after delete;
        return;
      } else {
        this.logger.warn(`Error encountered resolving resource ${resource.urn}: ${err}`, {
          context: 'ResourceType',
          tenant: resource.tenantId?.toString(),
        });
        // Original resource is returned.
        return resource;
      }
    }
  }

  public async processDeleteEvent(event: DomainEvent): Promise<AdspId> {
    if (!event || event.namespace !== this.deleteEventNamespace || event.name !== this.deleteEventName) {
      throw new InvalidOperationError(
        `Event '${event?.namespace}:${event?.name}' not a delete event for resource type '${this.type}'.`
      );
    }

    const resourceId = this.eventResourceIdGetter(event.payload);
    if (!resourceId || !AdspId.isAdspId(resourceId)) {
      throw new InvalidOperationError(
        `Failed to retrieve resource type '${this.type}' resource ID from event '${event?.namespace}:${event?.name}' payload.`
      );
    }

    const urn = AdspId.parse(resourceId);
    const deleted = await this.repository.deleteResource({ tenantId: event.tenantId, urn });

    return deleted ? urn : null;
  }
}
