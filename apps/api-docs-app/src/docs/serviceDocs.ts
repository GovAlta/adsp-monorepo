import { adspId, AdspId, LimitToOne, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
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
  invalidate(id: AdspId): void;
  refresh(id: AdspId): Promise<Record<string, ServiceDoc>>;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const withRetry = async <T>(fn: () => Promise<T>, retries = 3, delayMs = 1000): Promise<T> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries) throw err;
      await delay(delayMs * attempt);
    }
  }
};

class ServiceDocsImpl {
  private readonly cache = new NodeCache();

  constructor(
    private readonly logger: Logger,
    private readonly directory: ServiceDirectory,
    private readonly tokenProvider: TokenProvider
  ) {}

  #retrieveDocJson = async (docUrl): Promise<JsonObject | void> => {
    try {
      const doc = (await withRetry(() => axios.get(docUrl)))?.data as JsonObject;
      if (doc?.openapi) {
        return doc;
      }
    } catch (err) {
      this.logger.warn(`Failed retrieving doc from ${docUrl}`);
    }
  };

  #retrieveDocEntries = async (tenant?: string): Promise<Record<string, ServiceDoc>> => {
    const directoryServiceUrl = await this.directory.getServiceUrl(adspId`urn:ads:platform:directory-service`);
    const docs = {} as Record<string, ServiceDoc>;

    if (tenant) {
      const namespace = toKebabName(tenant);

      const tenantDirectoryUrl = new URL(`directory/v2/namespaces/${namespace}/entries`, directoryServiceUrl);

      let data: Array<Directory>;
      try {
        ({ data } = await axios.get<Array<Directory>>(tenantDirectoryUrl.href));
      } catch (err) {
        this.logger.warn(`Failed retrieving directory entries for namespace ${namespace}: ${err.message}`);
        return docs;
      }
      if (!Array.isArray(data)) {
        this.logger.warn(`Unexpected response shape for namespace ${namespace} directory entries`);
        return docs;
      }
      for (const entry of data) {
        const url = entry.url;
        try {
          const id = adspId`${entry.urn}`;
          if (id.type === 'service') {
            const serviceDirectoryUrl = new URL(
              `directory/v2/namespaces/${namespace}/services/${id.service}`,
              directoryServiceUrl.href
            );
            const { metadata } = (
              await withRetry(() => axios.get<DirectoryServiceResponse>(serviceDirectoryUrl.href))
            ).data;
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
          }
        } catch (err) {
          this.logger.warn(`Failed processing entry ${entry.urn}: ${err.message}`);
        }
      }
    }

    this.logger.info(`Retrieved service API docs for: ${Object.keys(docs).join(', ')}`);
    return docs;
  };

  @LimitToOne((propertyKey, namespace: string, force = false) => (force ? '' : `${propertyKey}:${namespace}`))
  private async loadNamespace(namespace: string, force = false): Promise<void> {
    const docs = await this.#retrieveDocEntries(namespace);
    this.cache.set(namespace, docs);
  }

  async getDocs(id?: AdspId): Promise<Record<string, ServiceDoc>> {
    // Kick off background loads without awaiting — callers get whatever is currently cached.
    if (!this.cache.keys().includes(id.namespace)) {
      this.loadNamespace(id.namespace).catch((err) => this.logger.warn(`Failed loading namespace ${id.namespace}: ${err.message}`));
    }
    if (id.namespace !== 'platform' && !this.cache.keys().includes('platform')) {
      this.loadNamespace('platform').catch((err) => this.logger.warn(`Failed loading namespace platform: ${err.message}`));
    }

    const mergedDocs: Record<string, ServiceDoc> =
      id.namespace === 'platform'
        ? { ...(this.cache.get<Record<string, ServiceDoc>>('platform') ?? {}) }
        : {
            ...(this.cache.get<Record<string, ServiceDoc>>('platform') ?? {}),
            ...(this.cache.get<Record<string, ServiceDoc>>(id.namespace) ?? {}),
          };

    if (id.type === 'service') {
      const docs: Record<string, ServiceDoc> = {};
      let doc = id.toString() in mergedDocs ? { ...mergedDocs[id.toString()] } : null;

      if (doc) {
        if (doc?.docUrl && !doc?.docs) {
          const docJson = await this.#retrieveDocJson(doc.docUrl);
          if (docJson) {
            docJson.servers = [{ url: doc.url }];
            doc = { ...doc, docs: docJson };
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

  invalidate(id: AdspId): void {
    if (this.cache.keys().includes(id.namespace)) {
      this.cache.del(id.namespace);
      this.loadNamespace(id.namespace).catch((err) => this.logger.warn(`Failed reloading namespace ${id.namespace}: ${err.message}`));
    }
  }

  async refresh(id: AdspId): Promise<Record<string, ServiceDoc>> {
    this.cache.del(id.namespace);
    await this.loadNamespace(id.namespace, true);
    return this.getDocs(id);
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
