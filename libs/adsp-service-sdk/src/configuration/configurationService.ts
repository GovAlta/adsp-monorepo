import axios from 'axios';
import moize from 'moize';
import * as NodeCache from 'node-cache';
import type { Logger } from 'winston';
import { ServiceDirectory } from '../directory';
import { adspId, AdspId, assertAdspId, LimitToOne } from '../utils';
import type { CombineConfiguration, ConfigurationConverter } from './configuration';
import { TokenProvider } from '../access';

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

  /**
   * Retrieves configuration for the service initialized with the SDK under its service account context.
   *
   * @template C Type of the configuration.
   * @template R Type of the combined tenant and core configuration.
   * @param {string} [name] Name of the configuration to retrieve. Required when the service uses its own configuration namespace.
   * @param {AdspId} [tenantId] Tenant to retrieve configuration for. Only used in platform (multi-tenant) services.
   * @returns {Promise<R>}
   * @memberof ConfigurationService
   */
  getServiceConfiguration<C, R = [C, C]>(name?: string, tenantId?: AdspId): Promise<R>;
}

export class ConfigurationServiceImpl implements ConfigurationService {
  private readonly LOG_CONTEXT = { context: 'ConfigurationService' };

  #configuration: NodeCache;

  #converter: ConfigurationConverter = (value: unknown) => value;

  #combine: CombineConfiguration = (tenantConfig: unknown, coreConfig: unknown) => [tenantConfig, coreConfig];

  constructor(
    private readonly serviceId: AdspId,
    private readonly logger: Logger,
    private readonly directory: ServiceDirectory,
    private readonly tokenProvider: TokenProvider,
    private readonly useNamespace = false,
    private readonly useActive = false,
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
    (propertyKey, namespace: string, name: string, _token, tenantId?: AdspId) =>
      `${propertyKey}-${tenantId ? `${tenantId}-` : ''}${namespace}:${name}`
  )
  private async retrieveConfiguration<C>(
    namespace: string,
    name: string,
    token: string,
    tenantId?: AdspId
  ): Promise<C> {
    this.logger.debug(
      `Retrieving tenant '${tenantId?.toString() || 'core'}' configuration for ${namespace}${name}...'`,
      {
        ...this.LOG_CONTEXT,
        tenant: tenantId?.toString(),
      }
    );

    const configurationServiceUrl = await this.directory.getServiceUrl(
      adspId`urn:ads:platform:configuration-service:v2`
    );

    const configUrl = this.useActive
      ? new URL(`v2/configuration/${namespace}/${name}/active`, configurationServiceUrl)
      : new URL(`v2/configuration/${namespace}/${name}/latest`, configurationServiceUrl);

    this.logger.debug(`Retrieving configuration from ${configUrl}...'`, {
      ...this.LOG_CONTEXT,
      tenant: tenantId?.toString(),
    });

    try {
      let { data } = await axios.get(configUrl.href, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          tenantId: tenantId?.toString(),
          orLatest: this.useActive || undefined,
        },
      });

      // Active endpoint returns the revision instead of just the raw configuration value.
      if (this.useActive) {
        data = data?.configuration;
      }

      const config = (data ? this.#converter(data, tenantId) : null) as C;
      if (config) {
        this.#configuration.set(`${tenantId ? tenantId.toString() + '-' : ''}${namespace}:${name}`, config);
        this.logger.info(
          `Retrieved and cached '${tenantId?.toString() || 'core'}' configuration for ${namespace}:${name}.`,
          {
            ...this.LOG_CONTEXT,
            tenant: tenantId?.toString(),
          }
        );
      } else {
        this.logger.info(`Retrieved configuration for ${namespace}:${name} and received no value.`, {
          ...this.LOG_CONTEXT,
          tenant: tenantId?.toString(),
        });
      }

      return config;
    } catch (err) {
      this.logger.warn(`Error encountered in request for configuration of ${namespace}:${name}. ${err}`, {
        ...this.LOG_CONTEXT,
        tenant: tenantId?.toString(),
      });
      return null as C;
    }
  }

  getConfiguration = async <C, R = [C, C]>(serviceId: AdspId, token: string, tenantId?: AdspId): Promise<R> => {
    const { namespace, service: name } = serviceId;
    let tenantConfiguration = null;
    if (tenantId) {
      assertAdspId(tenantId, 'Provided ID is not for a tenant', 'resource');

      tenantConfiguration =
        this.#configuration.get<C>(`${tenantId}-${namespace}:${name}`) ||
        (await this.retrieveConfiguration<C>(namespace, name, token, tenantId)) ||
        null;
    }

    const coreConfiguration =
      this.#configuration.get<C>(`${namespace}:${name}`) ||
      (await this.retrieveConfiguration<C>(namespace, name, token)) ||
      null;

    return this.#combine(tenantConfiguration, coreConfiguration, tenantId) as R;
  };

  getServiceConfiguration = async <C, R = [C, C]>(name?: string, tenantId?: AdspId): Promise<R> => {
    // If the service uses its own namespace for configuration, then service name (e.g. task-service) is the namespace,
    // otherwise the namespace of the service (e.g. platform) is used.
    const namespace = this.useNamespace ? this.serviceId.service : this.serviceId.namespace;
    // If the service uses its own namespace for configuration, then name input param is required,
    // otherwise the service name (e.g. task-service) is used.
    name = this.useNamespace ? name : this.serviceId.service;

    if (!name) {
      throw new Error(
        'Name must be specified if useNamespace is true and service has configuration across a namespace.'
      );
    }

    const token = await this.tokenProvider.getAccessToken();
    let tenantConfiguration = null;
    if (tenantId) {
      assertAdspId(tenantId, 'Provided ID is not for a tenant', 'resource');

      tenantConfiguration =
        this.#configuration.get<C>(`${tenantId}-${namespace}:${name}`) ||
        (await this.retrieveConfiguration<C>(namespace, name, token, tenantId)) ||
        null;
    }

    const coreConfiguration =
      this.#configuration.get<C>(`${namespace}:${name}`) ||
      (await this.retrieveConfiguration<C>(namespace, name, token)) ||
      null;

    return this.#combine(tenantConfiguration, coreConfiguration, tenantId) as R;
  };

  clearCached(tenantId: AdspId, namespace: string, name: string): void {
    if (this.#configuration.del(`${tenantId}-${namespace}:${name}`) > 0) {
      this.logger.info(`Cleared cached configuration for ${namespace}:${name} of tenant ${tenantId}.`, {
        ...this.LOG_CONTEXT,
        tenant: tenantId?.toString(),
      });
    }
  }
}
