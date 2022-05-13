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
  docs?: JsonObject;
  url: string;
  docUrl?: string;
}

interface Metadata {
  displayName?: string;
  _links?: {
    self?: string;
    docs?: {
      href: string;
    };
  };
  name?: string;
}

interface DirectoryServiceResponse {
  name?: string;
  description?: string;
  displayName?: string;
  metadata: Metadata;
}

interface Directory {
  url: string;
  namespace: string;
  urn: string;
  name: string;
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

  #retrieveDocJson = async (docUrl): Promise<JsonObject | void> => {
    try {
      const doc = (await axios.get(docUrl))?.data as JsonObject;
      if (doc?.openapi) {
        return doc;
      }
    } catch (err) {
      this.logger.warn(`Failed retrieving doc from ${docUrl}`);
    }
  };

  #retrieveDocEntries = async (tenant?: string): Promise<Record<string, ServiceDoc>> => {
    const directoryServiceUrl = await this.directory.getServiceUrl(adspId`urn:ads:platform:tenant-service`);
    const docs = {} as Record<string, ServiceDoc>;

    if (tenant) {
      const namespace = toKebabName(tenant);

      const tenantDirectoryUrl = new URL(`api/directory/v2/namespaces/${namespace}/entries`, directoryServiceUrl);

      const { data } = await axios.get<Array<Directory>>(tenantDirectoryUrl.href);
      for (const entry of data) {
        const url = entry.url;
        const id = adspId`${entry.urn}`;
        if (id.type === 'service') {
          try {
            const serviceDirectoryUrl = new URL(
              `api/directory/v2/namespaces/${namespace}/services/${id.service}`,
              directoryServiceUrl.href
            );
            const { metadata } = (await axios.get<DirectoryServiceResponse>(serviceDirectoryUrl.href)).data;
            if (metadata?._links?.docs?.href) {
              docs[id.toString()] = {
                service: {
                  id: id,
                  name: metadata?.displayName || metadata?.name,
                },
                url,
                docUrl: metadata?._links?.docs?.href,
              };
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
      const docs = await this.#retrieveDocEntries(id.namespace);
      this.cache.set(id.namespace, docs);
    }
    // Avoid re-cache of platform
    if (id.namespace !== 'platform' && !namespaces.includes('platform')) {
      const docs = await this.#retrieveDocEntries('platform');
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
      let doc = id.toString() in mergedDocs ? { ...mergedDocs[id.toString()] } : null;

      if (doc) {
        // metadata has been fetched, but the actual doc swagger has not
        if (doc?.docUrl && !doc?.docs) {
          const docJson = await this.#retrieveDocJson(doc.docUrl);
          if (docJson) {
            doc = {
              ...doc,
              docs: docJson,
            };
            mergedDocs[id.toString()] = doc;
            this.cache.set(id.namespace, { ...mergedDocs });
          }
        }
        docs[id.toString()] = doc;
      }
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
