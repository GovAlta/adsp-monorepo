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
  tenantManagementWebApp?: string;
  accessManagementApi: string;
  uiComponentUrl: string;
  fileApi?: string;
  serviceStatusApiUrl?: string;
  serviceStatusAppUrl?: string;
  valueServiceApiUrl?: string;
  docServiceApiUrl?: string;
  configurationServiceApiUrl?: string;
}

export interface ConfigState {
  keycloakApi?: KeycloakApi;
  serviceUrls?: ServiceUrls;
}

export const CONFIG_INIT: ConfigState = {};
