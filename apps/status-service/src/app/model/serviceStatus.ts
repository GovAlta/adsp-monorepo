import type { User } from '@abgov/adsp-service-sdk';
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
export type StatusServiceConfiguration = Record<string, unknown>;

// The application bits that rarely change (so not quite static)
// and are stored as part of the status-service
// configuration.

export interface StaticApplicationData {
  _id: string;
  appKey: string;
  name: string;
  url: string;
  description?: string;
}
// Application data, combines the static
// and dynamic bits
export interface ApplicationData {
  _id: string;
  appKey: string;
  name: string;
  url: string;
  description?: string;
  status: PublicServiceStatusType;
  metadata: unknown;
  statusTimestamp: number;
  tenantName: string;
  tenantRealm: string;
  tenantId: string;
  enabled: boolean;
}

export class ServiceStatusApplicationEntity implements ServiceStatusApplication {
  _id: string;
  endpoint: ServiceStatusEndpoint;
  status: PublicServiceStatusType;
  metadata: unknown;
  statusTimestamp: number;
  tenantName: string;
  tenantRealm: string;
  appKey: string;
  tenantId: string;
  enabled: boolean;

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
    this.tenantId = application.tenantId;
    this.tenantName = application.tenantName;
    this.tenantRealm = application.tenantRealm;
    this.status = application.status;
    this.enabled = application.enabled;
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
