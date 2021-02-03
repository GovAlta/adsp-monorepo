import { AssertRole, UnauthorizedError, Update, User } from '@core-services/core-common';
import { TenantConfigurationRepository } from '../repository';
import { TenantConfig, ServiceUserRoles } from '../types';

export class TenantConfigEntity implements TenantConfig{
  realmName: string;
  configurationSettingsList: string;

  constructor(
    private repository: TenantConfigurationRepository, 
    config: TenantConfig
  ) {
    this.realmName = config.realmName;
    this.configurationSettingsList = config.configurationSettingsList;
  }

  static create(
    repository: TenantConfigurationRepository, 
    config: TenantConfig
  ) {
    const entity = new TenantConfigEntity(repository, config);
    
    return repository.save(entity);
  }

  static delete(
    repository: TenantConfigurationRepository, 
    config: TenantConfig
  ) {
    
    const entity = new TenantConfigEntity(repository, config);

    return repository.delete(entity);
  }
}