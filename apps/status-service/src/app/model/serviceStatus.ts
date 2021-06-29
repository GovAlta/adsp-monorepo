import type { User } from '@abgov/adsp-service-sdk';
import { NewOrExisting, Update } from '@core-services/core-common';
import { MissingParamsError, UnauthorizedError } from '../common/errors';
import { ServiceStatusRepository } from '../repository/serviceStatus';
import {
  ManualOverrideState,
  PublicServiceStatusType,
  ServiceStatusApplication,
  ServiceStatusEndpoint,
  ServiceStatusType,
} from '../types';

export class ServiceStatusApplicationEntity implements ServiceStatusApplication {
  _id: string;
  description: string;
  endpoints: ServiceStatusEndpoint[];
  status: ServiceStatusType;
  metadata: unknown;
  name: string;
  statusTimestamp: number;
  tenantId: string;
  manualOverride: ManualOverrideState;
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
    this.endpoints = application.endpoints;
    this.metadata = application.metadata;
    this.name = application.name;
    this.description = application.description;
    this.statusTimestamp = application.statusTimestamp;
    this.tenantId = application.tenantId;
    this.status = application.status;
    this.manualOverride = application.manualOverride;
  }

  update(user: User, update: Update<ServiceStatusApplication>): Promise<ServiceStatusApplicationEntity> {
    if (!this.canUpdate(user)) {
      throw new UnauthorizedError('User not authorized to update service status.');
    }
    this.endpoints = update.endpoints ?? this.endpoints;
    this.metadata = update.metadata ?? this.metadata;
    this.name = update.name ?? this.name;
    this.description = update.description ?? this.description;
    this.statusTimestamp = update.statusTimestamp ?? this.statusTimestamp;
    this.status = update.status ?? this.status;
    this.manualOverride = update.manualOverride ?? this.manualOverride;

    return this.repository.save(this);
  }

  addEndpoint(user: User, url: string): Promise<ServiceStatusApplicationEntity> {
    if (!this.canUpdate(user)) {
      throw new UnauthorizedError('User not authorized to add applications.');
    }
    if (!url) {
      throw new MissingParamsError('Url is required');
    }
    this.endpoints.push({ url, status: 'pending' });
    return this.repository.save(this);
  }

  removeEndpoint(user: User, app: ServiceStatusApplication, url: string): Promise<ServiceStatusApplicationEntity> {
    if (!this.canUpdate(user)) {
      throw new UnauthorizedError('User not authorized to add applications.');
    }
    if (!url) {
      throw new MissingParamsError('Url is required');
    }
    const index = this.endpoints.findIndex((endpoint) => endpoint.url !== url);
    this.endpoints.splice(index, 1);
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
    this.manualOverride = 'on';
    // ensure the endpoints are in sync with the service state
    switch (status) {
      case 'maintenance':
      case 'disabled':
        this.endpoints.forEach((endpoint) => (endpoint.status = 'disabled'));
        break;
      case 'pending':
        this.manualOverride = 'off';
        this.endpoints.forEach((endpoint) => (endpoint.status = 'pending'));
        break;
    }

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
