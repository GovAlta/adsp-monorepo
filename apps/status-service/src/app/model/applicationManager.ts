import {
  adspId,
  AdspId,
  ConfigurationService,
  ServiceDirectory,
  Tenant,
  TenantService,
  TokenProvider,
} from '@abgov/adsp-service-sdk';
import axios from 'axios';
import { Logger } from 'winston';
import { isApp } from '../../mongo/schema';
import { EndpointStatusEntryRepository } from '../repository/endpointStatusEntry';
import { ServiceStatusRepository } from '../repository/serviceStatus';
import { ApplicationRepo } from '../router/ApplicationRepo';
import {
  ApplicationConfiguration,
  StaticApplicationData,
  StatusServiceApplications,
  StatusServiceConfiguration,
} from './serviceStatus';
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
      tokenProvider
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

  /**
   * This is here to convert application data to a new form.
   * Ideally it only needs to be run once.  Nov 15, 2022.
   * @param logger - its a logger.
   */
  synchronizeData = async () => {
    const tenants = await this.#tenantService.getTenants();
    tenants.forEach(async (tenant: Tenant) => {
      this.#updateAppDefinition(tenant);
    });
  };

  // TODO remove this code after next production release (Dec. 8, 2022).
  #updateAppDefinition = async (tenant: Tenant) => {
    const config: StatusServiceConfiguration = await this.#getConfiguration(tenant.id);
    const ids = Object.keys(config);
    let needsUpdate = false;
    ids.forEach(async (appId) => {
      const app = config[appId];
      // Fix up he app's configuration data.
      if (isApp(app)) {
        needsUpdate = true;
        const appKey = ApplicationRepo.getApplicationKey(app.name);
        const replacement: ApplicationConfiguration = {
          appKey: appKey,
          name: app.name,
          description: app.description,
          url: app.url,
        };
        delete config[appId];
        config[appKey] = replacement;
      }
    });
    if (needsUpdate) {
      this.#logger.info(`Updating status-service configuration for tenant ${tenant.name}`);
      try {
        await this.#updateConfig(config, tenant);
      } catch (e) {
        this.#logger.info(`Error updating configuration for tenant ${tenant.name}...${e.message}`);
      }
    }
  };

  #getConfiguration = async (tenantId: AdspId): Promise<StatusServiceConfiguration> => {
    const token = await this.#tokenProvider.getAccessToken();
    return this.configurationService.getConfiguration<StatusServiceConfiguration, StatusServiceConfiguration>(
      this.serviceId,
      token,
      tenantId
    );
  };

  #updateConfig = async (config: StatusServiceConfiguration, tenant: Tenant) => {
    const baseUrl = await this.#directory.getServiceUrl(adspId`urn:ads:platform:configuration-service`);
    const token = await this.#tokenProvider.getAccessToken();
    const configUrl = new URL(`/configuration/v2/configuration/platform/status-service?tenantId=${tenant.id}`, baseUrl);
    await axios.patch(
      configUrl.href,
      {
        operation: 'REPLACE',
        configuration: config,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  };
}
