import {
  AdspId,
  ConfigurationService,
  ServiceDirectory,
  Tenant,
  TenantService,
  TokenProvider,
} from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import { appPropertyRegex } from '../../mongo/schema';
import { ServiceStatusRepository } from '../repository/serviceStatus';
import { ApplicationRepo } from '../router/ApplicationRepo';
import { ServiceStatusApplication } from '../types';
import ServiceStatusApplicationEntity, {
  ApplicationData,
  StaticApplicationData,
  StatusServiceConfiguration,
} from './serviceStatus';
import { StatusApplications } from './statusApplications';

type ConfigurationFinder = (tenantId: AdspId) => Promise<StatusServiceConfiguration>;

export class ApplicationManager {
  #configurationFinder: ConfigurationFinder;
  #repository: ServiceStatusRepository;
  #logger: Logger;
  #tenantService: TenantService;
  #applicationRepo: ApplicationRepo;

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
  }

  findEnabledApps = async () => {
    const tenants = await this.#tenantService.getTenants();
    const apps = await this.#getApps(tenants);
    const statuses = await this.#getActiveApplicationStatuses();
    const keys = Object.keys(apps);
    const enabledApps = {};
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

  #getActiveApplicationStatuses = async (): Promise<ServiceStatusApplicationEntity[]> => {
    return this.#repository.findEnabledApplications();
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
      return config;
    };
  };

  /**
   * This is here to convert status data to a new form.
   * Ideally it only needs to be run once.  Oct 17, 2022.
   * @param logger - its a logger.
   */
  synchronizeData = async (logger: Logger) => {
    const statuses = await this.#repository.find({});
    const tenants = await this.#tenantService.getTenants();
    tenants.forEach(async (tenant: Tenant) => {
      const config: StatusServiceConfiguration = await this.#configurationFinder(tenant.id);
      const apps = new StatusApplications(config);
      const ids = Object.keys(config);
      ids.forEach(async (_id) => {
        const app = apps.get(_id);

        // Fix up he app's configuration data
        if (app && !(app._id && app.appKey)) {
          const appKey = ApplicationRepo.getApplicationKey(tenant.name, app.name);
          logger.info(`updating ${app.name}`);
          try {
            await this.#applicationRepo.updateConfiguration(tenant.id, _id, {
              ...app,
              _id: _id,
              appKey: appKey,
            });
          } catch (e) {
            logger.info(`Error updating configuration for ${app.name}...${e.message}`);
          }
        }

        // Ensure that status data exists for all apps
        if (app) {
          const status = statuses.find((s) => s?._id == _id);
          const appKey = ApplicationRepo.getApplicationKey(tenant.name, app.name);
          if (!status) {
            const newStatus = new ServiceStatusApplicationEntity(
              this.#repository,
              getDefaultStatus(_id, appKey, tenant)
            );
            try {
              await this.#repository.save(newStatus);
            } catch (e) {
              logger.error(`cannot add status for app ${app.name}: ${e.message}`);
            }
            logger.info(`Adding status to ${app.name}`);
          } else if (!status.appKey) {
            status.appKey = appKey;
            try {
              await this.#repository.save(status);
            } catch (e) {
              logger.error(`cannot add appKey to status for app ${app.name}: ${e.message}`);
            }
            logger.info(`Adding status appKey ${app.name}`);
          }
        }
      });
    });
  };
}

const getDefaultStatus = (_id: string, appKey: string, tenant: Tenant): ServiceStatusApplication => {
  return {
    _id: _id,
    appKey: appKey,
    endpoint: { status: 'offline' },
    metadata: '',
    statusTimestamp: 0,
    tenantId: tenant.id.toString(),
    tenantName: tenant.name,
    tenantRealm: tenant.realm,
    status: 'operational',
    enabled: false,
  };
};
