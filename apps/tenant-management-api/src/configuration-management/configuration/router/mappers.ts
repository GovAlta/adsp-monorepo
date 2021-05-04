import { TenantConfig, ServiceOption } from '../types';

export const mapServiceOption = (type: ServiceOption) => ({
  id: type.id,
  service: type.service,
  version: type.version,
  configOptions: type.configOptions,
});

export const mapTenantConfig = (type: TenantConfig) => ({
  id: type.id,
  tenantName: type.tenantName,
  configurationSettingsList: type.configurationSettingsList,
});
