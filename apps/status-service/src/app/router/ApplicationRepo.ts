import { adspId, AdspId, ServiceDirectory, Tenant, TokenProvider, User } from '@abgov/adsp-service-sdk';
import { NotFoundError, UnauthorizedError } from '@core-services/core-common';
import axios from 'axios';
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

  getStatus = async (appKey: string): Promise<ServiceStatusApplicationEntity> => {
    const statuses = await this.#repository.find({ appKey: appKey });
    return statuses[0] ?? null;
  };

  getApp = async (appKey: string, tenantId: AdspId): Promise<StaticApplicationData> => {
    const applications = await this.getTenantApps(tenantId);
    return applications.find(appKey);
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
    return new StatusApplications(data);
  };

  getTenantStatuses = async (tenantId: AdspId): Promise<ServiceStatusApplicationEntity[]> => {
    return await this.#repository.find({ tenantId: tenantId.toString() });
  };

  mergeApplicationData = (app: StaticApplicationData, status: ServiceStatusApplicationEntity) => {
    return {
      appKey: status.appKey,
      tenantId: status.tenantId,
      name: app.name,
      description: app.description,
      metadata: status.metadata,
      enabled: status.enabled,
      statusTimestamp: status.statusTimestamp,
      status: status.status,
      internalStatus: status.internalStatus,
      endpoint: { status: status.endpoint.status, url: app.url },
      tenantName: status.tenantName,
      tenantRealm: status.tenantRealm,
    };
  };

  createApp = async (appName: string, description: string, url: string, tenant: Tenant, user: User) => {
    const appKey = ApplicationRepo.getApplicationKey(tenant.name, appName);
    const status: ServiceStatusApplicationEntity = await ServiceStatusApplicationEntity.create(user, this.#repository, {
      tenantId: tenant.id.toString(),
      tenantName: tenant.name,
      tenantRealm: tenant.realm,
      appKey: appKey,
      endpoint: { status: 'offline' },
      metadata: '',
      statusTimestamp: 0,
      enabled: false,
    });
    const newApp: StaticApplicationData = {
      _id: status._id,
      appKey: appKey,
      name: appName,
      url: url,
      description: description,
    };
    this.updateConfiguration(tenant.id, status._id, newApp);
    return this.mergeApplicationData(newApp, status);
  };

  updateConfiguration = async (tenantId: AdspId, applicationId: string, newApp: StaticApplicationData) => {
    const baseUrl = await this.#directoryService.getServiceUrl(adspId`urn:ads:platform:configuration-service`);
    const token = await this.#tokenProvider.getAccessToken();
    const configUrl = new URL(`/configuration/v2/configuration/platform/status-service?tenantId=${tenantId}`, baseUrl);
    await axios.patch(
      configUrl.href,
      {
        operation: 'UPDATE',
        update: {
          [applicationId]: newApp,
        },
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  };

  deleteApp = async (appKey: string, user: User) => {
    const app = await this.getApp(appKey, user.tenantId);
    if (!app) {
      throw new NotFoundError('Status application', appKey);
    }
    const appStatus = await this.getStatus(appKey);

    if (user.tenantId?.toString() !== appStatus.tenantId) {
      throw new UnauthorizedError('invalid tenant id');
    }

    await appStatus.delete({ ...user } as User);
    this.#deleteConfigurationApp(app._id, user.tenantId);
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
    return ApplicationRepo.toKebabCase(`${tenantName}-${appName}`);
  };

  private static toKebabCase = (s: string): string => {
    return s
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  };
}
