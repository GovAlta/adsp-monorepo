export interface ServiceUrls {
  serviceStatusApiUrl?: string;
  serviceStatusAppUrl?: string;
  notificationServiceUrl?: string;
}

export interface ConfigState {
  serviceUrls?: ServiceUrls;
  production?: boolean;
  envLoaded: boolean;
  platformTenantRealm?: string;
  keycloakUrl?: string;
  clientSecret?: string;
}

export const CONFIG_INIT: ConfigState = { envLoaded: false };
