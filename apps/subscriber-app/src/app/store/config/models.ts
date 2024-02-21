export interface KeycloakApi {
  realm: string;
  url: string;
  clientId: string;
}

export interface TenantApi {
  host: string;
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
export interface RecaptchaService {
  execute(siteKey: string, options: { action: string }): Promise<string>;
}
export interface ConfigState {
  keycloakApi?: KeycloakApi;
  tenantApi?: TenantApi;
  serviceUrls?: ServiceUrls;
  recaptchaKey?: string;
  grecaptcha?: RecaptchaService;
}

export const CONFIG_INIT: ConfigState = {};
