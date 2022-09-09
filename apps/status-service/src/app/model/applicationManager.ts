import { AdspId, ConfigurationService, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import { ServiceStatusRepository } from '../repository/serviceStatus';
import { updateConfiguration } from '../router/serviceStatus';
import { ApplicationList } from './ApplicationList';
import ServiceStatusApplicationEntity, {
  ApplicationData,
  StaticApplicationData,
  StatusServiceConfiguration,
} from './serviceStatus';

type ConfigurationFinder = (tenantId: AdspId) => Promise<StatusServiceConfiguration>;

export class ApplicationManager {
  #configurationFinder: ConfigurationFinder;
  #repository: ServiceStatusRepository;
  #logger: Logger;
  #tokenProvider: TokenProvider;
  #directory: ServiceDirectory;

  constructor(
    tokenProvider: TokenProvider,
    service: ConfigurationService,
    serviceId: AdspId,
    repository: ServiceStatusRepository,
    directory: ServiceDirectory,
    logger: Logger
  ) {
    this.#configurationFinder = this.#getConfigurationFinder(tokenProvider, service, serviceId);
    this.#repository = repository;
    this.#logger = logger;
    this.#tokenProvider = tokenProvider;
    this.#directory = directory;
  }

  getActiveApps = async () => {
    const statuses = await this.#getActiveApplicationStatus();
    const tenants = this.#getActiveTenants(statuses);
    const configurations = await this.#getConfigurations(tenants);
    const applications = this.#merge(statuses, configurations);
    return new ApplicationList(applications);
  };

  getApp = async (appId: string, tenantId: AdspId): Promise<StaticApplicationData> => {
    const config = await this.#configurationFinder(tenantId);
    return config[appId] as StaticApplicationData;
  };

  #getActiveApplicationStatus = async (): Promise<ServiceStatusApplicationEntity[]> => {
    return this.#repository.findEnabledApplications();
  };

  #getActiveTenants = (statuses: ServiceStatusApplicationEntity[]): Set<AdspId> => {
    const tenants = new Set<AdspId>();
    statuses.forEach((a) => {
      tenants.add(AdspId.parse(a.tenantId));
    });
    return tenants;
  };

  #getConfigurations = async (tenants: Set<AdspId>): Promise<StatusServiceConfiguration> => {
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
        this.#logger.warn(`could not find application configuration associated with id ${status._id}`);
      }
    });
    return appData;
  };

  // TODO remove this code when the status no longer has the
  // needed properties for this.
  #saveConfiguration = async (status: ServiceStatusApplicationEntity) => {
    await updateConfiguration(this.#directory, this.#tokenProvider, AdspId.parse(status.tenantId), status._id, {
      _id: status._id,
      name: status.name,
      url: status.endpoint.url,
      description: status.description,
    });
  };

  /**
   * This should be run once by main, to update the service configuration
   * with any apps in the database that are not yet there.
   * Once all the apps have been added the call, and this method, can
   * be removed.  Sept 1, 2022.
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
