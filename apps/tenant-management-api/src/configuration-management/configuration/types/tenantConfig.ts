export interface TenantConfig {
  id: string;
  tenantName: string;
  configurationSettingsList: {
    [service: string]: {
      isActive: boolean;
      isEnabled: boolean;
      configuration: unknown;
    };
  };
}
