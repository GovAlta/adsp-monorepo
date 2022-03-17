import axios from 'axios';
import * as NodeCache from 'node-cache';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const retry = require('promise-retry');
import type { Logger } from 'winston';
import { TokenProvider } from '../access';
import { adspId, AdspId, assertAdspId } from '../utils';

interface DirectoryEntry {
  urn: string;
  url: string;
}

export interface DirectoryMetadata {
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

export interface ServiceDirectory {
  getServiceUrl(serviceId: AdspId): Promise<URL>;
  getResourceUrl(resourceId: AdspId): Promise<URL>;
  getMetadataByNamespaces(namespaces: string[]): Promise<Record<string, DirectoryMetadata>>;
}

export class ServiceDirectoryImpl implements ServiceDirectory {
  private readonly LOG_CONTEXT = { context: 'ServiceDirectory' };

  #directoryCache = new NodeCache({
    stdTTL: 36000,
    useClones: false,
  });

  #directoryMetadataCache = new NodeCache({
    stdTTL: 36000,
    useClones: false,
  });

  constructor(
    private readonly logger: Logger,
    private readonly directoryUrl: URL,
    private readonly tokenProvider: TokenProvider
  ) {}

  #tryRetrieveDirectoryMetaData = async (requestUrl: URL): Promise<DirectoryMetadata> => {
    const { data } = await axios.get<DirectoryMetadata>(requestUrl.href);
    return data;
  };

  #tryRetrieveDirectory = async (requestUrl: URL, count: number): Promise<{ urn: string; serviceUrl: URL }[]> => {
    this.logger.debug(`Try ${count}: retrieve directory entries...`, this.LOG_CONTEXT);
    const token = await this.tokenProvider.getAccessToken();
    const { data } = await axios.get<DirectoryEntry[]>(requestUrl.href, {
      headers: { Authorization: `Bearer ${token}` },
    });

    let directories = null;
    // consolidate directory v1 and v2 fetch endpoint schema
    if (Array.isArray(data)) {
      directories = data;
    } else {
      directories = Object.entries(data).map((e) => {
        return {
          urn: e[0],
          url: e[1],
        };
      });
    }

    return directories.map(({ urn, url }) => {
      let serviceUrl = null;
      try {
        serviceUrl = new URL(url);
        this.logger.debug(`Cached service directory entry ${urn} -> ${serviceUrl}`, this.LOG_CONTEXT);
      } catch (err) {
        this.logger.error(
          `Error encountered caching entry '${urn}'; entry url may be invalid: ${url}`,
          this.LOG_CONTEXT
        );
      }

      return { urn, serviceUrl };
    });
  };

  #retrieveDirectory = async (namespace?: string): Promise<void> => {
    let url = null;

    if (namespace === undefined) {
      // fetch the default platform directories
      url = new URL('/api/discovery/v1', this.directoryUrl);
    } else {
      // fetch the tenant platform directories by namespace
      url = new URL(`api/directory/v2/namespaces/${namespace}`, this.directoryUrl);
    }

    try {
      const results = await retry(async (next, count) => {
        try {
          return await this.#tryRetrieveDirectory(url, count);
        } catch (err) {
          this.logger.debug(`Try ${count} failed with error. ${err}`, this.LOG_CONTEXT);
          next(err);
        }
      });

      results.forEach(async ({ urn, serviceUrl }) => {
        this.#directoryCache.set(urn, serviceUrl);
        // Start to cache metadata
        try {
          const id = adspId`${urn}`;
          if (id.type === 'service') {
            const url = new URL(
              `/api/directory/v2/namespaces/${id.namespace}/services/${id.service}`,
              this.directoryUrl
            );
            const metadata = await this.#tryRetrieveDirectoryMetaData(url);
            this.#directoryMetadataCache.set(urn, metadata);
            this.logger.info(`Updated the directory metadata for urn: ${urn}.`);
          }
        } catch (err) {
          this.logger.warn(`Unable to retrieve metadata for ${urn}: ${err.message}`);
        }
      });
      this.logger.info(`Retrieved service directory from ${url}.`, this.LOG_CONTEXT);
    } catch (err) {
      this.logger.error(`Error encountered retrieving directory. ${err}`, this.LOG_CONTEXT);
    }
  };

  async getServiceUrl(id: AdspId): Promise<URL> {
    assertAdspId(id, 'Provided ID is not for a Service or API.', 'api', 'service');

    const key = `${id}`;
    let value = this.#directoryCache.get<URL>(key);
    if (!value) {
      await this.#retrieveDirectory();
      value = this.#directoryCache.get<URL>(key);
      if (!value) {
        throw new Error(`Failed to find directory entry for ${key}`);
      }
    }

    return value;
  }

  #retrieveServiceUrlByNamespaces = async (namespaces: string[]): Promise<void> => {
    namespaces.forEach(async (namespace) => {
      await this.#retrieveDirectory(namespace);
    });
  };

  async getMetadataByNamespaces(namespaces: string[]): Promise<Record<string, DirectoryMetadata>> {
    const URNs = this.#directoryMetadataCache.keys() as string[];
    const metadata: Record<string, DirectoryMetadata> = {};
    let hasUpdated = false;

    await URNs.forEach(async (urn) => {
      const id = adspId`${urn}`;
      if (namespaces.includes(id.namespace)) {
        let data = this.#directoryMetadataCache.get(urn);
        if (data === null && !hasUpdated) {
          this.logger.debug(
            `There is no cache for ${urn}. Try to fetch data from remote for namespaces: ${namespaces}`
          );
          await this.#retrieveServiceUrlByNamespaces(namespaces);
          data = this.#directoryMetadataCache.get(urn);
          hasUpdated = true;
        }
        if (data) {
          metadata[urn] = data;
        }
      }
    });

    return metadata;
  }

  async getResourceUrl(id: AdspId): Promise<URL> {
    assertAdspId(id, 'Provided ID is not for a Resource.', 'resource');
    const serviceUrl = await this.getServiceUrl(adspId`urn:ads:${id.namespace}:${id.service}:${id.api}`);
    // Trim any trailing slash on API url and leading slash on resource
    const resourceUrl = new URL(
      `${serviceUrl.pathname.replace(/\/$/g, '')}/${id.resource.replace(/^\//, '')}`,
      serviceUrl
    );

    return resourceUrl;
  }
}
