import type { User } from '@abgov/adsp-service-sdk';
import { ObjectId } from 'mongoose';
import { NewOrExisting, Update } from '@core-services/core-common';
import { MissingParamsError, UnauthorizedError } from '../common/errors';
import { ServiceStatusRepository } from '../repository/serviceStatus';
import {
  InternalServiceStatusType,
  PublicServiceStatusType,
  ServiceStatusApplication,
  ServiceStatusEndpoint,
} from '../types';

export class ServiceStatusApplicationEntity implements ServiceStatusApplication {
  _id?: string;
  description: string;
  endpoints: ServiceStatusEndpoint[];
  internalStatus: InternalServiceStatusType;
  metadata: unknown;
  name: string;
  publicStatus: PublicServiceStatusType;
  statusTimestamp: number;
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
    this.endpoints = application.endpoints;
    this.metadata = application.metadata;
    this.name = application.name;
    this.description = application.description;
    this.statusTimestamp = application.statusTimestamp;
    this.tenantId = application.tenantId;
    this.internalStatus = application.internalStatus;
    this.publicStatus = application.publicStatus;
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
    this.internalStatus = update.internalStatus ?? this.internalStatus;
    this.publicStatus = update.publicStatus ?? this.publicStatus;

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

  async setPublicStatus(user: Express.User, status: PublicServiceStatusType): Promise<ServiceStatusApplicationEntity> {
    if (!this.canUpdate(user)) {
      throw new UnauthorizedError('User not authorized to set application status');
    }

    this.publicStatus = status;
    this.statusTimestamp = Date.now();
    // ensure the endpoints are in sync with the service state
    switch (status) {
      case 'maintenance':
        this.endpoints.forEach((endpoint) => (endpoint.status = 'disabled'));
        break;
    }

    return await this.repository.save(this);
  }
  async setInternalStatus(
    user: Express.User,
    status: InternalServiceStatusType
  ): Promise<ServiceStatusApplicationEntity> {
    if (!this.canUpdate(user)) {
      throw new UnauthorizedError('User not authorized to set application status');
    }

    this.internalStatus = status;
    this.statusTimestamp = Date.now();
    // ensure the endpoints are in sync with the service state
    switch (status) {
      case 'stopped':
        this.endpoints.forEach((endpoint) => (endpoint.status = 'disabled'));
        break;
      case 'pending':
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
