import { TenantConfigurationRepository } from '../repository';
import { TenantConfig } from '../types';

export class TenantConfigEntity implements TenantConfig {
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

  update(update: TenantConfig) {

    if (update.configurationSettingsList) {
      this.configurationSettingsList = update.configurationSettingsList;
    }

    return this.repository.save(this);
  }

  delete(config: TenantConfig) {
    return this.repository.delete(this);
  }
}