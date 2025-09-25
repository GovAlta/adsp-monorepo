export interface ServiceUrls {
  // notificationServiceUrl?: string;
  // taskServiceApiUrl?: string;
  configurationServiceApiUrl?: string;
  directoryServiceApiUrl?: string;
  exportServiceUrl?: string;
  pushServiceApiUrl?: string;
  fileApi?: string;
  keycloakApi?: KeycloakApi;
  valueServiceApiUrl?: string;
  calendarServiceApiUrl?: string;
  pdfServiceApiUrl: string;
  formServiceApiUrl: string;
}

export interface FileApi {
  host: string;
  endpoints: {
    fileAdmin: string;
  };
}

export interface KeycloakApi {
  realm: string;
  url: string;
  clientId: string;
}

export interface RecaptchaService {
  execute(siteKey: string, options: { action: string }): Promise<string>;
}

export interface ConfigState {
  keycloakApi?: KeycloakApi;
  serviceUrls?: ServiceUrls;
  fileApi?: FileApi;
}

export const CONFIG_INIT: ConfigState = {};
