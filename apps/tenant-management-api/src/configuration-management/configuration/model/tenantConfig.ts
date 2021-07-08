import { AssertRole } from '@abgov/adsp-service-sdk';
import type { User } from '@abgov/adsp-service-sdk';
import { TenantServiceRoles } from '../../../roles';
import type { TenantConfigurationRepository } from '../repository';
import type { TenantConfig } from '../types';

interface ServiceSettings {
  isEnabled: boolean;
  isActive: boolean;
  configuration: unknown;
}

export class TenantConfigEntity implements TenantConfig {
  id: string;
  tenantName: string;
  configurationSettingsList: Record<string, ServiceSettings>;

  constructor(private repository: TenantConfigurationRepository, config: TenantConfig) {
    this.id = config.id;
    this.tenantName = config.tenantName;
    this.configurationSettingsList = config.configurationSettingsList;
  }

  @AssertRole('create tenant config', TenantServiceRoles.TenantAdmin)
  static create(
    _user: User,
    repository: TenantConfigurationRepository,
    config: TenantConfig
  ): Promise<TenantConfigEntity> {
    const entity = new TenantConfigEntity(repository, config);

    return repository.save(entity);
  }

  @AssertRole('update tenant config', TenantServiceRoles.TenantAdmin)
  update(_user: User, configurationSettingsList: Record<string, ServiceSettings>): Promise<TenantConfigEntity> {
    this.configurationSettingsList = {
      ...this.configurationSettingsList,
      ...configurationSettingsList,
    };
    return this.repository.save(this);
  }

  @AssertRole('update tenant config', TenantServiceRoles.TenantAdmin)
  updateService(_user: User, service: string, settings: ServiceSettings): Promise<TenantConfigEntity> {
    this.configurationSettingsList[service] = settings;
    return this.repository.save(this);
  }

  @AssertRole('delete tenant config', TenantServiceRoles.TenantAdmin)
  delete(_user: User): Promise<boolean> {
    return this.repository.delete(this);
  }
}
