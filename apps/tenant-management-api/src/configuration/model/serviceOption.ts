import type { ServiceRole, User } from '@abgov/adsp-service-sdk';
import { AssertCoreRole } from '@abgov/adsp-service-sdk';
import type { Update } from '@core-services/core-common';
import { TenantServiceRoles } from '../../roles';
import type { ServiceConfigurationRepository } from '../repository';
import type { ServiceOption } from '../types';

export class ServiceOptionEntity implements ServiceOption {
  service: string;
  id: string;
  version: string;
  configOptions: Record<string, unknown>;
  configSchema: Record<string, unknown>;
  displayName: string;
  description: string;
  roles: ServiceRole[];

  constructor(private repository: ServiceConfigurationRepository, serviceOption: Partial<ServiceOption>) {
    this.service = serviceOption.service;
    this.id = serviceOption.id;
    this.version = serviceOption.version;
    this.configOptions = serviceOption.configOptions || {};
    this.configSchema = serviceOption.configSchema || {};
    this.displayName = serviceOption.displayName;
    this.description = serviceOption.description;
    this.roles = serviceOption.roles || [];
  }

  @AssertCoreRole('create service option', TenantServiceRoles.PlatformService)
  static create(
    _user: User,
    repository: ServiceConfigurationRepository,
    serviceOption: ServiceOption
  ): Promise<ServiceOptionEntity> {
    const entity = new ServiceOptionEntity(repository, serviceOption);

    return repository.save(entity);
  }

  @AssertCoreRole('update service option', TenantServiceRoles.PlatformService)
  update(_user: User, update: Update<ServiceOption>): Promise<ServiceOptionEntity> {
    if (update.configOptions) {
      this.configOptions = update.configOptions;
    }

    if (update.configSchema) {
      this.configSchema = update.configSchema;
    }

    if (update.displayName) {
      this.displayName = update.displayName;
    }

    if (update.description) {
      this.description = update.description;
    }

    if (update.roles) {
      this.roles = update.roles;
    }

    return this.repository.save(this);
  }

  @AssertCoreRole('delete service option', TenantServiceRoles.PlatformService)
  delete(_user: User): Promise<boolean> {
    return this.repository.delete(this);
  }
}
