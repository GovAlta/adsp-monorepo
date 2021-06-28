import { TenantConfigurationRepository } from '../repository';
import { TenantConfig } from '../types';

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

  static create(repository: TenantConfigurationRepository, config: TenantConfig): Promise<TenantConfigEntity> {
    const entity = new TenantConfigEntity(repository, config);

    return repository.save(entity);
  }

  update(configurationSettingsList: Record<string, ServiceSettings>): Promise<TenantConfigEntity> {
    this.configurationSettingsList = {
      ...this.configurationSettingsList,
      ...configurationSettingsList,
    };
    return this.repository.save(this);
  }

  updateService(service: string, settings: ServiceSettings): Promise<TenantConfigEntity> {
    this.configurationSettingsList[service] = settings;
    return this.repository.save(this);
  }

  delete(): Promise<boolean> {
    return this.repository.delete(this);
  }
}
