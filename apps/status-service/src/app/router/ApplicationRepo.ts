import { adspId, AdspId, ServiceDirectory, Tenant, TokenProvider, User } from '@abgov/adsp-service-sdk';
import { NotFoundError } from '@core-services/core-common';
import axios from 'axios';
import { appPropertyRegex } from '../../mongo/schema';
import { ServiceStatusApplicationEntity, StaticApplicationData, StatusServiceConfiguration } from '../model';
import { StatusApplications } from '../model/statusApplications';
import { ServiceStatusRepository } from '../repository/serviceStatus';

/**
 * Applications are stored in both the status-repository (for
 * dynamic, status data) and the configuration-service f(or
 * static information).
 */
export class ApplicationRepo {
  #repository: ServiceStatusRepository;
  #serviceId: AdspId;
  #directoryService: ServiceDirectory;
  #tokenProvider: TokenProvider;

  constructor(
    repository: ServiceStatusRepository,
    serviceId: AdspId,
    directoryService: ServiceDirectory,
    tokenProvider: TokenProvider
  ) {
    this.#repository = repository;
    this.#serviceId = serviceId;
    this.#directoryService = directoryService;
    this.#tokenProvider = tokenProvider;
  }

  /*
   * The status is only created on an as needed basis.  The assumption
   * is that this method is being called because the status is now needed.
   */
  getStatus = async (user: User, appKey: string): Promise<ServiceStatusApplicationEntity> => {
    const statuses = await this.#repository.find({ appKey: appKey });
    return statuses.length == 1
      ? statuses[0]
      : ServiceStatusApplicationEntity.create(user, this.#repository, {
          appKey: appKey,
          endpoint: { status: 'offline' },
          metadata: '',
          statusTimestamp: 0,
          status: '',
          enabled: false,
        });
  };

  findStatus = async (appKey: string): Promise<ServiceStatusApplicationEntity> => {
    const statuses = await this.#repository.find({ appKey: appKey });
    return statuses.length == 1 ? statuses[0] : null;
  };

  getApp = async (appKey: string, tenantId: AdspId): Promise<StaticApplicationData> => {
    const applications = await this.getTenantApps(tenantId);
    return applications.find(appKey);
  };

  findAllStatuses = async (apps: StatusApplications) => {
    const appIds = apps.map((a) => {
      return a.appKey;
    });
    return await this.#repository.find({ appKey: { $in: appIds } });
  };

  /*
   * Get apps from the configuration-service.  Because of the latency between
   * creating a new app and the configuration-service cache being updated, even
   * with the cache dirty flag being set, all API's need to use the configuration
   * service directly, rather than $req.getConfiguration.  Users are faster than
   * the above latency.
   */
  getTenantApps = async (tenantId: AdspId): Promise<StatusApplications> => {
    const baseUrl = await this.#directoryService.getServiceUrl(adspId`urn:ads:platform:configuration-service:v2`);
    const configUrl = new URL(
      `/configuration/v2/configuration/${this.#serviceId.namespace}/${
        this.#serviceId.service
      }/latest?tenantId=${tenantId}`,
      baseUrl
    );
    const token = await this.#tokenProvider.getAccessToken();
    const { data } = await axios.get<StatusServiceConfiguration>(configUrl.href, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const regex = new RegExp(appPropertyRegex);
    const keys = Object.keys(data).filter((k) => {
      return regex.test(k);
    });
    const apps = {};
    // Add the tenantId in, cause its not part of the configuration.
    keys.forEach((k) => {
      apps[k] = { ...data[k], tenantId: tenantId };
    });
    return new StatusApplications(apps);
  };

  mergeApplicationData = (tenantId: string, app: StaticApplicationData, status?: ServiceStatusApplicationEntity) => {
    return {
      appKey: app.appKey,
      name: app.name,
      description: app.description,
      tenantId: tenantId,
      metadata: status?.metadata ?? '',
      enabled: status?.enabled ?? false,
      statusTimestamp: status?.statusTimestamp ?? null,
      status: status?.status ?? '',
      internalStatus: status?.internalStatus ?? 'stopped',
      endpoint: {
        status: status?.endpoint.status ?? 'offline',
        url: app.url,
      },
    };
  };

  createApp = async (appName: string, description: string, url: string, tenant: Tenant) => {
    const appKey = ApplicationRepo.getApplicationKey(tenant.name, appName);
    const newApp = {
      _id: null,
      appKey: appKey,
      name: appName,
      url: url,
      description: description,
      tenantId: tenant.id,
    };
    await this.updateApp(newApp);
    const created = await this.getApp(appKey, tenant.id);
    return this.mergeApplicationData(tenant.id.toString(), created);
  };

  updateApp = async (newApp: StaticApplicationData) => {
    const baseUrl = await this.#directoryService.getServiceUrl(adspId`urn:ads:platform:configuration-service`);
    const token = await this.#tokenProvider.getAccessToken();
    const configUrl = new URL(
      `/configuration/v2/configuration/platform/status-service?tenantId=${newApp.tenantId}`,
      baseUrl
    );
    // Configuration must be tenantless, so it can be
    // imported by other tenants.
    delete newApp.tenantId;
    await axios.patch(
      configUrl.href,
      {
        operation: 'UPDATE',
        update: {
          [newApp.appKey]: newApp,
        },
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return newApp.appKey;
  };

  deleteApp = async (appKey: string, user: User) => {
    const app = await this.getApp(appKey, user.tenantId);
    if (!app) {
      throw new NotFoundError('Status application', appKey);
    }

    const appStatus = await this.getStatus(user, appKey);
    if (appStatus) {
      await appStatus.delete({ ...user } as User);
    }
    this.#deleteConfigurationApp(appKey, user.tenantId);
  };

  #deleteConfigurationApp = async (id: string, tenantId: AdspId) => {
    const baseUrl = await this.#directoryService.getServiceUrl(adspId`urn:ads:platform:configuration-service`);
    const token = await this.#tokenProvider.getAccessToken();
    const configUrl = new URL(`/configuration/v2/configuration/platform/status-service?tenantId=${tenantId}`, baseUrl);
    await axios.patch(
      configUrl.href,
      {
        operation: 'DELETE',
        property: id,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  };

  // create a unique key that can be used to access the application
  // status.  This algorithm assumes that the application name
  // will be unique within a tenant context.
  static getApplicationKey = (tenantName: string, appName: string): string => {
    // Its a verb: to kebab.
    const kebabed = ApplicationRepo.toKebabCase(`${tenantName}-${appName}`);
    return `app_${kebabed}`;
  };

  private static toKebabCase = (s: string): string => {
    return s
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  };
}
