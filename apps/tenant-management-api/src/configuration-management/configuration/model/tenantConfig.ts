import { TenantConfigurationRepository } from '../repository';
import { TenantConfig } from '../types';

export class TenantConfigEntity implements TenantConfig {
  id: string;
  tenantName: string;
  configurationSettingsList: {
    [service: string]: {
      isEnabled: boolean;
      isActive: boolean;
      configuration: unknown;
    };
  };

  constructor(private repository: TenantConfigurationRepository, config: TenantConfig) {
    this.id = config.id;
    this.tenantName = config.tenantName;
    this.configurationSettingsList = config.configurationSettingsList;
  }

  static create(repository: TenantConfigurationRepository, config: TenantConfig) {
    const entity = new TenantConfigEntity(repository, config);

    return repository.save(entity);
  }

  update(configurationSettingsList) {
    this.configurationSettingsList = {
      ...this.configurationSettingsList,
      ...configurationSettingsList,
    };
    return this.repository.save(this);
  }

  delete() {
    return this.repository.delete(this);
  }
}
