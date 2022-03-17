import { adspId, AdspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import * as NodeCache from 'node-cache';
import { JsonObject } from 'swagger-ui-express';
import { Logger } from 'winston';

interface ServiceDoc {
  service: {
    id: AdspId;
    name: string;
  };
  docs: JsonObject;
  url: string;
}

export interface ServiceDocs {
  getDocs(namespace?: string): Promise<Record<string, ServiceDoc>>;
}

class ServiceDocsImpl {
  private readonly cache = new NodeCache({
    stdTTL: 3600,
  });

  constructor(
    private readonly logger: Logger,
    private readonly directory: ServiceDirectory,
    private readonly tokenProvider: TokenProvider
  ) {}

  #AdspIdToDocName = (id: AdspId) => {
    const capitalizeFirstChar = (string) => {
      return string.charAt(0).toUpperCase() + string.slice(1);
    };

    const displayServiceName = id.service
      .split('-')
      .map((word) => {
        return capitalizeFirstChar(word);
      })
      .join(' ');

    return `${capitalizeFirstChar(id.namespace)}  ${displayServiceName}`;
  };

  #retrieveDocs = async (namespace?: string): Promise<Record<string, ServiceDoc>> => {
    this.logger.debug('Retrieving service API docs...');
    const metadataList = await this.directory.getMetadataByNamespaces([namespace, 'platform']);
    const docs = {} as Record<string, ServiceDoc>;
    for (const urn in metadataList) {
      try {
        const metadata = metadataList[urn];
        const serviceId = adspId`${urn}`;

        if (metadata?._links?.doc) {
          const url = metadata._links.doc;
          try {
            this.logger.debug(`Retrieving API docs for service ${serviceId} ...`);
            const { data } = await axios.get(url);

            if (data.openapi) {
              data.servers = [{ url }];
              docs[serviceId.toString()] = {
                service: {
                  id: serviceId,
                  name: metadata?.displayName || metadata?.name || this.#AdspIdToDocName(serviceId),
                },
                docs: data,
                url,
              };
            }
          } catch (err) {
            this.logger.warn(`Failed fetching swagger json from: ${url} `);
          }
        } else {
          this.logger.debug(`${serviceId} does not have docs href`);
        }
      } catch (err) {
        this.logger.warn(`Error encountered in getting docs: ${err}`);
      }
    }

    this.logger.info(`Retrieved service API docs for: ${Object.keys(docs).join(', ')}`);
    return docs;
  };

  async getDocs(namespace?: string): Promise<Record<string, ServiceDoc>> {
    const key = 'docs';
    let docs = this.cache.get<Record<string, ServiceDoc>>(key);
    if (!docs) {
      docs = await this.#retrieveDocs(namespace);
      this.cache.set(key, docs);
    }
    return docs;
  }
}

interface ServiceDocProps {
  logger: Logger;
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
}

export const createServiceDocs = ({ logger, directory, tokenProvider }: ServiceDocProps): ServiceDocs => {
  return new ServiceDocsImpl(logger, directory, tokenProvider);
};
