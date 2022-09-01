import { AdspId, ConfigurationService, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import { ServiceStatusRepository } from '../repository/serviceStatus';
import { updateConfiguration } from '../router/serviceStatus';
import ServiceStatusApplicationEntity, {
  ApplicationData,
  StaticApplicationData,
  StatusServiceConfiguration,
} from './serviceStatus';

type ConfigurationFinder = (tenantId: AdspId) => Promise<StatusServiceConfiguration>;

export class ApplicationManager {
  #configurationFinder: ConfigurationFinder;
  #repository: ServiceStatusRepository;
  #tokenProvider: TokenProvider;
  #directory: ServiceDirectory;

  constructor(
    tokenProvider: TokenProvider,
    service: ConfigurationService,
    serviceId: AdspId,
    repository: ServiceStatusRepository,
    directory: ServiceDirectory
  ) {
    this.#configurationFinder = this.#getConfigurationFinder(tokenProvider, service, serviceId);
    this.#repository = repository;
    this.#tokenProvider = tokenProvider;
    this.#directory = directory;
  }

  getActiveApps = async () => {
    const apps = await this.#getActiveApplications();
    const tenants = this.#getActiveTenants(apps);
    const configs = await this.#getConfigurations(tenants);
    return this.#merge(apps, configs);
  };

  #getActiveApplications = async () => {
    return this.#repository.findEnabledApplications();
  };

  #getActiveTenants = (apps: ServiceStatusApplicationEntity[]): Set<AdspId> => {
    const tenants = new Set<AdspId>();
    apps.forEach((a) => {
      tenants.add(AdspId.parse(a.tenantId));
    });
    return tenants;
  };

  #getConfigurations = async (tenants: Set<AdspId>) => {
    const promises: Promise<StatusServiceConfiguration>[] = [];
    tenants.forEach((t) => {
      promises.push(this.#configurationFinder(t));
    });
    const configSet = await Promise.all(promises);
    return configSet.reduce((p, c) => {
      if (c) {
        const appKeys = Object.keys(c).filter((k) => {
          return /[a-zA-Z0-9]{12}/gi.test(k);
        });
        appKeys.forEach((k) => {
          p[k] = c[k];
        });
        return p;
      }
    }, {}) as StatusServiceConfiguration;
  };

  #getConfigurationFinder = (tokenProvider: TokenProvider, service: ConfigurationService, serviceId: AdspId) => {
    return async (tenantId: AdspId): Promise<StatusServiceConfiguration> => {
      const token = await tokenProvider.getAccessToken();
      const [config] = await service.getConfiguration<StatusServiceConfiguration>(serviceId, token, tenantId);
      return config;
    };
  };

  #merge = (
    apps: ServiceStatusApplicationEntity[],
    configs: Record<string, unknown>
  ): Record<string, ApplicationData> => {
    const appData: Record<string, ApplicationData> = {};
    apps.forEach((a) => {
      const config = configs[a._id] as StaticApplicationData;
      if (config) {
        appData[a._id] = { ...a, ...config };
      } else {
        // There should always be a configuration associated with
        // the repository app, but in case of a data glitch.
        // TODO remove this code when the app no longer has the
        // needed properties for this.  Its too late then.
        appData[a._id] = { ...a, url: a.endpoint.url };
        this.#saveConfiguration(a);
      }
    });
    return appData;
  };

  #saveConfiguration = async (app: ServiceStatusApplicationEntity) => {
    await updateConfiguration(this.#directory, this.#tokenProvider, AdspId.parse(app.tenantId), app._id, {
      name: app.name,
      url: app.endpoint.url,
      description: app.description,
    });
  };

  /**
   * This should be run once by main, to update the service configuration
   * with any apps in the database that are not yet in the configuration.
   * Once all the apps have been added, the call to this method can
   * be removed.
   * @param logger - its a logger.
   */
  convertData = async (logger: Logger) => {
    const savedApps = await this.#repository.find({});
    const tenants = this.#getActiveTenants(savedApps);
    const configuredApps = this.#getConfigurations(tenants);
    // Add configuration if it is missing
    savedApps.forEach(async (a) => {
      if (!configuredApps[a._id]) {
        logger.info(`##########  Adding configuration for app ${a.name} in ${a.tenantName} tenant`);
        await this.#saveConfiguration(a);
      }
    });
  };
}
