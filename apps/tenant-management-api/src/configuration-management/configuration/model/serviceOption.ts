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
  static create(
    repository: ServiceConfigurationRepository, 
    serviceOption: ServiceOption
  ) {
    const entity = new ServiceOptionEntity(repository, serviceOption);

    return repository.save(entity);
  }

  static delete(
    repository: ServiceConfigurationRepository, 
    serviceOption: ServiceOption
  ) {
    
    const entity = new ServiceOptionEntity(repository, serviceOption);

    return repository.delete(entity);
  }
}