export interface TenantApi {
  host: string;
  endpoints: {
    spaceAdmin: string;
    createTenant: string;
    tenantNameByRealm: string;
    tenantByName: string;
    tenantByEmail: string;
    tenantConfig: string;
    directory: string;
  };
}

export interface KeycloakApi {
  realm: string;
  url: string;
  clientId: string;
  checkLoginIframe?: boolean;
  flow?: string;
}
export interface FileApi {
  host: string;
  endpoints: {
    spaceAdmin: string;
    fileTypeAdmin: string;
    fileAdmin: string;
  };
}
export interface ServiceUrls {
  subscriberWebApp: string;
  eventServiceApiUrl: string;
  notificationServiceUrl: string;
  keycloakUrl: string;
  tenantManagementApi: string;
  tenantManagementWebApp?: string;
  accessManagementApi: string;
  uiComponentUrl: string;
  fileApi?: string;
  serviceStatusApiUrl?: string;
  serviceStatusAppUrl?: string;
  valueServiceApiUrl?: string;
  docServiceApiUrl?: string;
  configurationServiceApiUrl?: string;
  chatServiceApiUrl: string;
  pushServiceApiUrl: string;
  directoryServiceApiUrl?: string;
}

export interface ConfigState {
  keycloakApi?: KeycloakApi;
  tenantApi?: TenantApi;
  serviceUrls?: ServiceUrls;
  fileApi?: FileApi;
}

export const CONFIG_INIT: ConfigState = {};
