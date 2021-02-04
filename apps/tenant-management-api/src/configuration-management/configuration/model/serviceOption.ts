import { Update } from '@core-services/core-common';
import { ServiceConfigurationRepository } from '../repository';
import { ServiceOption } from '../types';

export class ServiceOptionEntity implements ServiceOption {
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

  update(
    update: Update<ServiceOption>) {

    if (update.service) {
      this.service = update.service;
    }

    if (update.version) {
      this.version = update.version;
    }

    if (update.configOptions) {
      this.configOptions = update.configOptions;
    }

    return this.repository.save(this);
  }

  delete(serviceOption: ServiceOption) {
    const entity = new ServiceOptionEntity(this.repository, serviceOption);

    return this.repository.delete(entity);
  }
}