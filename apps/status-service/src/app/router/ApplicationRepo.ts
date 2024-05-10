import {
  adspId,
  AdspId,
  ServiceDirectory,
  Tenant,
  TokenProvider,
  User,
  ConfigurationService,
} from '@abgov/adsp-service-sdk';
import { NotFoundError } from '@core-services/core-common';
import axios from 'axios';
import { isApp } from '../../mongo/schema';
import {
  ApplicationConfiguration,
  ServiceStatusApplicationEntity,
  StaticApplicationData,
  StatusServiceConfiguration,
} from '../model';
import { StatusApplications } from '../model/statusApplications';
import { EndpointStatusEntryRepository } from '../repository/endpointStatusEntry';
import { ServiceStatusRepository } from '../repository/serviceStatus';
import { PublicServiceStatusType } from '../types';

/**
 * Applications are stored in both the status-repository (for
 * dynamic, status data) and the configuration-service f(or
 * static information).
 */
export class ApplicationRepo {
  #repository: ServiceStatusRepository;
  #endpointStatusEntryRepository: EndpointStatusEntryRepository;
  #serviceId: AdspId;
  #directoryService: ServiceDirectory;
  #tokenProvider: TokenProvider;
  #configurationService: ConfigurationService;

  constructor(
    repository: ServiceStatusRepository,
    endpointStatusEntryRepository: EndpointStatusEntryRepository,
    serviceId: AdspId,
    directoryService: ServiceDirectory,
    tokenProvider: TokenProvider,
    configurationService: ConfigurationService
  ) {
    this.#repository = repository;
    this.#serviceId = serviceId;
    this.#directoryService = directoryService;
    this.#tokenProvider = tokenProvider;
    this.#endpointStatusEntryRepository = endpointStatusEntryRepository;
    this.#configurationService = configurationService;
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
          tenantId: user.tenantId.toString(),
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

  findAllStatuses = async (apps: StatusApplications, tenantId: string) => {
    const appKeys = apps.map((a) => {
      return a.appKey;
    });
    return await this.#repository.find({ appKey: { $in: appKeys }, tenantId: tenantId });
  };

  getTenantApps = async (tenantId: AdspId): Promise<StatusApplications> => {
    const token = await this.#tokenProvider.getAccessToken();
    const data = await this.#configurationService.getConfiguration<
      StatusServiceConfiguration,
      StatusServiceConfiguration
    >(this.#serviceId, token, tenantId);

    const keys = Object.keys(data);
    const apps = {};
    // Add the tenantId in, cause its not part of the configuration.
    keys.forEach((k) => {
      if (isApp(data[k])) {
        apps[k] = { ...data[k], tenantId: tenantId };
      }
    });

    return new StatusApplications(apps);
  };

  mergeApplicationData = (tenantId: string, app: ApplicationConfiguration, status?: ServiceStatusApplicationEntity) => {
    return {
      appKey: app.appKey,
      name: app.name,
      description: app.description,
      monitorOnly: app.monitorOnly,
      autoChangeStatus: app.autoChangeStatus,
      tenantId: tenantId,
      metadata: status?.metadata ?? '',
      enabled: status?.enabled ?? false,
      statusTimestamp: status?.statusTimestamp ?? null,
      status: status?.status ?? app.status,
      internalStatus: status?.internalStatus ?? 'stopped',
      endpoint: {
        status: status?.endpoint.status ?? 'offline',
        url: app.url,
      },
    };
  };

  createApp = async (
    appKey: string,
    appName: string,
    description: string,
    url: string,
    monitorOnly: boolean,
    status: PublicServiceStatusType,
    tenant: Tenant,
    user?: User
  ) => {
    const newApp = {
      appKey: appKey,
      name: appName,
      url: url,
      description: description,
      monitorOnly: monitorOnly,
      status: status,
    };
    await this.updateApp(newApp, tenant.id.toString());
    await ServiceStatusApplicationEntity.create(user, this.#repository, {
      appKey: appKey,
      endpoint: { status: 'offline' },
      metadata: '',
      statusTimestamp: Date.now(),
      status: status,
      enabled: false,
      tenantId: user.tenantId.toString(),
    });
    return this.mergeApplicationData(tenant.id.toString(), newApp);
  };

  updateApp = async (newApp: ApplicationConfiguration, tenantId: string) => {
    const baseUrl = await this.#directoryService.getServiceUrl(adspId`urn:ads:platform:configuration-service`);
    const token = await this.#tokenProvider.getAccessToken();
    const configUrl = new URL(`/configuration/v2/configuration/platform/status-service?tenantId=${tenantId}`, baseUrl);
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

    // Delete the app status
    const appStatus = await this.getStatus(user, appKey);
    if (appStatus) {
      await appStatus.delete({ ...user } as User);
    }

    // Delete its health status
    await this.#endpointStatusEntryRepository.deleteAll(app.appKey);

    // Delete the app itself.
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
  static getApplicationKey = (appName: string): string => {
    // Its a verb: to kebab.
    return ApplicationRepo.toKebabCase(appName);
  };

  private static toKebabCase = (s: string): string => {
    return s
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  };
}
