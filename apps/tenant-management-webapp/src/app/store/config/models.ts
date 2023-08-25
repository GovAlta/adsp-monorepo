export interface TenantApi {
  host: string;
}

export interface KeycloakApi {
  realm: string;
  url: string;
  clientId: string;
}

export interface FileApi {
  host: string;
  endpoints: {
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
  pdfServiceApiUrl?: string;
  calendarServiceApiUrl?: string;
  scriptServiceApiUrl?: string;
}

export interface FeatureFlags {
  Access: boolean;
  Calendar: boolean;
  Configuration: boolean;
  Form: boolean;
  Directory: boolean;
  Event: boolean;
  File: boolean;
  Notification: boolean;
  PDF: boolean;
  Script: boolean;
  Status: boolean;
}

export interface ConfigState {
  keycloakApi?: KeycloakApi;
  tenantApi?: TenantApi;
  serviceUrls?: ServiceUrls;
  fileApi?: FileApi;
  featureFlags?: FeatureFlags;
}

export const CONFIG_INIT: ConfigState = {};
