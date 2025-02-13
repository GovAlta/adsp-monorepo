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
   * Retrieves latest configuration revision for a service.
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
   * Retrieves active configuration revision, with fallback to latest, for the service initialized with the SDK under its service account context.
   *
   * @template C Type of the configuration.
   * @template R Type of the combined tenant and core configuration.
   * @param {string} [name] Name of the configuration to retrieve. Required when the service uses its own configuration namespace.
   * @param {AdspId} [tenantId] Tenant to retrieve configuration for. Only used in platform (multi-tenant) services.
   * @returns {Promise<R>}
   * @memberof ConfigurationService
   */
  getServiceConfiguration<C, R = [C, C, number?]>(name?: string, tenantId?: AdspId): Promise<R>;
}

interface Revision<C> {
  configuration: C;
  revision?: number;
}

function isRevision<C>(value: unknown): value is Revision<C> {
  return typeof value?.['revision'] === 'number';
}

export class ConfigurationServiceImpl implements ConfigurationService {
  private readonly LOG_CONTEXT = { context: 'ConfigurationService' };

  #configuration: NodeCache;

  #converter: ConfigurationConverter = (value: unknown) => value;

  #combine: CombineConfiguration = (
    tenantConfig: unknown,
    coreConfig: unknown,
    _tenantId?: AdspId,
    revision?: number
  ) => [tenantConfig, coreConfig, revision];

  constructor(
    private readonly serviceId: AdspId,
    private readonly logger: Logger,
    private readonly directory: ServiceDirectory,
    private readonly tokenProvider: TokenProvider,
    private readonly useNamespace = false,
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

  private getCacheKey(namespace: string, name: string, tenantId?: AdspId): string {
    return `${tenantId ? tenantId.toString() + '-' : ''}${namespace}:${name}`;
  }

  @LimitToOne(
    (propertyKey, namespace: string, name: string, _token, tenantId?: AdspId) =>
      `${propertyKey}-${tenantId ? `${tenantId}-` : ''}${namespace}:${name}`
  )
  private async retrieveConfiguration<C>(
    namespace: string,
    name: string,
    token: string,
    tenantId?: AdspId,
    useActive?: boolean
  ): Promise<Revision<C>> {
    this.logger.debug(`Retrieving (${tenantId?.toString() || 'core'}) configuration for ${namespace}${name}...'`, {
      ...this.LOG_CONTEXT,
      tenant: tenantId?.toString(),
    });

    const configurationServiceUrl = await this.directory.getServiceUrl(
      adspId`urn:ads:platform:configuration-service:v2`
    );

    const configUrl = useActive
      ? new URL(`v2/configuration/${namespace}/${name}/active`, configurationServiceUrl)
      : new URL(`v2/configuration/${namespace}/${name}/latest`, configurationServiceUrl);

    this.logger.debug(`Retrieving configuration from ${configUrl}...'`, {
      ...this.LOG_CONTEXT,
      tenant: tenantId?.toString(),
    });

    try {
      const { data } = await axios.get<Revision<C> | C>(configUrl.href, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          tenantId: tenantId?.toString(),
          orLatest: useActive || undefined,
        },
      });

      let value: unknown = data,
        revision: number;
      // Active endpoint returns the revision instead of just the raw configuration value.
      if (useActive && isRevision<C>(data)) {
        value = data?.configuration;
        revision = data?.revision;
      }

      const configuration = (value ? this.#converter(value, tenantId, revision) : null) as C;
      if (configuration) {
        this.#configuration.set(this.getCacheKey(namespace, name, tenantId), {
          configuration,
          revision,
        } as Revision<C>);
        this.logger.info(
          `Retrieved and cached (${tenantId?.toString() || 'core'}) configuration for ${namespace}:${name}.`,
          {
            ...this.LOG_CONTEXT,
            tenant: tenantId?.toString(),
          }
        );
      } else {
        // Cache an empty value to prevent API request every time.
        this.#configuration.set(this.getCacheKey(namespace, name, tenantId), { configuration: null });
        this.logger.info(`Retrieved configuration for ${namespace}:${name} and received no value.`, {
          ...this.LOG_CONTEXT,
          tenant: tenantId?.toString(),
        });
      }

      return { configuration, revision };
    } catch (err) {
      this.logger.warn(`Error encountered in request for configuration of ${namespace}:${name}. ${err}`, {
        ...this.LOG_CONTEXT,
        tenant: tenantId?.toString(),
      });
      return { configuration: null };
    }
  }

  private async getConfigurationFromCacheOrApi<C>(
    namespace: string,
    name: string,
    token: string,
    tenantId?: AdspId,
    useActive = false
  ): Promise<Revision<C>> {
    let configuration: C = null,
      revision: number;
    const cached = this.#configuration.get<Revision<C>>(this.getCacheKey(namespace, name, tenantId));
    if (cached) {
      configuration = cached.configuration;
      revision = cached.revision;

      this.logger.debug(
        `Configuration (${tenantId?.toString() || 'core'}) ${namespace}:${name} retrieved from cache.`,
        {
          ...this.LOG_CONTEXT,
          tenant: tenantId?.toString(),
        }
      );
    } else {
      const { configuration: readConfiguration, revision: readRevision } = await this.retrieveConfiguration<C>(
        namespace,
        name,
        token,
        tenantId,
        useActive
      );

      configuration = readConfiguration;
      revision = readRevision;
    }

    return { configuration, revision };
  }

  getConfiguration = async <C, R = [C, C]>(serviceId: AdspId, token: string, tenantId?: AdspId): Promise<R> => {
    const { namespace, service: name } = serviceId;

    // NOTE: In practice revision is not available when configuration is accessed via this function,
    // since the API endpoint used for latest configuration doesn't include the revision number.
    let tenantConfiguration: C;
    if (tenantId) {
      assertAdspId(tenantId, 'Provided ID is not for a tenant', 'resource');

      const { configuration } = await this.getConfigurationFromCacheOrApi<C>(namespace, name, token, tenantId);
      tenantConfiguration = configuration;
    }

    const { configuration: coreConfiguration } = await this.getConfigurationFromCacheOrApi<C>(namespace, name, token);

    return this.#combine(tenantConfiguration, coreConfiguration, tenantId) as R;
  };

  getServiceConfiguration = async <C, R = [C, C, number?]>(name?: string, tenantId?: AdspId): Promise<R> => {
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

    let tenantConfiguration: C, revision: number;
    const token = await this.tokenProvider.getAccessToken();
    if (tenantId) {
      assertAdspId(tenantId, 'Provided ID is not for a tenant', 'resource');

      const { configuration, revision: tenantRev } = await this.getConfigurationFromCacheOrApi<C>(
        namespace,
        name,
        token,
        tenantId,
        true
      );
      tenantConfiguration = configuration;
      revision = tenantRev;
    }

    const { configuration: coreConfiguration } = await this.getConfigurationFromCacheOrApi<C>(
      namespace,
      name,
      token,
      null,
      true
    );

    return this.#combine(tenantConfiguration, coreConfiguration, tenantId, revision) as R;
  };

  clearCached(tenantId: AdspId, namespace: string, name: string): void {
    if (this.#configuration.del(this.getCacheKey(namespace, name, tenantId)) > 0) {
      this.logger.info(`Cleared cached configuration for ${namespace}:${name} of tenant ${tenantId}.`, {
        ...this.LOG_CONTEXT,
        tenant: tenantId?.toString(),
      });
    }
  }
}
