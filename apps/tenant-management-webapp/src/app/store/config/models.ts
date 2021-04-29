export interface TenantApi {
  host: string;
  endpoints: {
    spaceAdmin: string;
    createTenant: string;
    tenantNameByRealm: string;
    tenantByEmail: string;
  };
}

export interface KeycloakApi {
  realm: string;
  url: string;
  clientId: string;
  checkLoginIframe?: boolean;
  flow?: string;
}

export interface ServiceUrls {
  eventServiceApiUrl: string;
  notificationServiceUrl: string;
  keycloakUrl: string;
  tenantManagementApi: string;
  accessManagementApi: string;
  uiComponentUrl: string;
  fileApi?: string;
  healthApi?: string;
}

export interface ConfigState {
  keycloakApi?: KeycloakApi;
  tenantApi?: TenantApi;
  serviceUrls?: ServiceUrls;
}

export const CONFIG_INIT: ConfigState = {};
