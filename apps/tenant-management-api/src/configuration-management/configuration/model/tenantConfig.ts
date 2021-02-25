import { TenantConfigurationRepository } from '../repository';
import { TenantConfig } from '../types';

export class TenantConfigEntity implements TenantConfig {
  id: string;
  realmName: string;
  configurationSettingsList: JSON;

  constructor(
    private repository: TenantConfigurationRepository,
    config: TenantConfig
  ) {
    this.id = config.id;
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

  update(update: TenantConfig) {
    if (update.configurationSettingsList) {
      this.configurationSettingsList = update.configurationSettingsList;
      this.realmName = update.realmName;
    }

    return this.repository.save(this);
  }

  delete() {
    return this.repository.delete(this);
  }
}
