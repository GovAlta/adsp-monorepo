export interface ServiceUrls {
  notificationServiceUrl?: string;
}

export interface ConfigState {
  serviceUrls?: ServiceUrls;
  production?: boolean;
  envLoaded: boolean;
}

export const CONFIG_INIT: ConfigState = { envLoaded: false };
