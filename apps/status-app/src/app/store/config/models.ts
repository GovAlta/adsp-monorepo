export interface ServiceUrls {
  serviceStatusApiUrl?: string;
  serviceStatusAppUrl?: string;
  notificationServiceUrl?: string;
}

export interface ConfigValues {
  serviceUrls?: ServiceUrls;
  production?: boolean;
  platformTenantRealm?: string;
  recaptchaKey?: string;
}

export interface RecaptchaService {
  execute(siteKey: string, options: { action: string }): Promise<string>;
}

export interface ConfigState extends ConfigValues {
  envLoaded: boolean;
  grecaptcha: RecaptchaService;
}

export const CONFIG_INIT: ConfigState = { envLoaded: false, grecaptcha: null };
