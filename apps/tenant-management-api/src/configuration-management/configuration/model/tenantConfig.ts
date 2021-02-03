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

  @AssertRole('create tenant configuration', ServiceUserRoles.admin)
  static create(
    user: User, 
    repository: TenantConfigurationRepository, 
    config: TenantConfig
  ) {
    const entity = new TenantConfigEntity(repository, config);
    
    return repository.save(entity);
  }

  update(user: User, update: Update<TenantConfig>) {
    if (!this.canUpdate(user)) {
      throw new UnauthorizedError('User not authorized to updated tenant config.');
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