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
    const statuses = await this.#getActiveApplicationStatus();
    const tenants = this.#getActiveTenants(statuses);
    const configurations = await this.#getConfigurations(tenants);
    const appData = this.#merge(statuses, configurations);
    return appData;
  };

  #getActiveApplicationStatus = async () => {
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
    const configurations = await Promise.all(promises);
    return configurations.reduce((p, c) => {
      if (c) {
        const appKeys = Object.keys(c).filter((k) => {
          return /^[a-zA-Z0-9]{24}$/gi.test(k);
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
      const config = await service.getConfiguration<StatusServiceConfiguration, StatusServiceConfiguration>(
        serviceId,
        token,
        tenantId
      );
      return config;
    };
  };

  #merge = (
    statuses: ServiceStatusApplicationEntity[],
    apps: Record<string, unknown>
  ): Record<string, ApplicationData> => {
    const appData: Record<string, ApplicationData> = {};
    statuses.forEach((status) => {
      const app = apps[status._id] as StaticApplicationData;
      if (app) {
        appData[status._id] = { ...status, ...app };
      } else {
        // There should always be an app associated with
        // the status, but...
        appData[status._id] = { ...status, url: status.endpoint.url };
        this.#saveConfiguration(status);
      }
    });
    return appData;
  };

  // TODO remove this code when the status no longer has the
  // needed properties for this.  Its too late then.
  #saveConfiguration = async (status: ServiceStatusApplicationEntity) => {
    await updateConfiguration(this.#directory, this.#tokenProvider, AdspId.parse(status.tenantId), status._id, {
      name: status.name,
      url: status.endpoint.url,
      description: status.description,
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
    const statuses = await this.#repository.find({});
    const tenants = this.#getActiveTenants(statuses);
    const apps = this.#getConfigurations(tenants);
    // Add configuration if it is missing
    statuses.forEach(async (a) => {
      if (!apps[a._id]) {
        logger.info(`##########  Adding configuration for app ${a.name} in ${a.tenantName} tenant`);
        await this.#saveConfiguration(a);
      }
    });
  };
}
