import {
  AdspId,
  ConfigurationService,
  ServiceDirectory,
  Tenant,
  TenantService,
  TokenProvider,
} from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import { ServiceStatusRepository } from '../repository/serviceStatus';
import { getApplicationKey, updateConfiguration } from '../router/serviceStatus';
import { ServiceStatusApplication } from '../types';
import { ApplicationList } from './ApplicationList';
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
  #tokenProvider: TokenProvider;
  #directory: ServiceDirectory;
  #tenantService: TenantService;

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
    this.#tokenProvider = tokenProvider;
    this.#directory = directory;
    this.#tenantService = tenantService;
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
        logger.info(`################# Processing App with id: ${_id}`);
        const app = apps.get(_id);

        // Fix up he app's configuration data
        if (app && (!app._id || !app.appKey)) {
          app._id = _id;
          app.appKey = getApplicationKey(tenant.name, app.name);
          logger.info(`#################### updating ${app.name}`);
          try {
            await updateConfiguration(this.#directory, this.#tokenProvider, tenant.id, _id, app);
          } catch (e) {
            logger.info(`################### Error updating configuration for ${app.name}...${e.message}`);
          }
        }

        // Ensure that status data exists for all apps
        if (app) {
          const status = statuses.find((s) => s?._id == _id);
          const appKey = getApplicationKey(tenant.name, app.name);
          if (!status) {
            const newStatus = new ServiceStatusApplicationEntity(
              this.#repository,
              getDefaultStatus(_id, appKey, tenant)
            );
            try {
              await this.#repository.save(newStatus);
            } catch (e) {
              logger.error(`################ cannot add status for app ${app.name}: ${e.message}`);
            }
            logger.info(`################# Adding status to ${app.name}`);
          } else if (!status.appKey) {
            status.appKey = appKey;
            try {
              await this.#repository.save(status);
            } catch (e) {
              logger.error(`################ cannot add appKey to status for app ${app.name}: ${e.message}`);
            }
            logger.info(`################# Adding status appKey ${app.name}`);
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
