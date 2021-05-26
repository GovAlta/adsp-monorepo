import { NewOrExisting, UnauthorizedError, Update, User } from '@core-services/core-common';
import { ServiceStatusRepository } from '../repository/serviceStatus';
import { ServiceStatusApplication, ServiceStatusEndpoint } from '../types';

export class ServiceStatusApplicationEntity {
  id: string;
  enabled: boolean;
  endpoints: ServiceStatusEndpoint[];
  metadata: unknown;
  name: string;
  statusTimestamp: number;
  tenantId: string;
  timeIntervalMin: number;

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
    this.id = application?.id;
    this.enabled = application.enabled;
    this.endpoints = application.endpoints;
    this.metadata = application.metadata;
    this.name = application.name;
    this.statusTimestamp = application.statusTimestamp;
    this.tenantId = application.tenantId;
    this.timeIntervalMin = application.timeIntervalMin;
  }

  update(user: User, update: Update<ServiceStatusApplication>): Promise<ServiceStatusApplicationEntity> {
    if (!this.canUpdate(user)) {
      throw new UnauthorizedError('User not authorized to update service status.');
    }
    if (update.enabled) {
      this.enabled = update.enabled;
    }
    if (update.endpoints) {
      this.endpoints = update.endpoints;
    }
    if (update.metadata) {
      this.metadata = update.metadata;
    }
    if (update.name) {
      this.name = update.name;
    }
    if (update.statusTimestamp) {
      this.statusTimestamp = update.statusTimestamp;
    }
    if (update.tenantId) {
      this.tenantId = update.tenantId;
    }
    if (update.timeIntervalMin) {
      this.timeIntervalMin = update.timeIntervalMin;
    }

    return this.repository.save(this);
  }

  addEndpoint(user: User, url: string): Promise<ServiceStatusApplicationEntity> {
    if (!this.canUpdate(user)) {
      throw new UnauthorizedError('User not authorized to add applications.');
    }
    if (!url) {
      throw new Error('Url is required');
    }
    this.endpoints.push({ url, status: 'pending' });
    return this.repository.save(this);
  }

  removeEndpoint(user: User, app: ServiceStatusApplication, url: string): Promise<ServiceStatusApplicationEntity> {
    if (!this.canUpdate(user)) {
      throw new UnauthorizedError('User not authorized to add applications.');
    }
    if (!url) {
      throw new Error('Url is required');
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

  private canUpdate(user: User): boolean {
    // TODO: determine the roles
    console.log('canUpdate', user);
    return true;
  }

  private canDelete(user: User): boolean {
    // TODO: determine the roles
    console.log('canDelete', user);
    return true;
  }

  private canCreate(user: User): boolean {
    // TODO: determine the roles
    console.log('canCreate', user);
    return true;
  }
}
