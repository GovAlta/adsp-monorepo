import { adspId, AdspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import * as NodeCache from 'node-cache';
import { JsonObject } from 'swagger-ui-express';
import { Logger } from 'winston';
import { toKebabName } from '@abgov/adsp-service-sdk';

interface ServiceDoc {
  service: {
    id: AdspId;
    name: string;
  };
  docs: JsonObject;
  url: string;
}

interface DirectoryMetadata {
  name?: string;
  description?: string;
  displayName?: string;
  _links?: {
    self?: string;
    doc?: string;
    health?: string;
    api?: Array<Record<string, any>>;
  };
}

export interface ServiceDocs {
  getDocs(id: AdspId): Promise<Record<string, ServiceDoc>>;
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

  #retrieveDocs = async (tenant?: string): Promise<Record<string, ServiceDoc>> => {
    const directoryServiceUrl = await this.directory.getServiceUrl(adspId`urn:ads:platform:tenant-service`);
    const docs = {} as Record<string, ServiceDoc>;

    if (tenant) {
      const namespace = toKebabName(tenant);

      const tenantDirectoryUrl = new URL(`api/directory/v2/namespaces/${namespace}`, directoryServiceUrl);

      const { data } = await axios.get<Record<string, string>>(tenantDirectoryUrl.href);
      for (const entry of Object.entries(data)) {
        const urn = entry[0];
        const url = entry[1];
        const id = adspId`${urn}`;
        if (id.type === 'service') {
          try {
            const serviceDirectoryUrl = new URL(
              `api/directory/v2/namespaces/${namespace}/services/${id.service}`,
              directoryServiceUrl.href
            );
            const { data: metadata } = await axios.get<DirectoryMetadata>(serviceDirectoryUrl.href);
            if (metadata?._links?.doc) {
              const docUrl = metadata?._links?.doc;
              this.logger.debug(`Retrieving API docs for service ${id} ...`);

              const { data: docData } = await axios.get(docUrl);
              if (docData.openapi) {
                docData.servers = [{ url }];
                docs[id.toString()] = {
                  service: {
                    id: id,
                    name: docData?.info?.title || metadata?.displayName || metadata?.name,
                  },
                  docs: docData,
                  url,
                };
              }
            }
          } catch (err) {
            this.logger.warn(`Failed retrieving docs for ${id} with error ${err.message}`);
          }
        }
      }
    }

    this.logger.info(`Retrieved service API docs for: ${Object.keys(docs).join(', ')}`);
    return docs;
  };

  async getDocs(id?: AdspId): Promise<Record<string, ServiceDoc>> {
    const namespaces = this.cache.keys();
    let mergedDocs: Record<string, ServiceDoc> = {};
    const docs: Record<string, ServiceDoc> = {};

    if (!namespaces.includes(id.namespace)) {
      const docs = await this.#retrieveDocs(id.namespace);
      this.cache.set(id.namespace, docs);
    }
    // Avoid re-cache of platform
    if (id.namespace !== 'platform' && !namespaces.includes('platform')) {
      const docs = await this.#retrieveDocs('platform');
      this.cache.set('platform', docs);
    }

    if (id.namespace === 'platform') {
      mergedDocs = {
        ...this.cache.get<Record<string, ServiceDoc>>('platform'),
      };
    } else {
      // Merge the platform and tenant docs
      mergedDocs = {
        ...this.cache.get<Record<string, ServiceDoc>>('platform'),
        ...this.cache.get<Record<string, ServiceDoc>>(id.namespace),
      };
    }

    if (id.type === 'service') {
      docs[id.toString()] = id.toString() in mergedDocs ? mergedDocs[id.toString()] : null;
      return docs;
    }
    return mergedDocs;
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
