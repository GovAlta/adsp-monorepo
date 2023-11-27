import axios from 'axios';
import moize from 'moize';
import * as NodeCache from 'node-cache';
import type { Logger } from 'winston';
import { ServiceDirectory } from '../directory';
import { adspId, AdspId, assertAdspId, LimitToOne } from '../utils';
import type { CombineConfiguration, ConfigurationConverter } from './configuration';

/**
 * Interface to configuration service for retrieval of service configuration.
 *
 * @export
 * @interface ConfigurationService
 */
export interface ConfigurationService {
  /**
   * Retrieves configuration for a service.
   *
   * @template C Type of the configuration.
   * @template R Type of the combined tenant and core configuration.
   * @param {AdspId} serviceId
   * @param {string} token
   * @param {AdspId} tenantId
   * @returns {Promise<R>}
   * @memberof ConfigurationService
   */
  getConfiguration<C, R = [C, C]>(serviceId: AdspId, token: string, tenantId?: AdspId): Promise<R>;
}

export class ConfigurationServiceImpl implements ConfigurationService {
  private readonly LOG_CONTEXT = { context: 'ConfigurationService' };

  #configuration: NodeCache;

  #converter: ConfigurationConverter = (value: unknown) => value;

  #combine: CombineConfiguration = (tenantConfig: unknown, coreConfig: unknown) => [tenantConfig, coreConfig];

  constructor(
    private readonly logger: Logger,
    private readonly directory: ServiceDirectory,
    converter: ConfigurationConverter = null,
    combine: CombineConfiguration = null,
    cacheTTL = 900
  ) {
    this.#configuration = new NodeCache({
      stdTTL: cacheTTL,
      useClones: false,
    });

    if (converter) {
      this.#converter = converter;
    }

    if (combine) {
      // Memoize the combine function in case it is expensive.
      // Note: we might be better served by just caching the combined result in node cache, but for now the tenant
      // and core configuration retrievals are independent requests.
      this.#combine = moize(combine, {
        maxSize: 50,
        matchesArg: (a, b) => {
          if (a instanceof AdspId && b instanceof AdspId) {
            return a.toString() === b.toString();
          } else {
            return a === b;
          }
        },
      });
    }
  }

  @LimitToOne(
    (propertyKey, serviceId: AdspId, _token, tenantId?: AdspId) =>
      `${propertyKey}-${tenantId ? `${tenantId}-` : ''}${serviceId}`
  )
  private async retrieveConfiguration<C>(serviceId: AdspId, token: string, tenantId?: AdspId): Promise<C> {
    const service = serviceId.service;

    this.logger.debug(`Retrieving tenant '${tenantId?.toString() || 'core'}' configuration for ${service}...'`, {
      ...this.LOG_CONTEXT,
      tenant: tenantId?.toString(),
    });

    const configurationServiceUrl = await this.directory.getServiceUrl(
      adspId`urn:ads:platform:configuration-service:v2`
    );

    const configUrl = new URL(
      `v2/configuration/${serviceId.namespace}/${service}/latest${tenantId ? `?tenantId=${tenantId}` : ''}`,
      configurationServiceUrl
    );

    this.logger.debug(`Retrieving configuration from ${configUrl}...'`, {
      ...this.LOG_CONTEXT,
      tenant: tenantId?.toString(),
    });

    try {
      const { data } = await axios.get<C>(configUrl.href, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const config = (data ? this.#converter(data, tenantId) : null) as C;
      if (config) {
        this.#configuration.set(`${tenantId ? tenantId.toString() + '-' : ''}${serviceId}`, config);
        this.logger.info(`Retrieved and cached '${tenantId?.toString() || 'core'}' configuration for ${service}.`, {
          ...this.LOG_CONTEXT,
          tenant: tenantId?.toString(),
        });
      } else {
        this.logger.info(`Retrieved configuration for ${service} and received no value.`, {
          ...this.LOG_CONTEXT,
          tenant: tenantId?.toString(),
        });
      }

      return config;
    } catch (err) {
      this.logger.warn(`Error encountered in request for configuration of ${service}. ${err}`, {
        ...this.LOG_CONTEXT,
        tenant: tenantId?.toString(),
      });
      return null as C;
    }
  }

  getConfiguration = async <C, R = [C, C]>(serviceId: AdspId, token: string, tenantId?: AdspId): Promise<R> => {
    let configuration = null;
    if (tenantId) {
      assertAdspId(tenantId, 'Provided ID is not for a tenant', 'resource');

      configuration =
        this.#configuration.get<C>(`${tenantId}-${serviceId}`) ||
        (await this.retrieveConfiguration<C>(serviceId, token, tenantId)) ||
        null;
    }

    const options =
      this.#configuration.get<C>(`${serviceId}`) || (await this.retrieveConfiguration<C>(serviceId, token)) || null;

    return this.#combine(configuration, options, tenantId) as R;
  };

  clearCached(tenantId: AdspId, serviceId: AdspId): void {
    if (this.#configuration.del(`${tenantId}-${serviceId}`) > 0) {
      this.logger.info(`Cleared cached configuration for ${serviceId} of tenant ${tenantId}.`, {
        ...this.LOG_CONTEXT,
        tenant: tenantId?.toString(),
      });
    }
  }
}
