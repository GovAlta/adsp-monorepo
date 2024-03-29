import type { AdspId, User } from '@abgov/adsp-service-sdk';
import { NewOrExisting, Update, UnauthorizedError } from '@core-services/core-common';
import { ServiceStatusRepository } from '../repository/serviceStatus';
import {
  InternalServiceStatusType,
  PublicServiceStatusType,
  ServiceStatusApplication,
  ServiceStatusEndpoint,
  EndpointToInternalStatusMapping,
} from '../types';

// Stored in the configuration service repository
export type StatusServiceConfiguration = Record<string, ApplicationConfiguration> & {
  applicationWebhookIntervals?: Record<string, HookInterval>;
};

// The application bits that rarely change (so not quite static)
// and are stored as part of the status-service
// configuration.

// This is the structure of applications stored in the
// configuration service.
export interface ApplicationConfiguration {
  appKey: string;
  name: string;
  url: string;
  description?: string;
  monitorOnly?: boolean;
  autoChangeStatus?: boolean;
  status?: PublicServiceStatusType;
}

// Add the tenant to the configuration.
export interface StaticApplicationData extends ApplicationConfiguration {
  tenantId: AdspId;
}

export interface PushServiceConfiguration {
  webhooks: Record<string, Webhooks>;
}

export interface HookInterval {
  appId: string;
  waitTimeInterval: number;
}

export interface Webhooks {
  id: string;
  url: string;
  name: string;
  targetId: string;
  intervalMinutes: number;
  eventTypes: { id: string }[];
  description: string;
  generatedByTest?: boolean;
  appCurrentlyUp: boolean;
}

export type StatusServiceApplications = Record<string, StaticApplicationData>;

// Application data, combines the static
// and dynamic bits
export interface ApplicationData {
  appKey: string;
  name: string;
  url: string;
  description?: string;
  status: PublicServiceStatusType;
  metadata: unknown;
  monitorOnly?: boolean;
  statusTimestamp: number;
  enabled: boolean;
}

export class ServiceStatusApplicationEntity implements ServiceStatusApplication {
  _id: string;
  endpoint: ServiceStatusEndpoint;
  status: PublicServiceStatusType;
  metadata: unknown;
  statusTimestamp: number;
  appKey: string;
  enabled: boolean;
  tenantId: string;

  static create(
    user: User,
    repository: ServiceStatusRepository,
    application: NewOrExisting<ServiceStatusApplication>
  ): Promise<ServiceStatusApplicationEntity> {
    const entity = new ServiceStatusApplicationEntity(repository, application);
    if (!entity.canCreate(user)) {
      throw new UnauthorizedError('User not authorized to create service status.');
    }
    return repository.save(entity);
  }

  constructor(private repository: ServiceStatusRepository, application: NewOrExisting<ServiceStatusApplication>) {
    this._id = application._id;
    this.appKey = application.appKey;
    this.endpoint = application.endpoint;
    this.metadata = application.metadata;
    this.statusTimestamp = application.statusTimestamp;
    this.status = application.status;
    this.enabled = application.enabled;
    this.tenantId = application.tenantId;
  }

  public get internalStatus(): InternalServiceStatusType {
    if (!this.enabled) {
      return 'stopped';
    }
    if (this.endpoint.status in EndpointToInternalStatusMapping) {
      return EndpointToInternalStatusMapping[this.endpoint.status] as InternalServiceStatusType;
    } else {
      return 'pending';
    }
  }

  update(user: User, update: Update<ServiceStatusApplication>): Promise<ServiceStatusApplicationEntity> {
    if (!this.canUpdate(user)) {
      throw new UnauthorizedError('User not authorized to update service status.');
    }

    this.metadata = update.metadata ?? this.metadata;
    this.statusTimestamp = update.statusTimestamp ?? this.statusTimestamp;
    this.endpoint = update.endpoint ?? this.endpoint;
    this.status = update.status ?? this.status;
    this.enabled = update.enabled ?? this.enabled;

    return this.repository.save(this);
  }

  enable(user: User): Promise<ServiceStatusApplicationEntity> {
    if (!this.canUpdate(user)) {
      throw new UnauthorizedError('User not authorized to add applications.');
    }
    return this.repository.enable(this);
  }

  disable(user: User): Promise<ServiceStatusApplicationEntity> {
    if (!this.canUpdate(user)) {
      throw new UnauthorizedError('User not authorized to add applications.');
    }
    return this.repository.disable(this);
  }

  async delete(user: User): Promise<boolean> {
    if (!this.canDelete(user)) {
      throw new UnauthorizedError('User not authorized to delete applications.');
    }
    return await this.repository.delete(this);
  }

  async setStatus(user: Express.User, status: PublicServiceStatusType): Promise<ServiceStatusApplicationEntity> {
    if (!this.canUpdate(user)) {
      throw new UnauthorizedError('User not authorized to set application status');
    }

    this.status = status;
    this.statusTimestamp = Date.now();
    return await this.repository.save(this);
  }

  private canUpdate(_user: User): boolean {
    // TODO: determine the roles
    return true;
  }

  private canDelete(_user: User): boolean {
    // TODO: determine the roles
    return true;
  }

  private canCreate(_user: User): boolean {
    // TODO: determine the roles
    return true;
  }
}

export default ServiceStatusApplicationEntity;
