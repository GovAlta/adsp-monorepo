import type { User } from '@abgov/adsp-service-sdk';
import { AssertCoreRole } from '@abgov/adsp-service-sdk';
import type { Update } from '@core-services/core-common';
import { TenantServiceRoles } from '../../../roles';
import type { ServiceConfigurationRepository } from '../repository';
import type { ServiceOption } from '../types';

export class ServiceOptionEntity implements ServiceOption {
  service: string;
  id: string;
  version: string;
  configOptions: unknown;

  constructor(private repository: ServiceConfigurationRepository, serviceOption: ServiceOption) {
    this.service = serviceOption.service;
    this.id = serviceOption.id;
    this.version = serviceOption.version;
    this.configOptions = serviceOption.configOptions;
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
    if (update.version) {
      this.version = update.version;
    }

    if (update.configOptions) {
      this.configOptions = update.configOptions;
    }

    return this.repository.save(this);
  }

  @AssertCoreRole('delete service option', TenantServiceRoles.PlatformService)
  delete(_user: User): Promise<boolean> {
    return this.repository.delete(this);
  }
}
