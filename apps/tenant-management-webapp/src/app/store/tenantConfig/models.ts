export interface TenantConfig {
  fileService?: {
    isActive?: boolean;
    isEnabled?: boolean;
  };
}

export const TENANT_CONFIG_INIT: TenantConfig = {};

export const TENANT_CONFIG_DEFAULT: TenantConfig = {
  fileService: {
    isActive: false,
    isEnabled: false,
  },
};
