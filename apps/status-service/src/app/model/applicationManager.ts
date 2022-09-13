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
        this.#logger.warn(`could not find application configuration associated with id ${status._id}`);
      }
    });
    return appData;
  };
}
