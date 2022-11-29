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
import { NoticeRepository } from '../repository/notice';
import { ServiceStatusRepository } from '../repository/serviceStatus';
import { ApplicationRepo } from '../router/ApplicationRepo';
import { NoticeApplicationEntity } from './notice';
import ServiceStatusApplicationEntity, { StaticApplicationData, StatusServiceConfiguration } from './serviceStatus';
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
  #noticeRepository: NoticeRepository;

  constructor(
    tokenProvider: TokenProvider,
    service: ConfigurationService,
    serviceId: AdspId,
    repository: ServiceStatusRepository,
    directory: ServiceDirectory,
    tenantService: TenantService,
    noticeRepository: NoticeRepository,
    logger: Logger
  ) {
    this.#configurationFinder = this.#getConfigurationFinder(tokenProvider, service, serviceId);
    this.#repository = repository;
    this.#logger = logger;
    this.#tenantService = tenantService;
    this.#applicationRepo = new ApplicationRepo(repository, serviceId, directory, tokenProvider);
    this.#tokenProvider = tokenProvider;
    this.#directory = directory;
    this.#noticeRepository = noticeRepository;
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
  synchronizeData = async () => {
    const tenants = await this.#tenantService.getTenants();
    tenants.forEach(async (tenant: Tenant) => {
      this.#updateAppStatus(tenant);
      this.#updateNoticeReferences(tenant);
      this.#updateAppDefinition(tenant);
    });
  };

  #updateNoticeReferences = async (tenant: Tenant) => {
    const notices = await this.#noticeRepository.find(0, 0, { tenantId: tenant.id.toString() });
    const config: StatusServiceConfiguration = await this.#configurationFinder(tenant.id);
    const apps = new StatusApplications(config);
    const oldKeyType = new RegExp('^[a-fA-F0-9]{24}$');
    notices.results.forEach(async (notice) => {
      const ref = notice.tennantServRef ? JSON.parse(notice.tennantServRef) : null;
      const needsUpdate = ref?.length > 0 && oldKeyType.test(ref[0].id);
      if (needsUpdate) {
        const app = apps.get(ref[0].id);
        if (app) {
          const appKey = ApplicationRepo.getApplicationKey(tenant.name, app.name);
          await this.#noticeRepository.save(
            new NoticeApplicationEntity(this.#noticeRepository, {
              ...notice,
              tennantServRef: JSON.stringify([{ name: ref[0].name, id: appKey }]),
            })
          );
        }
      }
    });
  };

  #updateAppDefinition = async (tenant: Tenant) => {
    const config: StatusServiceConfiguration = await this.#configurationFinder(tenant.id);
    const newKeyType = new RegExp('^app_.+$');
    const apps = new StatusApplications(config);
    const ids = Object.keys(config);
    let needsUpdate = false;
    ids.forEach(async (appId) => {
      const app = apps.get(appId);
      // Fix up he app's configuration data; we need to add the appKey.
      const hasNewKeyType = newKeyType.test(appId);
      if (app) {
        needsUpdate = needsUpdate || !app.appKey || !hasNewKeyType;
        const newId = ApplicationRepo.getApplicationKey(tenant.name, app.name);
        config[newId] = {
          appKey: newId,
          name: app.name,
          description: app.description,
          url: app.url,
        };
        if (!hasNewKeyType) {
          delete config[appId];
        }
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

  #updateAppStatus = async (tenant: Tenant) => {
    const config: StatusServiceConfiguration = await this.#configurationFinder(tenant.id);
    const apps = new StatusApplications(config);
    apps.forEach(async (app) => {
      if (app && app.appKey) {
        const status = await this.#repository.get(app.appKey);
        if (status) {
          const newStatus = new ServiceStatusApplicationEntity(this.#repository, {
            ...status,
            appKey: ApplicationRepo.getApplicationKey(tenant.name, app.name),
            tenantId: tenant.id.toString(),
          });
          await this.#repository.save(newStatus);
        }
      }
    });
  };
}
