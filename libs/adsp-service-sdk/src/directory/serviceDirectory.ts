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

/**
 * Service directory interface that provides lookup of service URLs.
 *
 * @export
 * @interface ServiceDirectory
 */
export interface ServiceDirectory {
  /**
   * Function to retrieve the URL of a service based on its ADSP URN.
   *
   * @param {AdspId} serviceId
   * @returns {Promise<URL>}
   * @memberof ServiceDirectory
   */
  getServiceUrl(serviceId: AdspId): Promise<URL>;
  getResourceUrl(resourceId: AdspId): Promise<URL>;
}

export class ServiceDirectoryImpl implements ServiceDirectory {
  private readonly LOG_CONTEXT = { context: 'ServiceDirectory' };

  #directoryCache = new NodeCache({
    stdTTL: 36000,
    useClones: false,
  });

  constructor(
    private readonly logger: Logger,
    private readonly directoryUrl: URL,
    private readonly tokenProvider: TokenProvider
  ) {}

  #getOverrideEnv = (urn: string): string => {
    try {
      const entryId = AdspId.parse(urn);
      assertAdspId(entryId, 'Directory entry must be a service or API.', 'service', 'api');
      const namespace = entryId.namespace.toUpperCase().replace(/[ -]/g, '_');
      const service = entryId.service.toUpperCase().replace(/[ -]/g, '_');
      const api = entryId.api?.toUpperCase().replace(/[ -]/g, '_');
      return `DIR_${namespace}_${service}${api ? `_${api}` : ''}`;
    } catch (err) {
      this.logger.debug(`Error resolving override env variable name for: ${urn}`, this.LOG_CONTEXT);
    }
  };

  #tryRetrieveDirectory = async (requestUrl: URL, count: number): Promise<{ urn: string; serviceUrl: URL }[]> => {
    this.logger.debug(`Try ${count}: retrieve directory entries...`, this.LOG_CONTEXT);

    const token = await this.tokenProvider.getAccessToken();
    const { data } = await axios.get<DirectoryEntry[]>(requestUrl.href, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return data
      .map(({ urn, url }) => {
        let serviceUrl: URL = null;
        try {
          const overrideEnv = this.#getOverrideEnv(urn);
          const override = process.env[overrideEnv];
          if (override) {
            this.logger.info(
              `Overrode entry ${urn} with value from env variable ${overrideEnv}: ${override}`,
              this.LOG_CONTEXT
            );
            url = override;
          }
          serviceUrl = new URL(url);
          this.logger.debug(`Cached service directory entry ${urn} -> ${serviceUrl}`, this.LOG_CONTEXT);
        } catch (err) {
          this.logger.error(
            `Error encountered caching entry '${urn}'; entry url may be invalid: ${url}`,
            this.LOG_CONTEXT
          );
        }

        return { urn, serviceUrl };
      })
      .filter(({ serviceUrl }) => serviceUrl);
  };

  #retrieveDirectory = async (namespace: string): Promise<void> => {
    const url = new URL(`/directory/v2/namespaces/${namespace}/entries`, this.directoryUrl);

    try {
      const results = await retry(async (next, count) => {
        try {
          return await this.#tryRetrieveDirectory(url, count);
        } catch (err) {
          this.logger.debug(`Try ${count} failed with error. ${err}`, this.LOG_CONTEXT);
          next(err);
        }
      });
      results.forEach(({ urn, serviceUrl }) => {
        this.#directoryCache.set(urn, serviceUrl);
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
      await this.#retrieveDirectory(id.namespace);
      value = this.#directoryCache.get<URL>(key);
      if (!value) {
        throw new Error(`Failed to find directory entry for ${key}`);
      }
    }

    return value;
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
