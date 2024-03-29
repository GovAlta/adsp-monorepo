import { AdspId, User } from '@abgov/adsp-service-sdk';

export interface UserSessionData extends User {
  accessToken: string;
  refreshToken: string;
  exp: number;
  refreshExp: number;
  authenticatedBy: string;
}

export type Prompt = 'none' | 'login' | 'consent' | 'select_account';
export interface Client {
  tenantId: AdspId;
  id: string;
  name: string;
  idpHint?: string;
  prompt?: Prompt;
  scope?: string | string[];
  disableVerifyHost?: boolean;
  authCallbackUrl: string;
  successRedirectUrl?: string;
  failureRedirectUrl?: string;
  targets: Record<string, Target>;
}

export interface ClientCredentials {
  realm: string;
  clientId: string;
  clientSecret: string;
  registrationUrl: string;
  registrationToken: string;
}

export interface Target {
  id: string;
  upstream: AdspId;
}
