import { AdspId, ConfigurationService, ServiceDirectory, TenantService, TokenProvider } from '@abgov/adsp-service-sdk';

import { Logger } from 'winston';
import { isApp } from '../../mongo/schema';
import { EndpointStatusEntryRepository } from '../repository/endpointStatusEntry';
import { ServiceStatusRepository } from '../repository/serviceStatus';
import { ApplicationRepo } from '../router/ApplicationRepo';
import { StaticApplicationData, StatusServiceApplications, StatusServiceConfiguration } from './serviceStatus';
import { StatusApplications } from './statusApplications';

type ConfigurationFinder = (tenantId: AdspId) => Promise<StatusServiceApplications>;

export class ApplicationManager {
  #configurationFinder: ConfigurationFinder;
  #repository: ServiceStatusRepository;
  #logger: Logger;
  #tenantService: TenantService;
  #applicationRepo: ApplicationRepo;
  #tokenProvider: TokenProvider;
  #directory: ServiceDirectory;
  serviceId: AdspId;
  configurationService: ConfigurationService;

  constructor(
    tokenProvider: TokenProvider,
    configurationService: ConfigurationService,
    serviceId: AdspId,
    repository: ServiceStatusRepository,
    endpointStatusEntryRepository: EndpointStatusEntryRepository,
    directory: ServiceDirectory,
    tenantService: TenantService,
    logger: Logger
  ) {
    this.#configurationFinder = this.#getConfigurationFinder(tokenProvider, configurationService, serviceId);
    this.#repository = repository;
    this.#logger = logger;
    this.#tenantService = tenantService;
    this.#applicationRepo = new ApplicationRepo(
      repository,
      endpointStatusEntryRepository,
      serviceId,
      directory,
      tokenProvider,
      configurationService
    );
    this.#tokenProvider = tokenProvider;
    this.#directory = directory;
    this.serviceId = serviceId;
    this.configurationService = configurationService;
  }

  findEnabledApps = async () => {
    const tenants = await this.#tenantService.getTenants();
    const enabledApps: StatusServiceApplications = {};
    for (const tenant of tenants) {
      const apps = await this.#getApps(tenant.id);
      const statuses = await this.#repository.findEnabledApplications(tenant.id.toString());
      const keys = Object.keys(apps);
      keys.forEach((k) => {
        const status = statuses ? statuses.find((s) => s.appKey === apps[k].appKey) : null;
        if (status && status.enabled) {
          enabledApps[k] = { ...apps[k], tenantId: tenant.id };
        }
      });
    }
    return new StatusApplications(enabledApps);
  };

  getApp = async (appKey: string, tenantId: AdspId): Promise<StaticApplicationData> => {
    return this.#applicationRepo.getApp(appKey, tenantId);
  };

  #getApps = async (tenantId: AdspId): Promise<StatusServiceApplications> => {
    const configuration = await this.#configurationFinder(tenantId);
    const appKeys = Object.keys(configuration);
    const result: StatusServiceApplications = {};
    appKeys.forEach((k) => {
      result[k] = { ...configuration[k], tenantId };
    });
    return result;
  };

  #getConfigurationFinder = (
    tokenProvider: TokenProvider,
    configurationService: ConfigurationService,
    serviceId: AdspId
  ) => {
    return async (tenantId: AdspId): Promise<StatusServiceApplications> => {
      const token = await tokenProvider.getAccessToken();
      const config = await configurationService.getConfiguration<
        StatusServiceConfiguration,
        StatusServiceConfiguration
      >(serviceId, token, tenantId);
      const keys = Object.keys(config);
      const apps: StatusServiceApplications = {};
      // Add the tenantId in, cause its not part of the configuration.
      keys.forEach((k) => {
        if (isApp(config[k])) {
          apps[k] = { ...config[k], tenantId: tenantId };
        }
      });
      return apps;
    };
  };
}
