import { environment } from '../../environments/environment';

export interface ServiceUrls {
  serviceStatusApiUrl?: string;
}

export interface ConfigState {
  serviceUrls?: ServiceUrls;
  production: boolean;
}

export const CONFIG_INIT: ConfigState = environment;
