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
import { appPropertyRegex } from '../../mongo/schema';
import { ServiceStatusRepository } from '../repository/serviceStatus';
import { ApplicationRepo } from '../router/ApplicationRepo';
import { StaticApplicationData, StatusServiceConfiguration } from './serviceStatus';
import { StatusApplications } from './statusApplications';

type ConfigurationFinder = (tenantId: AdspId) => Promise<StatusServiceConfiguration>;

export class ApplicationManager {
  #configurationFinder: ConfigurationFinder;
  #repository: ServiceStatusRepository;
  #logger: Logger;
  #tenantService: TenantService;
  #applicationRepo: ApplicationRepo;
  #tokenProvider: TokenProvider;
  #directory: ServiceDirectory;

  constructor(
    tokenProvider: TokenProvider,
    service: ConfigurationService,
    serviceId: AdspId,
    repository: ServiceStatusRepository,
    directory: ServiceDirectory,
    tenantService: TenantService,
    logger: Logger
  ) {
    this.#configurationFinder = this.#getConfigurationFinder(tokenProvider, service, serviceId);
    this.#repository = repository;
    this.#logger = logger;
    this.#tenantService = tenantService;
    this.#applicationRepo = new ApplicationRepo(repository, serviceId, directory, tokenProvider);
    this.#tokenProvider = tokenProvider;
    this.#directory = directory;
  }

  findEnabledApps = async () => {
    const tenants = await this.#tenantService.getTenants();
    const apps = await this.#getApps(tenants);
    const statuses = await this.#repository.findEnabledApplications();
    const keys = Object.keys(apps);
    const enabledApps: StatusServiceConfiguration = {};
    keys.forEach((k) => {
      const status = statuses.find((s) => s.appKey === apps[k].appKey);
      if (status && status.enabled) {
        enabledApps[k] = apps[k];
      }
    });
    return new StatusApplications(enabledApps);
  };

  getApp = async (appKey: string, tenantId: AdspId): Promise<StaticApplicationData> => {
    return this.#applicationRepo.getApp(appKey, tenantId);
  };

  #getApps = async (tenants: Tenant[]): Promise<StatusServiceConfiguration> => {
    const promises: Promise<StatusServiceConfiguration>[] = [];
    tenants.forEach((t) => {
      promises.push(this.#configurationFinder(t.id));
    });
    const configurations = await Promise.all(promises);
    const regex = new RegExp(appPropertyRegex);
    return configurations.reduce((p, c) => {
      if (c) {
        const appKeys = Object.keys(c).filter((k) => {
          return regex.test(k);
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
      const regex = new RegExp(appPropertyRegex);
      const keys = Object.keys(config).filter((k) => {
        return regex.test(k);
      });
      const apps = {};
      // Add the tenantId in, cause its not part of the configuration.
      keys.forEach((k) => {
        apps[k] = { ...config[k], tenantId: tenantId };
      });
      return apps;
    };
  };

  /**
   * This is here to convert application data to a new form.
   * Ideally it only needs to be run once.  Nov 15, 2022.
   * @param logger - its a logger.
   */
  synchronizeData = async (logger: Logger) => {
    const tenants = await this.#tenantService.getTenants();
    tenants.forEach(async (tenant: Tenant) => {
      const config: StatusServiceConfiguration = await this.#configurationFinder(tenant.id);
      const apps = new StatusApplications(config);
      const ids = Object.keys(config);
      let needsUpdate = false;
      ids.forEach(async (_id) => {
        const app = apps.get(_id);
        // Fix up he app's configuration data; we need to add the appKey.
        // Also, there is a small chance that
        // the application ID is missing (bad migration from earlier (Oct. 2022))
        // so ensure it is there.
        if (app && !(app._id && app.appKey && !app.tenantId)) {
          needsUpdate = true;
          const appKey = ApplicationRepo.getApplicationKey(tenant.name, app.name);
          config[_id] = {
            name: app.name,
            description: app.description,
            url: app.url,
            _id: _id,
            appKey: appKey,
          };
        }
      });
      if (needsUpdate) {
        logger.info(`Updating status-service configuration for tenant ${tenant.name}`);
        try {
          await this.updateConfig(config, tenant);
        } catch (e) {
          logger.info(`Error updating configuration for tenant ${tenant.name}...${e.message}`);
        }
      }
    });
  };

  updateConfig = async (config: StatusServiceConfiguration, tenant: Tenant) => {
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
