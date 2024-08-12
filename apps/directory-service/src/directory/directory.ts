import { adspId, AdspId, ServiceDirectory } from '@abgov/adsp-service-sdk';
import * as NodeCache from 'node-cache';
import { Logger } from 'winston';
import { DirectoryRepository } from './repository';
import { getNamespaceEntries } from './router/util';

export class ServiceDirectoryImpl implements ServiceDirectory {
  private readonly LOG_CONTEXT = { context: 'ServiceDirectory' };

  constructor(
    private logger: Logger,
    private repository: DirectoryRepository,
    private directoryCache = new NodeCache({
      stdTTL: 36000,
      useClones: false,
    })
  ) {}

  public async getServiceUrl(serviceId: AdspId): Promise<URL> {
    let url = this.directoryCache.get<URL>(serviceId.toString());

    if (!url) {
      let directories = [];
      try {
        directories = await getNamespaceEntries(this.repository, serviceId.namespace);
        const entry = directories.find((entry) => entry.urn === serviceId.toString());

        if (entry) {
          url = new URL(entry.url);
          this.directoryCache.set(serviceId.toString(), url);
        } else {
          this.logger.warn(`No entry found for ${serviceId}.`, this.LOG_CONTEXT);
        }
      } catch (err) {
        this.logger.warn(`Error retrieving service URL for ${serviceId}: ${err}`, this.LOG_CONTEXT);
      }
    }

    return url;
  }

  public async getResourceUrl(resourceId: AdspId): Promise<URL> {
    let url = this.directoryCache.get<URL>(resourceId.toString());

    if (!url) {
      const serviceUrl = await this.getServiceUrl(
        adspId`urn:ads:${resourceId.namespace}:${resourceId.service}:${resourceId.api}`
      );

      if (serviceUrl) {
        // Trim any trailing slash on API url and leading slash on resource
        url = new URL(
          `${serviceUrl.pathname.replace(/\/$/g, '')}/${resourceId.resource.replace(/^\//, '')}`,
          serviceUrl
        );
        this.directoryCache.set(resourceId.toString(), url);
      }
    }

    return url;
  }
}
