import { AssertRole, UnauthorizedError, Update, User } from '@core-services/core-common';
import { ServiceConfigurationRepository } from '../repository';
import { ServiceOption, ServiceUserRoles } from '../types';

export class ServiceOptionEntity implements ServiceOption{
  service: string;
  id: string
  version: string;
  configOptions: string;

  constructor(
    private repository: ServiceConfigurationRepository, 
    serviceOption: ServiceOption
  ) {
    this.service = serviceOption.service;
    this.id = serviceOption.id;
    this.version = serviceOption.version;
    this.configOptions = serviceOption.configOptions;
  }

  @AssertRole('create service configuration option', ServiceUserRoles.admin)
  static create(
    repository: ServiceConfigurationRepository, 
    serviceOption: ServiceOption
  ) {
    const entity = new ServiceOptionEntity(repository, serviceOption);

    return repository.save(entity);
  }

  update(user: User, update: Update<ServiceOption>) {
    if (!this.canUpdate(user)) {
      throw new UnauthorizedError('User not authorized to updated service config.');
    }

    return this.repository.save(this);
  }

  canAccess(user: User) {
    return user && (
      user.roles.includes(ServiceUserRoles.admin)
    );
  }

  canUpdate(user: User) {
    return user &&  (
      user.roles.includes(ServiceUserRoles.admin)
    );
  }
}